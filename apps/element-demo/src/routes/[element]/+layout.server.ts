/**
 * Server-side layout loader for element routes
 * Validates element exists before attempting to load
 */
import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { ELEMENT_REGISTRY } from '$lib/elements/registry';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const load: LayoutServerLoad = async ({ params }) => {
  const elementName = params.element || 'multiple-choice';

  // Validate element exists in registry
  const elementInfo = ELEMENT_REGISTRY.find((el) => el.name === elementName);

  if (!elementInfo) {
    const availableElements = ELEMENT_REGISTRY.map((el) => el.name);

    // Find similar elements (fuzzy match)
    const similarElements = availableElements.filter(
      (name) => name.includes(elementName.slice(0, 3)) || elementName.includes(name.slice(0, 3))
    );

    // Build helpful error message
    const suggestions =
      similarElements.length > 0
        ? `Did you mean one of these?\n${similarElements.map((name) => `  - /${name}/deliver`).join('\n')}`
        : 'No similar elements found.';

    const errorMessage = [
      `Element "${elementName}" not found in registry.`,
      '',
      `Available elements: ${availableElements.join(', ')}`,
      '',
      suggestions,
    ].join('\n');

    // Use SvelteKit's error helper for proper error handling
    throw error(404, errorMessage);
  }

  const version = await resolveElementVersion(elementName);

  // Element is valid, return minimal data
  // The client-side +layout.ts will handle loading the actual element data
  return {
    elementExists: true,
    elementVersion: version,
  };
};

async function resolveElementVersion(elementName: string): Promise<string> {
  const fileDir = path.dirname(fileURLToPath(import.meta.url));
  const roots = [...findRepoRootCandidates(fileDir), ...findRepoRootCandidates(process.cwd())];

  const candidatePaths = roots.flatMap((root) => [
    path.join(root, 'packages', 'elements-react', elementName, 'package.json'),
    path.join(root, 'packages', 'elements-svelte', elementName, 'package.json'),
  ]);

  for (const packageJsonPath of candidatePaths) {
    try {
      const raw = await readFile(packageJsonPath, 'utf-8');
      const parsed = JSON.parse(raw) as { version?: string };
      if (parsed.version) {
        return parsed.version;
      }
    } catch {
      // Try next candidate.
    }
  }

  return 'latest';
}

function findRepoRootCandidates(startDir: string): string[] {
  const candidates: string[] = [];
  let current = path.resolve(startDir);

  for (let i = 0; i < 10; i += 1) {
    if (existsSync(path.join(current, 'packages', 'elements-react'))) {
      candidates.push(current);
    }
    const next = path.dirname(current);
    if (next === current) {
      break;
    }
    current = next;
  }

  return Array.from(new Set(candidates));
}
