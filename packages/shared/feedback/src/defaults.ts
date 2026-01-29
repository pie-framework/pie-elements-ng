import type { Feedback } from './types';

/**
 * Default feedback messages for all correctness levels
 */
export const defaultFeedback: Feedback = {
  correct: {
    type: 'default',
    default: 'Correct',
    custom: 'Correct',
  },
  incorrect: {
    type: 'default',
    default: 'Incorrect',
    custom: 'Incorrect',
  },
  partial: {
    type: 'default',
    default: 'Nearly',
    custom: 'Nearly',
  },
  unanswered: {
    type: 'default',
    default: 'You have not entered a response',
    custom: 'You have not entered a response',
  },
};
