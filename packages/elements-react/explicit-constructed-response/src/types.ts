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

/** Feedback for a choice, shown when the response is evaluated */
export interface ChoiceFeedback {
  /** `default` shows the model's `defaultFeedback.correct`, `custom` shows `value`; absent means `none` */
  type?: 'none' | 'default' | 'custom';
  /** The custom feedback */
  value?: string;
}

/** An accepted answer for a response area */
export interface Choice {
  /** The value for the choice */
  value: string;
  /** The label of the choice: the answer the learner types */
  label: string;
  /** Feedback for the choice when the response is evaluated */
  feedback?: ChoiceFeedback;
}

/**
 * Object with all the available choices for each response area, keyed by the area's index in `markup`
 * (0 to n - 1). The first choice is the correct answer; the others are its alternates.
 */
export type Choices = Record<string, Choice[]>;

/**
 * Model for the @pie-elements/explicit-constructed-response
 */
export interface ExplicitConstructedResponseModel extends PieModel {
  /** Object with all the available choices for each response area */
  choices: Choices;
  /**
   * The type of display the container of the pie-ui element will be used
   * @default "block"
   */
  displayType?: string;
  /** The markup for the pie-ui element: response areas are `{{index}}` placeholders */
  markup: string;
  /** The authoring editor's markup, with response areas as elements; the author derives `markup` from it */
  slateMarkup?: string;
  /** The item stem for the question */
  prompt?: string;
  /**  Indicates if the prompt is enabled */
  promptEnabled?: boolean;
  /**
   * Indicates if spellcheck is enabled for the author
   * @default true
   */
  spellCheckEnabled?: boolean;
  /**
   * Indicates if spellcheck is enabled for the player
   * @default false
   */
  playerSpellCheckEnabled?: boolean;
  /** Indicates correct answer rationale */
  rationale?: string;
  /** Not read by this element: `partialScoring` selects the scoring */
  autoScoring?: 'allOrNothing' | 'partial';
  /** Indicates that the item should use partial scoring */
  partialScoring?: boolean;
  /** Not read by this element */
  studentInstructions?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Not read by this element */
  rubric?: string;
  /** Indicates if Rationale are enabled */
  rationaleEnabled?: boolean;
  /** Not read by this element; default models include it */
  studentInstructionsEnabled?: boolean;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates the note for the answer; the element shows a translated default when it is absent */
  note?: string;
  /**
   * Indicates the editor's toolbar position which can be 'bottom' or 'top'
   * @default "bottom"
   */
  toolbarEditorPosition?: 'bottom' | 'top';
  /** Indicates the maximum length for each response area */
  maxLengthPerChoice?: number[];
  /**
   * Indicates if each response area's input is limited to its `maxLengthPerChoice`
   * @default true
   */
  maxLengthPerChoiceEnabled?: boolean;
  /** Indicates if Rubric is enabled */
  rubricEnabled?: boolean;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Not read by this element: `responseAreaInputConfiguration.characters` controls the Spanish characters */
  spanishInputEnabled?: boolean;
  /**
   * Toolbar plugins of the response areas' inputs; the author copies them from the configuration's
   * `responseAreaInputConfiguration.inputConfiguration`
   */
  responseAreaInputConfiguration?: EditableHtmlConfigureProp;
  /** Feedback texts that choices with `default` feedback show */
  defaultFeedback?: {
    correct?: string;
    incorrect?: string;
  };
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
  /** Not read: the controller sets `disabled` from the environment. Demo models include it. */
  disabled?: boolean;
}

/**
 * Config Object for @pie-elements/explicit-constructed-response
 */
export interface ExplicitConstructedResponseConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Not read by this element */
  choices?: ConfigureProp;
  /** Item Stem configuration */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Configuration for the player's spellcheck; `enabled` is not read */
  playerSpellCheck?: ConfigurePropWithEnabled;
  /** Settings Panel control for editing the source; the control writes `enabled`, which is not read */
  editSource?: ConfigurePropWithEnabled;
  /** Settings Panel control for partial scoring */
  partialScoring?: ConfigureProp;
  /** Not read by this element: `partialScoring` shows the scoring control */
  autoScoring?: ConfigureProp;
  /** Not read by this element */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Template configuration */
  template?: EditableHtmlPluginConfigure;
  /** Not read by this element: `withRubric` shows the rubric control */
  rubric?: ConfigureProp;
  /** Not read by this element */
  alternates?: ConfigureProp;
  /** Maximum Length Per Choice Configuration: the settings panel control for `maxLengthPerChoiceEnabled` */
  maxLengthPerChoice?: ConfigureProp;
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
  /** Not read by this element: `spanishButton` shows the Spanish characters control */
  spanishInput?: ConfigureProp;
  /** Settings Panel control that disables the Spanish characters in the response areas' inputs */
  spanishButton?: ConfigureProp;
  /** Toolbar plugins of the response areas' inputs, under `inputConfiguration` */
  responseAreaInputConfiguration?: EditableHtmlPluginConfigure;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: the model's `promptEnabled` shows the prompt */
  showPrompt?: boolean;
  /** Not read by this element: `prompt.label` labels the prompt */
  promptLabel?: string;
  /** Not read by this element: `partialScoring.settings` shows the partial scoring control */
  settingsPartialScoring?: boolean;
}

export interface ExplicitConstructedResponseSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The learner's answer in each response area, keyed by the area's index */
  value?: Record<string, string>;
}
