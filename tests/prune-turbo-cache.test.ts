import { describe, expect, it } from 'vitest';
import { staleCacheFiles } from '../scripts/prune-turbo-cache.mjs';

describe('turbo cache pruning', () => {
  it('deletes every file of an entry no build task hashes to, and keeps the live ones', () => {
    const files = [
      '0a0c36b25ad21440.tar.zst',
      '0a0c36b25ad21440-meta.json',
      '0a0c36b25ad21440-manifest.json',
      'ffffffffffffffff.tar.zst',
      'ffffffffffffffff-meta.json',
      'ffffffffffffffff-manifest.json',
    ];
    expect(staleCacheFiles(files, new Set(['0a0c36b25ad21440']))).toEqual([
      'ffffffffffffffff.tar.zst',
      'ffffffffffffffff-meta.json',
      'ffffffffffffffff-manifest.json',
    ]);
  });

  it('keeps files Turbo did not name by task hash', () => {
    expect(staleCacheFiles(['README', 'tmp-123', 'abc.tar.zst'], new Set())).toEqual([]);
  });
});
