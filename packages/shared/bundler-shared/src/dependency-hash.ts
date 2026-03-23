/**
 * Generate deterministic hash from dependencies
 * Copied from pie-api-aws/packages/datastore/src/dependency.ts
 */

import { createHash } from 'node:crypto';
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

export function mkBundleCacheKey(deps: BuildDependency[], cacheSalt?: string): string {
  const dependencyHash = mkDependencyHash(deps);
  const normalizedSalt = cacheSalt?.trim();
  if (!normalizedSalt) {
    return dependencyHash;
  }

  const saltedHash = createHash('sha256')
    .update(dependencyHash)
    .update('\0')
    .update(normalizedSalt)
    .digest('hex')
    .slice(0, 16);

  return `${dependencyHash}-${saltedHash}`;
}
