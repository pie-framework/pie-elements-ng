/**
 * Generate entry files (player.js, client-player.js, editor.js)
 * Simplified from pie-api-aws/packages/bundler/src/code-generator.ts
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BuildBundleName, BuildDependency } from './types.js';

type EntryFiles = Partial<Record<BuildBundleName, string>>;

export function generateEntries(
  deps: BuildDependency[],
  workspaceDir: string,
  requestedBundles: BuildBundleName[]
): EntryFiles {
  const imports: string[] = [];
  const playerExports: string[] = [];
  const clientExports: string[] = [];
  const editorExports: string[] = [];

  for (const dep of deps) {
    const pkgJsonPath = join(workspaceDir, 'node_modules', dep.name, 'package.json');

    let pkgJson: any;
    try {
      pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
    } catch (error: any) {
      console.error(
        `[entry-generator] Failed to read package.json for ${dep.name}:`,
        error.message
      );
      throw error;
    }

    const elementName = toElementName(dep.name);

    // Import main element
    imports.push(`import ${elementName} from '${dep.name}';`);

    // Player: Element (+ optional Print)
    playerExports.push(`  '${dep.name}': { Element: ${elementName} },`);
    playerExports.push(`  '${dep.name}@${dep.version}': { Element: ${elementName} },`);

    // Check for print component
    const hasPrint = pkgJson.exports?.['./print'];
    if (hasPrint) {
      const printName = `${elementName}Print`;
      imports.push(`import ${printName} from '${dep.name}/print';`);
      playerExports[playerExports.length - 2] =
        `  '${dep.name}': { Element: ${elementName}, Print: ${printName} },`;
      playerExports[playerExports.length - 1] =
        `  '${dep.name}@${dep.version}': { Element: ${elementName}, Print: ${printName} },`;
    }

    // Check for controller
    const hasController = pkgJson.exports?.['./controller'];
    if (hasController) {
      const controllerName = `${elementName}Controller`;
      imports.push(`import * as ${controllerName} from '${dep.name}/controller';`);

      // Client-player: Element + controller
      clientExports.push(
        `  '${dep.name}': { Element: ${elementName}, controller: ${controllerName} },`
      );
      clientExports.push(
        `  '${dep.name}@${dep.version}': { Element: ${elementName}, controller: ${controllerName} },`
      );

      // Editor also needs controller
      editorExports.push(
        `  '${dep.name}': { Element: ${elementName}, controller: ${controllerName}`
      );
      editorExports.push(
        `  '${dep.name}@${dep.version}': { Element: ${elementName}, controller: ${controllerName}`
      );
    }

    // Check for author/configure
    const hasAuthor = pkgJson.exports?.['./author'];
    if (hasAuthor) {
      const configureName = `${elementName}Configure`;
      imports.push(`import ${configureName} from '${dep.name}/author';`);

      // Editor: Add Configure
      if (hasController) {
        // Complete previous entries with Configure
        editorExports[editorExports.length - 2] += `, Configure: ${configureName} },`;
        editorExports[editorExports.length - 1] += `, Configure: ${configureName} },`;
      } else {
        // No controller, just Element + Configure
        editorExports.push(
          `  '${dep.name}': { Element: ${elementName}, Configure: ${configureName} },`
        );
        editorExports.push(
          `  '${dep.name}@${dep.version}': { Element: ${elementName}, Configure: ${configureName} },`
        );
      }
    } else if (hasController) {
      // Close entries without Configure
      editorExports[editorExports.length - 2] += ' },';
      editorExports[editorExports.length - 1] += ' },';
    }
  }

  const output: EntryFiles = {};
  if (requestedBundles.includes('player')) {
    output.player = `
${imports.join('\n')}

export default {
${playerExports.join('\n')}
};
    `.trim();
  }

  if (requestedBundles.includes('client-player')) {
    output['client-player'] = `
${imports.join('\n')}

export default {
${clientExports.join('\n')}
};
    `.trim();
  }

  if (requestedBundles.includes('editor')) {
    output.editor = `
${imports.join('\n')}

export default {
${editorExports.join('\n')}
};
    `.trim();
  }

  return output;
}

function toElementName(pkgName: string): string {
  // @pie-element/multiple-choice -> MultipleChoice
  return pkgName
    .replace('@pie-element/', '')
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}
