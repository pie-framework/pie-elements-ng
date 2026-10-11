import type {
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

/** Dimensions the editor should take */
export interface ExtendedTextEntryDimensions {
  /**
   * Width the editor should take. USE CSS-style definition; the author writes a number of pixels.
   */
  width?: number | string;
  /**
   * Height the editor should take. USE CSS-style definition; the author writes a number of pixels.
   */
  height?: number | string;
}

export interface PredefinedAnnotation {
  /** Indicates the value displayed in the annotation button */
  label: string;
  /** Indicates the annotation value */
  text: string;
  /** Indicates the type of the annotation */
  type: 'positive' | 'negative';
}

/**
 * Feedback shown when the response is submitted. The author's feedback selector changes `type` and keeps
 * the other message, so a `custom` type can arrive without `custom` text, and then the default message
 * shows.
 */
export interface ExtendedTextEntryFeedback {
  /** Indicates the feedback type */
  type: 'default' | 'none' | 'custom';
  /** Indicates the feedback value */
  default?: string;
  /** Indicates the feedback custom value */
  custom?: string;
}

/** Model for the `@pie-element/extended-text-entry` Interaction */
export interface ExtendedTextEntryModel extends PieModel {
  /**
   * Dimensions the editor should take
   * @default {"height":100,"width":500}
   */
  dimensions?: ExtendedTextEntryDimensions;
  /**
   * Indicates the math keypad the student gets when math input is enabled; the grade bands map to the
   * keypad's grade modes
   * @default "Grade 8 - HS"
   */
  equationEditor?:
    | 'miscellaneous'
    | 'statistics'
    | 'advanced-algebra'
    | 'geometry'
    | 'Grade 8 - HS'
    | 'Grade 6 - 7'
    | 'Grade 3 - 5'
    | 'Grade 1 - 2'
    | 'non-negative-integers'
    | 'integers'
    | 'decimals'
    | 'fractions'
    | 'item-authoring';
  /** Extra keys added to the math keypad */
  customKeys?: string[];
  /** Feedback configuration */
  feedback?: ExtendedTextEntryFeedback;
  /**
   * Whether a control to allow insertion of math forumulas should be displayed
   * @default false
   */
  mathInput?: boolean;
  /**
   * Whether a control to allow insertion of spanish characters should be displayed
   * @default false
   */
  spanishInput?: boolean;
  /**
   * Whether a control to allow insertion of special characters should be displayed
   * @default false
   */
  specialInput?: boolean;
  /** Not read by this element: the author toggles multiple parts on the configuration's `multiple.enabled` */
  multiple?: boolean;
  /** The question prompt */
  prompt?: string;
  /**
   * Indicates if the prompt is enabled
   * @default true
   */
  promptEnabled?: boolean;
  /** Not read by this element: it renders no student instructions */
  studentInstructions?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /**
   * Indicates if the annotations are enabled
   * @default false
   */
  annotationsEnabled?: boolean;
  /**
   * Indicates if Feedback is enabled
   * @default false
   */
  feedbackEnabled?: boolean;
  /** Not read by this element: the default models carry it, and nothing renders a rationale */
  rationale?: string;
  /**
   * Not read by this element: the default models carry it, and nothing renders a rationale
   * @default true
   */
  rationaleEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /**
   * Indicates if spellcheck is disabled for the player; the player spellchecks only when this is false
   * @default true
   */
  playerSpellCheckDisabled?: boolean;
  /**
   * Indicates if the player pastes plain text only
   * @default false
   */
  playerPasteFormattingDisabled?: boolean;
  /**
   * Indicates if Student Instructions are enabled; the author shows the toggle, and nothing renders them
   * @default true
   */
  studentInstructionsEnabled?: boolean;
  /**
   * Indicates if Teacher Instructions are enabled
   * @default true
   */
  teacherInstructionsEnabled?: boolean;
  /**
   * Indicates the editor's toolbar position which can be 'bottom' or 'top'
   * @default "bottom"
   */
  toolbarEditorPosition?: 'bottom' | 'top';
  /** Indicates the predefined annotations for the annotation menu */
  predefinedAnnotations?: PredefinedAnnotation[];
  /**
   * Indicates the editor's toolbar position for the player, which can be 'bottom' or 'top'
   * @default "bottom"
   */
  playersToolbarPosition?: 'bottom' | 'top';
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

export interface ConfigureWithForceProp extends ConfigureProp {
  /**
   * Indicates the value for the toggle;
   * if true:
   * - this property will not be visible in Settings Panel (settings will become automatically false)
   * - the model property afferent to it will become automatically true
   */
  forceEnabled?: boolean;
}

/** Config Object for `@pie-element/extended-text-entry` */
export interface ExtendedTextEntryConfiguration {
  /** Annotations configuration */
  annotations?: ConfigureProp;
  /** Equation Editor configuration; `enabled` shows the equation editor choice */
  equationEditor?: ConfigurePropWithEnabled;
  /** Feedback configuration */
  feedback?: ConfigureProp;
  /** Math Input configuration; `enabled` is not read */
  mathInput?: ConfigurePropWithEnabled;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Spanish Input configuration; `enabled` is not read */
  spanishInput?: ConfigurePropWithEnabled;
  /** Special Input configuration; `enabled` is not read */
  specialInput?: ConfigurePropWithEnabled;
  /** Multiple Parts configuration; the settings toggle writes `enabled`, which nothing else reads */
  multiple?: ConfigurePropWithEnabled;
  /** Student Instructions configuration */
  studentInstructions?: ConfigureProp;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Prompt configuration */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Configuration for the player's spellcheck; `enabled` is not read */
  playerSpellCheck?: ConfigurePropWithEnabled;
  /** Configuration for the player's plain-text paste */
  playerPasteFormatting?: ConfigureProp;
  /** Dimensions configuration */
  dimensions?: ConfigureProp;
  /** Maximum image width for input fields */
  maxImageWidth?: ConfigureMaxImageDimensionsProp;
  /** Maximum image height for input fields */
  maxImageHeight?: ConfigureMaxImageDimensionsProp;
  /** Rubric configuration - only relevant in environments that use pie-player-components */
  withRubric?: ConfigureWithForceProp;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: the model's `promptEnabled` shows the prompt */
  showPrompt?: boolean;
  /** Not read by this element: `prompt.label` labels the prompt */
  promptLabel?: string;
  /** Not read by this element: it has no partial scoring */
  settingsPartialScoring?: boolean;
}

/** An annotation an instructor placed on the student's response */
export interface ExtendedTextEntryAnnotation {
  /** Identifier of the annotation */
  id: string;
  /** The annotation text shown beside the response */
  label: string;
  /** Indicates the type of the annotation */
  type: 'positive' | 'negative';
  /** The annotated text */
  quote: string;
  /** Start of the annotated text, as a character offset in the response's text content */
  start: number;
  /** End of the annotated text, as a character offset in the response's text content */
  end: number;
}

export interface ExtendedTextEntrySession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The student's response, as HTML */
  value?: string;
  /** The instructor's annotations on the response */
  annotations?: ExtendedTextEntryAnnotation[];
  /** The instructor's overall comment on the response */
  comment?: string;
}
