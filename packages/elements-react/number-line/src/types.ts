import type {
  ConfigureLanguageOptions,
  ConfigureMathMLProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigure,
  EditableHtmlPluginConfigureRequired,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/** Whether a point is drawn filled (included) or hollow (excluded) */
export type NumberLinePointType = 'full' | 'empty';

/** A point at `domainPosition` */
export interface NumberLinePoint {
  /** Indicates the response type */
  type: 'point';
  /** Indicates response domain position */
  domainPosition: number;
  /** Indicates point type */
  pointType: NumberLinePointType;
}

/** A segment from `domainPosition` to `domainPosition + size` */
export interface NumberLineLine {
  /** Indicates the response type */
  type: 'line';
  /** Indicates response domain position: the left end of the line */
  domainPosition: number;
  /** Indicates line size */
  size: number;
  /** Indicates left point (left limit for the line) type */
  leftPoint: NumberLinePointType;
  /** Indicates right point (right limit for the line) type */
  rightPoint: NumberLinePointType;
}

/** A ray starting at `domainPosition` */
export interface NumberLineRay {
  /** Indicates the response type */
  type: 'ray';
  /** Indicates response domain position */
  domainPosition: number;
  /** Indicates point type */
  pointType: NumberLinePointType;
  /** Indicates ray direction */
  direction: 'negative' | 'positive';
}

/** An object plotted on the number line */
export type NumberLineResponse = NumberLinePoint | NumberLineLine | NumberLineRay;

/**
 * A plotting tool: `P` point, `L` line, `R` ray, then the point types (`F` full, `E` empty) and,
 * for rays, the direction (`N` negative, `P` positive).
 */
export type NumberLineResponseType = 'PF' | 'LFF' | 'LEF' | 'LFE' | 'LEE' | 'RFN' | 'RFP' | 'REN' | 'REP';

export interface NumberLineDomain {
  min: number;
  max: number;
}

export interface NumberLineTicks {
  /** smallest tick - These ticks don't have labels. */
  minor: number;
  /** larger tick - These ticks have labels. */
  major: number;
  /** Tick interval type; derived from `minor` when absent */
  tickIntervalType?: 'Integer' | 'Fraction' | 'Decimal';
  /** Integer representation of minor; computed from `minor` */
  integerTick?: number;
  /** Decimal representation of minor; computed from `minor` */
  decimalTick?: number;
  /** Fraction representation of minor; computed from `minor` */
  fractionTick?: string;
}

export interface NumberLineArrows {
  left?: boolean;
  right?: boolean;
}

/** Indicates the available types of responses */
export interface NumberLineAvailableTypes {
  /** Indicates if full point is available */
  PF?: boolean;
  /** Indicates if line with full left & right point is available */
  LFF?: boolean;
  /** Indicates if line with empty left & full right point is available */
  LEF?: boolean;
  /** Indicates if line with full left & empty right point is available */
  LFE?: boolean;
  /** Indicates if line with empty left & right point is available */
  LEE?: boolean;
  /** Indicates if ray with full point and negative direction is available */
  RFN?: boolean;
  /** Indicates if ray with empty point and negative direction is available */
  REN?: boolean;
  /** Indicates if ray with full point and positive direction is available */
  RFP?: boolean;
  /** Indicates if ray with empty point and positive direction is available */
  REP?: boolean;
}

/** Configuration for the domain */
export interface NumberLineGraph {
  /** display arrows */
  arrows?: NumberLineArrows;
  /** Indicates domain representation width */
  width: number;
  /** Height of the plotting area; the author sets it from the available types and the maximum number of elements */
  height?: number;
  /** Domain limits */
  domain: NumberLineDomain;
  /** Indicates the maximum number of correct response values */
  maxNumberOfPoints?: number;
  /** tick configuration */
  ticks: NumberLineTicks;
  /** the title under the graph */
  title?: string;
  /** Indicates if the exhibit mode is enabled */
  exhibitOnly?: boolean;
  /** Indicates the initial type of response */
  initialType?: NumberLineResponseType;
  /** Indicates the available types of responses */
  availableTypes?: NumberLineAvailableTypes;
  /** Array of initial responses */
  initialElements?: NumberLineResponse[];
  /** Indicates the fractional step between 2 labeled ticks, e.g. `1/4`; a fraction sets `fraction` and the major tick */
  labelStep?: string;
  /** Labels ticks as fractions; set from `labelStep` and the tick interval type */
  fraction?: boolean;
}

/** Feedback for one outcome */
export interface NumberLineFeedbackLevel {
  /** Indicates the feedback type: `none` shows nothing, `default` shows `default`, `custom` shows `custom` */
  type: 'custom' | 'default' | 'none';
  /** Indicates the feedback value */
  default?: string;
  /** Indicates the feedback custom value */
  custom?: string;
}

export interface NumberLineFeedback {
  /** Indicates the configuration for feedback when answer is correct */
  correct?: NumberLineFeedbackLevel;
  /** Indicates the configuration for feedback when answer is incorrect */
  incorrect?: NumberLineFeedbackLevel;
  /** Indicates the configuration for feedback when answer is partially correct */
  partial?: NumberLineFeedbackLevel;
}

/** Model Object for @pie-element/number-line */
export interface NumberLineModel extends PieModel {
  /** Feedback for student responses */
  feedback?: NumberLineFeedback;
  /** Array of responses; the controller defaults it to none */
  correctResponse?: NumberLineResponse[];
  /** Indicates if partial scoring is enabled */
  partialScoring?: boolean;
  /** Configuration for the domain; the default graph applies when absent */
  graph?: NumberLineGraph;
  /** The question prompt or item stem */
  prompt?: string;
  /** Indicates if the prompt is enabled */
  promptEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates rationale for the answer */
  rationale?: string;
  /** Indicates if Rationale are enabled */
  rationaleEnabled?: boolean;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates if the graph title editor is shown; the configuration's `title.enabled` applies when absent */
  titleEnabled?: boolean;
  /** If enabled, allows user to set width for number line. */
  widthEnabled?: boolean;
  /**
   * Indicates the editor's toolbar position which can be 'bottom' or 'top'
   * @default "bottom"
   */
  toolbarEditorPosition?: 'bottom' | 'top';
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
  /** Not read by this element: the environment's `accessibility.colorContrast` sets the contrast. `createDefaultModel()` writes it. */
  colorContrast?: string;
}

export interface NumberLineSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The objects the student plotted */
  answer?: NumberLineResponse[];
}

