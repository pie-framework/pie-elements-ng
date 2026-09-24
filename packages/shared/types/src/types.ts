/**
 * Core PIE specification types
 */

/**
 * Reference to a media asset and its playable encodings.
 *
 * Structurally mirrors the `MediaAssetRef` in the pie-players
 * `media-asset-contract` PRD. The two definitions are deliberately kept as
 * separate declarations rather than a shared package dependency: this repo owns
 * the item-model side of the contract, pie-players owns the player side, and
 * both read the same authored JSON, so structural typing is sufficient for
 * interop. Fixture parity — not a package edge — is what pins them together.
 *
 * Sign-language catalog cards were the first consumer and use only the core
 * source fields. The optional presentation, track, and transcript metadata is
 * declared for broader consumers such as video stimuli; it remains meaningless
 * for a signing clip, where captions would duplicate the text already on screen.
 */
export interface MediaAssetRef {
  version: 1;
  id: string;
  kind: MediaKind;
  sources: MediaSource[];
  poster?: string;
  thumbnail?: string;
  durationSeconds?: number;
  tracks?: TextTrackRef[];
  transcript?: TranscriptRef;
  label?: string;
  description?: string;
  /**
   * Language of the asset itself, as authored metadata. Sign-language cards
   * leave it unset: the card's `language` already states the adaptation
   * language, and a second copy is a second thing to keep in agreement.
   */
  lang?: string;
}

export type MediaKind = 'image' | 'audio' | 'video' | 'other';

/** One playable encoding of a media asset. */
export interface MediaSource {
  src: string;
  /** MIME type, e.g. "video/mp4". */
  type?: string;
  width?: number;
  height?: number;
  bitrate?: number;
}

/** One authored text track associated with an audio or video asset. */
export interface TextTrackRef {
  src: string;
  kind: 'captions' | 'subtitles' | 'descriptions' | 'chapters' | 'metadata';
  lang: string;
  label: string;
  default?: boolean;
}

/** Inline or externally hosted transcript content for a media asset. */
export interface TranscriptRef {
  src?: string;
  html?: string;
  plainText?: string;
  lang?: string;
}

/**
 * A time slice within a media asset, so one recording can serve several
 * content nodes. Mirrors QTI 3's Media Fragments URI usage.
 */
export interface MediaFragmentRange {
  startSeconds: number;
  endSeconds?: number;
}

/**
 * Payload for a `sign-language` catalog card: a signed translation of the
 * content node the card is docked to.
 */
export interface SignLanguageCardPayload {
  /**
   * Language tag for the signed translation — BCP 47, which admits ISO 639-3
   * subtags for languages with no 639-1/2 code. "ase" is ASL, matching QTI 3
   * `xml:lang`.
   *
   * This is the language of the *adaptation*, not the item's base content
   * language (AfA/PNP's `languageOfAdaptation`). The distinction is load
   * bearing: a Spanish item's signed alternate is LSM, not ASL, so `signLang`
   * must never be inferred from the item or assessment content language.
   *
   * Optional, and redundant on almost every card. The card's `language` states
   * the same code and is the only field pie-players resolves a card on —
   * resolution runs before anything knows the card is a signing card, so it can
   * only key on the generic field — and the player falls back to it when this is
   * absent. Author it only where the two differ: a card tagged with the item's
   * content language (`language: 'en-US'`, `signLang: 'ase'`) so resolution
   * reaches it by the default-language rung. The Learnosity importer emits
   * `language` alone.
   */
  signLang?: string;
  media: MediaAssetRef;
  fragment?: MediaFragmentRange;
}

/**
 * Payload for a `spoken` catalog card that is a recording rather than a script.
 *
 * QTI 3 treats recorded audio and synthesized speech as the same support: both
 * are `spoken`, so this is not a new accommodation, it is the other form the
 * existing one can take. A node commonly carries both this and a `content`
 * card in the same language — the script is both what the audio was generated
 * from and the fallback for when the audio cannot play; pie-players resolves
 * between them with `CatalogLookupOptions.form`.
 *
 * No `kind` discriminant, for the same reason `SignLanguageCardPayload` has
 * none: the card's `catalog` already says what this is.
 */
export interface SpokenAudioCardPayload {
  media: MediaAssetRef;
  fragment?: MediaFragmentRange;
}

/**
 * The structured forms a card's `payload` may take.
 *
 * Which one applies is decided by the card's `catalog`, so this union carries no
 * discriminant of its own — a second discriminant could contradict the first.
 * Consumers select a card by catalog type and then validate the payload
 * structurally, which they must do regardless: catalog data is authored,
 * wire-facing and untrusted.
 */
export type CatalogCardPayload = SignLanguageCardPayload | SpokenAudioCardPayload;

