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

/** The chart types the element renders */
export type ChartingChartType = 'bar' | 'histogram' | 'lineDot' | 'lineCross' | 'dotPlot' | 'linePlot';

/** Whether a category's value or label matches the correct answer; the controller sets it when scoring */
export interface ChartingCategoryCorrectness {
  value: 'correct' | 'incorrect';
  label: 'correct' | 'incorrect';
}

/** A category on the chart: a bar, a point on a line or a column of a plot */
export interface ChartingCategory {
  /** Indicates category label */
  label: string;
  /** Indicates category value */
  value: number;
  /** Indicates if category value is interactive */
  interactive?: boolean;
  /** Indicates if category label is editable */
  editable?: boolean;
  /** Indicates if category is deletable */
  deletable?: boolean;
  /** Position of the category in the author's chart; scoring reports it with each correct category */
  index?: number;
  /** Indicates correctness for a category */
  correctness?: ChartingCategoryCorrectness;
}

/** Marks that are set as answers */
export interface ChartingCorrectAnswer {
  /** Indicates name of answer; the author keys the correct-response chart by it */
  name?: string;
  /** Indicates marks for the answer */
  data?: ChartingCategory[];
}

/** Settings for the category axis */
export interface ChartingDomain {
  /** Axis label */
  label?: string;
  /** Not read by this element: the chart fixes the category axis to 0–1 */
  min?: number;
  /** Not read by this element: the chart fixes the category axis to 0–1 */
  max?: number;
  /** Not read by this element: the chart fixes the category axis step to 1 */
  step?: number;
  /** Not read by this element: the chart fixes the category axis label step to 1 */
  labelStep?: number;
  /** Not read by this element: `label` labels the axis */
  axisLabel?: string;
}

/** Settings for the value axis */
export interface ChartingRange {
  /** Axis label */
  label?: string;
  /**
   * Min value
   * @default 0
   */
  min?: number;
  /**
   * Max value
   * @default 1
   */
  max?: number;
  /** Step value; `labelStep` applies when absent */
  step?: number;
  /**
   * Label step value
   * @default 1
   */
  labelStep?: number;
  /** Not read by this element: `label` labels the axis */
  axisLabel?: string;
}

/** Size of the chart */
export interface ChartingGraph {
  /** Width for chart representation */
  width: number;
  /** Height for chart representation */
  height: number;
}

/** Placeholder messages for the chart */
export interface ChartingPlaceholderMessages {
  /** Indicates placeholder message if title is not defined */
  title?: string;
  /** Indicates placeholder message if labels for range or domain are not defined */
  labels?: string;
}

/** Model Object for `@pie-element/charting` */
export interface ChartingModel extends PieModel {
  /**
   * Indicates if user can add more categories
   * @default true
   */
  addCategoryEnabled?: boolean;
  /**
   * Indicates the chart type
   * @default "lineCross"
   */
  chartType?: ChartingChartType;
  /** Indicates marks that are set as answers */
  correctAnswer?: ChartingCorrectAnswer;
  /** Indicates default categories for the answer */
  data?: ChartingCategory[];
  /** Indicates domain settings for the chart */
  domain?: ChartingDomain;
  /** Indicates the chart line model; 480 by 480 when absent */
  graph?: ChartingGraph;
  /** Indicates prompt value */
  prompt?: string;
  /**
   * Indicates if the prompt is enabled
   * @default true
   */
  promptEnabled?: boolean;
  /** Indicates range settings for the chart */
  range?: ChartingRange;
  /** Indicates rationale for the answer */
  rationale?: string;
  /**
   * Indicates if Rationale are enabled
   * @default true
   */
  rationaleEnabled?: boolean;
  /**
   * Indicates scoring type. `model()` applies the default when absent; `outcome()` scores an absent
   * value as partial scoring unless the environment turns partial scoring off.
   * @default "all or nothing"
   */
  scoringType?: 'all or nothing' | 'partial scoring';
  /** Not read by this element: it has no student instructions */
  studentInstructions?: string;
  /**
   * Indicates if Student Instructions are enabled. Not read by this element: it has no student instructions.
   * @default true
   */
  studentInstructionsEnabled?: boolean;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /**
   * Indicates if Teacher Instructions are enabled
   * @default true
   */
  teacherInstructionsEnabled?: boolean;
  /** Indicates chart title */
  title?: string;
  /** Not read by this element: the configuration's `titlePlaceholder` and `labelsPlaceholders` set the placeholders */
  placeholderMessages?: ChartingPlaceholderMessages;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates if Rubric is enabled. Not read by this element: the settings panel sets it when `withRubric.settings` is on. */
  rubricEnabled?: boolean;
  /**
   * Indicates if teacher can enable/disable data[]:interactive
   * @default false
   */
  changeInteractiveEnabled?: boolean;
  /**
   * Indicates if teacher can enable/disable data[]:editable
   * @default false
   */
  changeEditableEnabled?: boolean;
  /**
   * Indicates if teacher can enable/disable addCategoryEnabled
   * @default false
   */
  changeAddCategoryEnabled?: boolean;
  /**
   * Label for new category in correct response and player's chart
   * @default "New Category"
   */
  studentNewCategoryDefaultLabel?: string;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
}

