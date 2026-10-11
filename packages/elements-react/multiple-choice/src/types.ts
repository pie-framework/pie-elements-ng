import type {
  ConfigureLanguageOptions,
  ConfigureMathMLProp,
  ConfigureMaxImageDimensionsProp,
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  CustomAudioButton,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigure,
  EditableHtmlPluginConfigureRequired,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/**
 * The type of feedback to use:
 *    `default` = a standard feedback message
 *    `custom` = a customized feedback message
 */
export interface Feedback {
  /** @default "default" */
  type: 'custom' | 'default' | 'none';
  /** Value for feedback */
  value?: string;
  /** Custom value for feedback */
  custom?: string;
}

export interface Choice {
  /** Indicates if the choice is correct */
  correct?: boolean;
  /** the value that will be stored if this choice is selected */
  value: string;
  /** the text label that will be presented to the user for this choice */
  label: string;
  /** Feedback shown for this choice in evaluate mode, when `feedbackEnabled` is set */
  feedback?: Feedback;
  /** Rationale for the Choice */
  rationale?: string;
}

/** Model for the Choice Interaction */
export interface MultipleChoiceModel extends PieModel {
  /** Indicates the choices are single or multiple selection */
  choiceMode?: 'checkbox' | 'radio';
  /**
   * What key should be displayed before choices: `none` displays no key.
   * @default "letters"
   */
  choicePrefix?: 'letters' | 'numbers' | 'none';
  /** The choice options for the question */
  choices: Choice[];
  /** The question prompt or item stem */
  prompt?: string;
  /** Determines if prompt should show */
  promptEnabled?: boolean;
  /**
   * Indicates the layout of choices for player
   * @default "vertical"
   */
  choicesLayout?: 'grid' | 'horizontal' | 'vertical';
  /**
   * Indicates the number of columns for the grid layout
   * @default 2
   */
  gridColumns?: number;
  /**
   * Indicates the editor's toolbar position which can be 'bottom' or 'top'
   * @default "bottom"
   */
  toolbarEditorPosition?: 'bottom' | 'top';
  /**
   * Indicates the background color for selected choices
   * @default "initial"
   */
  selectedAnswerBackgroundColor?: string;
  /**
   * Indicates the border color for selected choices
   * @default "initial"
   */
  selectedAnswerStrokeColor?: string;
  /**
   * Indicates the border width for selected choices if selectedAnswerBackgroundColor is set
   * @default "initial"
   */
  selectedAnswerStrokeWidth?: string;
  /**
   * Indicates the background color for choices on hover
   * @default "initial"
   */
  hoverAnswerBackgroundColor?: string;
  /**
   * Indicates the border color for choices on hover
   * @default "initial"
   */
  hoverAnswerStrokeColor?: string;
  /**
   * Indicates the border width for choices on hover if hoverAnswerBackgroundColor is set
   * @default "initial"
   */
  hoverAnswerStrokeWidth?: string;
  /**
   * Indicates the order of choices presented to user
   * if true, answer choices will be presented in the order they are defined in the model
   * If false, answer choices may be presented in a random order (depending upon the value of the lockChoiceOrder environment variable)
   */
  lockChoiceOrder?: boolean;
  /** Indicates that minimum selections that should be made (only for choice mode 'checkbox') */
  minSelections?: number;
  /** Indicates that maximum selections that should be made (only for choice mode 'checkbox') */
  maxSelections?: number;
  /** Indicates that the item should use partial scoring */
  partialScoring?: boolean;
  /** Indicates scoring type */
  scoringType?: 'auto' | 'rubric';
  /** Indicates student instructions */
  studentInstructions?: string;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Indicates if feedback is enabled */
  feedbackEnabled?: boolean;
  /** Messages for choices whose feedback type is `default` */
  defaultFeedback?: {
    /** @default "Correct" */
    correct?: string;
    /** @default "Incorrect" */
    incorrect?: string;
  };
  /** Indicates if Rationale are enabled */
  rationaleEnabled?: boolean;
  /** Not read by the element: each choice carries its own `rationale`. Default models include it. */
  rationale?: string;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates if Student Instructions are enabled */
  studentInstructionsEnabled?: boolean;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates if Accessibility Labels are enabled */
  accessibilityLabelsEnabled?: boolean;
  /** Indicates if Rubric is enabled */
  rubricEnabled?: boolean;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Indicates if the selection button and choice prefix should be positioned below the corresponding answer choice */
  isSelectionButtonBelow?: boolean;
  /** Indicates font size adjustment factor */
  fontSizeFactor?: number;
  /** Indicates if the audio for the prompt should autoplay */
  autoplayAudioEnabled?: boolean;
  /** Indicates if the audio should reach the end before the item can be marked as 'complete' */
  completeAudioEnabled?: boolean;
  /** Indicates if the audio should be replaced with a custom audio button */
  customAudioButton?: CustomAudioButton;
  /** Lets learners select a choice in gather mode by pressing its number or letter key */
  keyboardEventsEnabled?: boolean;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
  /** @deprecated Use `choicesLayout`; `false` reads as `horizontal`. */
  verticalMode?: boolean;
  /** @deprecated Caps the author at 9 choices; use the configuration's `maxAnswerChoices`. */
  limitChoicesNumber?: boolean;
}

export interface MaxImageDimensions extends ConfigureMaxImageDimensionsProp {
  /** Indicates the max dimension for images in choices */
  choices?: number;
}

/** Config Object for @pie-element/multiple-choice */
export interface MultipleChoiceConfiguration {
  /**
   * The number of empty choices to show in config view if no choice model is provided
   * @minimum 0
   * @default 0
   */
  answerChoiceCount?: number;
  /** Configuration for the button that adds a choice */
  addChoiceButton?: ConfigureProp;
  /** Toolbar plugins every editable field starts from; a field's own `inputConfiguration` overrides it */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Configuration for the choice editors */
  choices?: EditableHtmlPluginConfigure;
  /** Settings Panel control for the choice mode (radio / checkboxes) */
  choiceMode?: ConfigureProp;
  /** Settings Panel control for the choice prefix */
  choicePrefix?: ConfigureProp;
  /** Whether the author can delete choices */
  deleteChoice?: ConfigureProp;
  /** Settings Panel control for feedback */
  feedback?: ConfigureProp;
  /** Configuration for the prompt */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Settings Panel control for spellcheck; `enabled` is the default for new items */
  spellCheck?: ConfigurePropWithEnabled;
  /** Settings Panel control for the choices layout */
  choicesLayout?: ConfigureProp;
  /** Settings Panel control for the number of grid columns */
  gridColumns?: ConfigureProp;
  /** Settings Panel control for locking the choice order */
  lockChoiceOrder?: ConfigureProp;
  /** Settings Panel control for partial scoring */
  partialScoring?: ConfigureProp;
  /** Configuration for the choice rationales */
  rationale?: EditableHtmlPluginConfigureRequired;
  /** Settings Panel control for the scoring type */
  scoringType?: ConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Settings Panel control for student instructions */
  studentInstructions?: ConfigureProp;
  /** Configuration for the teacher instructions */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Not read by the authoring surface; the model's `toolbarEditorPosition` sets the position */
  toolbarEditorPosition?: ConfigureProp;
  /** Settings Panel control that toggles sequential choice labels */
  sequentialChoiceLabels?: ConfigurePropWithEnabled;
  /** Not read by this element */
  accessibility?: EditableHtmlPluginConfigure;
  /** Minimum number of answer choices */
  minAnswerChoices?: number;
  /** Maximum number of answer choices */
  maxAnswerChoices?: number;
  /** Maximum image width per field */
  maxImageWidth?: MaxImageDimensions;
  /** Maximum image height per field */
  maxImageHeight?: MaxImageDimensions;
  /** Settings Panel control for the rubric */
  withRubric?: ConfigureProp;
  /** MathML output and editing */
  mathMlOptions?: ConfigureMathMLProp;
  /** Settings Panel control for the language; `enabled` shows the language choices */
  language?: ConfigurePropWithEnabled;
  /**
   * Language choices configuration
   * Only available if language is enabled
   */
  languageChoices?: ConfigureLanguageOptions;
  /** Not read by this element: the model's `promptEnabled` shows the prompt */
  showPrompt?: boolean;
  /** Not read by this element: `prompt.label` labels the prompt */
  promptLabel?: string;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: `partialScoring.settings` shows the partial scoring control */
  settingsPartialScoring?: boolean;
}

export interface MultipleChoiceSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** Values of the selected choices */
  value?: string[];
  /** Choice values in the order they were shuffled for this learner, when choice order is not locked */
  shuffledValues?: string[];
}
