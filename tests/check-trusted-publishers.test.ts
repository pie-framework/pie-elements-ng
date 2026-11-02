import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectStaleClaims,
  collectTrustedPublisherFailures,
  partitionUnclaimedByRegistry,
} from '../scripts/check-trusted-publishers.mjs';
import {
  LEDGER_RELATIVE_PATH,
  publishablePackages,
  readLedger,
  updateLedger,
} from '../scripts/lib/trusted-publishers.mjs';

const SLUG = 'pie-framework/pie-elements-ng';
const ROOT = path.resolve(__dirname, '..');

const packages = [
  { name: '@pie-element/multiple-choice', workflow: 'release.yml' },
  { name: '@pie-lib/render-ui', workflow: 'release.yml' },
];

const claim = { repository: SLUG, workflow: 'release.yml' };
const ledgerFor = (entries: Record<string, unknown>) => ({ packages: entries });

/** A throwaway repo root with the ledger's parent directory in place. */
const makeLedgerRoot = () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'trusted-publishers-'));
  mkdirSync(path.join(root, path.dirname(LEDGER_RELATIVE_PATH)), { recursive: true });
  return root;
};

describe('check-trusted-publishers', () => {
  it('passes when every publishable package has a matching claim', () => {
    const { failures, unclaimed } = collectTrustedPublisherFailures({
      packages,
      slug: SLUG,
      ledger: ledgerFor({
        '@pie-element/multiple-choice': claim,
        '@pie-lib/render-ui': claim,
      }),
    });

    expect(failures).toEqual([]);
    expect(unclaimed).toEqual([]);
  });

  // The regression this check exists for: a package nobody claimed a trusted publisher for.
  // Under OIDC it fails with ENEEDAUTH while the rest of the run publishes.
  it('fails a package with no recorded claim, and names it for remediation', () => {
    const { failures, unclaimed } = collectTrustedPublisherFailures({
      packages,
      slug: SLUG,
      ledger: ledgerFor({ '@pie-element/multiple-choice': claim }),
    });

    expect(unclaimed).toEqual(['@pie-lib/render-ui']);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('@pie-lib/render-ui');
    expect(failures[0]).toContain('ENEEDAUTH');
  });

  // npm permits one trusted publisher per package, so a claim naming the wrong workflow does
  // not just fail, it occupies the slot release.yml needs. The legacy records name `ci.yml`.
  it('fails a claim bound to the wrong workflow', () => {
    const { failures } = collectTrustedPublisherFailures({
      packages: [packages[0]],
      slug: SLUG,
      ledger: ledgerFor({
        '@pie-element/multiple-choice': { repository: SLUG, workflow: 'ci.yml' },
      }),
    });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('ci.yml');
  });

  it('fails a claim bound to another repository', () => {
    const { failures } = collectTrustedPublisherFailures({
      packages: [packages[0]],
      slug: SLUG,
      ledger: ledgerFor({
        '@pie-element/multiple-choice': {
          repository: 'pie-framework/pie-elements',
          workflow: 'release.yml',
        },
      }),
    });

    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain('pie-framework/pie-elements');
  });

  // `npm trust github` can only attach to a package npm already has, so the remedy for a
  // never-published name is a first publish, not the claim command.
  it('routes never-published names to a first publish and known names to a claim', () => {
    const { needsFirstPublish, needsClaim } = partitionUnclaimedByRegistry({
      unclaimed: ['@pie-element/new-thing', '@pie-lib/render-ui'],
      isPublished: (name: string) => name === '@pie-lib/render-ui',
    });

    expect(needsFirstPublish).toEqual(['@pie-element/new-thing']);
    expect(needsClaim).toEqual(['@pie-lib/render-ui']);
  });

  it('reports a claim for a package this repo no longer publishes without failing', () => {
    const ledger = ledgerFor({
      '@pie-element/multiple-choice': claim,
      '@pie-element/retired': claim,
    });

    expect(collectStaleClaims({ packages: [packages[0]], ledger })).toEqual([
      '@pie-element/retired',
    ]);
    expect(
      collectTrustedPublisherFailures({ packages: [packages[0]], slug: SLUG, ledger }).failures
    ).toEqual([]);
  });
});

describe('trusted-publishers ledger', () => {
  // Each entry costs an interactive 2FA round trip, so a write that dropped the claims
  // already recorded would mean re-paying the OTPs.
  it('recording a claim preserves the claims already in the ledger', () => {
    const root = makeLedgerRoot();

    updateLedger(root, { '@pie-lib/b': claim });
    updateLedger(root, { '@pie-lib/a': claim });

    // Sorted, so a claim landing later does not reshuffle the file and produce a noisy diff.
    expect(Object.keys(readLedger(root).packages)).toEqual(['@pie-lib/a', '@pie-lib/b']);

    updateLedger(root, { '@pie-lib/b': null });
    expect(Object.keys(readLedger(root).packages)).toEqual(['@pie-lib/a']);
  });

  it('an unknown top-level key in the ledger survives a write', () => {
    const root = makeLedgerRoot();
    writeFileSync(
      path.join(root, LEDGER_RELATIVE_PATH),
      JSON.stringify({ $comment: ['keep me'], packages: {} })
    );

    updateLedger(root, { '@pie-lib/a': claim });

    const written = JSON.parse(readFileSync(path.join(root, LEDGER_RELATIVE_PATH), 'utf8'));
    expect(written.$comment).toEqual(['keep me']);
    expect(Object.keys(written.packages)).toEqual(['@pie-lib/a']);
  });
});

describe('publishablePackages', () => {
  // This repo's workspaces mix plain globs, literal paths and a nested glob. A package the
  // expansion misses is one that releases without a claim, so check each shape against the
  // real workspace rather than a fixture.
  it('discovers packages from every workspace shape', () => {
    const rootManifest = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const names = publishablePackages(ROOT, rootManifest).map((p) => p.name);

    expect(names).toContain('@pie-element/cli'); // tools/cli (literal path)
    expect(names).toContain('@pie-element/element-player'); // packages/element-player
    expect(names).toContain('@pie-element/shared-controller-utils'); // packages/shared/*
    expect(names).toContain('@pie-element/multiple-choice'); // packages/elements-react/*
    expect(names.some((n) => n.startsWith('@pie-lib/'))).toBe(true);
    // Private packages (apps, demos) never publish, so they must not demand a claim.
    expect(names).not.toContain('@pie-element/element-demo');
  });
});