export interface ChartingSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The student's categories; the initial chart is scored when absent */
  answer?: ChartingCategory[];
}

/** Range of a chart dimension the author can set */
export interface ChartingDimensionConstraints {
  /** Smallest value the author can set */
  min?: number;
  /** Largest value the author can set */
  max?: number;
  /** Step of the control; values under 1 count as 20 */
  step?: number;
}

/** Chart dimensions the author can set */
export interface ChartingDimensions {
  /** Not read by this element */
  settings?: boolean;
  /** Not read by this element */
  label?: string;
  /** Shows the chart width and height controls */
  showInConfigPanel?: boolean;
  /** Width the author can set: `min` at least 50, `max` at most 700, `step` at most 200; 50, 700 and 20 when absent */
  width?: ChartingDimensionConstraints;
  /** Height the author can set: `min` at least 400, `max` at most 700, `step` at most 200; 400, 700 and 20 when absent */
  height?: ChartingDimensionConstraints;
}

export interface ChartingAuthorNewCategoryDefaults {
  /** Not read by this element */
  settings?: boolean;
  /** Indicates the label for the new category */
  label?: string;
  /** Indicates if new category is interactive */
  interactive?: boolean;
  /** Indicates if new category is editable */
  editable?: boolean;
}

/** Indicates the chart types that are available and the label used for each; a type without a label is not offered */
export interface ChartingAvailableChartTypes {
  /** Indicates if bar chart is available and the label used for it. */
  bar?: string;
  /** Indicates if histogram is available and the label used for it. */
  histogram?: string;
  /** Indicates if line chart with dots is available and the label used for it. */
  lineDot?: string;
  /** Indicates if line chart with crosses is available and the label used for it. */
  lineCross?: string;
  /** Indicates if dot plot is available and the label used for it. */
  dotPlot?: string;
  /** Indicates if line plot is available and the label used for it. */
  linePlot?: string;
}

export interface ChartingLabelsPlaceholders {
  /** Not read by this element */
  settings?: boolean;
  /** Not read by this element */
  label?: string;
  /** Not read by this element */
  enabled?: boolean;
  /** This value is empty for charting. The property exist in order to be consistent with graphing configuration. */
  top?: string;
  /** This value is empty for charting. The property exist in order to be consistent with graphing configuration. */
  right?: string;
  /** Indicates the placeholder for the bottom label */
  bottom?: string;
  /** Indicates the placeholder for the left label */
  left?: string;
}

export interface ChartingOption {
  /** Indicates if the item has to be displayed in the Settings Panel */
  settings?: boolean;
  /** Indicates the label for the option */
  authoringLabel?: string;
  /** Indicates the label for the item that has to be displayed in the Settings Panel */
  settingsLabel?: string;
}

export interface ChartingOptions {
  /** Indicates if teacher can enable/disable data[]:interactive */
  changeInteractive?: ChartingOption;
  /** Indicates if teacher can enable/disable data[]:editable */
  changeEditable?: ChartingOption;
  /** Indicates if teacher can enable/disable addCategoryEnabled */
  addCategory?: ChartingOption;
  /** Not read by this element: the configuration's top-level `mathMlOptions` applies */
  mathMlOptions?: ConfigureMathMLProp;
}

/** Config Object for `@pie-element/charting` */
export interface ChartingConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Prompt configuration */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the author's spellcheck */
  spellCheck?: ConfigurePropWithEnabled;
  /** Configuration for the title's placeholder */
  titlePlaceholder?: ConfigureProp;
  /** Labels Placeholder configuration */
  labelsPlaceholders?: ChartingLabelsPlaceholders;
  /** Scoring Type configuration */
  scoringType?: ConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Student Instructions configuration */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Chart title configuration. Not read by this element: `titlePlaceholder` sets the title's placeholder. */
  title?: ConfigurePropWithEnabled;
  /** Author instruction to build a new chart; `label` is the text shown above the form */
  instruction?: ConfigureProp;
  /** Configuration for new category in define chart */
  authorNewCategoryDefaults?: ChartingAuthorNewCategoryDefaults;
  /** Chart dimensions the author can set */
  chartDimensions?: ChartingDimensions;
  /** Not read by this element: the model's `studentNewCategoryDefaultLabel` labels the categories students add */
  studentNewCategoryDefaultLabel?: ConfigureProp;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /** Maximum image width for input fields */
  maxImageWidth?: ConfigureMaxImageDimensionsProp;
  /** Maximum image height for input fields */
  maxImageHeight?: ConfigureMaxImageDimensionsProp;
  /** Rubric configuration - only relevant in environments that use pie-player-components */
  withRubric?: ConfigureProp;
  /** Authoring view settings for Charting */
  chartingOptions?: ChartingOptions;
  /** Indicates the chart types that are available */
  availableChartTypes?: ChartingAvailableChartTypes;
  /** Indicates the label for the chart type */
  chartTypeLabel?: string;
  /** Language configuration */
  language?: ConfigurePropWithEnabled;
  /** Indicates the maximum character limit for X and Y axis labels */
  labelsCharactersLimit?: number;
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
  /** Not read by this element: `scoringType.settings` shows the scoring control */
  settingsPartialScoring?: boolean;
}
