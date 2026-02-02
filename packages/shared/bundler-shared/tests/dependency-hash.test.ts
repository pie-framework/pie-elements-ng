/**
 * Unit tests for dependency hash generation
 */

import { describe, it, expect } from 'vitest';
import { mkDependencyHash } from '../src/dependency-hash';
import type { BuildDependency } from '../src/types';

describe('mkDependencyHash', () => {
  it('should generate a deterministic hash for dependencies', () => {
    const deps: BuildDependency[] = [{ name: '@pie-element/multiple-choice', version: '2.0.0' }];

    const hash1 = mkDependencyHash(deps);
    const hash2 = mkDependencyHash(deps);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^\d+$/); // Should be a numeric string
  });

  it('should generate same hash regardless of dependency order', () => {
    const deps1: BuildDependency[] = [
      { name: '@pie-element/multiple-choice', version: '2.0.0' },
      { name: '@pie-element/text-entry', version: '0.2.0' },
    ];

    const deps2: BuildDependency[] = [
      { name: '@pie-element/text-entry', version: '0.2.0' },
      { name: '@pie-element/multiple-choice', version: '2.0.0' },
    ];

    const hash1 = mkDependencyHash(deps1);
    const hash2 = mkDependencyHash(deps2);

    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different versions', () => {
    const deps1: BuildDependency[] = [{ name: '@pie-element/multiple-choice', version: '2.0.0' }];

    const deps2: BuildDependency[] = [{ name: '@pie-element/multiple-choice', version: '0.2.0' }];

    const hash1 = mkDependencyHash(deps1);
    const hash2 = mkDependencyHash(deps2);

    expect(hash1).not.toBe(hash2);
  });

  it('should generate different hashes for different packages', () => {
    const deps1: BuildDependency[] = [{ name: '@pie-element/multiple-choice', version: '2.0.0' }];

    const deps2: BuildDependency[] = [{ name: '@pie-element/text-entry', version: '0.1.0' }];

    const hash1 = mkDependencyHash(deps1);
    const hash2 = mkDependencyHash(deps2);

    expect(hash1).not.toBe(hash2);
  });

  it('should handle duplicate dependencies', () => {
    const deps1: BuildDependency[] = [
      { name: '@pie-element/multiple-choice', version: '2.0.0' },
      { name: '@pie-element/multiple-choice', version: '2.0.0' },
    ];

    const deps2: BuildDependency[] = [{ name: '@pie-element/multiple-choice', version: '2.0.0' }];

    const hash1 = mkDependencyHash(deps1);
    const hash2 = mkDependencyHash(deps2);

    // Duplicates should be removed, so hashes should be the same
    expect(hash1).toBe(hash2);
  });

  it('should handle multiple dependencies', () => {
    const deps: BuildDependency[] = [
      { name: '@pie-element/multiple-choice', version: '2.0.0' },
      { name: '@pie-element/text-entry', version: '0.2.0' },
      { name: '@pie-element/inline-choice', version: '0.3.0' },
    ];

    const hash = mkDependencyHash(deps);

    expect(hash).toBeDefined();
    expect(hash).toMatch(/^\d+$/);
  });

  it('should be stable across process restarts', () => {
    // This test verifies that the hash is based on content, not process-specific state
    const deps: BuildDependency[] = [{ name: '@pie-element/multiple-choice', version: '2.0.0' }];

    const hash = mkDependencyHash(deps);

    // Known hash value for this specific input (from string-hash)
    // This ensures the hash algorithm is stable
    expect(hash).toBe('1091131105');
  });
});
