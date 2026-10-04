import { describe, expect, it } from 'vitest';
import en from '../src/en.js';
import es from '../src/es.js';

/** Namespaces whose Spanish is maintained here rather than synced from upstream. */
const LOCALLY_OWNED = [
  'charting',
  'dragInTheBlank',
  'explicitConstructedResponse',
  'extendedTextEntry',
  'graphing',
  'hotspot',
  'imageClozeAssociation',
  'mathInput',
  'mcPopulatedBlank',
  'simpleCloze',
  'vennClassification',
] as const;

type Strings = { [key: string]: string | Strings };

/** Nested groups, such as charting's `keyLegend`, flatten to dotted keys. */
const flatten = (strings: Strings, prefix = ''): Record<string, string> =>
  Object.fromEntries(
    Object.entries(strings).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value, `${prefix}${key}.`))
    )
  );

const placeholders = (text: string) =>
  [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

describe.each(LOCALLY_OWNED)('%s Spanish strings', (namespace) => {
  const english = flatten(en.translation[namespace] as Strings);
  const spanish = flatten((es.translation as Record<string, Strings>)[namespace]);

  it('cover every English key', () => {
    expect(Object.keys(spanish).sort()).toEqual(Object.keys(english).sort());
  });

  it('interpolate the same values as the English', () => {
    for (const key of Object.keys(english)) {
      expect(placeholders(spanish[key]), key).toEqual(placeholders(english[key]));
    }
  });
});
