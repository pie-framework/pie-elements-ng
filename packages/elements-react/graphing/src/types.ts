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

/** Kind of mark a graphing tool draws. */
export type MarkType =
  | 'point'
  | 'segment'
  | 'line'
  | 'vector'
  | 'circle'
  | 'sine'
  | 'polygon'
  | 'ray'
  | 'parabola'
  | 'absolute'
  | 'exponential';

/** A toolbar tool: a mark type, or `label`, which labels existing points instead of drawing a mark. */
export type GraphingTool = MarkType | 'label';

export interface Point {
  /** Indicates x coordinate */
  x: number;
  /** Indicates y coordinate */
  y: number;
}

/** A point of a mark, labelled with the label tool. */
export interface MarkPoint extends Point {
  /** Label shown next to the point */
  label?: string;
}

export interface Mark {
  /** Indicates type of mark */
  type: MarkType;
  /** Indicates if mark is in build process */
  building?: boolean;
  /** Indicates x coordinate if type is point */
  x?: number;
  /** Indicates y coordinate if type is point */
  y?: number;
  /** Indicates label value for mark */
  label?: string;
  /** Not read by this element or `@pie-lib/graphing`. */
  showLabel?: boolean;
  /** Indicates where starts the mark if type is line, segment, ray, vector */
  from?: MarkPoint;
  /** Indicates where ends the mark if type is line, segment, ray, vector */
  to?: MarkPoint;
  /** Labelled midpoint of a line, ray, segment, vector, circle or polygon mark */
  middle?: MarkPoint;
  /** Indicated the root of mark if type is sine, parabola, absolute, exponential or circle */
  root?: MarkPoint;
  /** Indicated the edge of mark if type is sine, parabola, absolute, exponential or circle */
  edge?: MarkPoint;
  /** Indicates if mark is closed if type is polygon, sine */
  closed?: boolean;
  /** Indicates all mark's points if type is polygon */
  points?: MarkPoint[];
}

export interface Answer {
  /** Indicates name of answer */
  name: string;
  /** Indicates marks for the answer */
  marks: Mark[];
}

/** The correct answer, plus alternates keyed `alternate<N>`, e.g. `alternate1`. */
export interface GraphingAnswers {
  /** The correct answer */
  correctAnswer: Answer;
  [alternate: string]: Answer;
}

export interface Arrows {
  /** Indicates if left arrow is enabled */
  left: boolean;
  /** Indicates if right arrow is enabled */
  right: boolean;
  /** Indicates if up arrow is enabled */
  up: boolean;
  /** Indicates if down arrow is enabled */
  down: boolean;
}

export interface GraphSettings {
  /** Min value */
  min: number;
  /** Max value */
  max: number;
  /** Padding value */
  padding?: number;
  /** Step value */
  step: number;
  /** Label step value */
  labelStep: number;
  /** Axis Label */
  axisLabel: string;
}

export interface Graph {
  /** Width for graph representation */
  width: number;
  /** Height for graph representation */
  height: number;
}

export interface Labels {
  /** Label for top side of the graph */
  top?: string;
  /** Label for bottom side of the graph */
  bottom?: string;
  /** Label for left side of the graph */
  left?: string;
  /** Label for right side of the graph */
  right?: string;
}

/** Model for the Graphing Interaction */
export interface GraphingModel extends PieModel {
  /** Indicates marks that are set as answers; alternates are keyed `alternate<N>` */
  answers: GraphingAnswers;
  /** Indicates if arrows are enabled; a boolean sets all four arrows (older models) */
  arrows?: Arrows | boolean;
  /** Indicates marks that have to be displayed in background */
  backgroundMarks?: Mark[];
  /**
   * Indicates if coordinates of a point are displayed on hover
   * @default false
   */
  coordinatesOnHover?: boolean;
  /**
   * Indicates the default grid configuration: an index into the configuration's `gridConfigurations`
   * @default 0
   * @minimum 0
   */
  defaultGridConfiguration?: number;
  /** Indicates the default selected tool for the graph; empty means the first toolbar tool */
  defaultTool?: MarkType | '';
  /** Indicates if the graph dimensions are displayed */
  dimensionsEnabled?: boolean;
  /** Indicates domain settings for the graph */
  domain?: GraphSettings;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
  /** Indicates the graph line model */
  graph?: Graph;
  /**
   * Indicates if the graph axes and labels are enabled
   * @default true
   */
  includeAxes?: boolean;
  /** Not read: the author copies it from the selected grid configuration. */
  label?: string;
  /** Indicates labels */
  labels?: Labels;
  /**
   * Indicates if the graph labels are displayed
   * @default true
   */
  labelsEnabled?: boolean;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Not read by this element; the author's padding toggle writes it. */
  padding?: boolean;
  /** Indicates prompt value */
  prompt?: string;
  /**
   * Indicates if the prompt is enabled
   * @default true
   */
  promptEnabled?: boolean;
  /** Indicates range settings for the graph */
  range?: GraphSettings;
  /** Indicates rationale for the answer */
  rationale?: string;
  /**
   * Indicates if Rationale are enabled
   * @default true
   */
  rationaleEnabled?: boolean;
  /** Indicates if Rubric is enabled */
  rubricEnabled?: boolean;
  /** Indicates scoring type */
  scoringType?: 'dichotomous' | 'partial scoring';
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /**
   * Indicates if some domain values will be synched to the range values
   * @default false
   */
  standardGrid?: boolean;
  /** Not read by this element. */
  studentInstructions?: string;
  /**
   * Indicates if Student Instructions are enabled
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
  /** Indicates graph title */
  title?: string;
  /**
   * Indicates if the graph title is displayed
   * @default true
   */
  titleEnabled?: boolean;
  /** Indicates the tools that have to be displayed in toolbar */
  toolbarTools?: GraphingTool[];
}

