import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { detectPendingChangesets } from '../scripts/release-detect-intent.mjs';

async function makeRepoFixture(): Promise<string> {
  const root = join(tmpdir(), `pie-release-detect-${process.pid}-${Date.now()}-${Math.random()}`);
  await mkdir(join(root, '.changeset'), { recursive: true });
  await writeFile(join(root, '.changeset', 'README.md'), '# Changesets\n', 'utf8');
  return root;
}

describe('release intent detection', () => {
  it('ignores prerelease changesets that pre.json already consumed', async () => {
    const root = await makeRepoFixture();
    await writeFile(
      join(root, '.changeset', 'already-applied.md'),
      '---\n"@pie-element/multiple-choice": patch\n---\n\nAlready applied in prerelease mode\n',
      'utf8'
    );
    await writeFile(
      join(root, '.changeset', 'pre.json'),
      JSON.stringify({ mode: 'pre', tag: 'next', changesets: ['already-applied'] }, null, 2),
      'utf8'
    );

    expect(await detectPendingChangesets(root)).toEqual({
      hasChangesets: false,
      pendingChangesets: [],
    });
  });

  it('reports changesets that are not consumed by prerelease state', async () => {
    const root = await makeRepoFixture();
    await writeFile(
      join(root, '.changeset', 'already-applied.md'),
      '---\n"@pie-element/multiple-choice": patch\n---\n\nAlready applied\n',
      'utf8'
    );
    await writeFile(
      join(root, '.changeset', 'new-release-work.md'),
      '---\n"@pie-element/inline-dropdown": patch\n---\n\nNew work\n',
      'utf8'
    );
    await writeFile(
      join(root, '.changeset', 'pre.json'),
      JSON.stringify({ mode: 'pre', tag: 'next', changesets: ['already-applied'] }, null, 2),
      'utf8'
    );

    expect(await detectPendingChangesets(root)).toEqual({
      hasChangesets: true,
      pendingChangesets: ['new-release-work'],
    });
  });

  // The archive under `.changeset/pre/` is what the first stable release builds its changelog
  // from, so once prerelease mode is gone it has to count, exactly as changesets itself counts it.
  it('reports the prerelease archive as pending once prerelease mode is gone', async () => {
    const root = await makeRepoFixture();
    await mkdir(join(root, '.changeset', 'pre'), { recursive: true });
    await writeFile(
      join(root, '.changeset', 'pre', 'shipped-as-next.md'),
      '---\n"@pie-element/multiple-choice": patch\n---\n\nShipped in a prerelease\n',
      'utf8'
    );
    await writeFile(
      join(root, '.changeset', 'pr-12.md'),
      '---\n"@pie-element/inline-dropdown": patch\n---\n\nNew work\n',
      'utf8'
    );

    expect(await detectPendingChangesets(root)).toEqual({
      hasChangesets: true,
      pendingChangesets: ['pr-12', 'pre/shipped-as-next'],
    });
  });

  it('leaves the prerelease archive out while prerelease mode is on', async () => {
    const root = await makeRepoFixture();
    await mkdir(join(root, '.changeset', 'pre'), { recursive: true });
    await writeFile(
      join(root, '.changeset', 'pre', 'shipped-as-next.md'),
      '---\n"@pie-element/multiple-choice": patch\n---\n\nShipped in a prerelease\n',
      'utf8'
    );
    await writeFile(
      join(root, '.changeset', 'pre.json'),
      JSON.stringify({ mode: 'pre', tag: 'next', changesets: [] }, null, 2),
      'utf8'
    );

    expect(await detectPendingChangesets(root)).toEqual({
      hasChangesets: false,
      pendingChangesets: [],
    });
  });
});
