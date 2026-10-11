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
 * One row in the match list.
 */
export interface MatchRow {
  /** Identifier for a row */
  id: string | number;
  /** Title that will be displayed for the row */
  title: string;
  /** Array of boolean values indicating which columns are selected in the row */
  values: boolean[];
}

/** Feedback configuration for one correctness level */
export interface MatchFeedbackLevel {
  /** Indicates the feedback type */
  type: 'default' | 'custom' | 'none';
  /** Indicates the feedback value */
  default?: string;
  /** Indicates the feedback custom value */
  custom?: string;
}

export interface MatchFeedback {
  /** Indicates the configuration for feedback when answer is correct */
  correct?: MatchFeedbackLevel;
  /** Indicates the configuration for feedback when answer is incorrect */
  incorrect?: MatchFeedbackLevel;
  /** Indicates the configuration for feedback when answer is partially correct */
  partial?: MatchFeedbackLevel;
}

/** Model for the @pie-element/match Interaction */
export interface MatchModel extends PieModel {
  /** Feedback for student responses */
  feedback?: MatchFeedback;
  /** Array of strings for column headers; the first heads the question column */
  headers: string[];
  /** The number of columns to be presented, the question column included */
  layout?: number;
  /** Indicates if the order of the rows should be randomly sorted on render */
  lockChoiceOrder?: boolean;
  /** Indicates if partial scoring should be used */
  partialScoring?: boolean;
  /** Indicates if the control for responses should be single (radio) or multiple (checkbox) */
  choiceMode?: 'radio' | 'checkbox';
  /** The question prompt or item stem */
  prompt?: string;
  /** Determines if prompt should show */
  promptEnabled?: boolean;
  /** The rows of choices to be presented. */
  rows: MatchRow[];
  /** Indicates value for rationale */
  rationale?: string;
  /** Indicates scoring type */
  scoringType?: 'auto' | 'rubric';
  /** Not read by this element */
  studentInstructions?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
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
   * Enables images in row titles when the host's configuration sets no `rows.inputConfiguration`.
   * @deprecated Use the configuration's `rows.inputConfiguration`.
   */
  enableImages?: boolean;
  /**
   * The delivery merges these keys over the model.
   * @deprecated Set the keys on the model itself.
   */
  config?: Record<string, unknown>;
}

export interface MatchMaxImageDimensions extends ConfigureMaxImageDimensionsProp {
  /** Indicates the max dimension for images in row labels */
  rowTitles?: number;
}

/** Config Object for @pie-element/match */
export interface MatchConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /**
   * Configuration for html input configuration regarding plugins that are enabled/disabled
   * on each question row
   * E.g. audio, video, image
   */
  rows?: EditableHtmlPluginConfigure;
  /** Configuration for feedback; `enabled` is not read */
  feedback?: ConfigurePropWithEnabled;
  /** Configuration for headers */
  headers?: EditableHtmlPluginConfigure;
  /** Configuration for layout */
  layout?: ConfigureProp;
  /** Configuration for lock choice order */
  lockChoiceOrder?: ConfigureProp;
  /** Configuration for partial scoring */
  partialScoring?: ConfigureProp;
  /** Configuration for choice mode */
  choiceMode?: ConfigureProp;
  /** Configuration for the prompt */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck; `enabled` is not read, the model's `spellCheckEnabled` turns it on */
  spellCheck?: ConfigurePropWithEnabled;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Scoring Type configuration */
  scoringType?: ConfigureProp;
  /** Student Instructions configuration */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Maximum image width for input fields */
  maxImageWidth?: MatchMaxImageDimensions;
  /** Maximum image height for input fields */
  maxImageHeight?: MatchMaxImageDimensions;
  /** Rubric configuration - only relevant in environments that use pie-player-components */
  withRubric?: ConfigureProp;
  /** Indicates the minimum number of question rows */
  minQuestions?: number;
  /** Indicates the maximum number of question rows */
  maxQuestions?: number;
  /** Indicates the maximum length of question rows headings */
  maxLengthQuestionsHeading?: number;
  /** Indicates the maximum number of answer columns */
  maxAnswers?: number;
  /** Indicates the maximum length of answer columns headings */
  maxLengthAnswers?: number;
  /** Indicates the maximum length of first column headings */
  maxLengthFirstColumnHeading?: number;
  /** Width of the authoring rows table, as a CSS length; the table scrolls when set */
  width?: string;
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
  /** Not read by this element: `partialScoring.settings` shows the partial scoring control */
  settingsPartialScoring?: boolean;
}

export interface MatchSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** For each row id, which answer columns the learner selected */
  answers?: Record<string, boolean[]>;
  /** Row ids in the order they were shuffled for this learner, when row order is not locked */
  shuffledValues?: (string | number)[];
}
