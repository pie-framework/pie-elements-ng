import type { PieModel } from '@pie-element/shared-types';

/** Multiple question prompts */
export interface MatchListPrompt {
  /** Identifier for a question prompt */
  id: string | number;
  /** Text that will be displayed in the question prompt row */
  title: string;
  /** Id for the correct answer for this question prompt */
  relatedAnswer: string | number;
}

/** Multiple answers */
export interface MatchListAnswer {
  /** Identifier for an answer row; the response counts as complete only when every placed id is a number */
  id: string | number;
  /** Text that will be displayed in the answer row */
  title: string;
}

/**
 * Feedback for one correctness level. A `custom` type without `custom` text shows the default
 * message.
 */
export interface MatchListFeedbackType {
  /** Indicates the feedback type */
  type: 'default' | 'none' | 'custom';
  /** Indicates the feedback value */
  default?: string;
  /** Indicates the feedback custom value */
  custom?: string;
}

/** Feedback for each correctness level; a level left out gets its default message */
export interface MatchListFeedback {
  /** Indicates the configuration for feedback when answer is correct */
  correct?: MatchListFeedbackType;
  /** Indicates the configuration for feedback when answer is incorrect */
  incorrect?: MatchListFeedbackType;
  /** Indicates the configuration for feedback when answer is partially correct */
  partial?: MatchListFeedbackType;
  /** Indicates the configuration for feedback when there is no answer */
  unanswered?: MatchListFeedbackType;
}

/** Model for the `@pie-element/match-list` Interaction */
export interface MatchListModel extends PieModel {
  /**  The question prompt or item stem*/
  prompt?: string;
  /** The question prompts that are going to be displayed. The default model carries none. */
  prompts?: MatchListPrompt[];
  /** The answer rows that are going to be displayed. The default model carries none. */
  answers?: MatchListAnswer[];
  /**
   * Indicates if answers should be locked in order according to the model or if they should be shuffed
   * true - order is respected according to model
   * false - order is shuffled
   */
  lockChoiceOrder?: boolean;
  /** Indicates if duplicates are allowed */
  duplicates?: boolean;
  /** Indicates if partial scoring should be used. Scoring treats an absent value as enabled. */
  partialScoring?: boolean;
  /** Feedback shown in evaluate mode */
  feedback?: MatchListFeedback;
  /** Indicates rationale for correct answer; shown to instructors in view and evaluate mode */
  rationale?: string;
  /**
   * Indicates the language of the component
   * Supported options: en, es, en_US, en-US, es_ES, es-ES, es_MX, es-MX
   */
  language?: string;
  /**
   * Not read by this element: the controller defaults nest their values under this key, so the
   * default model carries it, and the controller reads `prompts`, `answers` and `prompt` from the root
   */
  config?: {
    answers?: MatchListAnswer[];
    prompt?: string;
    prompts?: MatchListPrompt[];
    shuffled?: boolean;
  };
}

export interface MatchListSession {
  /** Identifier of the session */
  id?: string;
  /** The element the session belongs to */
  element?: string;
  /** The answer placed in each response area: the answer's `id`, keyed by the prompt's `id` */
  value?: Record<string, string | number>;
  /** Prompt and answer ids in the order they were shuffled for this learner, when choice order is not locked */
  shuffledValues?: {
    prompts?: (string | number)[];
    answers?: (string | number)[];
  };
}
