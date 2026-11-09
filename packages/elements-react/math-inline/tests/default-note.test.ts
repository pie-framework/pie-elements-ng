import { beforeAll, describe, expect, it } from 'vitest';
import { loadLocale } from '@pie-element/shared-i18n';
import { alternatesNote } from '../src/delivery/default-note.js';
import enUS from '../src/i18n/en-US.js';
import es from '../src/i18n/es.js';
import fr from '../src/i18n/fr.js';

beforeAll(async () => {
  await Promise.all([loadLocale('es'), loadLocale('fr')]);
});

const DEFAULT = 'primaryCorrectWithAlternates';

describe('alternates note', () => {
  it('renders the default in the chrome locale when the author wrote none', () => {
    expect(alternatesNote(undefined, 'es')).toBe(es[DEFAULT]);
    expect(alternatesNote('  ', 'es')).toBe(es[DEFAULT]);
  });

  it('keeps an authored note as written', () => {
    expect(alternatesNote('<p>Any form counts.</p>', 'es', 'en_US')).toBe('<p>Any form counts.</p>');
  });

  it.each([
    ['English', enUS[DEFAULT], undefined],
    ['English without its label', enUS[DEFAULT].replace(/^Note:\s*/, ''), undefined],
    ['declared-language', fr[DEFAULT], 'fr'],
    ['chrome-locale', es[DEFAULT], undefined],
  ])('treats a stored %s default as absent', (_, stored, itemLanguage) => {
    expect(alternatesNote(stored, 'es', itemLanguage)).toBe(es[DEFAULT]);
    expect(alternatesNote(`<p>${stored}</p>`, 'es', itemLanguage)).toBe(es[DEFAULT]);
  });
});
