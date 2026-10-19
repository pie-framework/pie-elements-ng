import { describe, expect, it } from 'vitest';
import {
  findBestLanguageMatch,
  languageTagLookupSequence,
  languageTagsEqual,
  normalizeLanguageTag,
  toLanguageTag,
} from '../src/language-tags.js';

describe('normalizeLanguageTag', () => {
  it.each([
    ['es_ES', 'es-es'],
    ['es_ES.UTF-8', 'es-es'],
    ['es_ES@euro', 'es-es'],
    ['  EN-us ', 'en-us'],
    ['', ''],
    [null, ''],
    [undefined, ''],
  ])('%j normalizes to %j', (tag, expected) => {
    expect(normalizeLanguageTag(tag)).toBe(expected);
  });
});

describe('toLanguageTag', () => {
  it('converts POSIX separators and keeps casing', () => {
    expect(toLanguageTag(' es_MX ')).toBe('es-MX');
    expect(toLanguageTag(undefined)).toBe('');
  });
});

describe('languageTagsEqual', () => {
  it('ignores separator style and case', () => {
    expect(languageTagsEqual('es_MX', 'ES-mx')).toBe(true);
    expect(languageTagsEqual('es', 'es-MX')).toBe(false);
    expect(languageTagsEqual('', '')).toBe(false);
  });
});

describe('languageTagLookupSequence', () => {
  it('truncates most specific first and skips trailing singletons', () => {
    expect(languageTagLookupSequence('zh-Hant-TW')).toEqual(['zh-hant-tw', 'zh-hant', 'zh']);
    expect(languageTagLookupSequence('en-a-bbb')).toEqual(['en-a-bbb', 'en']);
  });
});

describe('findBestLanguageMatch', () => {
  it('prefers the most specific candidate', () => {
    expect(findBestLanguageMatch('es-MX', ['es', 'es-MX'])).toBe('es-MX');
    expect(findBestLanguageMatch('es-MX', ['en-US', 'es'])).toBe('es');
    expect(findBestLanguageMatch('fr', ['en-US', 'es-ES'])).toBeUndefined();
  });
});
