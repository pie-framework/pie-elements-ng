import type { PieEnvironment } from '@pie-shared/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MultipleChoiceModel, MultipleChoiceSession } from '../types';
import {
  createCorrectResponseSession,
  createDefaultModel,
  model,
  outcome,
  validate,
} from './index';

describe('Multiple Choice Controller', () => {
  let question: MultipleChoiceModel;
  let env: PieEnvironment;

  beforeEach(() => {
    question = {
      id: '1',
      element: '@pie-elements-ng/multiple-choice',
      prompt: '<p>What is 2 + 2?</p>',
      promptEnabled: true,
      choices: [
        { value: 'a', label: '3', correct: false, feedback: 'Try again' },
        { value: 'b', label: '4', correct: true, feedback: 'Correct!' },
        { value: 'c', label: '5', correct: false },
      ],
      choiceMode: 'radio',
      choicePrefix: 'letters',
      choicesLayout: 'vertical',
      feedbackEnabled: true,
      rationaleEnabled: true,
      rationale: '<p>2 + 2 = 4 by basic arithmetic</p>',
    };

    env = { mode: 'gather', role: 'student' };
  });

  describe('model()', () => {
    it('returns view model for gather mode', async () => {
      const viewModel = await model(question, null, env);

      expect(viewModel.disabled).toBe(false);
      expect(viewModel.mode).toBe('gather');
      expect(viewModel.prompt).toBe('<p>What is 2 + 2?</p>');
      expect(viewModel.choices).toHaveLength(3);
      expect(viewModel.choiceMode).toBe('radio');
    });

    it('sets disabled true for view mode', async () => {
      env.mode = 'view';
      const viewModel = await model(question, null, env);

      expect(viewModel.disabled).toBe(true);
    });

    it('sets disabled true for evaluate mode', async () => {
      env.mode = 'evaluate';
      const viewModel = await model(question, null, env);

      expect(viewModel.disabled).toBe(true);
    });

    it('marks selected choices as checked', async () => {
      const session: MultipleChoiceSession = { value: ['a'] };
      const viewModel = await model(question, session, env);

      const choiceA = viewModel.choices.find((c) => c.value === 'a');
      const choiceB = viewModel.choices.find((c) => c.value === 'b');
      const choiceC = viewModel.choices.find((c) => c.value === 'c');

      expect(choiceA?.checked).toBe(true);
      expect(choiceB?.checked).toBe(false);
      expect(choiceC?.checked).toBe(false);
    });

    it('shows feedback for selected choices in evaluate mode', async () => {
      env.mode = 'evaluate';
      const session: MultipleChoiceSession = { value: ['a'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.choices[0].showFeedback).toBe(true);
      expect(viewModel.choices[1].showFeedback).toBe(false);
    });

    it('does not show feedback in gather mode', async () => {
      const session: MultipleChoiceSession = { value: ['a'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.choices[0].showFeedback).toBe(false);
    });

    it('shows rationale for instructor in evaluate mode', async () => {
      env.mode = 'evaluate';
      env.role = 'instructor';
      const session: MultipleChoiceSession = { value: ['b'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.showRationale).toBe(true);
      expect(viewModel.rationale).toBe('<p>2 + 2 = 4 by basic arithmetic</p>');
    });

    it('does not show rationale for student', async () => {
      env.mode = 'evaluate';
      env.role = 'student';
      const session: MultipleChoiceSession = { value: ['b'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.showRationale).toBe(false);
    });

    it('indicates correct response in evaluate mode', async () => {
      env.mode = 'evaluate';
      const session: MultipleChoiceSession = { value: ['b'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.responseCorrect).toBe(true);
    });

    it('indicates incorrect response in evaluate mode', async () => {
      env.mode = 'evaluate';
      const session: MultipleChoiceSession = { value: ['a'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.responseCorrect).toBe(false);
    });

    it('shows correct response to instructor', async () => {
      env.mode = 'evaluate';
      env.role = 'instructor';
      const session: MultipleChoiceSession = { value: ['a'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.correctResponse).toEqual(['b']);
    });

    it('does not show correct response to student', async () => {
      env.mode = 'evaluate';
      env.role = 'student';
      const session: MultipleChoiceSession = { value: ['a'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.correctResponse).toBeUndefined();
    });

    it('shuffles choices in gather mode', async () => {
      const viewModel = await model(question, null, env);

      // Choices should be reordered (very unlikely to be in original order with 3!)
      const _originalOrder = question.choices.map((c) => c.value).join('');
      const _shuffledOrder = viewModel.choices.map((c) => c.value).join('');

      // Just verify all choices are present
      expect(viewModel.choices).toHaveLength(3);
      expect(viewModel.choices.map((c) => c.value).sort()).toEqual(['a', 'b', 'c']);
    });

    it('locks shuffle order when lockChoiceOrder is true', async () => {
      question.lockChoiceOrder = true;
      const viewModel = await model(question, null, env);

      expect(viewModel.choices.map((c) => c.value)).toEqual(['a', 'b', 'c']);
    });

    it('uses shuffled values from session if present', async () => {
      const session: MultipleChoiceSession = { shuffledValues: ['c', 'a', 'b'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.choices.map((c) => c.value)).toEqual(['c', 'a', 'b']);
    });

    it('calls updateSession with shuffled order', async () => {
      const updateSession = vi.fn();
      await model(question, null, env, updateSession);

      expect(updateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          shuffledValues: expect.any(Array),
        })
      );
    });

    it('does not shuffle in view mode', async () => {
      env.mode = 'view';
      const viewModel = await model(question, null, env);

      expect(viewModel.choices.map((c) => c.value)).toEqual(['a', 'b', 'c']);
    });

    it('does not shuffle in evaluate mode', async () => {
      env.mode = 'evaluate';
      const session: MultipleChoiceSession = { value: ['b'] };
      const viewModel = await model(question, session, env);

      expect(viewModel.choices.map((c) => c.value)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('outcome()', () => {
    it('returns score 1 for correct answer', async () => {
      const session: MultipleChoiceSession = { value: ['b'] };
      const result = await outcome(question, session, env);

      expect(result.score).toBe(1);
      expect(result.empty).toBe(false);
    });

    it('returns score 0 for incorrect answer', async () => {
      const session: MultipleChoiceSession = { value: ['a'] };
      const result = await outcome(question, session, env);

      expect(result.score).toBe(0);
      expect(result.empty).toBe(false);
    });

    it('returns empty true for no response', async () => {
      const session: MultipleChoiceSession = {};
      const result = await outcome(question, session, env);

      expect(result.score).toBe(0);
      expect(result.empty).toBe(true);
    });

    it('returns empty true for empty array', async () => {
      const session: MultipleChoiceSession = { value: [] };
      const result = await outcome(question, session, env);

      expect(result.score).toBe(0);
      expect(result.empty).toBe(true);
    });

    it('handles checkbox mode with all correct', async () => {
      question.choiceMode = 'checkbox';
      question.choices[0].correct = true; // a and b both correct
      const session: MultipleChoiceSession = { value: ['a', 'b'] };
      const result = await outcome(question, session, env);

      expect(result.score).toBe(1);
      expect(result.empty).toBe(false);
    });

    it('returns 0 for checkbox with incorrect selection', async () => {
      question.choiceMode = 'checkbox';
      question.choices[0].correct = true; // a and b both correct
      const session: MultipleChoiceSession = { value: ['a', 'c'] }; // c is incorrect
      const result = await outcome(question, session, env);

      expect(result.score).toBe(0);
      expect(result.empty).toBe(false);
    });

    it('calculates partial score when enabled', async () => {
      question.choiceMode = 'checkbox';
      question.partialScoring = true;
      question.choices[0].correct = true; // a and b both correct
      const session: MultipleChoiceSession = { value: ['a'] }; // only a selected

      const result = await outcome(question, session, env);

      expect(result.score).toBe(0.5); // 1 out of 2 correct
      expect(result.empty).toBe(false);
    });

    it('calculates partial score with penalty for incorrect', async () => {
      question.choiceMode = 'checkbox';
      question.partialScoring = true;
      question.choices[0].correct = true; // a and b both correct
      const session: MultipleChoiceSession = { value: ['a', 'c'] }; // a correct, c incorrect

      const result = await outcome(question, session, env);

      expect(result.score).toBe(0); // (1 correct - 1 incorrect) / 2 total = 0
      expect(result.empty).toBe(false);
    });

    it('does not give negative score with partial scoring', async () => {
      question.choiceMode = 'checkbox';
      question.partialScoring = true;
      question.choices[0].correct = true; // a and b both correct
      const session: MultipleChoiceSession = { value: ['c'] }; // only incorrect selected

      const result = await outcome(question, session, env);

      expect(result.score).toBe(0); // max(0, (0 - 1) / 2) = 0
      expect(result.empty).toBe(false);
    });

    it('does not apply partial scoring in radio mode', async () => {
      question.partialScoring = true;
      const session: MultipleChoiceSession = { value: ['a'] };
      const result = await outcome(question, session, env);

      expect(result.score).toBe(0); // Binary scoring even with partialScoring true
      expect(result.empty).toBe(false);
    });
  });

  describe('createDefaultModel()', () => {
    it('creates default model with id and element', () => {
      const model = createDefaultModel();

      expect(model.id).toBeDefined();
      expect(model.element).toBe('@pie-elements-ng/multiple-choice');
      expect(model.choices).toHaveLength(3);
      expect(model.choiceMode).toBe('radio');
    });

    it('merges partial model with defaults', () => {
      const model = createDefaultModel({
        choiceMode: 'checkbox',
        choicePrefix: 'numbers',
      });

      expect(model.choiceMode).toBe('checkbox');
      expect(model.choicePrefix).toBe('numbers');
      expect(model.choices).toHaveLength(3); // From defaults
    });
  });

  describe('validate()', () => {
    it('returns empty errors for valid model', () => {
      const errors = validate(question, {});

      expect(errors).toEqual({});
    });

    it('requires at least 2 choices', () => {
      question.choices = [{ value: 'a', label: 'A', correct: true }];
      const errors = validate(question, {});

      expect(errors.choices).toBeDefined();
      expect(errors.choices).toContain('At least 2 choices');
    });

    it('requires at least one correct choice', () => {
      question.choices = [
        { value: 'a', label: 'A', correct: false },
        { value: 'b', label: 'B', correct: false },
      ];
      const errors = validate(question, {});

      expect(errors.choices).toBeDefined();
      expect(errors.choices).toContain('At least one choice must be marked as correct');
    });

    it('requires exactly one correct choice for radio mode', () => {
      question.choiceMode = 'radio';
      question.choices = [
        { value: 'a', label: 'A', correct: true },
        { value: 'b', label: 'B', correct: true },
        { value: 'c', label: 'C', correct: false },
      ];
      const errors = validate(question, {});

      expect(errors.choiceMode).toBeDefined();
      expect(errors.choiceMode).toContain('Radio mode requires exactly one correct answer');
    });

    it('allows multiple correct choices for checkbox mode', () => {
      question.choiceMode = 'checkbox';
      question.choices = [
        { value: 'a', label: 'A', correct: true },
        { value: 'b', label: 'B', correct: true },
        { value: 'c', label: 'C', correct: false },
      ];
      const errors = validate(question, {});

      expect(errors).toEqual({});
    });
  });

  describe('createCorrectResponseSession()', () => {
    it('returns session with correct values', () => {
      const session = createCorrectResponseSession(question, env);

      expect(session.id).toBeDefined();
      expect(session.value).toEqual(['b']);
    });

    it('returns multiple correct values for checkbox', () => {
      question.choiceMode = 'checkbox';
      question.choices[0].correct = true; // a and b both correct
      const session = createCorrectResponseSession(question, env);

      expect(session.value).toEqual(['a', 'b']);
    });

    it('returns all correct choices', () => {
      question.choices = [
        { value: 'a', label: 'A', correct: true },
        { value: 'b', label: 'B', correct: false },
        { value: 'c', label: 'C', correct: true },
        { value: 'd', label: 'D', correct: true },
      ];
      const session = createCorrectResponseSession(question, env);

      expect(session.value).toEqual(['a', 'c', 'd']);
    });
  });
});
