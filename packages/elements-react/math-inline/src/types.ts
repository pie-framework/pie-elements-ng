import type {
  ConfigureLanguageOptions,
  ConfigureMathMLProp,
  ConfigureMaxImageDimensionsProp,
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigureRequired,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/** Indicates the mode of the question: `Advanced Multi` fills response areas in `expression`, `Simple` takes one answer */
export type MathInlineResponseType = 'Advanced Multi' | 'Simple';

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

/** Feedback for one level of correctness */
export interface FeedbackLevel {
  /** Indicates the feedback type */
  type: 'default' | 'custom' | 'none';
  /** Indicates the feedback value */
  default?: string;
  /** Indicates the feedback custom value */
  custom?: string;
}

/** Feedback per level of correctness */
export interface ComplexFeedback {
  /** Indicates the configuration for feedback when answer is correct */
  correct: FeedbackLevel;
  /** Indicates the configuration for feedback when answer is incorrect */
  incorrect: FeedbackLevel;
  /** Indicates the configuration for feedback when answer is partially correct */
  partial?: FeedbackLevel;
}

export interface MathInlineResponse {
  /** The id of the response */
  id: number | string;
  /**
   * Indicates what type of validation should be applied on the response; the model's
   * `validationDefault` applies when it is not set
   */
  validation?: 'literal' | 'symbolic';
  /**
   * Indicates if the order of expression elements in literal validation can be ignore - whilst the expression is still mathematically correct;
   * the model's `ignoreOrderDefault` applies when it is not set
   */
  ignoreOrder?: boolean;
  /**
   * Indicates the allowance of trailing zeros in expressions - whilst the expression is still mathematically correct;
   * the model's `allowTrailingZerosDefault` applies when it is not set
   */
  allowTrailingZeros?: boolean;
  /** The answer for the question */
  answer: string;
  /** Alternative correct answers, keyed by alternate id */
  alternates?: Record<string, string>;
}

/** A settings-panel toggle the author writes into the model */
export interface MathInlineToggle {
  enabled?: boolean;
}

/** The authored settings of a math-inline model: every model key besides `id`, `element` and `config` */
export interface MathInlineModelSettings {
  /**
   * Indicates the mode of the question
   * @default "Advanced Multi"
   */
  responseType?: MathInlineResponseType;
  /** The item stem for the question */
  prompt?: string;
  /** Determines if prompt should show */
  promptEnabled?: boolean;
  /** Indicates the expression for advanced mode; each `{{response}}` is a response area */
  expression?: string;
  /**
   * Indicates what type of editor should be displayed for all the possible responses
   * @default "8"
   */
  equationEditor?: EquationEditor;
  /**
   * Indicates the editor the author uses for the response template in advanced mode
   * @default "8"
   */
  promptEquationEditor?: EquationEditor;
  /** Feedback configuration for the responses */
  feedback?: ComplexFeedback;
  /** Array of all correct responses; if responseType is Simple, only first element in array is used */
  responses?: MathInlineResponse[];
  /** Not read by the element: the first of `responses` is the default correct response */
  defaultResponse?: MathInlineResponse;
  /** Not read by the element */
  partialScoring?: boolean;
  /**
   * Indicates the default value for validation, in case that it's not set on a response
   * @default "literal"
   */
  validationDefault?: 'literal' | 'symbolic';
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
  /** Indicates the value for rationale */
  rationale?: string;
  /** Indicates scoring type */
  scoringType?: 'auto' | 'rubric';
  /** Not read by the element */
  studentInstructions?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Extra buttons defined by user */
  customKeys?: string[];
  /** Indicates if Feedback is enabled */
  feedbackEnabled?: boolean;
  /** Indicates if Rationale are enabled */
  rationaleEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates if Student Instructions are enabled */
  studentInstructionsEnabled?: boolean;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates the note for the answer; a translated default note applies when it is not set */
  note?: string;
  /**
   * Indicates the editor's toolbar position which can be 'bottom' or 'top'
   * @default "bottom"
   */
  toolbarEditorPosition?: 'bottom' | 'top';
  /** Indicates if Rubric is enabled */
  rubricEnabled?: boolean;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
  /**
   * Not read by the element: the settings panel's Ignore Order toggle writes it, and the
   * response editor reads `configuration.ignoreOrder.enabled` instead
   */
  ignoreOrder?: MathInlineToggle;
  /**
   * Not read by the element: the settings panel's Allow Trailing Zeros toggle writes it, and the
   * response editor reads `configuration.allowTrailingZeros.enabled` instead
   */
  allowTrailingZeros?: MathInlineToggle;
}

/**
 * Model for the @pie-elements/math-inline
 *
 * NOTE: teacherInstructions, studentInstructions, rationale & scoringType
 * functionalities are not defined yet - the value for those can belong to
 * model or to configure (to be moved when the functionality is defined)
 */
export interface MathInlineModel extends PieModel, MathInlineModelSettings {
  /**
   * Not read by the element: the controller's `createDefaultModel()` nests the default model
   * under `config`, as legacy does
   */
  config?: MathInlineModelSettings;
}

/**
 * Config Object for @pie-elements/math-inline
 */
export interface MathInlineConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Configuration for prompt */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Settings Panel control for feedback */
  feedback?: ConfigureProp;
  /** Configuration for response type */
  responseType?: ConfigureProp;
  /** Not read by this element */
  partialScoring?: ConfigureProp;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Scoring Type configuration */
  scoringType?: ConfigureProp;
  /** Student Instructions configuration */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Ignore Order configuration; `enabled` shows the control on each response */
  ignoreOrder?: ConfigurePropWithEnabled;
  /** Allow Trailing Zeros configuration; `enabled` shows the control on each response */
  allowTrailingZeros?: ConfigurePropWithEnabled;
  /** Maximum number of response areas */
  maxResponseAreas?: number;
  /** Maximum image width for input fields */
  maxImageWidth?: ConfigureMaxImageDimensionsProp;
  /** Maximum image height for input fields */
  maxImageHeight?: ConfigureMaxImageDimensionsProp;
  /** Rubric configuration - only relevant in environments that use pie-player-components */
  withRubric?: ConfigureProp;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /** Language configuration */
  language?: ConfigurePropWithEnabled;
  /**
   * Language choices configuration
   * Only available if language is enabled
   */
  languageChoices?: ConfigureLanguageOptions;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: the model's `promptEnabled` shows the prompt */
  showPrompt?: boolean;
  /** Not read by this element: `prompt.label` labels the prompt */
  promptLabel?: string;
  /** Not read by this element */
  settingsPartialScoring?: boolean;
}

/** The learner's answer to one response area */
export interface MathInlineAnswer {
  value: string;
}

export interface MathInlineSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** Answers per response area of `expression`, keyed `r1`, `r2`, ... (advanced mode) */
  answers?: Record<string, MathInlineAnswer>;
  /** The whole expression with the learner's answers filled in, as LaTeX (advanced mode) */
  completeAnswer?: string;
  /** The learner's answer, as LaTeX (simple mode) */
  response?: string;
}
