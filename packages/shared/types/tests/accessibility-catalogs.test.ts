import { describe, expect, it } from 'vitest';
import type { CatalogCard, SignLanguageCatalogCard } from '../src/types.js';
import { isSignLanguageCard } from '../src/types.js';
import {
  allCards,
  alternateSignLanguageCard,
  contentLanguageTaggedCard,
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
      language: 'ase',
      payload: {
        media: { version: 1, id: 'empty', kind: 'video', sources: [] },
      },
    } satisfies SignLanguageCatalogCard;

    expect(isSignLanguageCard(malformed)).toBe(false);
  });

  it('accepts a signing card that states its language only on the card', () => {
    // The shape the Learnosity importer writes. A guard that required
    // `payload.signLang` would reject every imported card, so this pins that it
    // does not.
    const imported = {
      catalog: 'sign-language',
      language: 'ase',
      payload: {
        media: {
          version: 1,
          id: 'no-payload-lang',
          kind: 'video',
          sources: [{ src: 'https://media.example.test/asl/x.mp4' }],
        },
      },
    } satisfies SignLanguageCatalogCard;

    expect(isSignLanguageCard(imported)).toBe(true);
  });

  it('gives access to the payload once narrowed', () => {
    const card: CatalogCard = fragmentRangeCard;

    if (!isSignLanguageCard(card)) {
      throw new Error('expected a sign-language card');
    }

    // Reached only through the guard, which is the point: `payload` is optional
    // on `CatalogCard`, so nothing may dereference it without narrowing first.
    expect(card.payload.media.id).toBe('asl-item-3-full');
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

  it('carries several signed languages on one mechanism', () => {
    // Two cards, same mechanism, different signed languages, stated on the card
    // where resolution reads them. No fallback between them is implied.
    const langs = [singleSourceCard, alternateSignLanguageCard]
      .filter(isSignLanguageCard)
      .map((card) => card.language);

    expect(langs).toEqual(['ase', 'bfi']);
  });

  it('lets the payload name the adaptation language when the card names another', () => {
    // The only shape where `signLang` is not redundant: the card is tagged with
    // the item's content language so resolution reaches it by the
    // default-language rung, and the payload says what the clip is signed in.
    if (!isSignLanguageCard(contentLanguageTaggedCard)) {
      throw new Error('expected a sign-language card');
    }

    expect(contentLanguageTaggedCard.language).toBe('en-US');
    expect(contentLanguageTaggedCard.payload.signLang).toBe('ase');
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
    expect(roundTripped.filter(isSignLanguageCard)).toHaveLength(6);
  });
});
