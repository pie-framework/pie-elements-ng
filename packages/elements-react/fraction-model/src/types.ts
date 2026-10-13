import type {
  ConfigureLanguageOptions,
  ConfigureMathMLProp,
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  EditableHtmlConfigureProp,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/** The selection in one model */
export interface FractionModelResponse {
  /** Indicates the response id for bar or pie model: the model's 1-based position */
  id: number;
  /** Indicates the selected response sector for model value: the number of parts selected in the model */
  value: number;
}

/** Model Object for `@pie-element/fraction-model` */
export interface FractionModelModel extends PieModel {
  /**
   * Array of ResponseObject for correct response
   * @default []
   */
  correctResponse?: FractionModelResponse[];
  /**
   * The title prompt of the item
   * @default ""
   */
  title?: string;
  /**
   * The question prompt or item stem
   * @default ""
   */
  prompt?: string;
  /**
   * Indicates if the model type should be Bar or Pie model
   * @default "bar"
   */
  modelTypeSelected?: 'bar' | 'pie';
  /**
   * Indicates max no of models to be selected
   * @default 1
   */
  maxModelSelected?: number;
  /**
   * Indicates parts per model to be selected
   * @default 5
   */
  partsPerModel?: number;
  /**
   * Indicates if student can configure no of models and parts per model
   * @default false
   */
  allowedStudentConfig?: boolean;
  /**
   * Determines if graph labels visible or not
   * @default false
   */
  showGraphLabels?: boolean;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Indicates if spellcheck is enabled for the author's title and prompt editors */
  spellCheckEnabled?: boolean;
  /**
   * Indicates the editor's toolbar position which can be 'bottom' or 'top'
   * @default "bottom"
   */
  toolbarEditorPosition?: 'bottom' | 'top';
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
}

/** What the student entered */
export interface FractionModelAnswers {
  /** The parts the student selected, one entry per model with a selection */
  response: FractionModelResponse[];
  /**
   * The number of models the student chose; written only when the model's `allowedStudentConfig` is
   * set, and empty until the student enters one
   */
  noOfModel?: number | '';
  /**
   * The parts per model the student chose; written only when the model's `allowedStudentConfig` is
   * set, and empty until the student enters one
   */
  partsPerModel?: number | '';
}

export interface FractionModelSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** What the student entered; absent until the element first renders */
  answers?: FractionModelAnswers;
}

/** Bounds of a number the author sets */
export interface FractionModelNumberOption {
  /** Indicates the min value for number model */
  min?: number;
  /** Indicates the max value for number model */
  max?: number;
  /** Not read by this element: the controller defaults set the starting value */
  default?: number;
}

/** A model type the author can choose */
export interface FractionModelTypeChoice {
  /** Indicates the value for model choice */
  value: 'bar' | 'pie';
  /** Indicates the label for model choice */
  label: string;
}

/** Configuration for model options selection like Parts per model, max no. of models etc */
export interface FractionModelOptionsConfiguration {
  /** Indicates the max number of models for item */
  maxOfModel?: FractionModelNumberOption;
  /** Indicates the parts per model for item */
  partsPerModel?: FractionModelNumberOption;
  /** Indicates the model types of item */
  modelTypeChoices?: FractionModelTypeChoice[];
}

/** Configuration for an editable field of the author */
export interface FractionModelFieldConfiguration {
  /** Not read by this element: it has no settings panel */
  settings?: boolean;
  /** Indicates the label of the field */
  label?: string;
  /** Not read by this element: the field is always shown */
  enabled?: boolean;
  /** Configuration for editable-html */
  inputConfiguration?: EditableHtmlConfigureProp;
}

/** Config Object for `@pie-element/fraction-model` */
export interface FractionModelConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /**
   * Configuration for html input configuration regarding plugins that are enabled/disabled
   * on item title
   * E.g. audio, video, image
   */
  title?: FractionModelFieldConfiguration;
  /**
   * Configuration for html input configuration regarding plugins that are enabled/disabled
   * on question stem
   * E.g. audio, video, image
   */
  prompt?: FractionModelFieldConfiguration;
  /** Configuration for model options selection like Parts per model, max no. of models etc */
  modelOptions?: FractionModelOptionsConfiguration;
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
  /** Not read by this element: the model's `spellCheckEnabled` sets spellcheck */
  spellCheck?: ConfigurePropWithEnabled;
  /** Not read by this element: the settings panel is always hidden */
  settingsPanelDisabled?: boolean;
  /** Not read by this element: it has no feedback */
  feedback?: ConfigureProp;
  /** Not read by this element: the prompt is always shown */
  showPrompt?: boolean;
  /** Not read by this element: `prompt.label` labels the prompt */
  promptLabel?: string;
  /** Not read by this element: it has no partial scoring */
  settingsPartialScoring?: boolean;
}
