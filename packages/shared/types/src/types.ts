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
 * Only the fields sign-language catalog cards need are declared. `poster`,
 * `thumbnail` and `durationSeconds` do not apply to a signing clip, and
 * `tracks`/`transcript` are meaningless for one: captions on a signing video
 * would be the English text already on screen. Add fields additively when a
 * second consumer (e.g. a video stimulus element) needs them.
 */
export interface MediaAssetRef {
  version: 1;
  id: string;
  kind: MediaKind;
  sources: MediaSource[];
  label?: string;
  description?: string;
  /**
   * Language of the asset itself, as authored metadata. For sign-language
   * cards the authoritative adaptation language is
   * `SignLanguageCardPayload.signLang`, so this stays optional rather than
   * requiring the same value be stated twice.
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
}

/**
 * A time slice within a media asset, so one recording can serve several
 * content nodes. Mirrors QTI 3's Media Fragments URI usage.
 */
export interface MediaFragment {
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
   */
  signLang: string;
  media: MediaAssetRef;
  fragment?: MediaFragment;
}

/**
 * A signed alternate representation, docked to a content node via
 * `data-catalog-idref`. Maps to QTI `qti-card support="sign-language"`.
 */
export interface SignLanguageCatalogCard {
  catalog: 'sign-language';
  language?: string;
  signLanguage: SignLanguageCardPayload;
  /**
   * Signing content lives in `signLanguage`. A bare URL in `content` is not a
   * supported form — see the note on `AccessibilityCatalogCard`.
   */
  content?: never;
}

/**
 * A text-bearing catalog card: `spoken` (SSML for TTS), `braille`,
 * `simplified-language`, and any catalog type this repo does not model
 * explicitly. Unknown `catalog` tokens are tolerated by design and should be
 * ignored rather than rejected by consumers.
 */
export interface TextCatalogCard {
  catalog: string;
  language?: string;
  /** Authored alternative content, often SSML. */
  content: string;
  signLanguage?: never;
}

/**
 * QTI-aligned accessibility catalog entry. Players/toolkits map visible model
 * content to an authored alternative — spoken text for TTS, or a signed video
 * translation — via `data-catalog-idref` on the content node.
 *
 * The card is a union discriminated on `catalog`, which is already the QTI
 * `support=` token; there is deliberately no second `kind` field, since two
 * discriminants can disagree. Because the catalog vocabulary is open-ended,
 * TypeScript cannot express "any string except 'sign-language'", so a
 * `{ catalog: 'sign-language', content: '<url>' }` object still satisfies
 * `TextCatalogCard`. That legacy bare-URL form is not supported and runtime
 * validation on the consuming side must reject it rather than render the URL
 * as visible text. Narrow with `isSignLanguageCard`.
 */
export type AccessibilityCatalogCard = SignLanguageCatalogCard | TextCatalogCard;

/**
 * Narrows a catalog card to its sign-language form.
 *
 * This is a structural narrowing guard, not a payload validator: it confirms
 * the card carries a signing payload with at least one media source. Full
 * payload validation — and the rule that an invalid payload is treated as
 * absent — belongs to the consuming player, per the sign-language PRD.
 */
export function isSignLanguageCard(
  card: AccessibilityCatalogCard
): card is SignLanguageCatalogCard {
  if (card.catalog !== 'sign-language') {
    return false;
  }

  const payload = (card as SignLanguageCatalogCard).signLanguage;

  return (
    typeof payload?.signLang === 'string' &&
    payload.signLang.length > 0 &&
    Array.isArray(payload.media?.sources) &&
    payload.media.sources.length > 0
  );
}

export interface AccessibilityCatalog {
  identifier: string;
  cards: AccessibilityCatalogCard[];
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