/** A student response */
export interface GraphingSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The marks the student drew */
  answer?: Mark[];
}

export interface ArrowsConfigProp extends ConfigureProp {
  /** Configuration for the left arrow checkbox */
  left?: ConfigureProp;
  /** Configuration for the right arrow checkbox */
  right?: ConfigureProp;
  /** Configuration for the up arrow checkbox */
  up?: ConfigureProp;
  /** Configuration for the down arrow checkbox */
  down?: ConfigureProp;
}

export interface DimensionsConfigProp extends ConfigurePropWithEnabled {
  /** Minimum graph dimension, in pixels */
  min?: number;
  /** Maximum graph dimension, in pixels */
  max?: number;
  /** Step between graph dimensions, in pixels */
  step?: number;
}

export interface GridPanelConfigProp {
  /** Label for the field in the Grid Setup Panel */
  label?: string;
  /** Indicates if the field is displayed in the Grid Setup Panel */
  enabled?: boolean;
}

export interface AuthoringConfigProp extends ConfigurePropWithEnabled {
  /** Indicates if the "Include axes and labels?" toggle is displayed in the Grid Setup Panel */
  includeAxesEnabled?: boolean;
  /** Indicates if the "Constrain to standard coordinate grid?" toggle is displayed in the Grid Setup Panel */
  standardGridEnabled?: boolean;
  /** Min value configuration */
  min?: GridPanelConfigProp;
  /** Max value configuration */
  max?: GridPanelConfigProp;
  /** Axis label configuration */
  axisLabel?: GridPanelConfigProp;
  /** Step value configuration */
  step?: GridPanelConfigProp;
  /** Label step value configuration */
  labelStep?: GridPanelConfigProp;
}

/** A preset grid an author picks from; selecting it copies these values into the model. */
export interface GridConfiguration {
  /** Name shown in the grid configuration picker */
  label?: string;
  /** Arrows for the grid */
  arrows?: Arrows;
  /** Domain settings for the grid */
  domain?: GraphSettings;
  /** Graph dimensions for the grid */
  graph?: Graph;
  /** Indicates if the graph axes and labels are enabled */
  includeAxes?: boolean;
  /** Labels for the grid */
  labels?: Labels;
  /** Indicates if padding is enabled */
  padding?: boolean;
  /** Range settings for the grid */
  range?: GraphSettings;
  /** Indicates if domain values are synched to the range values */
  standardGrid?: boolean;
  /** Graph title */
  title?: string;
}

export interface LabelsConfigProp extends ConfigurePropWithEnabled {
  /** Placeholder for the top label */
  top?: string;
  /** Placeholder for the right label */
  right?: string;
  /** Placeholder for the bottom label */
  bottom?: string;
  /** Placeholder for the left label */
  left?: string;
}

export interface TitleConfigProp extends ConfigurePropWithEnabled {
  /** Placeholder for the graph title */
  placeholder?: string;
}

export interface GraphingConfiguration {
  /** Base editable html input configuration regarding plugins that are enabled/disabled E.g. audio, video, image */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Grid Setup Panel configuration */
  authoring?: AuthoringConfigProp;
  /** Arrows configuration */
  arrows?: ArrowsConfigProp;
  /** Graph toolbar tools configuration */
  availableTools?: GraphingTool[];
  /** Coordinates configuration */
  coordinatesOnHover?: ConfigureProp;
  /** Minimum and maximum dimensions of the authoring view */
  contentDimensions?: ContentDimensions;
  /** Graph dimensions configuration */
  graphDimensions?: DimensionsConfigProp;
  /** Grid default configurations */
  gridConfigurations?: GridConfiguration[];
  /** Instructions shown at the top of the authoring view */
  instruction?: ConfigureProp;
  /** Padding configuration */
  padding?: ConfigureProp;
  /** Labels configuration */
  labels?: LabelsConfigProp;
  /** Language configuration */
  language?: ConfigurePropWithEnabled;
  /** Language choices configuration Only available if language is enabled */
  languageChoices?: ConfigureLanguageOptions;
  /** Configuration for the prompt */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the rationale */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck */
  spellCheck?: ConfigurePropWithEnabled;
  /** Scoring Type configuration */
  scoringType?: ConfigureProp;
  /** Student Instructions configuration */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Graph title configuration */
  title?: TitleConfigProp;
  /** Maximum image width for input fields */
  maxImageWidth?: ConfigureMaxImageDimensionsProp;
  /** Maximum image height for input fields */
  maxImageHeight?: ConfigureMaxImageDimensionsProp;
  /** Rubric configuration - only relevant in environments that use pie-player-components */
  withRubric?: ConfigureProp;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /**
   * Ability to remove incomplete tool added after switching current tool.
   * @default false
   */
  removeIncompleteTool?: boolean;
  /** Not read by this element. */
  showPrompt?: boolean;
  /** Not read by this element. */
  promptLabel?: string;
  /** Not read by this element. */
  settingsPartialScoring?: boolean;
}
