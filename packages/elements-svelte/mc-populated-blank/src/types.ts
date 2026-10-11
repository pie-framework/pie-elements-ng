import type { ConfigureProp, PieModel } from '@pie-element/shared-types';
import type { LayoutLimits } from './shared/layoutLimits.js';

/** `text` choices show `labelHtml`; `image` choices show `imageUrl` with `imageAlt`. */
export type McpbChoiceMode = 'text' | 'image';
/**
 * `populate_blank` fills the template's one `{{blank}}` with the picked choice; `audio_mc_only`
 * asks the question by audio and renders no blank.
 */
export type McpbInteractionMode = 'populate_blank' | 'audio_mc_only';
export type McpbDeliveryMode = 'gather' | 'view' | 'evaluate' | 'authoring' | 'print';
export type McpbRole = 'student' | 'instructor';
export type McpbCorrectness = 'correct' | 'incorrect' | 'unanswered';

export interface McpbChoice {
  /** Identifier of the choice, unique within the item; the session stores the picked one */
  id: string;
  /** The choice's content (HTML), shown when `choiceMode` is `text` */
  labelHtml?: string;
  /** The choice's image (URL), shown when `choiceMode` is `image` */
  imageUrl?: string;
  /** Text alternative for `imageUrl` */
  imageAlt?: string;
}

/** Image URLs for the listen button's two states. */
export interface McpbAudioButtonSkin {
  /** Image URL for the button while the audio is not playing */
  silentUrl: string;
  /** Image URL for the button while the audio plays */
  playingUrl: string;
}

/** Model for the populated-blank multiple-choice interaction */
export interface McPopulatedBlankModel extends PieModel {
  /** The question prompt or item stem */
  prompt?: string;
  /** Determines if prompt should show */
  promptEnabled?: boolean;
  /**
   * How the learner answers
   * @default "populate_blank"
   */
  interactionMode?: McpbInteractionMode;
  /**
   * Selects the arrangement: `inline_sentence`, `audio_blank_only`, `token_sequence` or
   * `stimulus_image_blank`; unset is block flow in DOM order. Lands on the root as
   * `layout-<layoutProfile>`.
   */
  layoutProfile?: string;
  /**
   * The choices' direction, `horizontal` or `vertical`. Unset, choices are horizontal when the
   * template is only `{{blank}}` or `interactionMode` is `audio_mc_only`, and vertical otherwise.
   */
  choiceLayout?: string;
  /**
   * Layout limits keyed by `layoutProfile`, merged over the bundled preset of that name. Delivery
   * applies the current profile's preset over `layoutLimits`.
   */
  layoutProfilePresets?: Record<string, Partial<LayoutLimits>>;
  /** Numeric visual constraints, each a positive number; a key left out takes the CQT-tuned default */
  layoutLimits?: Partial<LayoutLimits>;
  /** The listen button's images when `audioButtonSkinsByLocale` has none for the locale */
  audioButtonSkin?: McpbAudioButtonSkin | null;
  /**
   * The listen button's images keyed by lower-case `locale`, its two-letter language, or `default`,
   * tried in that order
   */
  audioButtonSkinsByLocale?: Record<string, McpbAudioButtonSkin>;
  /** A sentence or stimulus (HTML) rendered between the audio and the template */
  sentenceHtml?: string;
  /** The sentence (HTML); with `populate_blank` it holds exactly one `{{blank}}` */
  template?: string;
  /**
   * Whether the choices are text or images
   * @default "text"
   */
  choiceMode?: McpbChoiceMode;
  /** The choice options for the question */
  choices?: McpbChoice[];
  /** The choice group's accessible name when the item has no prompt to label it. */
  choiceGroupLabel?: string;
  /** The `id` of the correct choice */
  correctChoiceId?: string;
  /** Indicates if the item plays `audioUrl` */
  hasAudio?: boolean;
  /** Indicates if the audio plays when the item loads */
  autoplayAudioEnabled?: boolean;
  /** Keeps the item incomplete until the audio has played to the end */
  completeAudioEnabled?: boolean;
  /** The audio prompt's URL; required when `hasAudio` is set */
  audioUrl?: string;
  /**
   * Transcript text for the audio prompt.
   *
   * Not rendered by delivery: on `pie-section-player` the toolkit renders it from
   * the item's accessibility catalog, gated by the learner's profile (PIE-902).
   * It stays on the model for the print view, which has no toolkit, and renders it
   * unconditionally until print resolves catalogs itself (PIE-904), and as the
   * source the pie-api-aws import writes the card from.
   */
  audioTranscript?: string;
  /**
   * `true` plays the audio from the listen button, `false` from native audio controls. Unset, the
   * `audio_blank_only`, `stimulus_image_blank` and `token_sequence` layouts use the listen button.
   */
  useFeatureButtonAudio?: boolean;
  /** Picks the audio button skin; also the learner-facing strings' language when `language` is unset. */
  locale?: string;
  /** The learner-facing strings' language, as `@pie-lib/translator` reads it (`en_US`, `es_ES`, …). */
  language?: string;
  /** `false` shuffles the choices for a student; unset or `true` keeps the authored order. */
  lockChoiceOrder?: boolean;
  /**
   * The older spelling of `lockChoiceOrder: false`, read only when `lockChoiceOrder` is unset.
   * @deprecated Use `lockChoiceOrder`.
   */
  shuffle?: boolean;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** `false` hides `teacherInstructions`; unset shows them, as in multiple-choice. */
  teacherInstructionsEnabled?: boolean;
  /** `false` leaves the answer key out of an instructor's printout; a student's never has it. */
  printAnswerKey?: boolean;
  /** The CQT `custom_type` whose bundled variant stylesheet applies, e.g. `sel_r1-_plusggg` */
  customType?: string;
}

/** A Settings Panel control for an editable field. */
export interface McpbFieldConfigure extends ConfigureProp {
  /** Indicates if the item is required and the value cannot be empty */
  required?: boolean;
}

/**
 * Config Object for `@pie-element/mc-populated-blank`. The author view is a placeholder that reads
 * none of it; `validate()` reads the choice counts and the `required` flags.
 */
export interface McPopulatedBlankConfiguration {
  /** Configuration for the prompt; `settings` and `label` are not read */
  prompt?: McpbFieldConfigure;
  /** Configuration for the teacher instructions; `settings` and `label` are not read */
  teacherInstructions?: McpbFieldConfigure;
  /**
   * The fewest choices `validate()` accepts
   * @default 2
   */
  minAnswerChoices?: number;
  /** The most choices `validate()` accepts; unset allows any number */
  maxAnswerChoices?: number;
}

export interface McPopulatedBlankSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The picked choice id in a one-entry array, as multiple-choice stores it. */
  value?: string[];
  /**
   * Where older sessions hold the pick; read, never written.
   * @deprecated Sessions hold the pick in `value`.
   */
  choiceId?: string;
  /** When the first playback of the audio started (epoch milliseconds) */
  audioStartTime?: number;
  /** When the first playback of the audio ended (epoch milliseconds) */
  audioEndTime?: number;
  /** Milliseconds from `audioStartTime` to `audioEndTime` */
  waitTime?: number;
  /** The choice ids in the order a student saw them when `lockChoiceOrder` is `false` */
  shuffledValues?: string[];
  /** Where some sessions hold `shuffledValues`; read in preference to the root key */
  data?: { shuffledValues?: string[] };
}

export interface McpbEnv {
  mode?: McpbDeliveryMode;
  role?: McpbRole;
  '@pie-element'?: { lockChoiceOrder?: boolean };
}
