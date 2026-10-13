import type { ConfigureProp, PieModel } from '@pie-element/shared-types';

/** Model for the simple cloze (text entry) interaction */
export interface SimpleClozeModel extends PieModel {
  /** The question prompt or item stem */
  prompt?: string;
  /**
   * Determines if prompt should show
   * @default true
   */
  promptEnabled?: boolean;
  /**
   * The answer key (HTML or plain text). It is compared with the response as plain text, ignoring
   * case and extra spaces; a key with no text matches nothing.
   */
  correctAnswer?: string;
  /** Shown to instructors in view and evaluate mode. */
  teacherInstructions?: string;
  /**
   * `false` hides `teacherInstructions`
   * @default true
   */
  teacherInstructionsEnabled?: boolean;
  /** The learner-facing strings' language, as `@pie-lib/translator` reads it (`en_US`, `es_ES`, …). */
  language?: string;
}

/** A Settings Panel control for an editable field. */
export interface SimpleClozeFieldConfigure extends ConfigureProp {
  /** Indicates if the item is required and the value cannot be empty */
  required?: boolean;
}

/** Config Object for `@pie-element/simple-cloze` */
export interface SimpleClozeConfiguration {
  /**
   * Settings Panel control for the prompt; `label` titles the prompt editor, and `required` makes
   * `validate()` reject an empty prompt
   */
  prompt?: SimpleClozeFieldConfigure;
  /** Settings Panel control for teacher instructions; `label` titles the editor */
  teacherInstructions?: ConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
}

export interface SimpleClozeSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The learner's typed answer. */
  value?: string;
}
