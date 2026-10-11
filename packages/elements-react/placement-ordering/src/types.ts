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

export interface Choice {
  /** The id of the choice */
  id: string;
  /** The label of the choice */
  label?: string;
}

export interface CorrectResponse {
  /** The id of the correct response */
  id: string;
  /**
   * The weight of the correct response
   * Note: weights are not configurable in the existing component so we'll ignore it for now
   */
  weight?: number;
}

export interface AlternateResponse {
  /** Array that contains the alternate response ids */
  response: string[];
}

/**
 * @deprecated Use `{ response: [...] }`; the controller still scores this form and logs an error for it.
 */
export type ChoiceIdList = string[];

/** Feedback configuration for one correctness level. */
export interface FeedbackConfig {
  /** Indicates the feedback type */
  type: 'default' | 'custom' | 'none';
  /** Indicates the feedback value */
  default?: string;
  /** Indicates the feedback custom value */
  custom?: string;
}

export interface ComplexFeedbackType {
  /** Indicates the configuration for feedback when answer is correct */
  correct?: FeedbackConfig;
  /** Indicates the configuration for feedback when answer is incorrect */
  incorrect?: FeedbackConfig;
  /** Indicates the configuration for feedback when answer is partially correct */
  partial?: FeedbackConfig;
}

/** Model for the `@pie-element/placement-ordering` */
export interface PlacementOrderingModel extends PieModel {
  /** The label for possible choices */
  choiceLabel?: string;
  /** Array of all the available choices */
  choices: Choice[];
  /**
   * Array of the correct responses in the correct order.
   * A bare string is a choice id; the author converts it to `{ id, weight: 0 }`.
   */
  correctResponse?: Array<CorrectResponse | string>;
  /** Array that contains the correct alternate responses */
  alternateResponses?: Array<AlternateResponse | ChoiceIdList>;
  /** Feedback for student answer */
  feedback?: ComplexFeedbackType;
  /** The item stem for the question */
  prompt?: string;
  /** Determines if prompt should show */
  promptEnabled?: boolean;
  /** Not read by this element. */
  lockChoiceOrder?: boolean;
  /** If placement type is placement; show ordering indicates if the boxes are numbered */
  numberedGuides?: boolean;
  /**
   * The layout for displaying the choices
   * @default "vertical"
   */
  orientation?: 'vertical' | 'horizontal';
  /** Indicates if partialScoring is enabled */
  partialScoring?: boolean;
  /** Indicates if the items can be replaced with each other or if they can be placed inside other boxes */
  placementArea?: boolean;
  /** Indicates correct answer rationale */
  rationale?: string;
  /** Indicates if each choice will be removed from choices after becoming a target */
  removeTilesAfterPlacing?: boolean;
  /** Indicates scoring type. The author's settings panel sets it; the controller does not read it. */
  scoringType?: 'auto' | 'rubric';
  /** Not read by this element. */
  studentInstructions?: string;
  /** The label for answer area if placement area is enabled */
  targetLabel?: string;
  /** Indicates if Feedback is enabled */
  feedbackEnabled?: boolean;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Indicates if Rationale are enabled */
  rationaleEnabled?: boolean;
  /** Not read by this element. The author's settings panel toggles it and default models include it. */
  studentInstructionsEnabled?: boolean;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates if Choice Label is enabled */
  choiceLabelEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates the note for the answer */
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
}

/** Maximum image dimensions, with the choice-specific entries this element adds. */
export interface PlacementOrderingMaxImageDimensions extends ConfigureMaxImageDimensionsProp {
  /** Only available for the width prop: indicates the max width for images in choices and choices labels when placement area is enabled */
  choicesWithPlacementArea?: number;
  /** Only available for the width prop: indicates the max width for images in choices and choices labels when placement area is disabled */
  choicesWithoutPlacementArea?: number;
  /** Only available for the height prop: indicates the max height for images in choices and choices labels */
  choices?: number;
}

/** Config Object for `@pie-element/placement-ordering` */
export interface PlacementOrderingConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Choice Label configuration */
  choiceLabel?: EditableHtmlPluginConfigure;
  /** Choices configuration */
  choices?: EditableHtmlPluginConfigure;
  /** Indicates whether feedback is enabled; `enabled` is not read */
  feedback?: ConfigurePropWithEnabled;
  /** Item Stem configuration */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Not read by this element. */
  lockChoiceOrder?: ConfigureProp;
  /** Numbered Guides configuration */
  numberedGuides?: ConfigureProp;
  /** Orientation configuration */
  orientation?: ConfigureProp;
  /** Partial Scoring configuration */
  partialScoring?: ConfigureProp;
  /** Placement Area configuration */
  placementArea?: ConfigureProp;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Remove tiles after placing configuration */
  removeTilesAfterPlacing?: ConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Scoring Type configuration */
  scoringType?: ConfigureProp;
  /** Student Instructions configuration */
  studentInstructions?: ConfigureProp;
  /** Target Label configuration */
  targetLabel?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Maximum image width for input fields */
  maxImageWidth?: PlacementOrderingMaxImageDimensions;
  /** Maximum image height for input fields */
  maxImageHeight?: PlacementOrderingMaxImageDimensions;
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

export interface PlacementOrderingSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /**
   * The choice ids in the order the learner placed them.
   * With a placement area, an empty target is a hole in the array, which serializes as null.
   */
  value?: Array<string | null>;
}
