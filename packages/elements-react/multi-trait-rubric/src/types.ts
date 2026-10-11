import type {
  ConfigureMathMLProp,
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigure,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

export interface Trait {
  /** Trait name */
  name: string;
  /** Trait standards */
  standards: string[];
  /** Trait description */
  description: string;
  /** Score point descriptors. Starting from 0 to max. */
  scorePointsDescriptors: string[];
}

export interface Scale {
  /** Indicates max limit for scoring points */
  maxPoints: number;
  /** Score labels. Starting from 0 to max. */
  scorePointsLabels: string[];
  /** Trait label */
  traitLabel: string;
  /** Traits */
  traits: Trait[];
}

/** Model for the MultiTraitRubric Interaction */
export interface MultiTraitRubricModel extends PieModel {
  /**
   * Indicates if half scoring is enabled
   * @default false
   */
  halfScoring?: boolean;
  /**
   * Indicates if point labels should be shown
   * @default true
   */
  pointLabels?: boolean;
  /**
   * Indicates if should be visible to student
   * @default true
   */
  visibleToStudent?: boolean;
  /**
   * Indicates if description should be shown
   * @default false
   */
  description?: boolean;
  /**
   * Indicates if standards should be shown
   * @default false
   */
  standards?: boolean;
  /**
   * Indicates if scoring should start at 0 or 1
   * @default false
   */
  excludeZero?: boolean;
  /**
   * Indicates if spellcheck is enabled for the author. Default value is true
   * @default true
   */
  spellCheckEnabled?: boolean;
  /**
   * Shows the max points dropdown of each scale to the author
   * @default true
   */
  maxPointsEnabled?: boolean;
  /**
   * Shows the author's Add Scale button
   * @default true
   */
  addScaleEnabled?: boolean;
  /** scales */
  scales: Scale[];
  /** Renders the rubric expanded, without the show/hide toggle; print sets it */
  animationsDisabled?: boolean;
  /** Hides the scales' scroll arrows; print sets it */
  arrowsDisabled?: boolean;
  /** Language of the rubric's labels, e.g. "en-US" or "es-ES" */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
}

export interface DialogContent {
  /** Dialog box title */
  title?: string;
  /** Dialog box text */
  text?: string;
}

/** Config Object for `@pie-element/multi-trait-rubric` */
export interface MultiTraitRubricConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Expanded input configurations: only `inputConfiguration` is read, for the standards, description and score point descriptor editors */
  expandedInput?: EditableHtmlPluginConfigure;
  /** Label input configurations: only `inputConfiguration` is read, for the trait name, trait label and score point label editors */
  labelInput?: EditableHtmlPluginConfigure;
  /** Not read by the element: the dialog shows its built-in text */
  excludeZeroDialogBoxContent?: DialogContent;
  /** Not read by the element: the dialog shows its built-in text */
  includeZeroDialogBoxContent?: DialogContent;
  /** Not read by the element: the dialog shows its built-in text */
  deleteScaleDialogBoxContent?: DialogContent;
  /** Not read by the element: the dialog shows its built-in text */
  maxPointsDialogBoxContent?: DialogContent;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for Excluding Zero Column */
  showExcludeZero?: ConfigureProp;
  /** Configuration for Showing Score Point Labels */
  showScorePointLabels?: ConfigureProp;
  /** Configuration for Showing Description */
  showDescription?: ConfigureProp;
  /** Configuration for Showing Multi-trait-rubric to Students */
  showVisibleToStudent?: ConfigureProp;
  /** Configuration for Showing Half Scoring Indicator */
  showHalfScoring?: ConfigureProp;
  /** Configuration for the author's spellcheck: `enabled` is not read, the model's `spellCheckEnabled` sets it */
  spellCheck?: ConfigurePropWithEnabled;
  /** Configuration for showing the Standards column */
  showStandards?: ConfigureProp;
  /** Configuration for showing the Level Tag Input; `enabled` shows it */
  showLevelTagInput?: ConfigurePropWithEnabled;
  /** Configuration for allowing drag & drop per traits; `enabled` allows it */
  dragAndDrop?: ConfigurePropWithEnabled;
  /** Configuration for the Settings Panel toggle of the model's `maxPointsEnabled` */
  showMaxPoint?: ConfigureProp;
  /** Configuration for the Settings Panel toggle of the model's `addScaleEnabled` */
  addScale?: ConfigureProp;
  /** How large (in px) should multi-trait-rubric be; without it the rubric takes the container's width */
  width?: string;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /**
   * Minimum number of traits
   * @default 1
   */
  minNoOfTraits?: number;
  /**
   * Maximum number of traits
   * @default 10
   */
  maxNoOfTraits?: number;
  /**
   * Minimum number of scales
   * @default 1
   */
  minNoOfScales?: number;
  /**
   * Maximum number of scales
   * @default 10
   */
  maxNoOfScales?: number;
  /**
   * The default trait label for new created scales.
   * If it's not defined, it will default to the label of the first trait.
   * @default "Trait"
   */
  defaultTraitLabel?: string;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /**
   * Indicates the max limit for scoring points
   * @default 10
   */
  maxMaxPoints?: number;
}

/** The multi-trait rubric writes nothing into its session. */
export interface MultiTraitRubricSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
}
