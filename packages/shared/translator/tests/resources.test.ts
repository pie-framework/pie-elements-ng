import { describe, expect, it } from 'vitest';
import en from '../src/en.js';
import es from '../src/es.js';

/** Namespaces whose Spanish is maintained here rather than synced from upstream. */
const LOCALLY_OWNED = [
  'charting',
  'dragInTheBlank',
  'drawingResponse',
  'ebsr',
  'editableHtml',
  'explicitConstructedResponse',
  'extendedTextEntry',
  'fractionModel',
  'graphing',
  'hotspot',
  'imageClozeAssociation',
  'inlineDropdown',
  'mathInline',
  'mathInput',
  'mcPopulatedBlank',
  'multipleChoice',
  'numberLine',
  'rubric',
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

const expectSameStrings = (english: Record<string, string>, spanish: Record<string, string>) => {
  it('cover every English key', () => {
    expect(Object.keys(spanish).sort()).toEqual(Object.keys(english).sort());
  });

  it('interpolate the same values as the English', () => {
    for (const key of Object.keys(english)) {
      expect(placeholders(spanish[key]), key).toEqual(placeholders(english[key]));
    }
  });
};

describe.each(LOCALLY_OWNED)('%s Spanish strings', (namespace) => {
  expectSameStrings(
    flatten(en.translation[namespace] as Strings),
    flatten((es.translation as Record<string, Strings>)[namespace])
  );
});

describe('common Spanish strings', () => {
  expectSameStrings(flatten(en.common), flatten(es.common));
});
