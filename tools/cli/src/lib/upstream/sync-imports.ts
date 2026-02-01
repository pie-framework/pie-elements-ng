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
 * 2. **@pie-framework Events → Internal Packages**:
 *    - Upstream references external @pie-framework packages
 *    - Monorepo uses internal @pie-element/shared-* packages
 *
 * 3. **Editable-HTML Constants Inlining**:
 *    - `editable-html` package is not ESM-compatible (Slate v0.x dependencies)
 *    - We only need constants, so inline them to avoid the dependency
 *
 * 4. **TokenTypes Re-export**:
 *    - Upstream code works in CommonJS/Webpack (looser module resolution)
 *    - ESM requires explicit re-exports for proper module graph
 *
 * 5. **Configure Defaults Inlining**:
 *    - Configure package is not ESM-compatible (Slate v0.x dependencies)
 *    - Student-facing UI only needs minimal fallback configuration
 *    - Inline empty defaults object to avoid the dependency
 */
import { readFile, writeFile } from 'node:fs/promises';

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
 * - @pie-lib/mathml-to-latex → @pie-element/shared-mathml-to-latex
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

  // Transform mathml-to-latex
  transformed = transformed.replace(
    /from\s+['"]@pie-lib\/mathml-to-latex['"]/g,
    "from '@pie-element/shared-mathml-to-latex'"
  );

  // Transform feedback
  transformed = transformed.replace(
    /from\s+['"]@pie-lib\/feedback['"]/g,
    "from '@pie-element/shared-feedback'"
  );

  return transformed;
}

/**
 * Transform @pie-framework/mathquill imports to internal @pie-element/shared-mathquill
 *
 * Handles:
 * - @pie-framework/mathquill → @pie-element/shared-mathquill
 *
 * Our internal mathquill package is a fork from the PIE org with matrix support,
 * accessibility features, and modernized ESM code.
 */
export function transformMathquillImports(content: string): string {
  return content.replace(
    /from\s+['"]@pie-framework\/mathquill['"]/g,
    "from '@pie-element/shared-mathquill'"
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
    '@pie-lib/mathml-to-latex': '@pie-element/shared-mathml-to-latex',
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
 * Transform package.json dependencies for @pie-framework/mathquill
 *
 * Replaces @pie-framework/mathquill with internal @pie-element/shared-mathquill
 */
export function transformPackageJsonMathquill<T extends Record<string, any>>(packageJson: T): T {
  const transformed = { ...packageJson };

  // Replace @pie-framework/mathquill with internal package
  if (transformed.dependencies?.['@pie-framework/mathquill']) {
    transformed.dependencies['@pie-element/shared-mathquill'] = 'workspace:*';
    delete transformed.dependencies['@pie-framework/mathquill'];
  }
  if (transformed.devDependencies?.['@pie-framework/mathquill']) {
    transformed.devDependencies['@pie-element/shared-mathquill'] = 'workspace:*';
    delete transformed.devDependencies['@pie-framework/mathquill'];
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

  // Transform '../utils' to './utils' (only exact match, not '../utils/something')
  let transformed = content;
  transformed = transformed.replace(/from\s+['"]\.\.\/utils['"]/g, "from './utils'");

  return transformed;
}

/**
 * Transform SSR-unsafe require() calls to React.lazy() with dynamic imports
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
 * // Lazy load EditableHtml to avoid SSR issues with mathquill
 * const EditableHtmlLazy = React.lazy(() =>
 *   import('@pie-lib/editable-html-tip-tap').then(module => ({ default: module.default }))
 * );
 *
 * const StyledEditableHTML = styled(EditableHtmlLazy)(({ theme }) => ({
 *   fontFamily: theme.typography.fontFamily,
 * }));
 * ```
 *
 * Also automatically wraps JSX usage in React.Suspense for full automation.
 */
export function transformSsrRequireToReactLazy(content: string): string {
  let transformed = content;
  let componentToWrap: string | null = null;

  // Pattern 1: SSR check with require() for editable-html-tip-tap with styled wrapper
  // Matches:
  //   // - mathquill error window not defined
  //   let EditableHtml;
  //   let StyledEditableHTML;
  //   if (typeof window !== 'undefined') {
  //     EditableHtml = require('@pie-lib/editable-html-tip-tap')['default'];
  //     StyledEditableHTML = styled(EditableHtml)(...);
  //   }

  const ssrRequirePattern =
    /\/\/\s*-\s*mathquill\s+error\s+window\s+not\s+defined\s*\nlet\s+(\w+);\s*\nlet\s+(\w+);\s*\nif\s*\(\s*typeof\s+window\s*!==\s*['"]undefined['"]\s*\)\s*\{\s*\n\s*\1\s*=\s*require\(['"](@pie-lib\/[^'"]+)['"]\)\[['"]default['"]\];\s*\n\s*\2\s*=\s*styled\(\1\)\(([\s\S]*?)\);\s*\n\s*\}/;

  const match = transformed.match(ssrRequirePattern);

  if (match) {
    const [fullMatch, componentVar, styledVar, importPath, styleParams] = match;

    // Generate the React.lazy() replacement
    const replacement = `// Lazy load EditableHtml to avoid SSR issues with mathquill
const ${componentVar}Lazy = React.lazy(() =>
  import('${importPath}').then(module => ({ default: module.default }))
);

const ${styledVar} = styled(${componentVar}Lazy)(${styleParams});`;

    transformed = transformed.replace(fullMatch, replacement);
    componentToWrap = styledVar; // The styled component needs Suspense wrapping
  }

  // Pattern 2: Simpler pattern without styled wrapper (used in mask-markup)
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

    // Generate the React.lazy() replacement
    const replacement = `// Lazy load EditableHtml to avoid SSR issues with mathquill
const ${componentVar} = React.lazy(() =>
  import('${importPath}').then(module => ({ default: module.default }))
);`;

    transformed = transformed.replace(fullMatch, replacement);
    componentToWrap = componentVar;
  }

  // Now wrap JSX usage in React.Suspense if we found a component to wrap
  if (componentToWrap) {
    transformed = wrapComponentInSuspense(transformed, componentToWrap);
  }

  return transformed;
}

/**
 * Wrap JSX component usage in React.Suspense
 *
 * Finds all JSX instances of the component and wraps them in Suspense,
 * but only if not already wrapped.
 */
function wrapComponentInSuspense(content: string, componentName: string): string {
  let transformed = content;

  // Find all JSX instances of the component: <ComponentName ... />  or  <ComponentName ...>...</ComponentName>
  // This handles both self-closing and paired tags

  // Pattern for self-closing tags: <ComponentName ... />
  const selfClosingPattern = new RegExp(`(<${componentName}[\\s\\n][^>]*?\\/>)`, 'g');

  // Pattern for paired tags: <ComponentName ...>...</ComponentName>
  // We need to handle potentially nested content, so we'll use a simple approach
  const openTagPattern = new RegExp(`(<${componentName}(?:[\\s\\n][^>]*)?>)`, 'g');

  // Track all positions where we found the component
  const positions: Array<{ start: number; end: number; content: string }> = [];

  // Find self-closing instances
  let match: RegExpExecArray | null;
  match = selfClosingPattern.exec(content);
  while (match !== null) {
    const start = match.index;
    const fullMatch = match[0];
    const end = start + fullMatch.length;

    // Check if already wrapped in Suspense
    const before = content.slice(Math.max(0, start - 150), start);
    if (!before.includes('<React.Suspense') && !before.includes('<Suspense')) {
      positions.push({ start, end, content: fullMatch });
    }
    match = selfClosingPattern.exec(content);
  }

  // Find paired tag instances (more complex - need to find matching closing tag)
  openTagPattern.lastIndex = 0;
  match = openTagPattern.exec(content);
  const maxIterations = 1000; // Safety limit to prevent infinite loops
  let iterations = 0;

  while (match !== null && iterations < maxIterations) {
    iterations++;
    const openTagStart = match.index;
    const openTag = match[0];

    // Skip if this is a self-closing tag (already handled)
    if (openTag.endsWith('/>')) {
      match = openTagPattern.exec(content);
      continue;
    }

    // Find the matching closing tag
    const closingTag = `</${componentName}>`;
    let depth = 1;
    let searchPos = openTagStart + openTag.length;
    let closingTagPos = -1;

    // Simple depth-based search for matching closing tag
    while (depth > 0 && searchPos < content.length) {
      const nextOpen = content.indexOf(`<${componentName}`, searchPos);
      const nextClose = content.indexOf(closingTag, searchPos);

      if (nextClose === -1) break; // No closing tag found

      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Another opening tag before the closing tag
        depth++;
        searchPos = nextOpen + componentName.length + 1;
      } else {
        // Closing tag
        depth--;
        if (depth === 0) {
          closingTagPos = nextClose;
        }
        searchPos = nextClose + closingTag.length;
      }
    }

    if (closingTagPos !== -1) {
      const fullContent = content.slice(openTagStart, closingTagPos + closingTag.length);

      // Check if already wrapped in Suspense
      const before = content.slice(Math.max(0, openTagStart - 150), openTagStart);
      if (!before.includes('<React.Suspense') && !before.includes('<Suspense')) {
        positions.push({
          start: openTagStart,
          end: closingTagPos + closingTag.length,
          content: fullContent,
        });
      }
    }

    // Get next match - ensure we're advancing
    const prevLastIndex = openTagPattern.lastIndex;
    match = openTagPattern.exec(content);

    // Safety: if lastIndex didn't advance, force it forward to prevent infinite loop
    if (match && openTagPattern.lastIndex === prevLastIndex) {
      openTagPattern.lastIndex = prevLastIndex + 1;
      match = openTagPattern.exec(content);
    }
  }

  if (iterations >= maxIterations) {
    console.warn(
      `Warning: wrapComponentInSuspense hit iteration limit for component ${componentName}`
    );
  }

  // Apply wrapping in reverse order to preserve positions
  positions.sort((a, b) => b.start - a.start);

  for (const pos of positions) {
    const wrapped = `<React.Suspense fallback={<div>Loading editor...</div>}>
        ${pos.content}
      </React.Suspense>`;

    transformed = transformed.slice(0, pos.start) + wrapped + transformed.slice(pos.end);
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
