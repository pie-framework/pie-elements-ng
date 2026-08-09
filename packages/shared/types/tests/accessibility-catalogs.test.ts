import { describe, expect, it } from 'vitest';
import type { CatalogCard, SignLanguageCatalogCard } from '../src/types.js';
import { isSignLanguageCard } from '../src/types.js';
import {
  allCards,
  alternateSignLanguageCard,
  fragmentRangeCard,
  multiSourceCard,
  openEndedFragmentCard,
  promptCatalog,
  singleSourceCard,
  spokenCard,
  unknownTypeCard,
} from './fixtures/sign-language-cards.js';

describe('isSignLanguageCard', () => {
  it('narrows a single-source signing card', () => {
    expect(isSignLanguageCard(singleSourceCard)).toBe(true);
  });

  it('narrows a multi-source signing card', () => {
    expect(isSignLanguageCard(multiSourceCard)).toBe(true);
  });

  it('rejects a spoken card', () => {
    expect(isSignLanguageCard(spokenCard)).toBe(false);
  });

  it('rejects an unknown catalog type rather than throwing', () => {
    expect(isSignLanguageCard(unknownTypeCard)).toBe(false);
  });

  it('rejects a legacy bare-URL sign-language card', () => {
    // `catalog` is an open `string` and `content` is optional, so TypeScript
    // cannot state "a signing card must carry a payload" and this object
    // type-checks. The guard is what keeps it out at runtime, so a URL is never
    // rendered as visible text.
    const legacy = {
      catalog: 'sign-language',
      content: 'https://media.example.test/asl/prompt-1.mp4',
    } satisfies CatalogCard;

    expect(isSignLanguageCard(legacy)).toBe(false);
  });

  it('rejects a signing card whose media carries no sources', () => {
    const malformed = {
      catalog: 'sign-language',
      payload: {
        signLang: 'ase',
        media: { version: 1, id: 'empty', kind: 'video', sources: [] },
      },
    } satisfies SignLanguageCatalogCard;

    expect(isSignLanguageCard(malformed)).toBe(false);
  });

  it('rejects a signing card with a missing signLang', () => {
    const malformed = {
      catalog: 'sign-language',
      payload: {
        signLang: '',
        media: {
          version: 1,
          id: 'no-lang',
          kind: 'video',
          sources: [{ src: 'https://media.example.test/asl/x.mp4' }],
        },
      },
    } satisfies SignLanguageCatalogCard;

    expect(isSignLanguageCard(malformed)).toBe(false);
  });

  it('gives access to the payload once narrowed', () => {
    const card: CatalogCard = fragmentRangeCard;

    if (!isSignLanguageCard(card)) {
      throw new Error('expected a sign-language card');
    }

    // Reached only through the guard, which is the point: `payload` is optional
    // on `CatalogCard`, so nothing may dereference it without narrowing first.
    expect(card.payload.signLang).toBe('ase');
    expect(card.payload.fragment).toEqual({ startSeconds: 12.5, endSeconds: 19 });
  });
});

describe('sign-language card payload', () => {
  it('carries multiple sources with MIME types, which a flat string could not', () => {
    if (!isSignLanguageCard(multiSourceCard)) {
      throw new Error('expected a sign-language card');
    }

    expect(multiSourceCard.payload.media.sources.map((s) => s.type)).toEqual([
      'video/webm',
      'video/mp4',
    ]);
  });

  it('allows a fragment with no end, meaning play to the end of the asset', () => {
    if (!isSignLanguageCard(openEndedFragmentCard)) {
      throw new Error('expected a sign-language card');
    }

    expect(openEndedFragmentCard.payload.fragment).toEqual({ startSeconds: 24 });
  });

  it('distinguishes the adaptation language from the item content language', () => {
    // Two cards, same mechanism, different signed languages. No fallback
    // between them is implied.
    const langs = [singleSourceCard, alternateSignLanguageCard]
      .filter(isSignLanguageCard)
      .map((card) => card.payload.signLang);

    expect(langs).toEqual(['ase', 'bfi']);
  });
});

describe('catalog composition', () => {
  it('docks a spoken and a signed alternate to the same content node', () => {
    expect(promptCatalog.cards).toHaveLength(2);
    expect(promptCatalog.cards.filter(isSignLanguageCard)).toHaveLength(1);
  });

  it('survives a JSON round trip, since catalogs are authored wire data', () => {
    const roundTripped = JSON.parse(JSON.stringify(allCards)) as CatalogCard[];

    expect(roundTripped).toEqual(allCards);
    expect(roundTripped.filter(isSignLanguageCard)).toHaveLength(5);
  });
});
