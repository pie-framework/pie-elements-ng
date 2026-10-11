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

/** A selectable span of the main text */
export interface TextToken {
  /** The token text */
  text?: string;
  /** The start point in the main text for this token */
  start: number;
  /** The end point in the main text for this token */
  end: number;
  /** Is selected does the token represent a correct response */
  correct?: boolean;
  /** The start point before the author re-parsed the text; scoring matches a selection on either position */
  oldStart?: number;
  /** The end point before the author re-parsed the text; scoring matches a selection on either position */
  oldEnd?: number;
}

/**
 * Feedback for one correctness level. The author's feedback selector changes `type` and keeps the other
 * message, so a `custom` type can arrive without `custom` text, and then the default message shows.
 */
export interface FeedbackType {
  /** Indicates the feedback type */
  type: 'default' | 'none' | 'custom';
  /** Indicates the feedback value */
  default?: string;
  /** Indicates the feedback custom value */
  custom?: string;
}

/** Feedback for each correctness level */
export interface ComplexFeedbackType {
  /** Indicates the configuration for feedback when answer is correct */
  correct: FeedbackType;
  /** Indicates the configuration for feedback when answer is incorrect */
  incorrect: FeedbackType;
  /** Indicates the configuration for feedback when answer is partially correct */
  partial?: FeedbackType;
}

/** Pie Model Object for `@pie-element/select-text` */
export interface SelectTextModel extends PieModel {
  /**
   * The maximum number of token selections a user can make when responding; 0 allows any number
   * @default 0
   */
  maxSelections?: number;
  /**
   * The selected mode for tokenizing the text.
   * This is only used in the config UI to present the mode by which text has been tokenized for selection.
   * The tokenizer writes `sentence`, `words` or `paragraphs`, and an empty string after a token edit in a
   * newly opened author; `word` and `paragraph` are accepted for content written to the legacy contract.
   * @default "sentence"
   */
  mode?: 'sentence' | 'words' | 'paragraphs' | 'word' | 'paragraph' | '';
  /**
   * Indicates if partial scoring should be used. Scoring treats an absent value as enabled, while the
   * default models set false.
   */
  partialScoring?: boolean;
  /** Feedback for student responses */
  feedback?: ComplexFeedbackType;
  /** The selectable text tokens in the main text content */
  tokens: TextToken[];
  /** The passage of text from which user may select responses */
  text: string;
  /** The user prompt/item stem */
  prompt?: string;
  /**
   * Determines if prompt should show
   * @default true
   */
  promptEnabled?: boolean;
  /**
   * Indicates if the parts of text that are choosable, should be highligned when presented to student.
   * @default false
   */
  highlightChoices?: boolean;
  /** Indicates rationale for correct answer */
  rationale?: string;
  /**
   * Indicates scoring type
   * @default "auto"
   */
  scoringType?: 'auto' | 'rubric';
  /** Not read by this element: it renders no student instructions */
  studentInstructions?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /**
   * Indicates if Feedback is enabled
   * @default false
   */
  feedbackEnabled?: boolean;
  /**
   * Indicates if Rationale are enabled
   * @default true
   */
  rationaleEnabled?: boolean;
  /**
   * Indicates if Student Instructions are enabled; the author shows the toggle, and nothing renders them
   * @default true
   */
  studentInstructionsEnabled?: boolean;
  /**
   * Indicates if Teacher Instructions are enabled
   * @default true
   */
  teacherInstructionsEnabled?: boolean;
  /** Indicates if spellcheck is enabled */
  spellCheckEnabled?: boolean;
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
}

/** Config Object for `@pie-element/select-text` */
export interface SelectTextConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Selection Count configuration */
  selectionCount?: ConfigureProp;
  /** Correct answer count configuration */
  correctAnswer?: ConfigureProp;
  /** Selections configuration */
  selections?: ConfigureProp;
  /** Mode configuration */
  mode?: ConfigureProp;
  /** Partial Scoring configuration */
  partialScoring?: ConfigureProp;
  /** Feedback configuration */
  feedback?: ConfigureProp;
  /** Tokens configuration */
  tokens?: ConfigureProp;
  /** Text Content configuration */
  text?: ConfigureProp;
  /** Prompt configuration */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Highlight Choices configuration */
  highlightChoices?: ConfigureProp;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Scoring Type configuration */
  scoringType?: ConfigureProp;
  /** Student Instructions configuration */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Maximum number of selected tokens in correct answer */
  maxSelections?: number;
  /**
   * Minimum number of tokens
   * @default 2
   */
  minTokens?: number;
  /** Maximum number of tokens */
  maxTokens?: number;
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
  /** Not read by this element: `partialScoring.settings` shows the partial scoring control */
  settingsPartialScoring?: boolean;
}

export interface SelectTextSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The tokens the student selected */
  selectedTokens?: TextToken[];
}
