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
  if (!filePath.includes('text-select') || !filePath.includes('token-select/index')) {
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

/**
 * Transform lodash imports to lodash-es for ESM compatibility
 *
 * Handles all lodash import patterns:
 * - Individual module imports: import isEmpty from 'lodash/isEmpty'
 * - Named imports: import { isEmpty, isEqual } from 'lodash'
 * - Default import: import _ from 'lodash'
 * - Namespace import: import * as _ from 'lodash'
 *
 * Converts them to use lodash-es which is a pure ESM package.
 */
export function transformLodashToLodashEs(content: string): string {
  let transformed = content;

  // Pattern 1: Individual module imports
  // import isEmpty from 'lodash/isEmpty' → import { isEmpty } from 'lodash-es'
  // import cloneDeep from 'lodash/cloneDeep' → import { cloneDeep } from 'lodash-es'
  transformed = transformed.replace(
    /import\s+(\w+)\s+from\s+['"]lodash\/(\w+)['"]/g,
    "import { $1 } from 'lodash-es'"
  );

  // Pattern 2: Named imports, default imports, and namespace imports from main module
  // import { isEmpty, isEqual } from 'lodash' → import { isEmpty, isEqual } from 'lodash-es'
  // import _ from 'lodash' → import _ from 'lodash-es'
  // import * as _ from 'lodash' → import * as _ from 'lodash-es'
  transformed = transformed.replace(/from\s+['"]lodash['"]/g, "from 'lodash-es'");

  return transformed;
}

/**
 * Ensure deep lodash-es imports are fully specified for strict ESM resolution.
 *
 * Webpack (with fullySpecified ESM resolution) and other strict ESM loaders
 * require file extensions for deep package specifiers:
 * - lodash-es/isEqual -> lodash-es/isEqual.js
 */
export function transformLodashEsDeepImportsToFullySpecified(content: string): string {
  return content.replace(
    /(from\s+['"]|import\(\s*['"])lodash-es\/([^'")]+)(['"]\)?)/g,
    (match, prefix, path, suffix) => {
      if (/\.[a-z0-9]+$/i.test(path)) {
        return match;
      }
      return `${prefix}lodash-es/${path}.js${suffix}`;
    }
  );
}

/**
 * Ensure known strict-ESM deep imports include explicit file extensions.
 *
 * Webpack's fully-specified ESM resolution requires `.js` on deep imports like:
 * - react-konva/lib/ReactKonvaCore -> react-konva/lib/ReactKonvaCore.js
 */
export function transformKnownDeepImportsToFullySpecified(content: string): string {
  return content.replace(
    /(from\s+['"]|import\(\s*['"])react-konva\/lib\/ReactKonvaCore(['"]\)?)/g,
    '$1react-konva/lib/ReactKonvaCore.js$2'
  );
}

/**
 * Transform package.json dependencies from lodash to lodash-es
 *
 * Replaces lodash with lodash-es version 4.17.22 (latest ESM version)
 * Also removes @types/lodash as lodash-es includes built-in TypeScript types
 */
export function transformPackageJsonLodash<T extends Record<string, any>>(packageJson: T): T {
  const transformed = { ...packageJson };

  // Replace lodash with lodash-es in dependencies
  if (transformed.dependencies?.lodash) {
    transformed.dependencies['lodash-es'] = '^4.17.22';
    delete transformed.dependencies.lodash;
  }

  // Replace lodash with lodash-es in devDependencies
  if (transformed.devDependencies?.lodash) {
    transformed.devDependencies['lodash-es'] = '^4.17.22';
    delete transformed.devDependencies.lodash;
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

  // Upgrade recharts to 3.x in dependencies
  if (transformed.dependencies?.recharts) {
    // Only upgrade if it's 2.x
    const version = transformed.dependencies.recharts;
    if (version.includes('2.')) {
      transformed.dependencies.recharts = '^3.7.0';
    }
  }

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
  let transformed = content;

  // Transform pie-player-events imports
  transformed = transformed.replace(
    /from\s+['"]@pie-framework\/pie-player-events['"]/g,
    "from '@pie-element/shared-player-events'"
  );

  // Transform pie-configure-events imports
  transformed = transformed.replace(
    /from\s+['"]@pie-framework\/pie-configure-events['"]/g,
    "from '@pie-element/shared-configure-events'"
  );

  return transformed;
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
  return content.replace(
    /from\s+['"]@pie-lib\/controller-utils['"]/g,
    "from '@pie-element/shared-controller-utils'"
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
  let transformed = content;

  // Transform math-rendering
  transformed = transformed.replace(
    /from\s+['"]@pie-lib\/math-rendering['"]/g,
    "from '@pie-element/shared-math-rendering-mathjax'"
  );

  // Transform feedback
  transformed = transformed.replace(
    /from\s+['"]@pie-lib\/feedback['"]/g,
    "from '@pie-element/shared-feedback'"
  );

  return transformed;
}

/**
 * Transform legacy mathquill imports to @pie-element/shared-math-engine
 *
 * Handles:
 * - @pie-framework/mathquill → @pie-element/shared-math-engine
 * - @pie-element/shared-mathquill → @pie-element/shared-math-engine
 */
export function transformMathquillImports(content: string): string {
  return content
    .replace(/from\s+['"]@pie-framework\/mathquill['"]/g, "from '@pie-element/shared-math-engine'")
    .replace(
      /from\s+['"]@pie-element\/shared-mathquill['"]/g,
      "from '@pie-element/shared-math-engine'"
    );
}

/**
 * Rewrite legacy configure subpath imports to package roots.
 *
 * Upstream sometimes imports configure elements via:
 * - @pie-element/<element-name>/configure/lib
 *
 * In this repo, package exports do not expose that subpath. Importing the package root
 * resolves correctly via the package `exports` map and works for demo/Vite resolution.
 */
export function transformLegacyConfigureLibImports(content: string): string {
  return content.replace(/from\s+['"](@pie-element\/[^/'"]+)\/configure\/lib['"]/g, "from '$1'");
}

/**
 * Remove legacy MathQuill stylesheet imports.
 *
 * We now use shared-math-engine styles and should not pull MathQuill CSS.
 */
export function removeLegacyMathquillCssImports(content: string): string {
  return content.replace(/^\s*import\s+['"]mathquill\/build\/mathquill\.css['"];?\s*$/gm, '');
}

/**
 * Rewrite legacy Static wrapper access to modern shared-math-engine API.
 *
 * Handles:
 * - this.mqStatic.mathField.latex() -> this.mqStatic.mathField.getLatex?.()
 */
export function transformLegacyMathFieldLatexCalls(content: string): string {
  return content.replace(/(\.\s*mathField)\s*\.\s*latex\s*\(\s*\)/g, '$1.getLatex?.()');
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
 * Transform package.json dependencies for legacy mathquill packages
 *
 * Replaces:
 * - @pie-framework/mathquill
 * - @pie-element/shared-mathquill
 * - mathquill
 * With: @pie-element/shared-math-engine
 */
export function transformPackageJsonMathquill<T extends Record<string, any>>(packageJson: T): T {
  const transformed = { ...packageJson };

  const normalizeMathDeps = (deps?: Record<string, string>) => {
    if (!deps) {
      return;
    }
    if (
      deps['@pie-framework/mathquill'] ||
      deps['@pie-element/shared-mathquill'] ||
      deps.mathquill
    ) {
      deps['@pie-element/shared-math-engine'] = 'workspace:*';
    }
    delete deps['@pie-framework/mathquill'];
    delete deps['@pie-element/shared-mathquill'];
    delete deps.mathquill;
  };

  normalizeMathDeps(transformed.dependencies);
  normalizeMathDeps(transformed.devDependencies);

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

  // Transform '../utils' to './utils' (only exact match, not '../utils/something')
  let transformed = content;
  transformed = transformed.replace(/from\s+['"]\.\.\/utils['"]/g, "from './utils'");

  return transformed;
}

/**
 * Transform SSR-unsafe require() calls to standard ESM imports
 *
 * Upstream pie-lib code uses this pattern for SSR compatibility with MathQuill:
 *
 * ```js
 * // - mathquill error window not defined
 * let EditableHtml;
 * let StyledEditableHTML;
 * if (typeof window !== 'undefined') {
 *   EditableHtml = require('@pie-lib/editable-html-tip-tap')['default'];
 *   StyledEditableHTML = styled(EditableHtml)(({ theme }) => ({
 *     fontFamily: theme.typography.fontFamily,
 *   }));
 * }
 * ```
 *
 * This doesn't work in browser ESM (require is not defined). Transform to:
 *
 * ```tsx
 * import EditableHtmlImport from '@pie-lib/editable-html-tip-tap';
 *
 * const EditableHtml = EditableHtmlImport;
 * const StyledEditableHTML = styled(EditableHtml)(({ theme }) => ({
 *   fontFamily: theme.typography.fontFamily,
 * }));
 * ```
 *
 * We use direct imports instead of React.lazy because:
 * - Simpler code (no Suspense wrapper needed)
 * - No loading flicker
 * - Modern bundlers handle ESM imports correctly for SSR
 * - The component is always needed (no code-splitting benefit)
 */
export function transformSsrRequireToReactLazy(content: string): string {
  let transformed = content;

  // Pattern 1: SSR check with require() for editable-html-tip-tap with styled wrapper
  // Matches:
  //   // - mathquill error window not defined
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

    // Generate direct import replacement (better than React.lazy - simpler, no Suspense needed)
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

    // Generate direct import replacement (better than React.lazy - simpler, no Suspense needed)
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

  // Pattern 3: Class methods/arrow functions that might return styled components
  // Add `: any` return type to methods that are missing type annotations
  // Match: methodName = () => { or methodName = (params) => {
  // But only at start of line (class methods), not property assignments like reader.onload =
  // And only if they don't already have a type annotation
  const methodRegex = /^(\s*)(\w+)\s*=\s*\([^)]*\)\s*=>\s*\{/gm;
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
  let transformed = content;

  // Extract element name from package name (@pie-element/fraction-model → fraction-model)
  const elementName = packageName.replace('@pie-element/', '');

  // Pattern: import { X } from '@pie-element/element-name' or import X from '@pie-element/element-name'
  const selfImportPattern = new RegExp(
    `import\\s+(?:\\{\\s*([^}]+)\\s*\\}|([\\w]+))\\s+from\\s+['"]@pie-element/${elementName}['"]`,
    'g'
  );

  const matches = Array.from(transformed.matchAll(selfImportPattern));

  for (const match of matches) {
    const [fullMatch, namedImports, defaultImport] = match;

    // Determine source directory (configure/src → author, src → delivery)
    let targetPath = '';

    if (sourceFilePath.startsWith('configure/src/')) {
      // Configure files reference delivery components
      // configure/src/main.jsx → author/main.tsx
      // Relative path from author/ to delivery/
      targetPath = '../delivery';
    } else if (sourceFilePath.startsWith('src/')) {
      // Main src files shouldn't self-reference, but handle it anyway
      targetPath = '.';
    } else {
      // Unknown structure, skip
      continue;
    }

    // Strategy: Self-referential imports typically come from the package's main
    // index file which re-exports from various locations. Rather than trying to
    // guess individual file locations (which often fails for namespace exports
    // and re-exports), we keep the import pointing to the index (delivery folder)
    // which handles all re-exports correctly.
    //
    // Examples:
    // - import { NumberLineComponent, dataConverter, tickUtils } from '@pie-element/number-line'
    //   → import { NumberLineComponent, dataConverter, tickUtils } from '../delivery'
    // - import FractionModel from '@pie-element/fraction-model'
    //   → import FractionModel from '../delivery'

    if (namedImports) {
      // Named imports - keep them as a single import from the index
      const replacement = `import { ${namedImports} } from '${targetPath}'`;
      transformed = transformed.replace(fullMatch, replacement);
    } else if (defaultImport) {
      // Default import - reference main index
      const replacement = `import ${defaultImport} from '${targetPath}'`;
      transformed = transformed.replace(fullMatch, replacement);
    }
  }

  return transformed;
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
  if (sourcePath?.includes('charting') && sourcePath.includes('utils')) {
    // Fix: export const dataToXBand = (...) => { ... }
    // Pattern: export const functionName = (params) => {
    transformed = transformed.replace(
      /export const dataToXBand = \(/g,
      'export const dataToXBand: any = ('
    );
  }

  // Fix translator package default export type inference issue
  // The spread operator `...i18next` causes TypeScript to require a reference to i18next types
  if (sourcePath?.includes('translator') && sourcePath?.includes('/src/index')) {
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
  let transformed = content;

  // Pattern 1: import Menu from '@mui/material/Menu'
  // → import { InlineMenu as Menu } from '@pie-lib/render-ui'
  if (/import\s+Menu\s+from\s+['"]@mui\/material\/Menu['"]/.test(transformed)) {
    transformed = transformed.replace(
      /import\s+Menu\s+from\s+['"]@mui\/material\/Menu['"]/g,
      "import { InlineMenu as Menu } from '@pie-lib/render-ui'"
    );
  }

  // Pattern 2: import Menu, { MenuProps } from '@mui/material/Menu'
  // → import { InlineMenu as Menu } from '@pie-lib/render-ui'
  //   import type { MenuProps } from '@mui/material/Menu'
  const namedImportMatch = transformed.match(
    /import\s+Menu\s*,\s*\{([^}]+)\}\s+from\s+['"]@mui\/material\/Menu['"]/
  );
  if (namedImportMatch) {
    const namedImports = namedImportMatch[1];
    transformed = transformed.replace(
      /import\s+Menu\s*,\s*\{([^}]+)\}\s+from\s+['"]@mui\/material\/Menu['"]/,
      `import { InlineMenu as Menu } from '@pie-lib/render-ui';\nimport type {${namedImports}} from '@mui/material/Menu'`
    );
  }

  return transformed;
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
  if (!sourcePath?.includes('render-ui/src/index.js')) {
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
 * Transform MathQuill.getInterface(2) to getInterface(3)
 *
 * Interface version 2 requires jQuery, but pie-elements-ng uses interface version 3
 * which has a jQuery-free API. This transform updates calls to use version 3.
 *
 * @param content - Source code content
 * @returns Transformed content with getInterface(3) instead of getInterface(2)
 */
export function transformMathQuillInterface(content: string): string {
  // Replace MathQuill.getInterface(2) with MathQuill.getInterface(3)
  return content.replace(/MathQuill\.getInterface\(2\)/g, 'MathQuill.getInterface(3)');
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
