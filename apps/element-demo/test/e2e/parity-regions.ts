/**
 * Region map for McPopulatedBlank screenshot parity tests.
 *
 * Each variant declares which crops are compared and at what threshold.
 * Learnosity baselines are captured once (by a credentialed dev running
 * capture-baselines.spec.ts) and committed to test/e2e/snapshots/learnosity/.
 *
 * Overrides: set maxDiffPixelRatio per region when PIE intentionally diverges
 * from the Learnosity reference (e.g. an accessibility improvement). Always
 * include a comment field explaining why.
 *
 * PIE selectors:
 *   stem    → .pie-template-line
 *   choices → .pie-choices-fieldset
 *   audio   → .pie-audio-container
 *
 * Learnosity selectors:
 *   stem    → .rli-r1-stem           (blank + adjacent tokens)
 *   choices → .rli-r1-distractors    (choice tiles, role="group")
 *   audio   → .rli-r1-instructions   (listen button container)
 */

export interface RegionOverride {
  maxDiffPixelRatio: number;
  /** Required: explains why PIE diverges from the Learnosity reference. */
  reason: string;
}

export interface ParityRegion {
  /** Selector in the PIE panel (#pie-container). */
  pie: string;
  /** Selector in the Learnosity panel (#learnosity-container). */
  learnosity: string;
  /** Override default threshold when PIE intentionally differs. */
  override?: RegionOverride;
}

export interface VariantRegions {
  stem: ParityRegion;
  choices: ParityRegion;
  /** Omit for variants with no separate audio region (sr-vic, sel-vic). */
  audio?: ParityRegion;
}

/** Default pixel diff ratio applied to all crops unless overridden. */
export const DEFAULT_MAX_DIFF_PIXEL_RATIO = 0.1;

export const PARITY_REGIONS: Record<string, VariantRegions> = {
  'variant-sel-r1-plusggg': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-r1-stem',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-r1-distractors',
    },
    audio: {
      pie: '.pie-audio-container',
      learnosity: '.rli-r1-instructions',
    },
  },

  'variant-sel-r1-gplusggg': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-r1-stem',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-r1-distractors',
    },
    audio: {
      pie: '.pie-audio-container',
      learnosity: '.rli-r1-instructions',
    },
  },

  'variant-sel-r1-gg-plus': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-r1-stem',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-r1-distractors',
    },
    audio: {
      pie: '.pie-audio-container',
      learnosity: '.rli-r1-instructions',
    },
  },

  'variant-sel-r1-ggplus': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-r1-stem',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-r1-distractors',
    },
    audio: {
      pie: '.pie-audio-container',
      learnosity: '.rli-r1-instructions',
    },
  },

  'variant-sel-r1-g-stem': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-r1-stem',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-r1-distractors',
    },
    audio: {
      pie: '.pie-audio-container',
      learnosity: '.rli-r1-instructions',
    },
  },

  'variant-sel-r1-s3': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-r1-stem',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-r1-distractors',
    },
    audio: {
      pie: '.pie-audio-container',
      learnosity: '.rli-r1-instructions',
    },
  },

  // sel-vic: audio is embedded in the stem area, no separate audio crop needed.
  'variant-sel-vic': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-r1-stem',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-r1-distractors',
    },
  },

  // sr-vic: no audio component at all.
  'variant-sr-vic': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-r1-stem',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-r1-distractors',
    },
  },

  // Graphic (choiceMode=image) variants — no learnosityItemReference, PIE-only snapshots.
  'variant-sel-r1-plusggg-graphic': {
    stem: { pie: '.pie-template-line', learnosity: '.rli-r1-stem' },
    choices: { pie: '.pie-choices-fieldset', learnosity: '.rli-r1-distractors' },
    audio: { pie: '.pie-audio-container', learnosity: '.rli-r1-instructions' },
  },

  'variant-sel-r1-gplusggg-graphic': {
    stem: { pie: '.pie-template-line', learnosity: '.rli-r1-stem' },
    choices: { pie: '.pie-choices-fieldset', learnosity: '.rli-r1-distractors' },
    audio: { pie: '.pie-audio-container', learnosity: '.rli-r1-instructions' },
  },

  'variant-sel-r1-gg-plus-graphic': {
    stem: { pie: '.pie-template-line', learnosity: '.rli-r1-stem' },
    choices: { pie: '.pie-choices-fieldset', learnosity: '.rli-r1-distractors' },
    audio: { pie: '.pie-audio-container', learnosity: '.rli-r1-instructions' },
  },

  'variant-sel-r1-ggplus-graphic': {
    stem: { pie: '.pie-template-line', learnosity: '.rli-r1-stem' },
    choices: { pie: '.pie-choices-fieldset', learnosity: '.rli-r1-distractors' },
    audio: { pie: '.pie-audio-container', learnosity: '.rli-r1-instructions' },
  },

  'variant-sel-r1-g-stem-graphic': {
    stem: { pie: '.pie-template-line', learnosity: '.rli-r1-stem' },
    choices: { pie: '.pie-choices-fieldset', learnosity: '.rli-r1-distractors' },
    audio: { pie: '.pie-audio-container', learnosity: '.rli-r1-instructions' },
  },

  'variant-sel-r1-s3-graphic': {
    stem: { pie: '.pie-template-line', learnosity: '.rli-r1-stem' },
    choices: { pie: '.pie-choices-fieldset', learnosity: '.rli-r1-distractors' },
    audio: { pie: '.pie-audio-container', learnosity: '.rli-r1-instructions' },
  },
};
