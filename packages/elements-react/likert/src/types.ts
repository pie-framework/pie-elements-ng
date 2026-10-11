import type {
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigure,
  EditableHtmlPluginConfigureRequired,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/** Number of points on the likert scale */
export type LikertScale = 'likert3' | 'likert5' | 'likert7';

/** Label set of the likert scale */
export type LikertType = 'agreement' | 'frequency' | 'yesNo' | 'importance' | 'likelihood' | 'like';

/** Layout of the likert choices */
export type LikertOrientation = 'horizontal' | 'vertical';

export interface LikertChoice {
  /** the value that will be stored if this likert choice is selected */
  value: number;
  /** the text label that will be presented to the user for this likert choice */
  label: string;
}

/** Model for the Likert Interaction */
export interface LikertModel extends PieModel {
  /**
   * Indicates the likert scale
   * @default "likert3"
   */
  likertScale?: LikertScale;
  /**
   * Indicates the likert type
   * @default "agreement"
   */
  likertType?: LikertType;
  /**
   * Indicates the likert orientation
   * @default "horizontal"
   */
  likertOrientation?: LikertOrientation;
  /** The choice options for the question */
  choices: LikertChoice[];
  /**
   * The question prompt or item stem
   * @default ""
   */
  prompt?: string;
  /** Not read by the element: the prompt always shows. Default models include it. */
  promptEnabled?: boolean;
  /**
   * Indicates teacher instructions
   * @default ""
   */
  teacherInstructions?: string;
  /**
   * Indicates if Teacher Instructions are enabled
   * @default true
   */
  teacherInstructionsEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates scoring type; the Settings Panel sets it when the configuration's `scoringType.settings` is set. The likert is not scored. */
  scoringType?: 'auto' | 'rubric';
  /** Language of the teacher instructions toggle labels, e.g. "en-US" or "es-ES" */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
}

/** Config Object for `@pie-element/likert` */
export interface LikertConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Configuration for prompt; `settings` is not read: the prompt always shows */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck: `enabled` is not read, the model's `spellCheckEnabled` sets it */
  spellCheck?: ConfigurePropWithEnabled;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Configuration for likert choice: only `inputConfiguration` is read, for the choice label editors */
  likertChoice?: EditableHtmlPluginConfigure;
  /** Settings Panel control for the scoring type */
  scoringType?: ConfigureProp;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: the prompt always shows */
  showPrompt?: boolean;
  /** Not read by this element: `prompt.label` labels the prompt */
  promptLabel?: string;
  /** Not read by this element: the likert is not scored */
  settingsPartialScoring?: boolean;
}

export interface LikertSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The `value` of the selected choice */
  value?: number;
}
