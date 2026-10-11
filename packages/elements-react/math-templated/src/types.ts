import type {
  ConfigureLanguageOptions,
  ConfigureMathMLProp,
  ConfigureMaxImageDimensionsProp,
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigure,
  EditableHtmlPluginConfigureRequired,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/**
 * Keypad of an equation editor: a grade band, as a number or a numeric string
 * (1 for Grade 1 - 2, 3 for Grade 3 - 5, 6 for Grade 6 - 7, 8 for Grade 8 - HS),
 * or a named keypad
 */
export type EquationEditor =
  | 1
  | 3
  | 6
  | 8
  | '1'
  | '3'
  | '6'
  | '8'
  | 'non-negative-integers'
  | 'integers'
  | 'decimals'
  | 'fractions'
  | 'geometry'
  | 'advanced-algebra'
  | 'statistics'
  | 'item-authoring';

/** The correct response of one response area */
export interface MathTemplatedResponse {
  /** The id for the response; the authoring view creates responses without one */
  id?: string;
  /** The value for the response's answer */
  answer: string;
  /**
   * Indicates what type of validation should be applied on the response; the model's
   * `validationDefault` applies when it is not set
   */
  validation?: 'literal' | 'symbolic';
  /**
   * Indicates the allowance of trailing zeros in expressions; the model's
   * `allowTrailingZerosDefault` applies when it is not set
   */
  allowTrailingZeros?: boolean;
  /**
   * Indicates if the order of expression elements in literal validation can be ignore; the model's
   * `ignoreOrderDefault` applies when it is not set
   */
  ignoreOrder?: boolean;
  /**
   * For validation type = literal, alternates represents
   * an object with some alternatives for the correct answers, keyed by alternate id
   */
  alternates?: Record<string, string>;
  /** Not read by the element: the authoring view sets it on the responses it creates */
  allowSpaces?: boolean;
}

/**
 * Model for the `@pie-element/math-templated`
 */
export interface MathTemplatedModel extends PieModel {
  /** Indicates markup value; each `{{n}}` is response area `n` */
  markup?: string;
  /**
   * The markup as the authoring editor holds it, with each response area as a `math_templated` span;
   * the authoring view derives it from `markup` when it is not set
   */
  slateMarkup?: string;
  /** Indicates prompt value */
  prompt?: string;
  /** Indicates if Prompt is enabled */
  promptEnabled?: boolean;
  /** Indicates teacher instructions value */
  teacherInstructions?: string;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates rationale value */
  rationale?: string;
  /** Indicates if Rationale is enabled */
  rationaleEnabled?: boolean;
  /** Indicates if Spell Check is enabled for the author */
  spellCheckEnabled?: boolean;
  /**
   * Indicates if Player Spell Check is enabled. Not read by the element: the settings panel
   * writes it, and delivery does not apply it
   */
  playerSpellCheckEnabled?: boolean;
  /** Correct responses, keyed by response area index */
  responses?: Record<string, MathTemplatedResponse>;
  /**
   * Indicates what type of editor should be displayed for all the possible responses
   * @default "8"
   */
  equationEditor?: EquationEditor;
  /** Extra buttons defined by user */
  customKeys?: string[];
  /**
   * Indicates the default value for ignoreOrder, in case that it's not set
   * @default false
   */
  ignoreOrderDefault?: boolean;
  /**
   * Indicates the default value for allowTrailingZeros, in case that it's not set
   * @default false
   */
  allowTrailingZerosDefault?: boolean;
  /**
   * Indicates the default value for validation, in case that it's not set on a response
   * @default "literal"
   */
  validationDefault?: 'literal' | 'symbolic';
  /** Indicates if partial scoring is enabled; scoring is dichotomous only when it is false */
  partialScoring?: boolean;
  /**
   * Indicates the editor's toolbar position which can be 'bottom' or 'top'
   * @default "bottom"
   */
  toolbarEditorPosition?: 'bottom' | 'top';
  /** Indicates the note for the answer; a translated default note applies when it is not set */
  note?: string;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
  /** Not read by the element: the demo models carry it */
  scoringType?: 'auto' | 'rubric';
  /** Not read by the element: the demo models carry it */
  feedbackEnabled?: boolean;
  /** Not read by the element: the demo models carry it */
  studentInstructionsEnabled?: boolean;
}

/**
 * Config Object for `@pie-element/math-templated`
 */
export interface MathTemplatedConfiguration {
  /** Ignore Order configuration; `enabled` shows the control on each response */
  ignoreOrder?: ConfigurePropWithEnabled;
  /** Allow Trailing Zeros configuration; `enabled` shows the control on each response */
  allowTrailingZeros?: ConfigurePropWithEnabled;
  /** Partial Scoring configuration */
  partialScoring?: ConfigureProp;
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /**
   * Configuration for the prompt; `inputConfiguration` is not read, the prompt editor takes
   * `teacherInstructions.inputConfiguration`
   */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Configuration for edit Source; `enabled` is not read */
  editSource?: ConfigurePropWithEnabled;
  /** Configuration for the player's spellcheck; `enabled` is not read */
  playerSpellCheck?: ConfigurePropWithEnabled;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Configuration for Rationale */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Template configuration */
  template?: EditableHtmlPluginConfigure;
  /** Maximum image width for input fields */
  maxImageWidth?: ConfigureMaxImageDimensionsProp;
  /** Maximum image height for input fields */
  maxImageHeight?: ConfigureMaxImageDimensionsProp;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /** Language configuration */
  language?: ConfigurePropWithEnabled;
  /**
   * Language choices configuration
   * Only available if language is enabled
   */
  languageChoices?: ConfigureLanguageOptions;
  /** Maximum number of response areas */
  maxResponseAreas?: number;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
}

/** The learner's answer to one response area */
export interface MathTemplatedAnswer {
  value: string;
}

export interface MathTemplatedSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** Answers per response area, keyed `r0`, `r1`, ... by response area index */
  answers?: Record<string, MathTemplatedAnswer>;
}
