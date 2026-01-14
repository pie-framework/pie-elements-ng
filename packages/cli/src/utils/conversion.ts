/**
 * JavaScript to TypeScript conversion utilities
 */

export interface ConversionMetadata {
  sourcePath: string;
  commit: string;
  date: string;
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
  const tsCode = jsCode;
  const hasDefaultObjectExport = false;

  // Must be at the very top of the file to reliably suppress TypeScript diagnostics.
  // We keep synced files buildable even when upstream JS has type issues.
  const tsNoCheck = `// @ts-nocheck\n`;

  // Add sync metadata header
  const header = `/**
 * @synced-from ${metadata.sourcePath}
 * @synced-commit ${metadata.commit}
 * @synced-date ${metadata.date}
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
 * @synced-commit ${metadata.commit}
 * @synced-date ${metadata.date}
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
