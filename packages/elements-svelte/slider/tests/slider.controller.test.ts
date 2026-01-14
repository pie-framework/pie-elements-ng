/**
 * Slider Controller Tests
 */

import { describe, expect, it } from 'vitest';
import {
  createSession,
  evaluate,
  formatValue,
  getValidValues,
  isSessionComplete,
  isValidValue,
  normalizeValue,
  updateSession,
  validateModel,
} from '../src/slider.controller.js';
import type { SliderModel, SliderSession } from '../src/slider.types.js';

describe('Slider Controller', () => {
  describe('validateModel', () => {
    it('validates a valid model with no errors', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
        step: 1,
      };

      const errors = validateModel(model);
      expect(errors).toEqual([]);
    });

    it('requires id', () => {
      const model = {
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
      } as SliderModel;

      const errors = validateModel(model);
      expect(errors).toContain('Model must have an id');
    });

    it('requires lowerBound', () => {
      const model = {
        id: 'slider-1',
        element: '@pie-element/slider',
        upperBound: 100,
      } as unknown as SliderModel;

      const errors = validateModel(model);
      expect(errors).toContain('lowerBound is required');
    });

    it('requires upperBound', () => {
      const model = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
      } as unknown as SliderModel;

      const errors = validateModel(model);
      expect(errors).toContain('upperBound is required');
    });

    it('requires lowerBound < upperBound', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 100,
        upperBound: 0,
      };

      const errors = validateModel(model);
      expect(errors).toContain('lowerBound must be less than upperBound');
    });

    it('requires positive step', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
        step: -1,
      };

      const errors = validateModel(model);
      expect(errors).toContain('step must be greater than 0');
    });

    it('requires step to evenly divide range', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
        step: 7, // 100 % 7 !== 0
      };

      const errors = validateModel(model);
      expect(errors).toContain('step must evenly divide the range (upperBound - lowerBound)');
    });

    it('requires correctResponse within bounds', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
        correctResponse: 150,
      };

      const errors = validateModel(model);
      expect(errors).toContain('correctResponse must be within lowerBound and upperBound');
    });

    it('requires correctResponse to align with step', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
        step: 10,
        correctResponse: 15, // Not aligned with step 10
      };

      const errors = validateModel(model);
      expect(errors).toContain('correctResponse must align with step increments');
    });

    it('requires correctResponse when partialScoring enabled', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
        partialScoring: true,
      };

      const errors = validateModel(model);
      expect(errors).toContain('correctResponse is required when partialScoring is enabled');
    });

    it('requires non-negative scoringTolerance', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
        scoringTolerance: -5,
      };

      const errors = validateModel(model);
      expect(errors).toContain('scoringTolerance must be non-negative');
    });
  });

  describe('createSession', () => {
    it('creates an empty session', () => {
      const session = createSession();
      expect(session).toEqual({ value: undefined });
    });
  });

  describe('updateSession', () => {
    it('updates session with new value', () => {
      const session: SliderSession = { value: undefined };
      const updated = updateSession(session, 50);

      expect(updated.value).toBe(50);
    });

    it('can clear session value', () => {
      const session: SliderSession = { value: 50 };
      const updated = updateSession(session, undefined);

      expect(updated.value).toBeUndefined();
    });
  });

  describe('isSessionComplete', () => {
    it('returns false for empty session', () => {
      const session: SliderSession = { value: undefined };
      expect(isSessionComplete(session)).toBe(false);
    });

    it('returns true for session with value', () => {
      const session: SliderSession = { value: 50 };
      expect(isSessionComplete(session)).toBe(true);
    });

    it('returns true for session with zero value', () => {
      const session: SliderSession = { value: 0 };
      expect(isSessionComplete(session)).toBe(true);
    });
  });

  describe('normalizeValue', () => {
    const model: SliderModel = {
      id: 'slider-1',
      element: '@pie-element/slider',
      lowerBound: 0,
      upperBound: 100,
      step: 10,
    };

    it('clamps value to lower bound', () => {
      const normalized = normalizeValue(-50, model);
      expect(normalized).toBe(0);
    });

    it('clamps value to upper bound', () => {
      const normalized = normalizeValue(150, model);
      expect(normalized).toBe(100);
    });

    it('snaps to nearest step', () => {
      const normalized = normalizeValue(47, model);
      expect(normalized).toBe(50);
    });

    it('rounds down to nearest step', () => {
      const normalized = normalizeValue(44, model);
      expect(normalized).toBe(40);
    });

    it('handles fractional steps', () => {
      const fractionalModel: SliderModel = {
        ...model,
        lowerBound: 0,
        upperBound: 1,
        step: 0.1,
      };

      const normalized = normalizeValue(0.47, fractionalModel);
      expect(normalized).toBeCloseTo(0.5, 1);
    });
  });

  describe('evaluate', () => {
    const model: SliderModel = {
      id: 'slider-1',
      element: '@pie-element/slider',
      lowerBound: 0,
      upperBound: 100,
      step: 1,
      correctResponse: 50,
    };

    it('returns 0 score for incomplete session', () => {
      const session: SliderSession = { value: undefined };
      const evaluation = evaluate(model, session);

      expect(evaluation.score).toBe(0);
      expect(evaluation.correct).toBe(false);
    });

    it('returns 0 score when no correct answer defined', () => {
      const noAnswerModel = { ...model, correctResponse: undefined };
      const session: SliderSession = { value: 50 };
      const evaluation = evaluate(noAnswerModel, session);

      expect(evaluation.score).toBe(0);
      expect(evaluation.correct).toBe(false);
    });

    it('returns full score for exact match', () => {
      const session: SliderSession = { value: 50 };
      const evaluation = evaluate(model, session);

      expect(evaluation.score).toBe(1);
      expect(evaluation.correct).toBe(true);
      expect(evaluation.difference).toBe(0);
    });

    it('returns 0 score for incorrect answer without partial scoring', () => {
      const session: SliderSession = { value: 30 };
      const evaluation = evaluate(model, session);

      expect(evaluation.score).toBe(0);
      expect(evaluation.correct).toBe(false);
      expect(evaluation.difference).toBe(20);
    });

    it('awards partial credit within tolerance', () => {
      const partialModel: SliderModel = {
        ...model,
        partialScoring: true,
        scoringTolerance: 10,
      };

      const session: SliderSession = { value: 45 };
      const evaluation = evaluate(partialModel, session);

      expect(evaluation.score).toBeGreaterThan(0);
      expect(evaluation.score).toBeLessThan(1);
      expect(evaluation.correct).toBe(false);
      expect(evaluation.partialCredit).toBeDefined();
    });

    it('calculates linear partial credit', () => {
      const partialModel: SliderModel = {
        ...model,
        partialScoring: true,
        scoringTolerance: 10,
      };

      // 5 units away from correct (50), tolerance is 10
      // Credit should be 1 - (5/10) = 0.5
      const session: SliderSession = { value: 45 };
      const evaluation = evaluate(partialModel, session);

      expect(evaluation.partialCredit).toBeCloseTo(0.5, 2);
    });

    it('does not award partial credit beyond tolerance', () => {
      const partialModel: SliderModel = {
        ...model,
        partialScoring: true,
        scoringTolerance: 5,
      };

      const session: SliderSession = { value: 30 }; // 20 units away
      const evaluation = evaluate(partialModel, session);

      expect(evaluation.score).toBe(0);
      expect(evaluation.correct).toBe(false);
    });
  });

  describe('isValidValue', () => {
    const model: SliderModel = {
      id: 'slider-1',
      element: '@pie-element/slider',
      lowerBound: 0,
      upperBound: 100,
      step: 10,
    };

    it('returns true for valid value', () => {
      expect(isValidValue(50, model)).toBe(true);
    });

    it('returns false for value below lower bound', () => {
      expect(isValidValue(-10, model)).toBe(false);
    });

    it('returns false for value above upper bound', () => {
      expect(isValidValue(110, model)).toBe(false);
    });

    it('returns false for value not aligned with step', () => {
      expect(isValidValue(55, model)).toBe(false);
    });

    it('returns true for boundary values', () => {
      expect(isValidValue(0, model)).toBe(true);
      expect(isValidValue(100, model)).toBe(true);
    });
  });

  describe('getValidValues', () => {
    it('returns all valid values for integer step', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 10,
        step: 2,
      };

      const values = getValidValues(model);
      expect(values).toEqual([0, 2, 4, 6, 8, 10]);
    });

    it('handles fractional steps', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 1,
        step: 0.25,
      };

      const values = getValidValues(model);
      expect(values).toEqual([0, 0.25, 0.5, 0.75, 1]);
    });

    it('handles default step of 1', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 5,
      };

      const values = getValidValues(model);
      expect(values).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  describe('formatValue', () => {
    it('formats integer with no decimals', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
        step: 1,
      };

      expect(formatValue(50, model)).toBe('50');
    });

    it('formats with appropriate decimal places for fractional step', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 1,
        step: 0.1,
      };

      expect(formatValue(0.5, model)).toBe('0.5');
    });

    it('formats with two decimal places for small step', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 1,
        step: 0.01,
      };

      expect(formatValue(0.55, model)).toBe('0.55');
    });

    it('handles undefined step (defaults to 1)', () => {
      const model: SliderModel = {
        id: 'slider-1',
        element: '@pie-element/slider',
        lowerBound: 0,
        upperBound: 100,
      };

      expect(formatValue(42.567, model)).toBe('43');
    });
  });
});
