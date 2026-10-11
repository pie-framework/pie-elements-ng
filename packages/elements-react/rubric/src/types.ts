import type {
  ConfigureMathMLProp,
  ConfigureProp,
  ContentDimensions,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigure,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/** Model for the RubricPie Interaction */
export interface RubricModel extends PieModel {
  /**
   * Indicates the score points labels. Starting from 0 to max
   * @default ["", "", "", ""]
   */
  points?: string[];
  /**
   * Indicates the sample answers labels. Starting from 0 to max.
   * `null` hides the sample answer of that point; an empty string shows an empty one.
   * @default [null, null, null, null]
   */
  sampleAnswers?: (string | null)[];
  /**
   * Indicates the max limit for scoring points
   * @default 3
   */
  maxPoints?: number;
  /**
   * Indicates if point 0 should be excluded
   * @default false
   */
  excludeZero?: boolean;
  /** Not read by the element: legacy schemas spell `excludeZero` as `excludeZeros`. */
  excludeZeros?: boolean;
  /**
   * Shows the author's control for excluding point 0
   * @default true
   */
  excludeZeroEnabled?: boolean;
  /**
   * Shows the author's max points dropdown
   * @default true
   */
  maxPointsEnabled?: boolean;
  /** Indicates that rubricInstruction is enabled */
  rubriclessInstructionEnabled?: boolean;
  /** Scoring instruction of a rubricless rubric */
  rubriclessInstruction?: string;
  /** Renders the rubric expanded, without the show/hide toggle; print sets it */
  animationsDisabled?: boolean;
  /** Language of the rubric's labels, e.g. "en-US" or "es-ES" */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
}

/** Config Object for `@pie-element/rubric` */
export interface RubricConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Ability to exclude zero configuration */
  showExcludeZero?: ConfigureProp;
  /** Show max points dropdown configuration */
  showMaxPoint?: ConfigureProp;
  /** How large can the rubric be */
  width?: string;
  /** Configuration for editable-html */
  mathMlOptions?: ConfigureMathMLProp;
  /**
   * Indicates the max limit for scoring points; the dropdown stops at 100
   * @default 9
   */
  maxMaxPoints?: number;
  /** Indicates that it is rubricless: the author edits max points and an instruction, without point descriptors */
  rubricless?: boolean;
  /**
   * Scoring instruction for rubricless: `settings` and `label` set its Settings Panel toggle.
   * Its editor takes `baseInputConfiguration`; `inputConfiguration` is not read.
   */
  rubriclessInstruction?: EditableHtmlPluginConfigure;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: the rubric has no prompt */
  showPrompt?: boolean;
  /** Not read by this element: the rubric has no prompt */
  promptLabel?: string;
  /** Not read by this element: the rubric is not scored */
  settingsPartialScoring?: boolean;
}

/** The rubric writes nothing into its session. */
export interface RubricSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
}
