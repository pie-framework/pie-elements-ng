import { describe, expect, it } from 'vitest';
import en from '../src/en.js';
import es from '../src/es.js';

/** Namespaces whose Spanish is maintained here rather than synced from upstream. */
const LOCALLY_OWNED = ['mcPopulatedBlank', 'simpleCloze', 'vennClassification'] as const;

const placeholders = (text: string) =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

describe.each(LOCALLY_OWNED)('%s Spanish strings', (namespace) => {
  const english = en.translation[namespace] as Record<string, string>;
  const spanish = (es.translation as Record<string, Record<string, string>>)[namespace];

  it('cover every English key', () => {
    expect(Object.keys(spanish).sort()).toEqual(Object.keys(english).sort());
  });

  it('interpolate the same values as the English', () => {
    for (const key of Object.keys(english)) {
      expect(placeholders(spanish[key]), key).toEqual(placeholders(english[key]));
    }
  });
});
