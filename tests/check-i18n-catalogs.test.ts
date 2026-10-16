import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const gate = join(process.cwd(), 'scripts/check-i18n-catalogs.mjs');

type Catalog = Record<string, unknown>;

const english: Catalog = {
  label: 'Show {name}',
  count: { one: '{count} item', other: '{count} items' },
};
const spanish: Catalog = {
  label: 'Mostrar {name}',
  count: { one: '{count} elemento', other: '{count} elementos' },
};

interface Fixture {
  es?: Catalog;
  loaders?: string;
  manifest?: unknown;
}

/** Run the gate over one package whose `src/i18n` holds `en-US`, `es` and `fixture`'s overrides. */
function runGate(fixture: Fixture = {}) {
  const root = mkdtempSync(join(tmpdir(), 'pie-i18n-gate-'));
  const dir = join(root, 'packages/elements-react/probe/src/i18n');
  mkdirSync(dir, { recursive: true });
  const module = (catalog: Catalog) => `export default ${JSON.stringify(catalog)};\n`;
  writeFileSync(join(dir, 'en-US.ts'), module(english));
  writeFileSync(join(dir, 'es.ts'), module(fixture.es ?? spanish));
  writeFileSync(
    join(dir, 'index.ts'),
    `export const loaders = { ${fixture.loaders ?? "es: () => import('./es.js')"} };\n`
  );
  writeFileSync(
    join(dir, 'catalog-manifest.json'),
    JSON.stringify(
      fixture.manifest ?? {
        locales: {
          es: { status: 'reviewed', english: { label: english.label, count: english.count } },
        },
      }
    )
  );
  // Under bun, as `bun run lint` runs it: Node 22.17 (.nvmrc) cannot import the `.ts` catalogs.
  const result = spawnSync('bun', [gate], { cwd: root, encoding: 'utf8' });
  return { status: result.status, output: result.stdout + result.stderr };
}

describe('i18n catalog gate', () => {
  it('passes a catalog in parity with a fresh snapshot', () => {
    const { status, output } = runGate();
    expect(output).toContain('packages/elements-react/probe/src/i18n: 2 keys; es reviewed');
    expect(status).toBe(0);
  });

  it('fails a missing key and an i18next slot', () => {
    const { status, output } = runGate({ es: { label: 'Mostrar {{name}}' } });
    expect(output).toContain('es: missing count (falls back to English silently)');
    expect(output).toContain('es: label uses an i18next {{slot}}; write {slot}');
    expect(status).toBe(1);
  });

  it('fails a lost placeholder, an unknown key and a plural group turned into a string', () => {
    const { status, output } = runGate({
      es: { label: 'Mostrar', count: 'elementos', extra: 'Extra' },
    });
    expect(output).toContain('es: label lost placeholder {name}');
    expect(output).toContain('es: extra is not defined by en-US');
    expect(output).toContain('es: count is a string where en-US has a plural');
    expect(status).toBe(1);
  });

  it('names only the keys whose English moved under a reviewed translation', () => {
    const { status, output } = runGate({
      manifest: {
        locales: { es: { status: 'reviewed', english: { label: 'Show', count: english.count } } },
      },
    });
    expect(output).toContain('English changed under reviewed translations: label;');
    expect(status).toBe(1);
  });

  it('fails a generated catalog once English changes', () => {
    const { status, output } = runGate({
      manifest: { locales: { es: { status: 'generated', sourceHash: 'stale' } } },
    });
    expect(output).toContain('es: generated from English stale');
    expect(status).toBe(1);
  });

  it('fails a locale file without its loader', () => {
    const { status, output } = runGate({ loaders: '' });
    expect(output).toContain('es: absent from the loaders in index.ts');
    expect(status).toBe(1);
  });
});
