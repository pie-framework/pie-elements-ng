import { describe, expect, it } from 'vitest';

import { authoredOrDefault } from '../src/authored-or-default.js';

const defaults: Record<string, string> = {
  'en-US': 'Note: The answer shown above is the primary correct answer.',
  es: 'Nota: La respuesta que se muestra arriba es la respuesta correcta principal.',
  fr: 'Remarque : La réponse ci-dessus est la bonne réponse principale.',
};
const defaultIn = (locale: string | undefined) => defaults[locale ?? 'en-US'];

describe('authoredOrDefault', () => {
  it('returns authored text as stored', () => {
    expect(authoredOrDefault('<p>Either order is accepted.</p>', defaultIn, 'es')).toBe(
      '<p>Either order is accepted.</p>'
    );
  });

  it('falls back to the default in the language for missing or blank text', () => {
    expect(authoredOrDefault(undefined, defaultIn, 'es')).toBe(defaults.es);
    expect(authoredOrDefault('  ', defaultIn, 'fr')).toBe(defaults.fr);
  });

  it('treats a stored English, interface-locale or declared-language default as absent', () => {
    expect(authoredOrDefault(defaults['en-US'], defaultIn, 'fr')).toBe(defaults.fr);
    expect(authoredOrDefault(defaults.fr, defaultIn, 'fr', 'es')).toBe(defaults.fr);
    expect(authoredOrDefault(defaults.es, defaultIn, 'fr', 'es')).toBe(defaults.fr);
  });

  it('keeps a default in a locale it does not compare', () => {
    expect(authoredOrDefault(defaults.es, defaultIn, 'fr')).toBe(defaults.es);
  });

  it('ignores markup, spacing, non-breaking spaces and the leading label', () => {
    expect(
      authoredOrDefault(
        '<p><strong>Note:</strong>&nbsp;The answer shown above is the&#160;primary correct answer.</p>',
        defaultIn,
        'es'
      )
    ).toBe(defaults.es);
    expect(
      authoredOrDefault('The answer shown above is the primary correct answer.', defaultIn, 'es')
    ).toBe(defaults.es);
  });
});
