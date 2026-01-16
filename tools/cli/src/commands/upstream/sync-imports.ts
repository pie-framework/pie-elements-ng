/**
 * Import rewriting utilities for sync operations
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
 * - @pie-framework/pie-player-events → @pie-elements-ng/shared-player-events
 * - @pie-framework/pie-configure-events → @pie-elements-ng/shared-configure-events
 */
export function transformPieFrameworkEventImports(content: string): string {
  let transformed = content;

  // Transform pie-player-events imports
  transformed = transformed.replace(
    /from\s+['"]@pie-framework\/pie-player-events['"]/g,
    "from '@pie-elements-ng/shared-player-events'"
  );

  // Transform pie-configure-events imports
  transformed = transformed.replace(
    /from\s+['"]@pie-framework\/pie-configure-events['"]/g,
    "from '@pie-elements-ng/shared-configure-events'"
  );

  return transformed;
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
    transformed.dependencies['@pie-elements-ng/shared-player-events'] = 'workspace:*';
    delete transformed.dependencies['@pie-framework/pie-player-events'];
  }
  if (transformed.devDependencies?.['@pie-framework/pie-player-events']) {
    transformed.devDependencies['@pie-elements-ng/shared-player-events'] = 'workspace:*';
    delete transformed.devDependencies['@pie-framework/pie-player-events'];
  }

  // Replace @pie-framework/pie-configure-events with internal package
  if (transformed.dependencies?.['@pie-framework/pie-configure-events']) {
    transformed.dependencies['@pie-elements-ng/shared-configure-events'] = 'workspace:*';
    delete transformed.dependencies['@pie-framework/pie-configure-events'];
  }
  if (transformed.devDependencies?.['@pie-framework/pie-configure-events']) {
    transformed.devDependencies['@pie-elements-ng/shared-configure-events'] = 'workspace:*';
    delete transformed.devDependencies['@pie-framework/pie-configure-events'];
  }

  return transformed;
}
