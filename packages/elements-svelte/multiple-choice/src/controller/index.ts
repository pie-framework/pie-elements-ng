/**
 * Multiple Choice Controller
 *
 * Implements the PIE controller interface for multiple choice elements.
 */

import type {
  CommonConfigSettings,
  OutcomeResult,
  PieController,
  PieEnvironment,
  PieModel,
  PieSession,
  ValidationErrors,
} from '@pie-element/shared-types';
import { isEmpty, showFeedback, showRationale, shuffle, uuid } from '@pie-element/shared-utils';
import type {
  Choice,
  MultipleChoiceModel,
  MultipleChoiceSession,
  MultipleChoiceViewModel,
} from '../types';
import { defaults } from './defaults';

/**
 * Transform question model into view model for rendering
 */
export async function model(
  question: PieModel,
  session: PieSession | null,
  env: PieEnvironment,
  updateSession?: (session: PieSession) => void
): Promise<MultipleChoiceViewModel> {
  const q = question as MultipleChoiceModel;
  const s = session as MultipleChoiceSession | null;

  // Handle choice shuffling
  let choices = [...q.choices];
  const lockChoiceOrder = env.lockChoiceOrder ?? q.lockChoiceOrder ?? false;

  if (!lockChoiceOrder && env.mode === 'gather') {
    const shuffledValues = s?.shuffledValues;
    if (shuffledValues) {
      // Use existing shuffle order from session
      choices = shuffledValues
        .map((v) => choices.find((c) => c.value === v))
        .filter((c): c is Choice => c !== undefined);
    } else {
      // Create new shuffle order
      choices = shuffle(choices);
      if (updateSession) {
        updateSession({
          ...s,
          shuffledValues: choices.map((c) => c.value),
        });
      }
    }
  }

  // Build view model
  const disabled = env.mode !== 'gather';
  const feedbackVisible = showFeedback(env, q.feedbackEnabled);
  const rationaleVisible = showRationale(env, q.rationaleEnabled);

  const viewModel: MultipleChoiceViewModel = {
    disabled,
    mode: env.mode,
    prompt: q.prompt,
    promptEnabled: q.promptEnabled,
    choiceMode: q.choiceMode,
    choicePrefix: q.choicePrefix,
    choicesLayout: q.choicesLayout,
    rationale: q.rationale,
    showRationale: rationaleVisible,
    choices: choices.map((choice, index) => {
      const checked = s?.value?.includes(choice.value) ?? false;
      return {
        ...choice,
        index,
        checked,
        showFeedback: feedbackVisible && checked,
      };
    }),
  };

  // Add evaluation data
  if (env.mode === 'evaluate') {
    const correctValues = q.choices.filter((c) => c.correct).map((c) => c.value);
    const selectedValues = s?.value ?? [];
    const allCorrect = correctValues.every((v) => selectedValues.includes(v));
    const noIncorrect = selectedValues.every((v) => correctValues.includes(v));

    viewModel.responseCorrect = allCorrect && noIncorrect;

    if (env.role === 'instructor') {
      viewModel.correctResponse = correctValues;
    }
  }

  return viewModel;
}

/**
 * Calculate score for the response
 */
export async function outcome(
  model: PieModel,
  session: PieSession,
  _env: PieEnvironment
): Promise<OutcomeResult> {
  const q = model as MultipleChoiceModel;
  const s = session as MultipleChoiceSession;

  if (isEmpty(s) || !s.value || s.value.length === 0) {
    return { score: 0, empty: true };
  }

  const correctValues = q.choices.filter((c) => c.correct).map((c) => c.value);
  const selectedValues = s.value;

  // Binary scoring (default)
  const allCorrect = correctValues.every((v) => selectedValues.includes(v));
  const noIncorrect = selectedValues.every((v) => correctValues.includes(v));

  if (allCorrect && noIncorrect) {
    return { score: 1, empty: false };
  }

  // Partial scoring (if enabled)
  if (q.partialScoring && q.choiceMode === 'checkbox') {
    const correctSelected = selectedValues.filter((v) => correctValues.includes(v)).length;
    const incorrectSelected = selectedValues.filter((v) => !correctValues.includes(v)).length;
    const totalCorrect = correctValues.length;

    // Score = (correct selections - incorrect selections) / total correct
    const score = Math.max(0, (correctSelected - incorrectSelected) / totalCorrect);
    return { score, empty: false };
  }

  return { score: 0, empty: false };
}

/**
 * Create a default model with optional overrides
 */
export function createDefaultModel(partial?: Partial<MultipleChoiceModel>): MultipleChoiceModel {
  return {
    ...defaults,
    id: uuid(),
    element: '@pie-element/multiple-choice',
    ...partial,
  };
}

/**
 * Validate the model configuration
 */
export function validate(model: PieModel, _config: CommonConfigSettings): ValidationErrors {
  const q = model as MultipleChoiceModel;
  const errors: ValidationErrors = {};

  if (!q.choices || q.choices.length < 2) {
    errors.choices = 'At least 2 choices are required';
  }

  const correctCount = q.choices?.filter((c) => c.correct).length ?? 0;
  if (correctCount === 0) {
    errors.choices = 'At least one choice must be marked as correct';
  }

  if (q.choiceMode === 'radio' && correctCount > 1) {
    errors.choiceMode = 'Radio mode requires exactly one correct answer';
  }

  return errors;
}

/**
 * Create a session with the correct response
 */
export function createCorrectResponseSession(
  question: PieModel,
  _env: PieEnvironment
): MultipleChoiceSession {
  const q = question as MultipleChoiceModel;
  const correctValues = q.choices.filter((c) => c.correct).map((c) => c.value);

  return {
    id: uuid(),
    value: correctValues,
  };
}

// Export controller object that implements PieController interface
export const controller: PieController = {
  model,
  outcome,
  createDefaultModel,
  validate,
  createCorrectResponseSession,
};
