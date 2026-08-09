/**
 * Shared fixtures for `sign-language` accessibility catalog cards.
 *
 * These are pure data typed against the contract, so they serialize to JSON
 * unchanged. pie-players owns the card shape (`players-shared`); this repo and
 * pie-api-aws (PIE-881) restate it structurally rather than depending on that
 * package, because all three read the same authored JSON and none of them should
 * need a package edge to agree about it. Fixture parity is what keeps the three
 * declarations from drifting — which they did once, when this repo and the
 * importer put the signing payload under `signLanguage` and the player put it
 * under `payload`.
 */

import type { AccessibilityCatalog, CatalogCard } from '../../src/types.js';

/** Single source, the shape the sample ASL content actually has. */
export const singleSourceCard: CatalogCard = {
  catalog: 'sign-language',
  language: 'ase',
  payload: {
    media: {
      version: 1,
      id: 'asl-prompt-1',
      kind: 'video',
      sources: [{ src: 'https://media.example.test/asl/prompt-1.mp4', type: 'video/mp4' }],
    },
  },
};

/** Multiple encodings of one recording, with dimensions. */
export const multiSourceCard: CatalogCard = {
  catalog: 'sign-language',
  language: 'ase',
  payload: {
    media: {
      version: 1,
      id: 'asl-prompt-2',
      kind: 'video',
      label: 'American Sign Language translation of the question',
      sources: [
        {
          src: 'https://media.example.test/asl/prompt-2.webm',
          type: 'video/webm',
          width: 1280,
          height: 720,
        },
        {
          src: 'https://media.example.test/asl/prompt-2.mp4',
          type: 'video/mp4',
          width: 640,
          height: 360,
        },
      ],
    },
  },
};

/** One recording sliced by time so it can serve several content nodes. */
export const fragmentRangeCard: CatalogCard = {
  catalog: 'sign-language',
  language: 'ase',
  payload: {
    media: {
      version: 1,
      id: 'asl-item-3-full',
      kind: 'video',
      sources: [{ src: 'https://media.example.test/asl/item-3.mp4', type: 'video/mp4' }],
    },
    fragment: { startSeconds: 12.5, endSeconds: 19 },
  },
};

/** Open-ended fragment — start with no end, playing to the end of the asset. */
export const openEndedFragmentCard: CatalogCard = {
  catalog: 'sign-language',
  language: 'ase',
  payload: {
    media: {
      version: 1,
      id: 'asl-item-3-full',
      kind: 'video',
      sources: [{ src: 'https://media.example.test/asl/item-3.mp4', type: 'video/mp4' }],
    },
    fragment: { startSeconds: 24 },
  },
};

/**
 * A second signed language on the same content node. The card array plus the
 * card's `language` carries this at no extra cost; no cross-sign-language
 * fallback is implied — a consumer that cannot match the requested language
 * shows nothing.
 */
export const alternateSignLanguageCard: CatalogCard = {
  catalog: 'sign-language',
  language: 'bfi',
  payload: {
    media: {
      version: 1,
      id: 'bsl-prompt-1',
      kind: 'video',
      sources: [{ src: 'https://media.example.test/bsl/prompt-1.mp4', type: 'video/mp4' }],
    },
  },
};

/**
 * The one shape where `payload.signLang` earns its place: a card tagged with the
 * item's *content* language, so a resolver reaches it by the default-language
 * rung, while the payload states what the clip is actually signed in. Nothing
 * produces this today — the importer writes `language` alone — but the field
 * exists for it, so a fixture holds the line.
 */
export const contentLanguageTaggedCard: CatalogCard = {
  catalog: 'sign-language',
  language: 'en-US',
  payload: {
    signLang: 'ase',
    media: {
      version: 1,
      id: 'asl-prompt-4',
      kind: 'video',
      sources: [{ src: 'https://media.example.test/asl/prompt-4.mp4', type: 'video/mp4' }],
    },
  },
};

/** A spoken card, to prove text cards are unchanged by the widening. */
export const spokenCard: CatalogCard = {
  catalog: 'spoken',
  language: 'en-US',
  content: '<speak>What is <say-as interpret-as="characters">CO2</say-as>?</speak>',
};

/** An unknown catalog type, which consumers must ignore rather than reject. */
export const unknownTypeCard: CatalogCard = {
  catalog: 'some-future-catalog-type',
  content: 'whatever the author put here',
};

/**
 * A catalog docking both a spoken and a signed alternate to the same content
 * node — the coexistence case the PRD is built around.
 */
export const promptCatalog: AccessibilityCatalog = {
  identifier: 'prompt-catalog-1',
  cards: [spokenCard, singleSourceCard],
};

export const allCards: CatalogCard[] = [
  singleSourceCard,
  multiSourceCard,
  fragmentRangeCard,
  openEndedFragmentCard,
  alternateSignLanguageCard,
  contentLanguageTaggedCard,
  spokenCard,
  unknownTypeCard,
];
