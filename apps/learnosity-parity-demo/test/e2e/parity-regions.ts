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
 * Learnosity selectors (vary by template family):
 *   r1 family (sel_r1-*_plusggg variants):
 *     stem    → .rli-r1-stem           (blank + adjacent tokens)
 *     choices → .rli-r1-distractors    (choice tiles, role="group")
 *     audio   → .rli-r1-instructions   (listen button container)
 *   s3 family (sel_r1-s3_plusggg) — uses its own rli-s3-* prefix in the
 *   live (devel) item bundle, not the rli-r1-* prefix shown in the source
 *   templates. The PIE template is "<p>{{blank}}</p>" so the LSY equivalent
 *   stem is the cloze container itself:
 *     stem    → .rli-s3-cloze-container
 *     choices → .rli-s3-distractors
 *     audio   → .rli-s3-listen-container
 *   vic family (sel_vic, sr_vic) — different prefix entirely:
 *     stem    → .rli-vic-stimulus     (cloze inside .rli-vic-answer)
 *     choices → .rli-vic-distractors
 *     audio   → none (sr_vic) or inline (sel_vic — no separate crop)
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

  // s3 template (sel_r1-s3_plusggg) uses the rli-s3-* prefix in the live
  // (devel) item bundle. The PIE template for this demo is "<p>{{blank}}</p>"
  // so the LSY equivalent is .rli-s3-cloze-container (the cloze itself).
  'variant-sel-r1-s3': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-s3-cloze-container',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-s3-distractors',
    },
    audio: {
      pie: '.pie-audio-container',
      learnosity: '.rli-s3-listen-container',
    },
  },

  // sel-vic uses the rli-vic-* prefix — different template family.
  // The cloze sits inside .rli-vic-stimulus → .rli-vic-answer; the listen
  // button is rendered inline so there's no separate audio crop.
  'variant-sel-vic': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-vic-stimulus',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-vic-distractors',
    },
  },

  // sr-vic shares the rli-vic-* prefix and has no audio component at all.
  'variant-sr-vic': {
    stem: {
      pie: '.pie-template-line',
      learnosity: '.rli-vic-stimulus',
    },
    choices: {
      pie: '.pie-choices-fieldset',
      learnosity: '.rli-vic-distractors',
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

  // s3-graphic uses the same s3 template as the text variant — rli-s3-* prefix.
  'variant-sel-r1-s3-graphic': {
    stem: { pie: '.pie-template-line', learnosity: '.rli-s3-cloze-container' },
    choices: { pie: '.pie-choices-fieldset', learnosity: '.rli-s3-distractors' },
    audio: { pie: '.pie-audio-container', learnosity: '.rli-s3-listen-container' },
  },
};
