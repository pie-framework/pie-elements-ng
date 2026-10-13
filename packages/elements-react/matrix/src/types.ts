import type {
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  EditableHtmlConfigureProp,
  EditableHtmlPluginConfigureRequired,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/** The preset that labels the columns; changing the number of rows or columns sets `custom` */
export type MatrixLabelType = 'agreement' | 'frequency' | 'yesNo' | 'importance' | 'likelihood' | 'like' | 'custom';

/** Model for the Matrix Interaction */
export interface MatrixModel extends PieModel {
  /** Indicates the row labels */
  rowLabels?: string[];
  /** Indicates the column labels */
  columnLabels?: string[];
  /** Indicates the matrix values: the score of each cell, keyed `row-column` with 0-based indices; a cell without a value scores 0 */
  matrixValues?: Record<string, number>;
  /** Indicates the matrix label type */
  labelType?: MatrixLabelType;
  /** The question prompt or item stem */
  prompt?: string;
  /** Not read by this element: the prompt always shows */
  promptEnabled?: boolean;
  /** Indicates teacher instructions */
  teacherInstructions?: string;
  /** Indicates if Teacher Instructions are enabled */
  teacherInstructionsEnabled?: boolean;
  /** Indicates if spellcheck is enabled for the author. Default value is true */
  spellCheckEnabled?: boolean;
  /** Indicates scoring type */
  scoringType?: 'auto' | 'rubric';
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
}

/** Config Object for `@pie-element/matrix` */
export interface MatrixConfiguration {
  /**
   * Base editable html input configuration regarding plugins that are enabled/disabled
   * E.g. audio, video, image
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Configuration for the author's spellcheck; `enabled` is not read, the model's `spellCheckEnabled` turns it on */
  spellCheck?: ConfigurePropWithEnabled;
  /** Teacher Instructions configuration */
  teacherInstructions?: EditableHtmlPluginConfigureRequired;
  /** Configuration for the prompt */
  prompt?: EditableHtmlPluginConfigureRequired;
  /** Scoring Type configuration */
  scoringType?: ConfigureProp;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: the prompt always shows */
  showPrompt?: boolean;
  /** Not read by this element: `prompt.label` labels the prompt */
  promptLabel?: string;
  /** Not read by this element, which has no partial scoring */
  settingsPartialScoring?: boolean;
}

export interface MatrixSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The chosen cell of each answered row, keyed `row-column`, with that cell's value from the model's `matrixValues` (0 when it has none) */
  value?: Record<string, number>;
}
