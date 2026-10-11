import type {
  ConfigureLanguageOptions,
  ConfigureMathMLProp,
  ConfigureMaxImageDimensionsProp,
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  CustomAudioButton,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigure,
  EditableHtmlPluginConfigureRequired,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

export interface CategoryChoice {
  /** Identifier for the choice */
  id: string;
  /** The xhtml content for the choice */
  content: string;
  /**
   * How many categories the choice may be placed in: 0 places it in any number of categories, 1 in one.
   * Read when `allowMultiplePlacementsEnabled` is `Set Per Choice`; otherwise the element derives it from that key.
   */
  categoryCount?: number;
  /** How often the choice appears in the correct response; the authoring view recomputes it on every render, so a stored value is not read */
  correctResponseCount?: number;
}

export interface Category {
  /** Identifier for the category */
  id: string;
  /** The label to display with the category. */
  label: string;
  /** Not read by the element: the choices placed in a category come from the session's `answers` */
  choices?: CategoryChoice[];
}

export interface CategoryCorrectResponse {
  /** The identifier for the category */
  category: string;
  /** Array of identifiers for the choices that belong in this category */
  choices: string[];
  /** Array of alternatives correct choices */
  alternateResponses?: string[][];
}

/** Feedback configuration for one correctness level */
export interface FeedbackLevel {
  /** Indicates the feedback type */
  type: 'default' | 'custom' | 'none';
  /** Indicates the feedback value */
  default?: string;
  /** Indicates the feedback custom value */
  custom?: string;
}

export interface CategorizeFeedback {
  /** Indicates the configuration for feedback when answer is correct */
  correct?: FeedbackLevel;
  /** Indicates the configuration for feedback when answer is incorrect */
  incorrect?: FeedbackLevel;
  /** Indicates the configuration for feedback when answer is partially correct */
  partial?: FeedbackLevel;
}

/** Whether a choice may be placed in more than one category: for every choice, for none, or per choice */
export type MultiplePlacements = 'Yes' | 'No' | 'Set Per Choice';

/** Pie Model Object for `@pie-element/categorize` */
export interface CategorizeModel extends PieModel {
  /** Indicates if alternate correct answers are allowed */
  allowAlternateEnabled?: boolean;
  /** Indicates if author has the possibility to set maxChoicesPerCategory */
  allowMaxChoicesPerCategory?: boolean;
  /**
   * Whether choices may be placed in more than one category; `Set Per Choice` reads each choice's `categoryCount`.
   * When unset, the element allows it exactly when a choice appears in more than one category of the correct response.
   */
  allowMultiplePlacementsEnabled?: MultiplePlacements;
  /** Not read by the element: alternate responses live in `correctResponse[].alternateResponses`. Default models include it. */
  alternates?: unknown[];
  /** The available choices */
  choices: CategoryChoice[];
  /**
   * The number of columns in which to present the categories
   * @default 2
   */
  categoriesPerRow?: number;
  /** Indicates where the choices should be presented in relation to the categories. */
  choicesPosition?: 'above' | 'below' | 'left' | 'right';
  /** Label to be displayed for the choices */
  choicesLabel?: string;
  /** Should the choices be shuffled or not */
  lockChoiceOrder?: boolean;
  /** The question prompt or item stem */
  prompt?: string;
  /** Indicates if the prompt is enabled */
  promptEnabled?: boolean;
  /** The categories in which choices may be placed */
  categories: Category[];
  /** The defintion of the correct response to the question */
  correctResponse?: CategoryCorrectResponse[];
  /** Feedback configuration */
  feedback?: CategorizeFeedback;
  /** Indicates the maximum number of choices from a category */
  maxChoicesPerCategory?: number;
  /** Indicates the value for rationale */
  rationale?: string;
  /** Indicates if partial scoring is enabled */
  partialScoring?: boolean;
  /** Indicates if Feedback is enabled */
  feedbackEnabled?: boolean;
  /** Indicates if Rationale are enabled */
  rationaleEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates if Student Instructions are enabled */
  studentInstructionsEnabled?: boolean;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates the note for the answer */
  note?: string;
  /**
   * Indicates the editor's toolbar position which can be 'bottom' or 'top'
   * @default "bottom"
   */
  toolbarEditorPosition?: 'bottom' | 'top';
  /** Indicates if Rubric is enabled */
  rubricEnabled?: boolean;
  /** Indicates scoring type */
  scoringType?: 'auto' | 'rubric';
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Maximum number of choices */
  maxAnswerChoices?: number;
  /** Labels shown beside each row of categories, one per row */
  rowLabels?: string[];
  /** Minimum height of a category row, as a CSS length */
  minRowHeight?: string;
  /** Indicates font size adjustment factor */
  fontSizeFactor?: number;
  /** Indicates if the audio for the prompt should autoplay */
  autoplayAudioEnabled?: boolean;
  /** Indicates if the audio should reach the end before the item can be marked as 'complete' */
  completeAudioEnabled?: boolean;
  /** Indicates if the audio should be replaced with a custom audio button */
  customAudioButton?: CustomAudioButton;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
}

export interface MaxImageDimensions extends ConfigureMaxImageDimensionsProp {
  /** Indicates the max dimension for images in choices */
  choices?: number;
  /** Indicates the max dimension for images in row labels */
  rowLabel?: number;
  /** Indicates the max dimension for images in category labels */
  categoryLabel?: number;
}

/** Config Object for `@pie-element/categorize` */
export interface CategorizeConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Partial Scoring configuration */
  partialScoring?: ConfigureProp;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the author's spellcheck; `enabled` is not read, the model's `spellCheckEnabled` turns it on */
  spellCheck?: ConfigurePropWithEnabled;
  /** Settings Panel control for feedback; `enabled` is not read */
  feedback?: ConfigurePropWithEnabled;
  /** Settings Panel control for locking the choice order */
  lockChoiceOrder?: ConfigureProp;
  /** Settings Panel control for multiple placements of a choice */
  allowMultiplePlacements?: ConfigureProp;
  /** Settings Panel control for the maximum number of choices per category */
  maxPlacements?: ConfigureProp;
  /** Settings Panel control for alternate correct answers */
  allowAlternate?: ConfigureProp;
  /** Settings Panel control for the number of categories per row */
  categoriesPerRow?: ConfigureProp;
  /** Scoring Type configuration */
  scoringType?: ConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Student Instructions configuration */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the prompt */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the headers */
  headers?: EditableHtmlPluginConfigure;
  /** Configuration for the row labels */
  rowLabels?: EditableHtmlPluginConfigure;
  /** Not read by the authoring surface; the model's `toolbarEditorPosition` sets the position */
  toolbarEditorPosition?: ConfigureProp;
  /**
   * Minimum number of choices
   * @default 1
   */
  minChoices?: number;
  /** Maximum number of choices, shown in the authoring validation message; `validate()` checks the model's `maxAnswerChoices` */
  maxChoices?: number;
  /**
   * Minimum number of categories
   * @default 1
   */
  minCategories?: number;
  /**
   * Maximum number of categories
   * @default 12
   */
  maxCategories?: number;
  /**
   * Maximum length of a choice's text, in characters
   * @default 300
   */
  maxLengthPerChoice?: number;
  /**
   * Maximum length of a category label's text, in characters
   * @default 150
   */
  maxLengthPerCategory?: number;
  /** Position of the choices */
  choicesPosition?: ConfigureProp;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /**
   * Minimum value of categories per row
   * @default 1
   */
  minCategoriesPerRow?: number;
  /** Maximum image width for input fields */
  maxImageWidth?: MaxImageDimensions;
  /** Maximum image height for input fields */
  maxImageHeight?: MaxImageDimensions;
  /** Rubric configuration - only relevant in environments that use pie-player-components */
  withRubric?: ConfigureProp;
  /** Language configuration */
  language?: ConfigurePropWithEnabled;
  /**
   * Language choices configuration
   * Only available if language is enabled
   */
  languageChoices?: ConfigureLanguageOptions;
  /** Configuration for maximum number of choices */
  allowMaxAnswerChoices?: ConfigureProp;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: `partialScoring.settings` shows the partial scoring control */
  settingsPartialScoring?: boolean;
}

/** The choices the learner placed in one category */
export interface CategorizeAnswer {
  /** The identifier for the category */
  category: string;
  /** Identifiers of the choices placed in the category */
  choices: string[];
}

export interface CategorizeSession {
  /** Identifier of the session; the correct-response session carries the number 1 */
  id?: string | number;
  /** The element the session belongs to */
  element?: string;
  /** The choices placed in each category */
  answers?: CategorizeAnswer[];
  /** The input that made the last change; the delivery writes `Mouse` */
  selector?: string;
  /** When auto-played prompt audio started, in epoch milliseconds */
  audioStartTime?: number;
  /** When auto-played prompt audio ended, in epoch milliseconds */
  audioEndTime?: number;
  /** Milliseconds the learner waited for auto-played prompt audio to finish */
  waitTime?: number;
  /** Choice ids in the order they were shuffled for this learner, when choice order is not locked */
  shuffledValues?: string[];
}
