/**
 * Import rewriting utilities for sync operations
 *
 * This module contains transforms that rewrite imports during the sync process
 * to handle differences between the upstream CommonJS/Webpack code and the
 * ESM-only target environment.
 *
 * ## Why These Rewrites Are Needed:
 *
 * 1. **Lodash → Lodash-ES**:
 *    - Upstream uses CommonJS `lodash` package
 *    - ESM requires `lodash-es` for proper tree-shaking
 *
 * 2. **Recharts 2.x → 3.x**:
 *    - Upstream uses recharts 2.x which has lodash dependency
 *    - Recharts 3.x is fully ESM-compatible with no lodash dependency
 *
 * 3. **@pie-framework Events → Internal Packages**:
 *    - Upstream references external @pie-framework packages
 *    - Monorepo uses internal @pie-element/shared-* packages
 *
 * 4. **Editable-HTML Constants Inlining**:
 *    - `editable-html` package is not ESM-compatible (Slate v0.x dependencies)
 *    - We only need constants, so inline them to avoid the dependency
 *
 * 5. **TokenTypes Re-export**:
 *    - Upstream code works in CommonJS/Webpack (looser module resolution)
 *    - ESM requires explicit re-exports for proper module graph
 *
 * 6. **Configure Defaults Inlining**:
 *    - Configure package is not ESM-compatible (Slate v0.x dependencies)
 *    - Student-facing UI only needs minimal fallback configuration
 *    - Inline empty defaults object to avoid the dependency
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import {
  PRESET_IDS,
  shouldTransformConfigUiMathjsSource,
  shouldTransformReactInputAutosizeSource,
} from './sync-presets.js';
import { applySourceEdits, rewriteModuleSpecifiers, type SourceEdit } from './sync-source-edit.js';

const SOURCE_PATH_PRESET_RULES = {
  [PRESET_IDS.transformTextSelectTokenTypesReexport]: (sourcePath: string) =>
    sourcePath.includes('text-select') && sourcePath.includes('token-select/index'),
  [PRESET_IDS.transformChartingUtilsTypeFix]: (sourcePath: string) =>
    sourcePath.includes('charting') && sourcePath.includes('utils'),
  [PRESET_IDS.transformTranslatorIndexTypeFix]: (sourcePath: string) =>
    sourcePath.includes('translator') && sourcePath.includes('/src/index'),
  [PRESET_IDS.transformRenderUiInlineMenuExport]: (sourcePath: string) =>
    sourcePath.includes('render-ui/src/index.js'),
} as const;

function sourcePathMatchesPreset(
  sourcePath: string | undefined,
  presetId: keyof typeof SOURCE_PATH_PRESET_RULES
): boolean {
  return !!sourcePath && SOURCE_PATH_PRESET_RULES[presetId](sourcePath);
}

/**
 * Fix import statements in a file to handle default export conversions
 *
 * When converting JS files with default exports to TS, we need to update
 * imports in consuming files to use named imports instead.
 */
export async function fixImportsInFile(
  filePath: string,
  defaultExportFiles: Set<string>
): Promise<boolean> {
  let content = await readFile(filePath, 'utf-8');
  let modified = false;

  // Match import statements: import Something from './file'
  const importRegex = /import\s+(\w+)\s+from\s+['"](\.[^'"]+)['"]/g;
  const matches = Array.from(content.matchAll(importRegex));

  for (const match of matches) {
    const [fullMatch, importName, importPath] = match;
    // Normalize the import path (remove extensions, resolve relative paths)
    const normalizedPath = importPath.replace(/\.(tsx?|jsx?)$/, '');

    // Check if this file had a default export
    if (defaultExportFiles.has(normalizedPath)) {
      // Replace default import with named import
      const replacement = `import { ${importName} } from '${importPath}'`;
      content = content.replace(fullMatch, replacement);
      modified = true;
    }
  }

  if (modified) {
    await writeFile(filePath, content, 'utf-8');
  }

  return modified;
}

/**
 * Rewrite relative ESM specifiers to explicit `.js` extensions for NodeNext compatibility.
 *
 * This is applied after sync so TypeScript source uses runtime-valid ESM specifiers:
 * - `./foo` -> `./foo.js`
 * - `./bar` (directory with index file) -> `./bar/index.js`
 */
