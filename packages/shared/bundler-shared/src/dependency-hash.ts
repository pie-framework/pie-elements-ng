/**
 * Generate deterministic hash from dependencies
 * Copied from pie-api-aws/packages/datastore/src/dependency.ts
 */

import hash from 'string-hash';
import type { BuildDependency } from './types.js';

export function mkDependencyHash(deps: BuildDependency[]): string {
  // Deduplicate by name (keep first occurrence)
  const unique = Array.from(new Map(deps.map((d) => [d.name, d])).values());

  // Create sorted string: "pkg1@1.0.0+pkg2@2.0.0"
  const depString = unique
    .map((d) => `${d.name}@${d.version || 'latest'}`)
    .sort()
    .join('+');

  return String(hash(depString));
}
