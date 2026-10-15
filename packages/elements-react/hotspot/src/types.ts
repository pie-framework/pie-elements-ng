import type {
  ConfigureLanguageOptions,
  ConfigureMathMLProp,
  ConfigureMaxImageDimensionsProp,
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  CustomAudioButton,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigureRequired,
  ExtraCSSRules,
  PieEnvironment,
  PieModel,
} from '@pie-element/shared-types';

export interface Point {
  /** the x position */
  x: number;
  /** the y position */
  y: number;
}

/** Fields every hotspot shape carries. */
export interface HotspotShapeBase {
  /** the id of the shape; a session answer refers to it */
  id: string;
  /** indicates if the shape is correct */
  correct?: boolean;
  /** Position of the shape in drawing order, which the author's undo uses */
  index?: number;
  /** Text appended to the shape's "Hotspot x of y" name for screen readers; `aria_label` and `aria-label` are read as well */
  ariaLabel?: string;
  aria_label?: string;
  'aria-label'?: string;
}

export interface Rectangle extends HotspotShapeBase {
  /** the height of the rectangle */
  height: number;
  /** the width of the rectangle */
  width: number;
  /** the x position of the rectangle */
  x: number;
  /** the y position of the rectangle */
  y: number;
}

export interface Polygon extends HotspotShapeBase {
  /** the points of the polygon */
  points: Point[];
}

export interface Circle extends HotspotShapeBase {
  /** the radius of the circle */
  radius: number;
  /** the x position of the circle's center */
  x: number;
  /** the y position of the circle's center */
  y: number;
}

export type HotspotShape = Rectangle | Polygon | Circle;

export interface Shapes {
  /** the rectangles of the shape */
  rectangles?: Rectangle[];
  /** the polygons of the shape */
  polygons?: Polygon[];
  /** the circles of the shape */
  circles?: Circle[];
}

export interface Dimensions {
  /** the height of the section */
  height: number;
  /** the width of the section */
  width: number;
}

/** Model for the `@pie-element/hotspot` Interaction */
export interface HotspotModel extends PieModel {
  /** The question prompt or item stem */
  prompt?: string;
  /** Indicates if the prompt is enabled */
  promptEnabled?: boolean;
  /** The image over which hotspots will be drawn */
  imageUrl?: string;
  /** The shapes/hotspots of the question */
  shapes: Shapes;
  /** Indicates if the item supports multiple correct answers */
  multipleCorrect?: boolean;
  /** Indicates if the item should use partial scoring */
  partialScoring?: boolean;
  /** The dimensions of the drawable section */
  dimensions?: Dimensions;
  /** The color that fills the hotspot */
  hotspotColor?: string;
  /** The color that fills a selected hotspot */
  selectedHotspotColor?: string;
  /**
   * The color of the outline a hotspot shows on hover
   * @default "black"
   */
  hoverOutlineColor?: string;
  /** The filling hotspot color options */
  hotspotList?: string[];
  /** The outline color of the hotspot */
  outlineColor?: string;
  /** The outline hotspot color options */
  outlineList?: string[];
  /** Indicates the value for rationale */
  rationale?: string | null;
  /** Indicates if Rationale are enabled */
  rationaleEnabled?: boolean;
  /** Not read by this element. Default models include it. */
  studentInstructionsEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /**
   * Indicates the width of the outline for a selection
   * @default 5
   */
  strokeWidth?: number;
  /** Indicates teacher instructions */
  teacherInstructions?: string | null;
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
  /** Not read by this element: the controller derives it from the environment's mode. Demo-app samples carry it. */
  disabled?: boolean;
  /** Not read by this element: the controller takes it from the environment. Demo-app samples carry it. */
  mode?: PieEnvironment['mode'];
}

/** Config Object for `@pie-element/hotspot` */
export interface HotspotConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Configuration for multiple correct */
  multipleCorrect?: ConfigureProp;
  /** Configuration for partial scoring */
  partialScoring?: ConfigureProp;
  /** Configuration for rationale */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Configuration for prompt */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Configuration for teacher instructions */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /**
   * Configuration for preserveAspectRatio. If enabled, then the image aspect ratio will be preserved.
   * It is enabled by default.
   */
  preserveAspectRatio?: ConfigurePropWithEnabled;
  /**
   * Minimum number of shapes
   * @default 2
   */
  minShapes?: number;
  /** Maximum number of shapes */
  maxShapes?: number;
  /** Maximum number of selected shapes in correct answer */
  maxSelections?: number;
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
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: the model's `promptEnabled` shows the prompt */
  showPrompt?: boolean;
  /** Not read by this element: `prompt.label` labels the prompt */
  promptLabel?: string;
  /** Not read by this element: `partialScoring.settings` shows the partial scoring control */
  settingsPartialScoring?: boolean;
}

/** A selected hotspot. */
export interface HotspotAnswer {
  /** id of the selected shape */
  id: string;
}

export interface HotspotSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The selected hotspots */
  answers?: HotspotAnswer[];
  /** How the learner made the last selection */
  selector?: 'Mouse' | 'Keyboard';
  /** Timestamp, in milliseconds, when auto-played prompt audio started playing */
  audioStartTime?: number;
  /** Timestamp, in milliseconds, when auto-played prompt audio finished playing */
  audioEndTime?: number;
  /** Milliseconds the learner waited for auto-played prompt audio to finish */
  waitTime?: number;
}