export async function rewriteRelativeSpecifiersForNodeEsm(filePath: string): Promise<boolean> {
  let content = await readFile(filePath, 'utf-8');
  let modified = false;

  const rewriteSpecifier = (specifier: string): string => {
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
      return specifier;
    }

    // Keep explicit extensions as-is (css/json/svg/js/etc.).
    if (/\.[a-z0-9]+$/i.test(specifier)) {
      return specifier;
    }

    const basePath = join(dirname(filePath), specifier);
    const moduleFileExtensions = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];
    const indexFileExtensions = moduleFileExtensions.map((ext) => `/index${ext}`);

    const hasModuleFile = moduleFileExtensions.some((ext) => existsSync(`${basePath}${ext}`));
    if (hasModuleFile) {
      return `${specifier}.js`;
    }

    const hasIndexFile = indexFileExtensions.some((suffix) => existsSync(`${basePath}${suffix}`));
    if (hasIndexFile) {
      return `${specifier.replace(/\/$/, '')}/index.js`;
    }

    // Do not guess unresolved paths.
    return specifier;
  };

  content = content.replace(
    /(from\s+)(['"])(\.\.?\/[^'"]+)\2/g,
    (match, prefix, quote, specifier) => {
      const rewritten = rewriteSpecifier(specifier);
      if (rewritten !== specifier) {
        modified = true;
        return `${prefix}${quote}${rewritten}${quote}`;
      }
      return match;
    }
  );

  content = content.replace(
    /(import\(\s*)(['"])(\.\.?\/[^'"]+)\2(\s*\))/g,
    (match, start, quote, specifier, end) => {
      const rewritten = rewriteSpecifier(specifier);
      if (rewritten !== specifier) {
        modified = true;
        return `${start}${quote}${rewritten}${quote}${end}`;
      }
      return match;
    }
  );

  content = content.replace(/\bimport\s+(['"])(\.\.?\/[^'"]+)\1/g, (match, quote, specifier) => {
    const rewritten = rewriteSpecifier(specifier);
    if (rewritten !== specifier) {
      modified = true;
      return `import ${quote}${rewritten}${quote}`;
    }
    return match;
  });

  if (modified) {
    await writeFile(filePath, content, 'utf-8');
  }

  return modified;
}

/**
 * Check if code contains JSX syntax
 */
export function containsJsx(code: string): boolean {
  return /<[A-Za-z][\w-]*[\s/>]/.test(code);
}

/**
 * Replace editable-html imports with inlined constants
 *
 * editable-html is not ESM-compatible (depends on Slate v0.x), but some packages
 * only import constants from it. We inline these constants to avoid the dependency.
 */
export function inlineEditableHtmlConstants(code: string): string {
  // Check if file imports from editable-html
  const editableHtmlImportRegex =
    /import\s+(\w+)\s+from\s+['"]\.\.\/\.\.\/\.\.\/editable-html\/src\/constants['"]/;
  const match = code.match(editableHtmlImportRegex);

  if (!match) {
    return code; // No editable-html import, return unchanged
  }

  const importName = match[1];

  // Replace the import with inlined constants
  const inlinedConstants = `// Inlined from editable-html/src/constants (not ESM-compatible)
const ${importName} = {
  MAIN_CONTAINER_CLASS: 'main-container',
  PIE_TOOLBAR__CLASS: 'pie-toolbar',
};`;

  return code.replace(editableHtmlImportRegex, inlinedConstants);
}

/**
 * Fix missing re-export of TokenTypes in text-select token-select/index.jsx
 * The upstream imports TokenTypes from ./token but doesn't re-export it,
 * causing build failures when parent index.js tries to import it.
 */
export function reexportTokenTypes(code: string, filePath: string): string {
  // Only apply to text-select token-select/index file
  if (!sourcePathMatchesPreset(filePath, PRESET_IDS.transformTextSelectTokenTypesReexport)) {
    return code;
  }

  // Check if file imports TokenTypes from ./token
  if (!code.includes("import Token, { TokenTypes } from './token'")) {
    return code;
  }

  // Check if already exports TokenTypes
  if (code.includes('export { TokenTypes }')) {
    return code;
  }

  // Add export after the default export
  return code.replace(
    /^export default TokenSelect;$/m,
    'export default TokenSelect;\nexport { TokenTypes };'
  );
}

/**
 * Replace configure/lib/defaults import with an empty defaults object
 * when configure directory is not synced (ESM-incompatible due to Slate v0.x)
 */
export function inlineConfigureDefaults(code: string): string {
  // Only apply to files that import from ../configure/lib/defaults
  const configureImportRegex =
    /import\s+(\w+)\s+from\s+['"](\.\.\/configure\/lib\/defaults|\.\.\/\.\.\/configure\/lib\/defaults)['"]/;
  const match = code.match(configureImportRegex);

  if (!match) return code;

  const importName = match[1];

  // Replace with minimal defaults object
  // The configuration property is what's typically used in student-facing code
  const inlinedDefaults = `// Inlined from configure/lib/defaults (configure/ not synced - ESM-incompatible)
const ${importName} = {
  configuration: {
    // Minimal configuration for student-facing UI
    // Full authoring configuration is only needed in the configure package
  } as any
};`;

  return code.replace(configureImportRegex, inlinedDefaults);
}

/**
 * Determine if a file should have .tsx extension based on content
 */
export function shouldUseTsxExtension(content: string, originalPath: string): boolean {
  // If original file was .jsx, use .tsx
  if (originalPath.endsWith('.jsx')) {
    return true;
  }

  // If content contains JSX, use .tsx
  if (containsJsx(content)) {
    return true;
  }

  // Otherwise use .ts
  return false;
}

/**
 * Convert CommonJS module.exports to ES module exports
 *
 * Handles patterns like:
 * module.exports = { foo: ..., bar: ... }
 *
 * Converts to:
 * export const foo = ...;
 * export const bar = ...;
 */
export function convertModuleExportsToEsm(content: string): string {
  // Match: module.exports = { key: value, key2: value2, ... };
  const moduleExportsPattern = /module\.exports\s*=\s*\{([\s\S]*?)\};?/;
  const match = content.match(moduleExportsPattern);

  if (!match) {
    return content;
  }

  const [fullMatch, objectContent] = match;

  // Parse the object content into key-value pairs
  // Match patterns like: key: value, (with value possibly spanning multiple lines)
  const exports: string[] = [];
  const lines = objectContent.split('\n');

  let currentKey: string | null = null;
  let currentValue: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '{' || trimmed === '}') continue;

    // Check if this line starts a new key
    const keyMatch = trimmed.match(/^(\w+):\s*(.*)/);
    if (keyMatch) {
      // Save previous export if any
      if (currentKey) {
        const value = currentValue.join('\n').replace(/,\s*$/, ''); // Remove trailing comma
        exports.push(`export const ${currentKey} =\n${value};`);
      }

      // Start new export
      currentKey = keyMatch[1];
      currentValue = [keyMatch[2]];
    } else {
      // Continuation of current value
      currentValue.push(line);
    }
  }

  // Save last export
  if (currentKey) {
    const value = currentValue.join('\n').replace(/,\s*$/, '');
    exports.push(`export const ${currentKey} =\n${value};`);
  }

  // Replace the module.exports block with ES module exports
  const esmExports = exports.join('\n\n');
  return content.replace(fullMatch, esmExports);
}

const VENDORED_LODASH_PACKAGE = '@pie-element/shared-lodash';

function lodashMemberFromPath(path: string): string {
  return path.replace(/\.js$/i, '').split('/').pop() ?? path;
}

/**
 * Transform lodash and lodash-es imports to the vendored shared lodash package.
 *
 * The vendored package is intentionally a narrow ESM implementation of the
 * lodash helpers used by synced PIE sources, avoiding CDN/runtime lodash
 * resolution while keeping import shapes tree-shakeable.
 */
export function transformLodashToVendoredLodash(content: string): string {
  const sourceFile = ts.createSourceFile(
    'source.tsx',
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const edits: SourceEdit[] = [];
  const dynamicDeepImportMembers = new Set<string>();

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const path = lodashDeepImportPath(node.moduleSpecifier.text);
      if (path) {
        const member = lodashMemberFromPath(path);
        edits.push({
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          text: lodashImportReplacement(node, sourceFile, member),
        });
      }
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const path = lodashDeepImportPath(node.moduleSpecifier.text);
      if (path) {
        const member = lodashMemberFromPath(path);
        edits.push({
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          text: lodashExportReplacement(node, sourceFile, member),
        });
      }
    } else if (isDynamicStringImport(node)) {
      const path = lodashDeepImportPath(node.arguments[0].text);
      if (path) {
        const member = lodashMemberFromPath(path);
        dynamicDeepImportMembers.add(member);
        edits.push({
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          text: `Promise.resolve({ default: ${member}, ${member} })`,
        });
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  let transformed = applySourceEdits(content, edits);

  // Root imports keep their local import shape.
  transformed = rewriteModuleSpecifiers(transformed, (specifier) =>
    specifier === 'lodash' || specifier === 'lodash-es' ? VENDORED_LODASH_PACKAGE : undefined
  );

  if (dynamicDeepImportMembers.size > 0) {
    const imports = [...dynamicDeepImportMembers].sort().join(', ');
    transformed = `import { ${imports} } from '${VENDORED_LODASH_PACKAGE}';\n${transformed}`;
  }

  return transformed;
}

function lodashDeepImportPath(specifier: string): string | null {
  const match = specifier.match(/^(?:lodash|lodash-es)\/(.+)$/);
  return match?.[1] ?? null;
}

function isDynamicStringImport(node: ts.Node): node is ts.CallExpression & {
  arguments: ts.NodeArray<ts.StringLiteral>;
} {
  return (
    ts.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    node.arguments.length === 1 &&
    ts.isStringLiteral(node.arguments[0])
  );
}

function quoteLike(specifier: string, originalText: string): string {
  const delimiter = originalText.startsWith('"') ? '"' : "'";
  const escaped = specifier.replace(/\\/g, '\\\\').replaceAll(delimiter, `\\${delimiter}`);
  return `${delimiter}${escaped}${delimiter}`;
}

function lodashImportReplacement(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile,
  member: string
): string {
  const packageSpecifier = quoteLike(
    VENDORED_LODASH_PACKAGE,
    node.moduleSpecifier.getText(sourceFile)
  );
  const importClause = node.importClause;
  if (!importClause) {
    return `import ${packageSpecifier};`;
  }

  if (importClause.name) {
    return `import { ${formatLodashBinding(member, importClause.name.text)} } from ${packageSpecifier};`;
  }

  const namedBindings = importClause.namedBindings;
  if (namedBindings && ts.isNamespaceImport(namedBindings)) {
    return `import { ${formatLodashBinding(member, namedBindings.name.text)} } from ${packageSpecifier};`;
  }

  if (namedBindings && ts.isNamedImports(namedBindings)) {
    const bindings = namedBindings.elements
      .map((specifier) => lodashImportSpecifierBinding(member, specifier))
      .join(', ');
    const typeOnly = importClause.isTypeOnly ? 'type ' : '';
    return `import ${typeOnly}{ ${bindings} } from ${packageSpecifier};`;
  }

  return `import ${packageSpecifier};`;
}

function lodashExportReplacement(
  node: ts.ExportDeclaration,
  sourceFile: ts.SourceFile,
  member: string
): string {
  const packageSpecifier = quoteLike(
    VENDORED_LODASH_PACKAGE,
    node.moduleSpecifier?.getText(sourceFile) ?? `'${VENDORED_LODASH_PACKAGE}'`
  );
  const exportClause = node.exportClause;
  if (!exportClause) {
    return `export { ${member} } from ${packageSpecifier};`;
  }

  if (ts.isNamespaceExport(exportClause)) {
    return `export { ${formatLodashBinding(member, exportClause.name.text)} } from ${packageSpecifier};`;
  }

  const bindings = exportClause.elements
    .map((specifier) => lodashExportSpecifierBinding(member, specifier))
    .join(', ');
  const typeOnly = node.isTypeOnly ? 'type ' : '';
  return `export ${typeOnly}{ ${bindings} } from ${packageSpecifier};`;
}

function lodashImportSpecifierBinding(member: string, specifier: ts.ImportSpecifier): string {
  const imported = specifier.propertyName?.text ?? specifier.name.text;
  const local = specifier.name.text;

  if (imported === 'default') {
    return formatLodashBinding(member, local);
  }

  return imported === local ? imported : `${imported} as ${local}`;
}

function lodashExportSpecifierBinding(member: string, specifier: ts.ExportSpecifier): string {
  const exported = specifier.name.text;
  const local = specifier.propertyName?.text ?? exported;

  if (local === 'default') {
    return formatLodashBinding(member, exported);
  }

  return local === exported ? exported : `${local} as ${exported}`;
}

function formatLodashBinding(imported: string, local: string): string {
  return imported === local ? imported : `${imported} as ${local}`;
}

export const transformLodashToLodashEs = transformLodashToVendoredLodash;

/**
 * Transform classnames imports to clsx.
 *
 * clsx preserves the call shape used by classnames while offering a browser ESM
 * entrypoint, so synced source should prefer it over the CommonJS-era package.
 */
export function transformClassnamesToClsx(content: string): string {
  return rewriteModuleSpecifiers(content, (specifier) =>
    specifier === 'classnames' ? 'clsx' : undefined
  );
}

/**
 * Replace react-input-autosize with the local ESM autosize input component.
 *
 * The upstream dependency is CommonJS-era and only used by graph label inputs.
 * Synced packages generate a tiny local component instead of carrying the
 * dependency into browser ESM output.
 */
export function transformReactInputAutosizeToLocal(content: string, sourcePath?: string): string {
  if (!shouldTransformReactInputAutosizeSource(sourcePath)) {
    return content;
  }

  const sourceFile = ts.createSourceFile(
    'source.tsx',
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const edits: SourceEdit[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === 'react-input-autosize'
    ) {
      const importName = node.importClause?.name?.text;
      if (importName) {
        edits.push({
          start: node.getStart(sourceFile),
          end: node.getEnd(),
          text:
            importName === 'AutosizeInput'
              ? "import { AutosizeInput } from './autosize-input.js';"
              : `import { AutosizeInput as ${importName} } from './autosize-input.js';`,
        });
      }
    } else if (isAutosizeInputComponentAdapter(node, sourceFile)) {
      edits.push({
        start: node.getStart(sourceFile),
        end: node.getEnd(),
        text: '',
      });
    } else if (isAutosizeInputComponentJsxTag(node)) {
      edits.push({
        start: node.tagName.getStart(sourceFile),
        end: node.tagName.getEnd(),
        text: 'AutosizeInput',
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return applySourceEdits(content, edits);
}

function isAutosizeInputComponentAdapter(
  node: ts.Node,
  sourceFile: ts.SourceFile
): node is ts.VariableStatement {
  if (!ts.isVariableStatement(node) || node.declarationList.declarations.length !== 1) {
    return false;
  }

  const declaration = node.declarationList.declarations[0];
  if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'AutosizeInputComponent') {
    return false;
  }

  return (
    declaration.initializer?.getText(sourceFile).replace(/\s+/g, '') ===
    'AutosizeInput?.default??AutosizeInput'
  );
}

function isAutosizeInputComponentJsxTag(
  node: ts.Node
): node is ts.JsxOpeningElement | ts.JsxClosingElement | ts.JsxSelfClosingElement {
  return (
    (ts.isJsxOpeningElement(node) ||
      ts.isJsxClosingElement(node) ||
      ts.isJsxSelfClosingElement(node)) &&
    ts.isIdentifier(node.tagName) &&
    node.tagName.text === 'AutosizeInputComponent'
  );
}

/**
 * Replace config-ui's tiny mathjs usage with a local fraction-to-number helper.
 *
 * number-text-field-custom only uses `math.number(math.fraction(value))` to
 * compare custom fraction values. Keep mathjs for number-line where the surface
 * includes exact rational arithmetic, comparisons, snapping, and expression
 * parsing.
 */
export function transformConfigUiMathjsToLocalFraction(
  content: string,
  sourcePath?: string
): string {
  if (!shouldTransformConfigUiMathjsSource(sourcePath)) {
    return content;
  }

  let transformed = content.replace(
    /math\.number\(\s*math\.fraction\(([^()]+?)\)\s*\)/g,
    'fractionToNumber($1)'
  );

  if (transformed === content) {
    return content;
  }

  if (!/\bmath\./.test(transformed)) {
    transformed = transformed.replace(
      /import\s+\*\s+as\s+math\s+from\s+(['"])mathjs\1;?/,
      "import { fractionToNumber } from './fraction-to-number.js';"
    );
  } else if (!transformed.includes("from './fraction-to-number.js'")) {
    transformed = transformed.replace(
      /import\s+\*\s+as\s+math\s+from\s+(['"])mathjs\1;?/,
      (match) => `${match}\nimport { fractionToNumber } from './fraction-to-number.js';`
    );
  }

  return transformed;
}

/**
 * Compatibility wrapper retained for older callers. Lodash imports now target
 * the vendored shared package rather than lodash-es deep modules.
 */
export function transformLodashEsDeepImportsToFullySpecified(content: string): string {
  return transformLodashToVendoredLodash(content);
}

/**
 * Ensure known strict-ESM deep imports include explicit file extensions.
 *
 * Webpack's fully-specified ESM resolution requires `.js` on deep imports like:
 * - react-konva/lib/ReactKonvaCore -> react-konva/lib/ReactKonvaCore.js
 */
export function transformKnownDeepImportsToFullySpecified(content: string): string {
  return rewriteModuleSpecifiers(content, (specifier) =>
    specifier === 'react-konva/lib/ReactKonvaCore' ? 'react-konva/lib/ReactKonvaCore.js' : undefined
  );
}

/**
 * Transform package.json dependencies from lodash/lodash-es to the vendored package.
 *
 * The browser/runtime dependency is a workspace package that vendors the small
 * lodash helper surface needed by synced sources.
 */
export function transformPackageJsonLodash<T extends Record<string, any>>(packageJson: T): T {
  const transformed = { ...packageJson };

  if (transformed.dependencies?.lodash || transformed.dependencies?.['lodash-es']) {
    transformed.dependencies[VENDORED_LODASH_PACKAGE] = 'workspace:*';
    delete transformed.dependencies.lodash;
    delete transformed.dependencies['lodash-es'];
  }

  if (transformed.devDependencies?.lodash || transformed.devDependencies?.['lodash-es']) {
    transformed.devDependencies[VENDORED_LODASH_PACKAGE] = 'workspace:*';
    delete transformed.devDependencies.lodash;
    delete transformed.devDependencies['lodash-es'];
  }

  // Remove @types/lodash if present (lodash-es has built-in types)
  if (transformed.dependencies?.['@types/lodash']) {
    delete transformed.dependencies['@types/lodash'];
  }
  if (transformed.devDependencies?.['@types/lodash']) {
    delete transformed.devDependencies['@types/lodash'];
  }

  return transformed;
}

/**
 * Transform recharts version in package.json
 *
 * Upgrades recharts from 2.x to 3.x for ESM compatibility.
 * Recharts 3.x removes the lodash dependency and is fully ESM-compatible.
 */
export function transformPackageJsonRecharts<T extends Record<string, any>>(packageJson: T): T {
  const transformed = { ...packageJson };

  // Keep recharts on the current ESM-capable major.
  if (transformed.dependencies?.recharts) {
    transformed.dependencies.recharts = '^3.8.1';
  }

  return transformed;
}

/**
 * Apply browser-ESM dependency replacements and upgrades for synced packages.
 *
 * This is intentionally dependency policy, not build-output patching: upstream
 * sync rewrites package manifests toward packages that can participate in the
 * browser ESM graph directly.
 */
export function transformPackageJsonBrowserEsmDependencies<T extends Record<string, any>>(
  packageJson: T,
  options: { removeReactInputAutosize?: boolean; removeMathjs?: boolean } = {}
): T {
  const transformed = { ...packageJson };
  const deps = transformed.dependencies as Record<string, string> | undefined;
  if (!deps) {
    return transformed;
  }

  if (deps.classnames) {
    deps.clsx = '^2.1.1';
    delete deps.classnames;
  }

  if (options.removeReactInputAutosize) {
    delete deps['react-input-autosize'];
  }

  if (options.removeMathjs) {
    delete deps.mathjs;
  }

  const versionPins: Record<string, string> = {
    '@types/react': '^18.2.0',
    '@types/react-dom': '^18.2.0',
    clsx: '^2.1.1',
    mathjs: '^15.2.0',
    'react-draggable': '^4.6.0',
    'react-is': '^18.3.1',
    'react-redux': '^9.3.0',
    redux: '^5.0.1',
  };

  for (const [name, version] of Object.entries(versionPins)) {
    if (deps[name]) {
      deps[name] = version;
    }
  }

  delete deps.react;
  delete deps['react-dom'];

  return transformed;
}

/**
 * Transform @pie-framework event package imports to internal packages
 *
 * Handles:
 * - @pie-framework/pie-player-events → @pie-element/shared-player-events
 * - @pie-framework/pie-configure-events → @pie-element/shared-configure-events
 */
export function transformPieFrameworkEventImports(content: string): string {
  return rewriteModuleSpecifiers(content, (specifier) => {
    if (specifier === '@pie-framework/pie-player-events') {
      return '@pie-element/shared-player-events';
    }
    if (specifier === '@pie-framework/pie-configure-events') {
      return '@pie-element/shared-configure-events';
    }
    return undefined;
  });
}

/**
 * Transform @pie-lib/controller-utils imports to internal @pie-element/shared-controller-utils
 *
 * Handles:
 * - @pie-lib/controller-utils → @pie-element/shared-controller-utils
 *
 * Our internal controller-utils package has the same API but with modernized TypeScript
 * and no lodash/debug dependencies.
 */
export function transformControllerUtilsImports(content: string): string {
  return rewriteModuleSpecifiers(content, (specifier) =>
    specifier === '@pie-lib/controller-utils' ? '@pie-element/shared-controller-utils' : undefined
  );
}

/**
 * Transform @pie-lib shared package imports to internal @pie-element/shared-* packages
 *
 * Handles:
 * - @pie-lib/math-rendering → @pie-element/shared-math-rendering-mathjax
 *
 * These packages have been moved to shared/ for better version control and consistency.
 */
export function transformSharedPackageImports(content: string): string {
  return rewriteModuleSpecifiers(content, (specifier) => {
    if (specifier === '@pie-lib/math-rendering') {
      return '@pie-element/shared-math-rendering-mathjax';
    }
    if (specifier === '@pie-lib/feedback') {
      return '@pie-element/shared-feedback';
    }
    return undefined;
  });
}

/**
 * Rewrite legacy configure subpath imports to author entrypoints.
 *
 * Upstream sometimes imports configure elements via:
 * - @pie-element/<element-name>/configure/lib
 *
 * In this repo, configure code is synced into `src/author` and packages expose that via
 * the `./author` export. Rewriting to `/author` preserves author-vs-delivery boundaries.
 */
export function transformLegacyConfigureLibImports(content: string): string {
  return rewriteModuleSpecifiers(content, (specifier) =>
    /^@pie-element\/[^/]+\/configure\/lib$/.test(specifier)
      ? specifier.replace(/\/configure\/lib$/, '/author')
      : undefined
  );
}

/**
 * Transform package.json dependencies for PIE Framework event packages
 *
 * Replaces external @pie-framework event packages with internal workspace packages
 */
export function transformPackageJsonPieEvents<T extends Record<string, any>>(packageJson: T): T {
  const transformed = { ...packageJson };

  // Replace @pie-framework/pie-player-events with internal package
  if (transformed.dependencies?.['@pie-framework/pie-player-events']) {
    transformed.dependencies['@pie-element/shared-player-events'] = 'workspace:*';
    delete transformed.dependencies['@pie-framework/pie-player-events'];
  }
  if (transformed.devDependencies?.['@pie-framework/pie-player-events']) {
    transformed.devDependencies['@pie-element/shared-player-events'] = 'workspace:*';
    delete transformed.devDependencies['@pie-framework/pie-player-events'];
  }

  // Replace @pie-framework/pie-configure-events with internal package
  if (transformed.dependencies?.['@pie-framework/pie-configure-events']) {
    transformed.dependencies['@pie-element/shared-configure-events'] = 'workspace:*';
    delete transformed.dependencies['@pie-framework/pie-configure-events'];
  }
  if (transformed.devDependencies?.['@pie-framework/pie-configure-events']) {
    transformed.devDependencies['@pie-element/shared-configure-events'] = 'workspace:*';
    delete transformed.devDependencies['@pie-framework/pie-configure-events'];
  }

  return transformed;
}

/**
 * Transform package.json dependencies for @pie-lib/controller-utils
 *
 * Replaces @pie-lib/controller-utils with internal @pie-element/shared-controller-utils
 */
export function transformPackageJsonControllerUtils<T extends Record<string, any>>(
  packageJson: T
): T {
  const transformed = { ...packageJson };

  // Replace @pie-lib/controller-utils with internal package
  if (transformed.dependencies?.['@pie-lib/controller-utils']) {
    transformed.dependencies['@pie-element/shared-controller-utils'] = 'workspace:*';
    delete transformed.dependencies['@pie-lib/controller-utils'];
  }
  if (transformed.devDependencies?.['@pie-lib/controller-utils']) {
    transformed.devDependencies['@pie-element/shared-controller-utils'] = 'workspace:*';
    delete transformed.devDependencies['@pie-lib/controller-utils'];
  }

  return transformed;
}

/**
 * Transform package.json dependencies for shared packages
 *
 * Replaces @pie-lib shared packages with internal @pie-element/shared-* packages
 */
export function transformPackageJsonSharedPackages<T extends Record<string, any>>(
  packageJson: T
): T {
  const transformed = { ...packageJson };

  const sharedPackages = {
    '@pie-lib/math-rendering': '@pie-element/shared-math-rendering-mathjax',
    '@pie-lib/feedback': '@pie-element/shared-feedback',
  };

  for (const [oldPkg, newPkg] of Object.entries(sharedPackages)) {
    // Replace in dependencies
    if (transformed.dependencies?.[oldPkg]) {
      transformed.dependencies[newPkg] = 'workspace:*';
      delete transformed.dependencies[oldPkg];
    }
    // Replace in devDependencies
    if (transformed.devDependencies?.[oldPkg]) {
      transformed.devDependencies[newPkg] = 'workspace:*';
      delete transformed.devDependencies[oldPkg];
    }
  }

  return transformed;
}

/**
 * Transform direct property assignment patterns to use assignProps utility
 *
 * Replaces patterns like:
 *   Object.entries(props).forEach(([key, value]) => { element[key] = value; });
 * With:
 *   assignProps(element, props);
 *
 * And adds the import if not present.
 *
 * NOTE: This transform is available but NOT enabled in the sync pipeline by default.
 * Only enable it if this pattern appears frequently in upstream code and needs
 * to be refactored automatically. For one-off cases, manual refactoring is preferred.
 *
 * To enable: Import and call this in sync-pielib-strategy.ts after other transforms.
 */
export function transformToAssignProps(content: string): string {
  let transformed = content;
  let needsImport = false;

  // Pattern 1: Object.entries(props).forEach with element[key] = value
  // Matches: Object.entries(props).forEach(([key, value]) => { element[key] = value; });
  const pattern1 =
    /Object\.entries\((\w+)\)\.forEach\(\(\[(\w+),\s*(\w+)\]\)\s*=>\s*\{\s*(\w+)\[\2\]\s*=\s*\3;\s*\}\);?/g;
  const matches1 = Array.from(transformed.matchAll(pattern1));

  for (const match of matches1) {
    const [fullMatch, propsVar, _keyVar, _valueVar, elementVar] = match;
    const replacement = `assignProps(${elementVar}, ${propsVar});`;
    transformed = transformed.replace(fullMatch, replacement);
    needsImport = true;
  }

  // Pattern 2: for...of loop with Object.entries
  // Matches: for (const [key, value] of Object.entries(props)) { element[key] = value; }
  const pattern2 =
    /for\s*\(const\s*\[(\w+),\s*(\w+)\]\s*of\s*Object\.entries\((\w+)\)\)\s*\{\s*(\w+)\[\1\]\s*=\s*\2;\s*\}/g;
  const matches2 = Array.from(transformed.matchAll(pattern2));

  for (const match of matches2) {
    const [fullMatch, _keyVar, _valueVar, propsVar, elementVar] = match;
    const replacement = `assignProps(${elementVar}, ${propsVar});`;
    transformed = transformed.replace(fullMatch, replacement);
    needsImport = true;
  }

  // Add import if needed and not already present
  if (needsImport && !transformed.includes("from '@pie-element/shared-utils'")) {
    // Find where to insert the import (after other imports)
    const importMatch = transformed.match(/(import\s+.*?from\s+['"].*?['"];?\s*\n)+/);
    if (importMatch && importMatch.index !== undefined) {
      const lastImportEnd = importMatch.index + importMatch[0].length;
      transformed =
        transformed.slice(0, lastImportEnd) +
        "import { assignProps } from '@pie-element/shared-utils';\n" +
        transformed.slice(lastImportEnd);
    } else {
      // No imports found, add at the beginning (after any leading comments)
      const firstNonCommentLine = transformed.search(/^(?!\/\/|\/\*|\*|$)/m);
      if (firstNonCommentLine !== -1) {
        transformed =
          transformed.slice(0, firstNonCommentLine) +
          "import { assignProps } from '@pie-element/shared-utils';\n\n" +
          transformed.slice(firstNonCommentLine);
      }
    }
  }

  return transformed;
}

/**
 * Transform configure utility imports for flattened directory structure
 *
 * In upstream pie-elements, configure utility files live at configure/utils.js
 * and are imported from configure/src/ files using '../utils'.
 *
 * In the synced structure, both configure/src/ files and configure/utils.js
 * are synced to src/configure/, so the import path needs to change from
 * '../utils' to './utils'.
 *
 * This transform handles:
 * - import { x } from '../utils' → import { x } from './utils'
 * - Only applies to files directly in configure/src/, not subdirectories
 * - Only when the import is '../utils' (not '../utils/something')
 */
export function transformConfigureUtilsImports(content: string, relativePath: string): string {
  // Only apply to files directly in configure/src/ (not in subdirectories)
  // Note: In the target, these files end up in author/ directory
  // Match patterns like:
  // - "configure/src/something.js" (yes)
  // - "configure/src/design/something.js" (no - has subdirectory)
  const configureRootFilePattern = /^configure\/src\/[^/]+\.(jsx?|tsx?)$/;
  if (!configureRootFilePattern.test(relativePath)) {
    return content;
  }

  // Transform '../utils' to './utils.js' (only exact match, not '../utils/something')
  // Keep explicit runtime extension for Node ESM consistency.
  return rewriteModuleSpecifiers(content, (specifier) =>
    specifier === '../utils' ? './utils.js' : undefined
  );
}

/**
 * Transform legacy SSR-gated `require()` for pie-lib editors into static ESM imports.
 *
 * Older upstream pie-lib used `typeof window` + `require()` so heavy editor code did not
 * run under SSR. That breaks in browser ESM where `require` is undefined. When this pattern
 * is still present in synced sources, rewrite it to a normal default import plus styled()
 * wrapper. If upstream has already moved to ESM imports, this is a no-op.
 */
export function transformSsrRequireToEsmImport(content: string): string {
  let transformed = content;

  // Pattern 1: SSR check with require() for editable-html-tip-tap with styled wrapper
  // Matches:
  //   let EditableHtml;
  //   let StyledEditableHTML;
  //   if (typeof window !== 'undefined') {
  //     EditableHtml = require('@pie-lib/editable-html-tip-tap')['default'];
  //     StyledEditableHTML = styled(EditableHtml)(...);
  //   }
  //
  // Note: styled() call may span multiple lines

  const ssrRequirePattern =
    /(?:\/\/import\s+\w+\s+from\s+['"]@pie-lib\/[^'"]+['"]\s*;\s*\n)?let\s+(\w+);\s*\nlet\s+(\w+);\s*\n(?:\/\/\s*-\s*mathquill\s+error\s+window\s+not\s+defined\s*\n)?if\s*\(\s*typeof\s+window\s*!==\s*['"]undefined['"]\s*\)\s*\{\s*\n\s*\1\s*=\s*require\(['"](@pie-lib\/[^'"]+)['"]\)\[['"]default['"]\];\s*\n\s*\2\s*=\s*styled\(\1\)\(([\s\S]*?)\);\s*\n\s*\}/;

  const match = transformed.match(ssrRequirePattern);

  if (match) {
    const [fullMatch, componentVar, styledVar, importPath, styleParams] = match;

    const importVarName = `${componentVar}Import`;
    const replacement = `import ${importVarName} from '${importPath}';

const ${componentVar} = ${importVarName};
const ${styledVar} = styled(${componentVar})(${styleParams});`;

    transformed = transformed.replace(fullMatch, replacement);
  }

  // Pattern 2: Simpler pattern without styled wrapper
  // Matches:
  //   //import EditableHTML from '@pie-lib/editable-html-tip-tap';
  //   let EditableHtml;
  //   if (typeof window !== 'undefined') {
  //     EditableHtml = require('@pie-lib/editable-html-tip-tap')['default'];
  //   }

  const simpleRequirePattern =
    /(?:\/\/import\s+\w+\s+from\s+['"]@pie-lib\/[^'"]+['"]\s*;\s*\n)?let\s+(\w+);\s*\nif\s*\(\s*typeof\s+window\s*!==\s*['"]undefined['"]\s*\)\s*\{\s*\n\s*\1\s*=\s*require\(['"](@pie-lib\/[^'"]+)['"]\)\[['"]default['"]\];\s*\n\s*\}/;

  const simpleMatch = transformed.match(simpleRequirePattern);

  if (simpleMatch && !match) {
    // Only apply if we didn't already match the styled pattern
    const [fullMatch, componentVar, importPath] = simpleMatch;

    const importVarName = `${componentVar}Import`;
    const replacement = `import ${importVarName} from '${importPath}';

const ${componentVar} = ${importVarName};`;

    transformed = transformed.replace(fullMatch, replacement);
  }

  return transformed;
}

/**
 * Fix TypeScript type inference errors for styled components
 *
 * TypeScript can't infer types for some MUI styled components, causing errors like:
 * "The inferred type of 'X' cannot be named without a reference to '@emotion/styled'"
 *
 * This transform adds explicit type annotations to fix these errors.
 */
export function fixStyledComponentTypes(content: string): string {
  let transformed = content;

  // Pattern 1: Export const styled components (e.g., export const StyledFormControlLabel = styled(...))
  // Add `: any` to fix type inference issues
  // Match any identifier, not just those starting with "Styled"
  const exportConstStyledRegex = /export const (\w+) = styled\(/g;
  transformed = transformed.replace(exportConstStyledRegex, 'export const $1: any = styled(');

  // Pattern 2: Const styled components (e.g., const StyledToken = styled(...), const MiniField = styled(...))
  // Add `: any` to fix type inference issues
  // Match any identifier, not just those starting with "Styled"
  const constStyledRegex = /const (\w+) = styled\(/g;
  transformed = transformed.replace(constStyledRegex, 'const $1: any = styled(');

  // Pattern 3: Class field arrow functions that might return styled components
  // Add `: any` return type to class fields missing type annotations.
  // IMPORTANT: keep this line-scoped so we do not accidentally match multiline JSX
  // assignments such as `foo = (<Component ref={(r) => { ... }} />)`.
  const methodRegex = /^(\s*)(\w+)\s*=\s*\([^)\n]*\)\s*=>\s*\{/gm;
  transformed = transformed.replace(methodRegex, (match) => {
    // Check if already has type annotation (: type = )
    const hasTypeAnnotation = match.includes(':');
    if (hasTypeAnnotation) {
      return match;
    }
    // Add `: any` type annotation
    return match.replace(/(\w+)(\s*=)/, '$1: any$2');
  });

  return transformed;
}

/**
 * Transform self-referential package imports to relative imports
 *
 * In upstream pie-elements, configure files sometimes import from their own package
 * using the package name (e.g., import { X } from '@pie-element/fraction-model').
 * This creates circular dependency issues in the build.
 *
 * This transform converts these self-referential imports to relative paths based on
 * the package structure:
 * - @pie-element/{name} → relative path to delivery component
 *
 * Example:
 * In configure/src/main.jsx:
 *   import { FractionModelChart } from '@pie-element/fraction-model'
 * Becomes:
 *   import FractionModelChart from '../delivery/fraction-model-chart'
 *
 * @param content - The file content
 * @param packageName - The current package name (e.g., '@pie-element/fraction-model')
 * @param sourceFilePath - The source file path relative to package root
 * @returns Transformed content with relative imports
 */
export function transformSelfReferentialImports(
  content: string,
  packageName: string,
  sourceFilePath: string
): string {
  // Extract element name from package name (@pie-element/fraction-model → fraction-model)
  const elementName = packageName.replace('@pie-element/', '');
  let targetPath: string | null = null;

  if (sourceFilePath.startsWith('configure/src/')) {
    // Configure files reference delivery components
    // configure/src/main.jsx → author/main.tsx
    // Relative path from author/ to delivery/
    targetPath = '../delivery';
  } else if (sourceFilePath.startsWith('src/')) {
    // Main src files shouldn't self-reference, but handle it anyway
    targetPath = '.';
  }

  if (!targetPath) {
    return content;
  }

  // Strategy: Self-referential imports typically come from the package's main
  // index file which re-exports from various locations. Rather than trying to
  // guess individual file locations (which often fails for namespace exports
  // and re-exports), we keep the import pointing to the index.
  return rewriteModuleSpecifiers(content, (specifier) =>
    specifier === `@pie-element/${elementName}` ? `${targetPath}/index.js` : undefined
  );
}

/**
 * Fix type inference errors for exported functions with complex return types
 *
 * TypeScript can't infer types for some exported functions that have complex dependencies,
 * causing errors like: "The inferred type of 'X' cannot be named without a reference to 'Y'"
 *
 * This transform adds explicit `: any` type annotations to fix these portability errors.
 */
export function fixExportedFunctionTypes(content: string, sourcePath?: string): string {
  let transformed = content;

  // Only apply to specific files that are known to have issues
  if (sourcePathMatchesPreset(sourcePath, PRESET_IDS.transformChartingUtilsTypeFix)) {
    // Fix: export const dataToXBand = (...) => { ... }
    // Pattern: export const functionName = (params) => {
    transformed = transformed.replace(
      /export const dataToXBand = \(/g,
      'export const dataToXBand: any = ('
    );
  }

  // Fix translator package default export type inference issue
  // The spread operator `...i18next` causes TypeScript to require a reference to i18next types
  if (sourcePathMatchesPreset(sourcePath, PRESET_IDS.transformTranslatorIndexTypeFix)) {
    // Add type imports
    if (!transformed.includes('type i18n')) {
      transformed = transformed.replace(
        /import i18next from 'i18next';/,
        "import i18next, { type i18n, type TOptions } from 'i18next';"
      );
    }

    // Add type annotations before the export default
    if (!transformed.includes('interface Translator')) {
      const typeAnnotations = `
interface Translator extends i18n {
  t: (key: string, options: TOptions) => string;
}

interface TranslatorModule {
  translator: Translator;
  languageOptions: Array<{ value: string; label: string }>;
}

const translatorModule: TranslatorModule = `;

      transformed = transformed.replace(/export default \{/, typeAnnotations + '{');

      // Replace the export statement
      transformed = transformed.replace(/\n\};$/m, '\n};\n\nexport default translatorModule;');
    }
  }

  return transformed;
}

/**
 * Transform MUI Menu imports to use InlineMenu from @pie-lib/render-ui
 *
 * Replaces direct imports of Menu from '@mui/material/Menu' with InlineMenu
 * from '@pie-lib/render-ui', which includes fixes for the backdrop overlay issue.
 *
 * This addresses a common issue where MUI's Menu component covers the entire screen
 * with a white background when used in inline contexts (dropdowns within text).
 *
 * Transformations:
 * - import Menu from '@mui/material/Menu' → import { InlineMenu as Menu } from '@pie-lib/render-ui'
 * - import Menu, { MenuProps } from '@mui/material/Menu' → import { InlineMenu as Menu } from '@pie-lib/render-ui'; import type { MenuProps } from '@mui/material/Menu'
 * - styled(Menu) continues to work as Menu is aliased to InlineMenu
 *
 * @param content - Source code content
 * @returns Transformed content with Menu imports replaced
 */
export function transformMenuToInlineMenu(content: string): string {
  const sourceFile = ts.createSourceFile(
    'source.tsx',
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const edits: SourceEdit[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === '@mui/material/Menu'
    ) {
      const defaultName = node.importClause?.name?.text;
      if (!defaultName) {
        return;
      }

      const namedImports = menuNamedImportsText(node, sourceFile);
      const replacement = [
        `import { InlineMenu as ${defaultName} } from '@pie-lib/render-ui';`,
        namedImports ? `import type { ${namedImports} } from '@mui/material/Menu';` : null,
      ]
        .filter((line): line is string => !!line)
        .join('\n');

      edits.push({
        start: node.getStart(sourceFile),
        end: node.getEnd(),
        text: replacement,
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return applySourceEdits(content, edits);
}

function menuNamedImportsText(
  node: ts.ImportDeclaration,
  sourceFile: ts.SourceFile
): string | null {
  const namedBindings = node.importClause?.namedBindings;
  if (!namedBindings || !ts.isNamedImports(namedBindings)) {
    return null;
  }

  return namedBindings.elements.map((element) => element.getText(sourceFile)).join(', ');
}

/**
 * Add InlineMenu export to render-ui index file
 *
 * The InlineMenu component is a pie-elements-ng specific component that wraps
 * MUI's Menu to fix the backdrop overlay issue. Since it doesn't exist in the
 * upstream pie-lib, we need to add its export after the sync completes.
 *
 * This transform adds the InlineMenu export to the end of the render-ui index
 * file if it's not already present.
 *
 * @param content - Source code content
 * @param sourcePath - Path to the source file (to identify render-ui index)
 * @returns Transformed content with InlineMenu export added if needed
 */
export function addInlineMenuExport(content: string, sourcePath?: string): string {
  // Only apply to render-ui root index file (not subdirectories like collapsible/index.tsx)
  // sourcePath format: pie-lib/packages/render-ui/src/index.js
  if (!sourcePathMatchesPreset(sourcePath, PRESET_IDS.transformRenderUiInlineMenuExport)) {
    return content;
  }

  // Check if InlineMenu export already exists
  if (content.includes('InlineMenu')) {
    return content;
  }

  // Add InlineMenu export at the end of the file
  const exportStatement =
    "\n// Non-synced pie-elements-ng exports\nexport { InlineMenu } from './inline-menu';\n";

  return content.trimEnd() + exportStatement;
}

/**
 * Transform React component imports that may resolve as module objects in IIFE builds.
 *
 * Some libraries export React components as objects (e.g. forwardRef) or wrapped modules,
 * which can trigger React invariant #130 in certain bundled interop paths.
 *
 * This transform rewrites known-risk imports to pass through a small runtime unwrap helper:
 * - `@mdi/react` default import
 * - `react-konva` named imports
 */
export function transformReactInteropComponentImports(content: string): string {
  let transformed = content;
  let touched = false;

  // Handle default import from @mdi/react:
  // import Icon from '@mdi/react'
  // ->
  // import IconImport from '@mdi/react'
  // const Icon = unwrapReactInteropSymbol(IconImport, 'Icon');
  transformed = transformed.replace(
    /^import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]@mdi\/react['"];?\s*$/m,
    (match, localName: string) => {
      if (localName.endsWith('Import')) {
        return match;
      }
      touched = true;
      return `import ${localName}Import from '@mdi/react';`;
    }
  );

  const mdiMatch = transformed.match(
    /^import\s+([A-Za-z_$][\w$]*)Import\s+from\s+['"]@mdi\/react['"];?\s*$/m
  );
  if (mdiMatch) {
    const localName = mdiMatch[1];
    const declaration = `const ${localName} = unwrapReactInteropSymbol(${localName}Import, '${localName}');`;
    if (!transformed.includes(declaration)) {
      touched = true;
      transformed = transformed.replace(mdiMatch[0], `${mdiMatch[0]}\n${declaration}`);
    }
  }

  // Handle named imports from react-konva:
  // import { Stage, Layer } from 'react-konva'
  // ->
  // import { Stage as StageImport, Layer as LayerImport } from 'react-konva'
  // const Stage = unwrapReactInteropSymbol(StageImport, 'Stage');
  // const Layer = unwrapReactInteropSymbol(LayerImport, 'Layer');
  const konvaImportRegex = /^import\s+\{([^}]+)\}\s+from\s+['"]react-konva['"];?\s*$/m;
  const konvaMatch = transformed.match(konvaImportRegex);
  if (konvaMatch) {
    const rawSpec = konvaMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsed = rawSpec
      .map((entry) => {
        const aliasMatch = entry.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
        if (aliasMatch) {
          return { exported: aliasMatch[1], local: aliasMatch[2] };
        }
        const singleMatch = entry.match(/^([A-Za-z_$][\w$]*)$/);
        if (singleMatch) {
          return { exported: singleMatch[1], local: singleMatch[1] };
        }
        return null;
      })
      .filter((v): v is { exported: string; local: string } => !!v);

    if (parsed.length) {
      const rewrittenSpecs = parsed.map(({ exported, local }) => `${exported} as ${local}Import`);
      const declarations = parsed.map(
        ({ exported, local }) =>
          `const ${local} = unwrapReactInteropSymbol(${local}Import, '${exported}');`
      );

      transformed = transformed.replace(
        konvaImportRegex,
        `import { ${rewrittenSpecs.join(', ')} } from 'react-konva';`
      );

      for (const declaration of declarations) {
        if (!transformed.includes(declaration)) {
          transformed = transformed.replace(
            /^import\s+\{[^}]+\}\s+from\s+['"]react-konva['"];?\s*$/m,
            (line) => `${line}\n${declaration}`
          );
        }
      }
      touched = true;
    }
  }

  // Handle mixed named imports from @pie-lib/render-ui where React components
  // may resolve through nested/default interop in IIFE bundles.
  // Example:
  // import { Collapsible, color, PreviewPrompt } from '@pie-lib/render-ui'
  // ->
  // import { Collapsible as CollapsibleImport, color, PreviewPrompt as PreviewPromptImport } from '@pie-lib/render-ui';
  // const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible');
  // const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt');
  const renderUiImportRegex = /^import\s+\{([^}]+)\}\s+from\s+['"]@pie-lib\/render-ui['"];?\s*$/m;
  const renderUiMatch = transformed.match(renderUiImportRegex);
  if (renderUiMatch) {
    const rawSpec = renderUiMatch[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsed = rawSpec
      .map((entry) => {
        const aliasMatch = entry.match(/^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/);
        if (aliasMatch) {
          return { exported: aliasMatch[1], local: aliasMatch[2] };
        }
        const singleMatch = entry.match(/^([A-Za-z_$][\w$]*)$/);
        if (singleMatch) {
          return { exported: singleMatch[1], local: singleMatch[1] };
        }
        return null;
      })
      .filter((v): v is { exported: string; local: string } => !!v);

    // Heuristic: only wrap React component-like imports (PascalCase symbols).
    const componentLike = parsed.filter(
      ({ exported, local }) =>
        /^[A-Z]/.test(exported) && /^[A-Z]/.test(local) && !local.endsWith('Import')
    );

    if (componentLike.length) {
      const rewrittenSpecs = parsed.map(({ exported, local }) => {
        const shouldWrap = componentLike.some(
          (entry) => entry.exported === exported && entry.local === local
        );
        return shouldWrap
          ? `${exported} as ${local}Import`
          : exported === local
            ? local
            : `${exported} as ${local}`;
      });

      const declarations = componentLike.map(
        ({ exported, local }) =>
          `const ${local} = unwrapReactInteropSymbol(${local}Import, '${exported}');`
      );

      transformed = transformed.replace(
        renderUiImportRegex,
        `import { ${rewrittenSpecs.join(', ')} } from '@pie-lib/render-ui';`
      );

      // Add a namespace import so wrapped component imports can fall back to module members
      // when named import interop resolves unexpectedly in IIFE bundles.
      if (
        !/^import\s+\*\s+as\s+RenderUiNamespace\s+from\s+['"]@pie-lib\/render-ui['"];?\s*$/m.test(
          transformed
        )
      ) {
        transformed = transformed.replace(
          /^import\s+\{[^}]+\}\s+from\s+['"]@pie-lib\/render-ui['"];?\s*$/m,
          (line) => `${line}\nimport * as RenderUiNamespace from '@pie-lib/render-ui';`
        );
      }

      const renderUiInteropPrelude = `const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;`;
      if (!transformed.includes('const renderUiNamespaceAny = RenderUiNamespace as any;')) {
        transformed = transformed.replace(
          /^import\s+\*\s+as\s+RenderUiNamespace\s+from\s+['"]@pie-lib\/render-ui['"];?\s*$/m,
          (line) => `${line}\n${renderUiInteropPrelude}`
        );
      }

      for (const declaration of declarations) {
        const withFallback = declaration.replace(
          /unwrapReactInteropSymbol\((\w+)Import, '(\w+)'\);$/,
          "unwrapReactInteropSymbol($1Import, '$2') || unwrapReactInteropSymbol(renderUi.$2, '$2');"
        );
        if (!transformed.includes(declaration) && !transformed.includes(withFallback)) {
          transformed = transformed.replace(
            /^import\s+\{[^}]+\}\s+from\s+['"]@pie-lib\/render-ui['"];?\s*$/m,
            (line) => `${line}\n${withFallback}`
          );
        }
      }
      touched = true;
    }
  }

  if (!touched) {
    return transformed;
  }

  if (!transformed.includes('function isRenderableReactInteropType(')) {
    const helperBlock = `function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
`;

    // Capture top-of-file import blocks, including multiline imports.
    const importBlockMatch = transformed.match(
      /^(?:(?:\s*\/\/[^\n]*\n|\s*\/\*[\s\S]*?\*\/\s*\n|\s*\n)*)((?:import[\s\S]*?;\s*\n)+)/
    );
    if (importBlockMatch) {
      const insertAt = importBlockMatch[0].length;
      transformed =
        transformed.slice(0, insertAt) + '\n' + helperBlock + transformed.slice(insertAt);
    } else {
      transformed = `${helperBlock}\n${transformed}`;
    }
  }

  return transformed;
}