/**
 * QTI-aligned accessibility catalog entry: one alternate representation of a
 * content node, docked to it by `data-catalog-idref`.
 *
 * Maps onto QTI 3's `qti-card`. `catalog` is QTI's `@support` and is the only
 * discriminant — there is deliberately no second `kind` field. `language` is the
 * card entry's `xml:lang`. QTI's single content slot is represented by exactly
 * one of two fields, never both, with nothing mirrored between them:
 *
 * - `content` — the string form, for alternates a string can express: SSML for
 *   `spoken`, plain text for `simplified-language`.
 * - `payload` — the structured form, for what a string cannot express. Today
 *   only a signing video.
 *
 * One generic payload slot rather than a field per accommodation
 * (`signLanguage`, `braille`, …), which is the shape pie-players canonicalises
 * and the shape this repo now follows. A field per accommodation makes every new
 * structured alternate a breaking widening of this type in every consumer that
 * reads cards, and it gives the same fact two names across repos — which
 * produced a real bug: a card carrying `signLanguage` rendered its video in the
 * player and was simultaneously reported as carrying no payload by the player's
 * "what alternates exist" path, because only one of the two read paths knew
 * about the alias.
 *
 * `catalog` is a bare `string` because the vocabulary is open-ended and unknown
 * tokens must be ignored rather than rejected. TypeScript therefore cannot
 * express "a `sign-language` card must carry a payload", so a
 * `{ catalog: 'sign-language', content: '<url>' }` object still satisfies this
 * type. That legacy bare-URL form is not supported: runtime validation on the
 * consuming side must reject it rather than render the URL as visible text.
 * Narrow with `isSignLanguageCard`.
 */
export interface CatalogCard {
  catalog: string;
  language?: string;
  content?: string;
  payload?: CatalogCardPayload;
}

/**
 * A `CatalogCard` narrowed to the signing case, where the payload is mandatory.
 *
 * Maps to QTI `qti-card support="sign-language"`. This is a refinement of the
 * shared shape for authoring and narrowing, not a second card model: it adds
 * only what `CatalogCard` cannot state, which is that a signing card must carry
 * its payload and must not carry a bare URL in `content`.
 */
export interface SignLanguageCatalogCard extends CatalogCard {
  catalog: 'sign-language';
  payload: SignLanguageCardPayload;
  content?: never;
}

/**
 * Narrows a catalog card to its sign-language form.
 *
 * This is a structural narrowing guard, not a payload validator: it confirms
 * the card carries a signing payload with at least one media source. Full
 * payload validation — and the rule that an invalid payload is treated as
 * absent — belongs to the consuming player, per the sign-language PRD.
 *
 * Deliberately says nothing about `signLang`. It once required a non-empty one,
 * which would have rejected every card the Learnosity importer produces: the
 * adaptation language lives on the card's `language`, and a payload that omits
 * `signLang` is the normal shape rather than a malformed one.
 */
export function isSignLanguageCard(card: CatalogCard): card is SignLanguageCatalogCard {
  if (card.catalog !== 'sign-language') {
    return false;
  }

  const payload = card.payload;

  return Array.isArray(payload?.media?.sources) && payload.media.sources.length > 0;
}

export interface AccessibilityCatalog {
  identifier: string;
  cards: CatalogCard[];
}

// Base PIE model (all elements extend this)
export interface PieModel {
  id: string;
  element: string; // e.g., "@pie-element/multiple-choice"
  accessibilityCatalogs?: AccessibilityCatalog[];
}

// Theme configuration (from DaisyUI or custom)
export interface PieTheme {
  primary?: string; // Primary brand color
  secondary?: string; // Secondary color
  accent?: string; // Accent color
  neutral?: string; // Neutral color
  'base-100'?: string; // Base background color
  'base-200'?: string; // Secondary background
  'base-300'?: string; // Tertiary background
  'base-content'?: string; // Base text color
  info?: string; // Info color
  success?: string; // Success/correct color
  warning?: string; // Warning color
  error?: string; // Error/incorrect color
}

// Environment configuration
export interface PieEnvironment {
  mode: 'gather' | 'view' | 'evaluate';
  role: 'student' | 'instructor';
  // Optional advanced features
  lockChoiceOrder?: boolean;
  partialScoring?: boolean;
  // Optional theme configuration
  theme?: PieTheme;
}

// Session data (student responses)
export interface PieSession {
  id?: string;
  [key: string]: unknown;
}

// View model (output from controller.model())
export interface ViewModel extends Record<string, unknown> {
  disabled: boolean;
  mode: PieEnvironment['mode'];
}

// Outcome result (output from controller.outcome())
export interface OutcomeResult {
  score: number; // 0-1 scale
  empty: boolean; // True if no response provided
}

// Validation result
export interface ValidationErrors {
  [key: string]: string;
}

// Common configuration settings
export interface CommonConfigSettings {
  settingsPanelDisabled?: boolean;
  spellCheck?: ConfigureProp;
  maxImageWidth?: ConfigureProp;
  maxImageHeight?: ConfigureProp;
  withRubric?: ConfigureProp;
  language?: ConfigureProp;
  languageChoices?: ConfigureLanguageOptions;
}

export interface ConfigureProp {
  settings?: boolean;
  label?: string;
  enabled?: boolean;
}

export interface ConfigureLanguageOptions {
  label: string;
  options: { label: string; value: string }[];
}

// Print options
export interface PrintOptions {
  role: 'student' | 'instructor';
  mode?: PieEnvironment['mode'];
}

// Controller interface
export interface PieController {
  model(
    question: PieModel,
    session: PieSession | null,
    env: PieEnvironment,
    updateSession?: (session: PieSession) => void
  ): Promise<ViewModel>;

  outcome(model: PieModel, session: PieSession, env: PieEnvironment): Promise<OutcomeResult>;

  createDefaultModel(partial?: Partial<PieModel>): PieModel;

  validate(model: PieModel, config: CommonConfigSettings): ValidationErrors;

  createCorrectResponseSession(question: PieModel, env: PieEnvironment): PieSession;
}
