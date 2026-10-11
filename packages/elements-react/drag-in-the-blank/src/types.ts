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

/** A token the learner drags into a response area */
export interface Choice {
  /** Identifier of the choice; response areas store it as their answer */
  id: string;
  /** The markup of the choice */
  value: string;
}

/** Object containing the correct answer for each response area: the choice id, keyed by the area's index in `markup` */
export type CorrectResponse = Record<string, string>;

/**
 * Alternate correct choice ids for each response area, indexed by the area's index in `markup`:
 * an array of arrays, or an object keyed by the area index.
 */
export type AlternateResponses = string[][] | Record<string, string[]>;

/**
 * Model for the @pie-elements/drag-in-the-blank
 */
export interface DragInTheBlankModel extends PieModel {
  /** Array of all the available choices */
  choices: Choice[];
  /**
   * Indicates where the choices should be presented in relation to the markup.
   * @default "below"
   */
  choicesPosition?: 'above' | 'below' | 'left' | 'right';
  /** Object containing the correct answer for each response area */
  correctResponse: CorrectResponse;
  /** Alternative correct choices for each response area */
  alternateResponses?: AlternateResponses;
  /**
   * Indicates if duplicates are enabled
   * @default true
   */
  duplicates?: boolean;
  /** The markup for the pie-ui element: response areas are `{{index}}` placeholders */
  markup: string;
  /** The authoring editor's markup, with response areas as elements; the author derives `markup` from it */
  slateMarkup?: string;
  /** Indicates if the choices are presented in a fixed order */
  lockChoiceOrder?: boolean;
  /** Indicates that the item should use partial scoring */
  partialScoring?: boolean;
  /** The item stem for the question */
  prompt?: string;
  /**  Indicates if the prompt is enabled */
  promptEnabled?: boolean;
  /** Indicates correct answer rationale */
  rationale?: string;
  /** Not read by this element */
  studentInstructions?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Not read by this element */
  rubric?: string;
  /** Indicates if Rationale are enabled */
  rationaleEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Not read by this element; default models include it */
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
  /** Not read: the controller sets `disabled` from the environment. Default models include it. */
  disabled?: boolean;
  /** Not read: the controller sets `mode` from the environment. Default models include it. */
  mode?: 'gather' | 'view' | 'evaluate';
}

export interface MaxImageDimensions extends ConfigureMaxImageDimensionsProp {
  /** Indicates the max dimension for images in choices */
  choice?: number;
}

/**
 * Config Object for @pie-elements/drag-in-the-blank
 */
export interface DragInTheBlankConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Not read by this element */
  choices?: ConfigureProp;
  /** Settings Panel control for the choices position */
  choicesPosition?: ConfigureProp;
  /** Duplicates configuration */
  duplicates?: ConfigureProp;
  /** Settings Panel control for locking the choice order */
  lockChoiceOrder?: ConfigureProp;
  /** Settings Panel control for partial scoring */
  partialScoring?: ConfigureProp;
  /** Item Stem configuration */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Not read by this element */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Add choice configuration */
  addChoice?: EditableHtmlPluginConfigure;
  /** Not read by this element: `withRubric` shows the rubric control */
  rubric?: ConfigureProp;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /**
   * Minimum number of choices
   * @default 2
   */
  minChoices?: number;
  /** Maximum number of choices */
  maxChoices?: number;
  /** Maximum number of response areas */
  maxResponseAreas?: number;
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
  /** Maximum character limit for each answer choice */
  maxLength?: number;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: the model's `promptEnabled` shows the prompt */
  showPrompt?: boolean;
  /** Not read by this element: `prompt.label` labels the prompt */
  promptLabel?: string;
  /** Not read by this element: `partialScoring.settings` shows the partial scoring control */
  settingsPartialScoring?: boolean;
}

export interface DragInTheBlankSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The id of the choice placed in each response area, keyed by the area's index */
  value?: Record<string, string>;
  /** How the learner gave the last response; the delivery writes `Mouse` */
  selector?: string;
  /** Choice ids in the order they were shuffled for this learner, when choice order is not locked */
  shuffledValues?: string[];
  /** Timestamp (ms) when the prompt's auto-played audio started */
  audioStartTime?: number;
  /** Timestamp (ms) when the prompt's auto-played audio ended */
  audioEndTime?: number;
  /** Milliseconds the learner waited for the prompt's auto-played audio to finish */
  waitTime?: number;
}
