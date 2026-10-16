import { describe, expect, it } from 'vitest';
import { elementLanguageAttributes, stampElementLanguage } from '../src/element-language.js';

describe('elementLanguageAttributes', () => {
  it.each([
    ['es_MX', { lang: 'es-MX', dir: 'ltr' }],
    ['ES_mx', { lang: 'es-MX', dir: 'ltr' }],
    ['en_US.UTF-8', { lang: 'en-US', dir: 'ltr' }],
    ['ar', { lang: 'ar', dir: 'rtl' }],
  ])('%j stamps %j', (language, expected) => {
    expect(elementLanguageAttributes(language)).toEqual(expected);
  });

  it.each([undefined, null, '', '  ', 'Spanish', 'en US'])('%j stamps nothing', (language) => {
    expect(elementLanguageAttributes(language)).toBeUndefined();
  });
});

describe('stampElementLanguage', () => {
  it('stamps the host and never the document', () => {
    const host = document.createElement('div');
    document.body.append(host);
    document.documentElement.setAttribute('lang', 'nl');

    stampElementLanguage(host, 'he_IL');
    expect(host.getAttribute('lang')).toBe('he-IL');
    expect(host.getAttribute('dir')).toBe('rtl');

    // The content's language is unknown, so the host inherits the page's.
    stampElementLanguage(host, undefined);
    expect(host.hasAttribute('lang')).toBe(false);
    expect(host.hasAttribute('dir')).toBe(false);
    expect(document.documentElement.getAttribute('lang')).toBe('nl');
    host.remove();
  });
});
