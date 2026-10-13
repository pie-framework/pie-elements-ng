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

export interface Dimensions {
  /** the height of the section */
  height: number;
  /** the width of the section */
  width: number;
}

/** Rubric configuration with a forced value. */
export interface ConfigureWithForceProp extends ConfigureProp {
  /**
   * Indicates the value for the toggle;
   * if true:
   * - this property will not be visible in Settings Panel (settings will become automatically false)
   * - the model property afferent to it will become automatically false
   */
  forceEnabled?: boolean;
}

/** Model for the `@pie-element/drawing-response` Interaction */
export interface DrawingResponseModel extends PieModel {
  /** The question prompt or item stem */
  prompt?: string;
  /** Indicates if the prompt is enabled */
  promptEnabled?: boolean;
  /** The image over which shapes, patterns and texts will be added */
  imageUrl?: string;
  /** The dimensions of the image */
  imageDimensions?: Dimensions;
  /** Not read by this element. */
  studentInstructions?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Not read by this element. Default models include it. */
  studentInstructionsEnabled?: boolean;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates if Background Image is enabled */
  backgroundImageEnabled?: boolean;
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

/** Config Object for `@pie-element/drawing-response` */
export interface DrawingResponseConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Configuration for the background image toggle; `enabled` is not read */
  backgroundImage?: ConfigurePropWithEnabled;
  /** Not read by this element: drawing responses are scored manually */
  partialScoring?: ConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Not read by this element. */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Prompt configuration */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Maximum image width for input fields */
  maxImageWidth?: ConfigureMaxImageDimensionsProp;
  /** Maximum image height for input fields */
  maxImageHeight?: ConfigureMaxImageDimensionsProp;
  /** Rubric configuration - only relevant in environments that use pie-player-components */
  withRubric?: ConfigureWithForceProp;
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
  /** Not read by this element: the prompt field is labelled "Item Stem" */
  promptLabel?: string;
  /** Not read by this element: drawing responses are scored manually */
  settingsPartialScoring?: boolean;
}

/** A shape the learner drew, serialized from its drawing tool. */
export interface DrawingResponseDrawable {
  /** The tool that drew the shape */
  type: 'FreePathDrawable' | 'LineDrawable' | 'RectangleDrawable' | 'CircleDrawable' | 'EraserDrawable';
  /** x position where drawing started */
  startx?: number;
  /** y position where drawing started */
  starty?: number;
  /** ISO timestamp of when the shape was drawn; it orders undo */
  createdAt?: string;
  /** Fill color of rectangles and circles */
  fillColor?: string;
  /** Outline color of rectangles and circles */
  outlineColor?: string;
  /** Color applied with the paint tool */
  paintColor?: string;
  /** Flat x, y coordinate list of free paths and eraser strokes */
  points?: number[];
  /** x offset after the shape was dragged */
  posX?: number;
  /** y offset after the shape was dragged */
  posY?: number;
  /** End x of lines and rectangles; center x of circles */
  x?: number;
  /** End y of lines and rectangles; center y of circles */
  y?: number;
  /** Width of rectangles */
  width?: number;
  /** Height of rectangles */
  height?: number;
  /** Radius of circles */
  radius?: number;
}

/** A text box the learner added. It also carries the Konva text node's attributes (scale, rotation, font size). */
export interface DrawingResponseText {
  /** Identifier of the text box */
  id: string;
  /** Always "text-entry" */
  type?: 'text-entry';
  /** The text shown on the canvas */
  text?: string;
  /** The value of the text box's editor */
  value?: string;
  /** Placeholder shown before the learner edits the text box */
  label?: string;
  /** Indicates the text box still shows its placeholder */
  isDefault?: boolean;
  /** x position */
  x?: number;
  /** y position */
  y?: number;
  /** Width of the text box */
  width?: number;
  /** ISO timestamp of when the text box was added; it orders undo */
  createdAt?: string;
  /** Indicates the text node is shown */
  textVisible?: boolean;
  /** Indicates the resize handles are shown */
  transformerVisible?: boolean;
  /** Indicates the editor is shown */
  textareaVisible?: boolean;
}

export interface DrawingResponseSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The shapes the learner drew */
  drawables?: DrawingResponseDrawable[];
  /** The text boxes the learner added */
  texts?: DrawingResponseText[];
  /** Width of the drawing area when the session was saved; delivery restores the drawing area to it */
  width?: number;
}