/** Hold default values for number line width like min, max and step. */
export interface NumberLineDimensions {
  /** Not read by this element */
  settings?: boolean;
  /** Not read by this element */
  label?: string;
  /** Not read by this element: the model's `widthEnabled` shows the width control */
  enabled?: boolean;
  /**
   * Minimum width the author can set
   * @default 200
   */
  min?: number;
  /**
   * Maximum width the author can set
   * @default 800
   */
  max?: number;
  /** Step of the width control */
  step?: number;
}

export interface NumberLineTitleConfiguration extends EditableHtmlPluginConfigure {
  /** The model's `titleEnabled` when the model does not set it */
  enabled?: boolean;
}

/** Config Object for @pie-element/number-line */
export interface NumberLineConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Configuration for the instruction; `label` is the text shown above the form */
  instruction?: ConfigurePropWithEnabled;
  /** Configuration for the prompt */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Rationale configuration */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the teacher instructions */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the title */
  title?: NumberLineTitleConfiguration;
  /** Hold default values for number line width like min, max and step. */
  numberLineDimensions?: NumberLineDimensions;
  /** Configuration for the author's spellcheck */
  spellCheck?: ConfigurePropWithEnabled;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /**
   * Holds numeric value for maximum number of elements allowed on number line.
   * @default 20
   */
  maxMaxElements?: number;
  /** Hide buttons in point configuration module (Select All / None). */
  hidePointConfigButtons?: boolean;
  /** Array of available tools for author. */
  availableTools?: NumberLineResponseType[];
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
  /** Not read by this element: it has no partial scoring control */
  settingsPartialScoring?: boolean;
}
