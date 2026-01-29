/**
 * Feedback type configuration
 */
export type FeedbackType = 'default' | 'none' | 'custom';

/**
 * Correctness levels
 */
export type Correctness = 'correct' | 'incorrect' | 'partial' | 'unanswered';

/**
 * Feedback configuration for a specific correctness level
 */
export interface FeedbackConfig {
  /** The type of feedback to show */
  type: FeedbackType;
  /** The default feedback message */
  default: string;
  /** The custom feedback message (if type is 'custom') */
  custom: string;
}

/**
 * Complete feedback configuration for all correctness levels
 */
export interface Feedback {
  correct: FeedbackConfig;
  incorrect: FeedbackConfig;
  partial: FeedbackConfig;
  unanswered: FeedbackConfig;
}
