import { describe, expect, it } from 'vitest';
import {
  findBestLanguageMatch,
  languageTagLookupSequence,
  languageTagScript,
  languageTagScriptsMatch,
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

  it('reaches the language and likely script before the bare language', () => {
    expect(findBestLanguageMatch('zh-TW', ['zh', 'zh-Hant'])).toBe('zh-Hant');
    expect(findBestLanguageMatch('sr-ME', ['sr', 'sr-Latn'])).toBe('sr-Latn');
  });

  it('passes a bare-language catalog by when its likely script differs', () => {
    expect(findBestLanguageMatch('zh-TW', ['en-US', 'zh'])).toBeUndefined();
    expect(findBestLanguageMatch('zh-Hant', ['zh'])).toBeUndefined();
    expect(findBestLanguageMatch('sr-Latn-RS', ['sr'])).toBeUndefined();
    expect(findBestLanguageMatch('zh-SG', ['zh'])).toBe('zh');
    expect(findBestLanguageMatch('sr-Cyrl', ['sr'])).toBe('sr');
  });

  it('accepts an exact match whatever its script data', () => {
    expect(findBestLanguageMatch('zh', ['zh'])).toBe('zh');
    expect(findBestLanguageMatch('es_es', ['es-ES'])).toBe('es-ES');
  });
});

describe('languageTagScript', () => {
  it('reads an explicit script, then the CLDR likely script', () => {
    expect(languageTagScript('sr-Latn')).toBe('latn');
    expect(languageTagScript('zh-TW')).toBe('hant');
    expect(languageTagScript('zh')).toBe('hans');
    expect(languageTagScript('ar_SA')).toBe('arab');
  });

  it('has no script for a blank or unparseable tag', () => {
    expect(languageTagScript('')).toBeUndefined();
    expect(languageTagScript('not a tag!')).toBeUndefined();
  });
});

describe('languageTagScriptsMatch', () => {
  it('passes when either side has no script data', () => {
    expect(languageTagScriptsMatch('zh-TW', 'not a tag!')).toBe(true);
    expect(languageTagScriptsMatch('zh-TW', 'zh')).toBe(false);
  });

  it('passes every tag when the runtime has no Intl.Locale', () => {
    const intl = Intl as { Locale?: typeof Intl.Locale };
    const { Locale } = intl;
    delete intl.Locale;
    try {
      expect(languageTagScriptsMatch('zh-HK', 'zh-CN')).toBe(true);
      expect(findBestLanguageMatch('zh-HK', ['zh'])).toBe('zh');
    } finally {
      intl.Locale = Locale;
    }
  });
});
