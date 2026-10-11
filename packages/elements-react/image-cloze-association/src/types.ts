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
  PieModel,
} from '@pie-element/shared-types';

/** Position of the possible responses relative to the image */
export type ImageClozeAssociationChoicesPosition = 'top' | 'bottom' | 'left' | 'right';

export interface ImageClozeAssociationResponseContainer {
  /** The x coordinate of the response container, as a percentage of the image width */
  x?: number;
  /** The y coordinate of the response container, as a percentage of the image height */
  y?: number;
  /** The width of the response container, as a percentage of the image width (e.g. `"35.7%"`) */
  width?: string;
  /** The height of the response container, as a percentage of the image height (e.g. `"23.6%"`) */
  height?: string;
}

/** The correct images of one response container */
export interface ImageClozeAssociationContainerResponse {
  /** An array containing strings that are img tags */
  images?: string[];
}

export interface ImageClozeAssociationValidResponse {
  /** The score of the response */
  score?: number;
  /** The correct images per response container, in response container order */
  value?: ImageClozeAssociationContainerResponse[];
}

export interface ImageClozeAssociationValidation {
  /** The valid response */
  validResponse?: ImageClozeAssociationValidResponse;
  /** List of alternate responses */
  altResponses?: ImageClozeAssociationValidResponse[];
  /**
   * Snake-case form of `validResponse`, which the controller reads through camelizing every key;
   * the instructor's correct-response session reads only this form
   */
  valid_response?: ImageClozeAssociationValidResponse;
  /** Snake-case form of `altResponses`, which the controller reads through camelizing every key */
  alt_responses?: ImageClozeAssociationValidResponse[];
}

export interface ImageClozeAssociationImage {
  /** The url of the image */
  src?: string;
  /** The width of the image */
  width?: number;
  /** The height of the image */
  height?: number;
}

export interface ImageClozeAssociationUiStyle {
  /**
   * Position of the possible responses relative to the image
   * @default "bottom"
   */
  possibilityListPosition?: ImageClozeAssociationChoicesPosition;
  /** Not read by the element */
  fontsize?: string;
}

/** Snake-case form of the style options, which the controller reads through camelizing every key */
export interface ImageClozeAssociationSnakeCaseUiStyle {
  /**
   * Position of the possible responses relative to the image
   * @default "bottom"
   */
  possibility_list_position?: ImageClozeAssociationChoicesPosition;
  /** Not read by the element */
  fontsize?: string;
}

/**
 * Model for the `@pie-element/image-cloze-association` Interaction
 *
 * The controller camelizes every key before reading the model, so a snake-case key reads as its
 * camel-case form. The snake-case keys declared here are those that authored models carry.
 */
export interface ImageClozeAssociationModel extends PieModel {
  /** Indicates in answer choices should have a transparent background. Default value is undefined. */
  answerChoiceTransparency?: boolean;
  /** The question prompt or item stem */
  prompt?: string;
  /** Indicates rationale value; instructors see it in view and evaluate modes */
  rationale?: string;
  /** Indicates if Rationale is enabled. Not read by the element: the rationale shows whenever it is set */
  rationaleEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates teacher instructions value; instructors see it in view and evaluate modes */
  teacherInstructions?: string;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates if Student Instructions are enabled. Not read by the element */
  studentInstructionsEnabled?: boolean;
  /** The image over which the responses will be dragged */
  image?: ImageClozeAssociationImage;
  /**
   * List of the response containers
   * The response containers are the areas where the images are dragged in
   */
  responseContainers?: ImageClozeAssociationResponseContainer[];
  /** The question stimulus */
  stimulus?: string;
  /** List of img tags that are the possible responses */
  possibleResponses?: string[];
  /** The validation - correct responses, alternate responses and score */
  validation?: ImageClozeAssociationValidation;
  /** Indicates if the item should use partial scoring */
  partialScoring?: boolean;
  /**
   * Indicates how many responses can be placed in a response container
   * @default 1
   */
  maxResponsePerZone?: number;
  /** Indicates if duplicate responses are allowed */
  duplicateResponses?: boolean;
  /** Indicates if the response containers should have a dashed border */
  showDashedBorder?: boolean;
  /** Indicates if Rubric is enabled */
  rubricEnabled?: boolean;
  /** Indicates if the possible responses have to be shuffled in the player */
  shuffle?: boolean;
  /** Indicates that the possible responses keep their authored order even when `shuffle` is set */
  lockChoiceOrder?: boolean;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Indicates style options of the component */
  uiStyle?: ImageClozeAssociationUiStyle;
  /** Indicates the background color of the response area */
  responseAreaFill?: string;
  /** Indicates padding of the response container */
  responseContainerPadding?: string;
  /** Indicates the padding of the image drop target */
  imageDropTargetPadding?: string;
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
  /** Snake-case form of `possibleResponses` */
  possible_responses?: string[];
  /** Snake-case form of `responseContainers` */
  response_containers?: ImageClozeAssociationResponseContainer[];
  /** Snake-case form of `uiStyle` */
  ui_style?: ImageClozeAssociationSnakeCaseUiStyle;
  /** Snake-case form of `duplicateResponses` */
  duplicate_responses?: boolean;
  /**
   * Snake-case form of `maxResponsePerZone`
   * @default 1
   */
  max_response_per_zone?: number;
  /** Not read by the element: the demo model carries it */
  response_container?: Record<string, unknown>;
  /** Not read by the element: the demo model carries it */
  metadata?: Record<string, unknown>;
  /** Not read by the element: the demo model carries it */
  is_math?: boolean;
  /** Not read by the element: the demo model carries it */
  response_id?: string;
  /** Not read by the element: the demo model carries it */
  metadatadistractor_rationale?: string;
}

/**
 * Config Object for `@pie-element/image-cloze-association`
 */
export interface ImageClozeAssociationConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Maximum image width for input fields */
  maxImageWidth?: ConfigureMaxImageDimensionsProp;
  /** Maximum image height for input fields */
  maxImageHeight?: ConfigureMaxImageDimensionsProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck; `enabled` is not read */
  spellCheck?: ConfigurePropWithEnabled;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
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
  /** Not read by this element */
  showPrompt?: boolean;
  /** Not read by this element */
  promptLabel?: string;
  /** Not read by this element */
  settingsPartialScoring?: boolean;
}

/** An image the learner placed in a response container */
export interface ImageClozeAssociationAnswer {
  /** Identifier of the placement; the instructor's correct-response session leaves it out */
  id?: string;
  /** The img tag of the placed possible response */
  value: string;
  /** Index of the response container the image is placed in */
  containerIndex: number;
}

export interface ImageClozeAssociationSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The images the learner placed */
  answers?: ImageClozeAssociationAnswer[];
  /** How the learner placed the images; the delivery writes `Mouse` */
  selector?: string;
  /** Possible responses in the order they were shuffled for this learner, when their order is not locked */
  shuffledValues?: string[];
}
