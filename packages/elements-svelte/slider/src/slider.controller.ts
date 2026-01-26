/**
 * Slider Controller
 *
 * Handles model validation, session management, and evaluation logic
 * Implements PIE controller interface for use with pie-element-player
 */

import type { SliderEvaluation, SliderModel, SliderSession } from './slider.types.js';
import type { PieEnvironment, OutcomeResult } from '@pie-elements-ng/types';

/**
 * Validate slider model
 */
export function validateModel(model: SliderModel): string[] {
  const errors: string[] = [];

  if (!model.id) {
    errors.push('Model must have an id');
  }

  if (model.lowerBound === undefined || model.lowerBound === null) {
    errors.push('lowerBound is required');
  }

  if (model.upperBound === undefined || model.upperBound === null) {
    errors.push('upperBound is required');
  }

  if (
    model.lowerBound !== undefined &&
    model.upperBound !== undefined &&
    model.lowerBound >= model.upperBound
  ) {
    errors.push('lowerBound must be less than upperBound');
  }

  if (model.step !== undefined && model.step <= 0) {
    errors.push('step must be greater than 0');
  }

  if (
    model.step !== undefined &&
    model.lowerBound !== undefined &&
    model.upperBound !== undefined
  ) {
    const range = model.upperBound - model.lowerBound;
    if (range % model.step !== 0) {
      errors.push('step must evenly divide the range (upperBound - lowerBound)');
    }
  }

  if (
    model.correctResponse !== undefined &&
    model.lowerBound !== undefined &&
    model.upperBound !== undefined
  ) {
    if (model.correctResponse < model.lowerBound || model.correctResponse > model.upperBound) {
      errors.push('correctResponse must be within lowerBound and upperBound');
    }

    if (model.step !== undefined) {
      const offset = model.correctResponse - model.lowerBound;
      if (offset % model.step !== 0) {
        errors.push('correctResponse must align with step increments');
      }
    }
  }

  if (model.partialScoring && model.correctResponse === undefined) {
    errors.push('correctResponse is required when partialScoring is enabled');
  }

  if (model.scoringTolerance !== undefined && model.scoringTolerance < 0) {
    errors.push('scoringTolerance must be non-negative');
  }

  return errors;
}

/**
 * Create a new empty session
 */
export function createSession(): SliderSession {
  return {
    value: undefined,
  };
}

/**
 * Update session with new value
 */
export function updateSession(session: SliderSession, value: number | undefined): SliderSession {
  return {
    ...session,
    value,
  };
}

/**
 * Check if session is complete (has a value)
 */
export function isSessionComplete(session: SliderSession): boolean {
  return session.value !== undefined && session.value !== null;
}

/**
 * Normalize value to ensure it aligns with step increments
 */
export function normalizeValue(value: number, model: SliderModel): number {
  const { lowerBound, upperBound, step = 1 } = model;

  // Clamp to bounds
  let normalized = Math.max(lowerBound, Math.min(upperBound, value));

  // Snap to step
  const offset = normalized - lowerBound;
  const steps = Math.round(offset / step);
  normalized = lowerBound + steps * step;

  // Ensure within bounds after rounding
  normalized = Math.max(lowerBound, Math.min(upperBound, normalized));

  return normalized;
}

/**
 * Evaluate session response
 */
export function evaluate(model: SliderModel, session: SliderSession): SliderEvaluation {
  // No response
  if (!isSessionComplete(session)) {
    return {
      score: 0,
      correct: false,
    };
  }

  // No correct answer defined - can't evaluate
  if (model.correctResponse === undefined) {
    return {
      score: 0,
      correct: false,
    };
  }

  // Type guard: We've already checked session.value exists above
  if (session.value === undefined || session.value === null) {
    return {
      score: 0,
      correct: false,
    };
  }

  const userValue = session.value;
  const correctValue = model.correctResponse;
  const difference = Math.abs(userValue - correctValue);

  // Exact match
  if (difference === 0) {
    return {
      score: 1,
      correct: true,
      partialCredit: 1,
      difference: 0,
    };
  }

  // Partial scoring
  if (model.partialScoring && model.scoringTolerance !== undefined) {
    if (difference <= model.scoringTolerance) {
      // Linear partial credit based on distance
      // Closer = more credit
      const partialCredit = 1 - difference / model.scoringTolerance;
      return {
        score: partialCredit,
        correct: false,
        partialCredit,
        difference,
      };
    }
  }

  // Incorrect
  return {
    score: 0,
    correct: false,
    difference,
  };
}

/**
 * Get score as percentage string
 */
export function getScorePercentage(evaluation: SliderEvaluation): string {
  return `${Math.round(evaluation.score * 100)}%`;
}

/**
 * Check if value is valid for the model constraints
 */
export function isValidValue(value: number, model: SliderModel): boolean {
  const { lowerBound, upperBound, step = 1 } = model;

  // Check bounds
  if (value < lowerBound || value > upperBound) {
    return false;
  }

  // Check step alignment
  const offset = value - lowerBound;
  if (offset % step !== 0) {
    return false;
  }

  return true;
}

/**
 * Get all valid values for the slider (useful for testing)
 */
export function getValidValues(model: SliderModel): number[] {
  const { lowerBound, upperBound, step = 1 } = model;
  const values: number[] = [];

  for (let value = lowerBound; value <= upperBound; value += step) {
    values.push(value);
  }

  return values;
}

/**
 * Format value for display
 */
export function formatValue(value: number, model: SliderModel): string {
  // Guard against invalid values
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0';
  }

  // Check if we need decimal places based on step
  const step = model.step ?? 1;
  const decimals = step < 1 ? (String(step).split('.')[1]?.length ?? 0) : 0;

  return value.toFixed(decimals);
}

/**
 * PIE Controller Interface
 */

/**
 * Build view model for rendering
 * This filters the model to only include properties that should be visible to the client
 */
export async function model(
  question: SliderModel,
  _session: SliderSession | null,
  _env: PieEnvironment
): Promise<SliderModel> {
  // Return the full model - in delivery mode, we show everything
  // The element will handle hiding sensitive data based on mode/role
  return {
    ...question,
  };
}

/**
 * Calculate outcome for scoring
 */
export async function outcome(
  question: SliderModel,
  session: SliderSession,
  _env: PieEnvironment
): Promise<OutcomeResult> {
  const evaluation = evaluate(question, session);

  return {
    score: evaluation.score,
    empty: !isSessionComplete(session),
  };
}
