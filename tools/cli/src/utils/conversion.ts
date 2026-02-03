/**
 * JavaScript to TypeScript conversion utilities
 */

export interface ConversionMetadata {
  sourcePath: string;
  commit: string;
}

export interface ConversionResult {
  code: string;
  hasDefaultObjectExport: boolean;
}

/**
 * Convert JavaScript to TypeScript
 */
export function convertJsToTs(jsCode: string, metadata: ConversionMetadata): ConversionResult {
  // We intentionally do NOT transform the JavaScript syntax.
  // Goal: keep upstream source as-is, while letting the monorepo's TS/Vite pipeline build it.
  // TypeScript diagnostics are suppressed for synced files.
  let tsCode = jsCode;
  const hasDefaultObjectExport = false;

  // Convert CommonJS module.exports to ES modules
  tsCode = convertModuleExportsToEsm(tsCode);

  // Must be at the very top of the file to reliably suppress TypeScript diagnostics.
  // We keep synced files buildable even when upstream JS has type issues.
  const tsNoCheck = `// @ts-nocheck\n`;

  // Add sync metadata header
  const header = `/**
 * @synced-from ${metadata.sourcePath}
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

`;
  return { code: tsNoCheck + header + tsCode, hasDefaultObjectExport };
}

/**
 * Convert CommonJS module.exports to ES module exports
 */
function convertModuleExportsToEsm(content: string): string {
  // Match: module.exports = { key: value, key2: value2, ... };
  const moduleExportsPattern = /module\.exports\s*=\s*\{([\s\S]*?)\};?/;
  const match = content.match(moduleExportsPattern);

  if (!match) {
    return content;
  }

  const [fullMatch, objectContent] = match;

  // Parse the object content into key-value pairs
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
 * Convert JSX to TSX
 */
export function convertJsxToTsx(jsxCode: string, metadata: ConversionMetadata): ConversionResult {
  // We intentionally do NOT transform the JavaScript/JSX syntax.
  // Goal: keep upstream source as-is, while letting the monorepo's TS/Vite pipeline build it.
  // TypeScript diagnostics are suppressed for synced files.
  const tsxCode = jsxCode;
  const hasDefaultObjectExport = false;

  // Must be at the very top of the file to reliably suppress TypeScript diagnostics.
  // We keep synced files buildable even when upstream JSX has type issues.
  const tsNoCheck = `// @ts-nocheck\n`;

  // Add sync metadata header
  const header = `/**
 * @synced-from ${metadata.sourcePath}
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

`;
  return { code: tsNoCheck + header + tsxCode, hasDefaultObjectExport };
}

/**
 * Fix imports from default export files
 * Some files export default objects but are imported with named imports
 */
export function fixImports(content: string, hasDefaultObjectExport: boolean): string {
  if (!hasDefaultObjectExport) {
    return content;
  }

  // Convert: import { something } from './file'
  // To: import * as file from './file'
  // This is needed when the imported file has export default {}
  return content.replace(
    /import\s+{\s*([^}]+)\s*}\s+from\s+(['"]\.\/[^'"]+['"])/g,
    (_match, _imports, path) => {
      // Extract filename from path
      const filename =
        path
          .replace(/['"]/g, '')
          .split('/')
          .pop()
          ?.replace(/\.\w+$/, '') || 'module';
      return `import * as ${filename} from ${path}`;
    }
  );
}
