import type {
  ConfigureLanguageOptions,
  ConfigureMathMLProp,
  ConfigureMaxImageDimensionsProp,
  ConfigurePropWithEnabled,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigureRequired,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/** One passage; the student sees one tab per passage */
export interface PassageEntry {
  /** The title of the passage; a passage without a title is labelled "Passage <n>" */
  title?: string;
  /** The subtitle of the passage */
  subtitle?: string;
  /** The author of the passage */
  author?: string;
  /** The content of the passage */
  text?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Overrides the model's `teacherInstructionsEnabled` for this passage */
  teacherInstructionsEnabled?: boolean;
  /** Overrides the model's `titleEnabled` for this passage */
  titleEnabled?: boolean;
  /** Overrides the model's `subtitleEnabled` for this passage */
  subtitleEnabled?: boolean;
  /** Overrides the model's `authorEnabled` for this passage */
  authorEnabled?: boolean;
  /** Overrides the model's `textEnabled` for this passage */
  textEnabled?: boolean;
}

/** Model for the `@pie-element/passage` */
export interface PassageModel extends PieModel {
  /** The passages, in tab order */
  passages: PassageEntry[];
  /**
   * Indicates if Teacher Instructions are enabled
   * @default true
   */
  teacherInstructionsEnabled?: boolean;
  /**
   * Indicates if title is enabled
   * @default true
   */
  titleEnabled?: boolean;
  /**
   * Indicates if subtitle is enabled
   * @default true
   */
  subtitleEnabled?: boolean;
  /**
   * Indicates if text is enabled
   * @default true
   */
  textEnabled?: boolean;
  /**
   * Indicates if author is enabled. The author's default model sets true.
   * @default false
   */
  authorEnabled?: boolean;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
}

/** Maximum image dimensions for the passage's editable fields */
export interface PassageMaxImageDimensionsProp extends ConfigureMaxImageDimensionsProp {
  /** Indicates the max dimension for images in the passage text */
  text?: number;
}

/** Config Object for `@pie-element/passage` */
export interface PassageConfiguration {
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Title configuration */
  title?: EditableHtmlPluginConfigureRequired;
  /** Subtitle configuration */
  subtitle?: EditableHtmlPluginConfigureRequired;
  /** Author configuration */
  author?: EditableHtmlPluginConfigureRequired;
  /** Text configuration */
  text?: EditableHtmlPluginConfigureRequired;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Maximum image width for input fields */
  maxImageWidth?: PassageMaxImageDimensionsProp;
  /** Maximum image height for input fields */
  maxImageHeight?: PassageMaxImageDimensionsProp;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Language configuration */
  language?: ConfigurePropWithEnabled;
  /**
   * Language choices configuration
   * Only available if language is enabled
   */
  languageChoices?: ConfigureLanguageOptions;
  /** ability to include a second passage */
  additionalPassage?: ConfigurePropWithEnabled;
}

/** The passage records no response; its session carries only its identity */
export interface PassageSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
}
