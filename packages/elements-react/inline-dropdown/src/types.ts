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

/** An option of a response area's dropdown */
export interface Choice {
  /** The value for the choice */
  value: string;
  /** The label of the choice */
  label: string;
  /** Indicates if choice is correct */
  correct?: boolean;
  /** Rationale for the choice */
  rationale?: string;
}

/**
 * Object with all the available choices for each response area, keyed by the area's index in `markup`
 * (0 to n - 1)
 */
export type Choices = Record<string, Choice[]>;

/** Further correct choice values for each response area, keyed by the area's index in `markup` */
export type AlternateResponse = Record<string, string[]>;

/**
 * Model for the `@pie-element/inline-dropdown`
 */
export interface InlineDropdownModel extends PieModel {
  /** Object with all the available choices for each response area */
  choices: Choices;
  /** Object that contains values that are right as well, besides the main one */
  alternateResponse?: AlternateResponse;
  /** Not read by this element: `alternateResponse` holds the alternate values */
  alternateResponses?: AlternateResponse;
  /** The markup for the pie-ui element: response areas are `{{index}}` placeholders */
  markup: string;
  /** The authoring editor's markup, with response areas as elements; the author derives `markup` from it */
  slateMarkup?: string;
  /** The item stem for the question */
  prompt?: string;
  /** Determines if prompt should show */
  promptEnabled?: boolean;
  /** Indicates if the choices are presented in a fixed order */
  lockChoiceOrder?: boolean;
  /** Indicates if partialScoring is enabled */
  partialScoring?: boolean;
  /** Indicates correct answer rationale */
  rationale?: string;
  /** Not read by this element */
  scoringType?: 'auto' | 'rubric';
  /** Not read by this element */
  studentInstructions?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Indicates if Rationale are enabled */
  rationaleEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates if Choice Level Rationales are enabled */
  choiceRationaleEnabled?: boolean;
  /** Not read by this element; default models include it */
  studentInstructionsEnabled?: boolean;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /**
   * Indicates display type for the container of the pie-ui element
   * @default "block"
   */
  displayType?: string;
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
  /** Not read by this element: `lockChoiceOrder` controls the shuffle. Default models include it. */
  shuffle?: boolean;
  /** Not read: the controller sets `disabled` from the environment. Default models include it. */
  disabled?: boolean;
  /** Not read: the controller sets `mode` from the environment. Default models include it. */
  mode?: 'gather' | 'view' | 'evaluate';
}

/**
 * Config Object for `@pie-element/inline-dropdown`
 */
export interface InlineDropdownConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Not read by this element */
  choices?: ConfigureProp;
  /** Item Stem configuration */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Lock Choice Order configuration */
  lockChoiceOrder?: ConfigureProp;
  /** Partial Scoring configuration */
  partialScoring?: ConfigureProp;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Choice Level Rationales configuration */
  choiceRationale?: ConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Not read by this element */
  scoringType?: ConfigureProp;
  /** Not read by this element */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Template configuration */
  template?: EditableHtmlPluginConfigure;
  /** Not read by this element; the author's defaults carry it */
  toolbarEditorPosition?: ConfigureProp;
  /** Maximum number of response areas */
  maxResponseAreas?: number;
  /** Maximum number of choices per response area */
  maxResponseAreaChoices?: number;
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
  /** Configuration for editable-html inside inline-dropdown toolbar, under `inputConfiguration` */
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

export interface InlineDropdownSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The value of the choice selected in each response area, keyed by the area's index */
  value?: Record<string, string>;
  /**
   * Choice values of each response area in the order they were shuffled for this learner, keyed by the
   * area's index, when choice order is not locked. An array is the format of older sessions; the
   * controller replaces it.
   */
  shuffledValues?: Record<string, string[]> | string[];
}
