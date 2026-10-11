import type {
  MultipleChoiceConfiguration,
  MultipleChoiceModel,
  MultipleChoiceSession,
} from '@pie-element/multiple-choice';
import type {
  ConfigureLanguageOptions,
  ConfigureProp,
  ConfigurePropWithEnabled,
  ContentDimensions,
  EditableHtmlConfigureProp,
  ExtraCSSRules,
  PieModel,
} from '@pie-element/shared-types';

/**
 * One part of the EBSR item: a multiple-choice question. The item's own `id`, `element` and
 * accessibility catalogs stand for both parts.
 */
export type EbsrPart = Omit<MultipleChoiceModel, 'id' | 'element' | 'accessibilityCatalogs'>;

/** Model for the EBSR Interaction */
export interface EbsrModel extends PieModel {
  /** First part of EBSR */
  partA: EbsrPart;
  /** Second part of EBSR */
  partB: EbsrPart;
  /**
   * Indicates if part labels should be displayed
   * @default true
   */
  partLabels?: boolean;
  /**
   * Indicates what type should have part labels if they are enabled
   * @default "Letters"
   */
  partLabelType?: 'Letters' | 'Numbers';
  /** Indicates if partial scoring should be used */
  partialScoring?: boolean;
  /** Indicates scoring type */
  scoringType?: 'auto' | 'rubric';
  /**
   * Indicates the language of the component; it also sets each part's language
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /** Host-supplied CSS scoped to the element */
  extraCSSRules?: ExtraCSSRules;
}

/** Config Object for `@pie-element/ebsr` */
export interface EbsrConfiguration {
  /** Indicates configuration for part A */
  partA?: MultipleChoiceConfiguration;
  /** Indicates configuration for part B */
  partB?: MultipleChoiceConfiguration;
  /** Part labels (Configuration for both parts) */
  partLabels?: ConfigureProp;
  /** Indicates whether the settings panel wil allow the author to modify settings for partial scoring */
  partialScoring?: ConfigureProp;
  /** Indicates if the settings panel is not available */
  settingsPanelDisabled?: boolean;
  /** Indicates whether the Scoring type option should be displayed */
  scoringType?: ConfigureProp;
  /**
   * Toolbar plugins every editable field of both parts starts from; it replaces each part's own
   * `baseInputConfiguration`
   */
  baseInputConfiguration?: EditableHtmlConfigureProp;
  /** Settings Panel control for the language; `enabled` shows the language choices */
  language?: ConfigurePropWithEnabled;
  /**
   * Language choices configuration
   * Only available if language is enabled
   */
  languageChoices?: ConfigureLanguageOptions;
  /** Dimensions of the authoring container */
  contentDimensions?: ContentDimensions;
  /** Not read by this element: each part's `promptEnabled` shows its prompt */
  showPrompt?: boolean;
  /** Not read by this element: each part's `prompt.label` labels its prompt */
  promptLabel?: string;
  /** Not read by this element: `partialScoring.settings` shows the partial scoring control */
  settingsPartialScoring?: boolean;
}

export interface EbsrSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The session of each part */
  value?: {
    partA?: MultipleChoiceSession;
    partB?: MultipleChoiceSession;
  };
  /** Choice values of each part in the order they were shuffled for this learner, when choice order is not locked */
  shuffledValues?: {
    partA?: string[];
    partB?: string[];
  };
}
