/**
 * Shared fixtures for `sign-language` accessibility catalog cards.
 *
 * These are pure data typed against the contract, so they serialize to JSON
 * unchanged. pie-players (PIE-880) and pie-api-aws (PIE-881) restate the same
 * card types structurally rather than importing this package; copying these
 * fixtures across is what keeps the three declarations from drifting.
 */

import type { AccessibilityCatalog, AccessibilityCatalogCard } from '../../src/types.js';

/** Single source, the shape the sample ASL content actually has. */
export const singleSourceCard: AccessibilityCatalogCard = {
  catalog: 'sign-language',
  signLanguage: {
    signLang: 'ase',
    media: {
      version: 1,
      id: 'asl-prompt-1',
      kind: 'video',
      sources: [{ src: 'https://media.example.test/asl/prompt-1.mp4', type: 'video/mp4' }],
    },
  },
};

/** Multiple encodings of one recording, with dimensions. */
export const multiSourceCard: AccessibilityCatalogCard = {
  catalog: 'sign-language',
  signLanguage: {
    signLang: 'ase',
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
export const fragmentRangeCard: AccessibilityCatalogCard = {
  catalog: 'sign-language',
  signLanguage: {
    signLang: 'ase',
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
export const openEndedFragmentCard: AccessibilityCatalogCard = {
  catalog: 'sign-language',
  signLanguage: {
    signLang: 'ase',
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
 * A second signed language on the same content node. The card array plus
 * `signLang` carries this at no extra cost; no cross-sign-language fallback is
 * implied — a consumer that cannot match the requested language shows nothing.
 */
export const alternateSignLanguageCard: AccessibilityCatalogCard = {
  catalog: 'sign-language',
  signLanguage: {
    signLang: 'bfi',
    media: {
      version: 1,
      id: 'bsl-prompt-1',
      kind: 'video',
      sources: [{ src: 'https://media.example.test/bsl/prompt-1.mp4', type: 'video/mp4' }],
    },
  },
};

/** A spoken card, to prove text cards are unchanged by the widening. */
export const spokenCard: AccessibilityCatalogCard = {
  catalog: 'spoken',
  language: 'en-US',
  content: '<speak>What is <say-as interpret-as="characters">CO2</say-as>?</speak>',
};

/** An unknown catalog type, which consumers must ignore rather than reject. */
export const unknownTypeCard: AccessibilityCatalogCard = {
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

export const allCards: AccessibilityCatalogCard[] = [
  singleSourceCard,
  multiSourceCard,
  fragmentRangeCard,
  openEndedFragmentCard,
  alternateSignLanguageCard,
  spokenCard,
  unknownTypeCard,
];
