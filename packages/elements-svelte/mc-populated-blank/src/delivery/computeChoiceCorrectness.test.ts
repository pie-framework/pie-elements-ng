/**
 * Unit tests for computeChoiceCorrectness.
 *
 * This is the harness for extracting the choiceCorrectnessById state machine
 * from McPopulatedBlank.svelte. The function takes five pure inputs and returns
 * a Map — no component rendering required.
 *
 * Cases:
 *   C1. Not evaluate mode → empty map
 *   C2. Evaluate mode, no correctChoiceId → empty map
 *   C3. Reveal active, student chose correctly → { correctId: 'correct' } only
 *   C4. Reveal active, student chose wrong → { correctId: 'correct' } only (student badge suppressed)
 *   C5. Evaluate, unanswered → { correctId: 'incorrect' }
 *   C6. Evaluate, student chose correctly → { correctId: 'correct' }
 *   C7. Evaluate, student chose wrong → { studentId: 'incorrect', correctId: 'incorrect' }
 *   C8. Empty-string ids treated as "no selection" → C5 path, not C7
 */

import { describe, expect, it } from 'vitest';
import { computeChoiceCorrectness } from './computeChoiceCorrectness';

describe('computeChoiceCorrectness', () => {
  // C1 — not in evaluate mode: no badges regardless of selection
  it('C1: returns empty map when not in evaluate mode', () => {
    const result = computeChoiceCorrectness({
      isEvaluateMode: false,
      correctChoiceId: 'choice-a',
      selectedId: 'choice-b',
      showCorrectAnswer: false,
    });
    expect(result.size).toBe(0);
  });

  // C2 — evaluate mode but no correct answer defined: nothing to badge
  it('C2: returns empty map when correctChoiceId is absent', () => {
    const result = computeChoiceCorrectness({
      isEvaluateMode: true,
      correctChoiceId: '',
      selectedId: 'choice-b',
      showCorrectAnswer: false,
    });
    expect(result.size).toBe(0);
  });

  // C3 — reveal active, student answered correctly: only the correct badge
  it('C3: reveal active + correct selection → correct badge on correct choice only', () => {
    const result = computeChoiceCorrectness({
      isEvaluateMode: true,
      correctChoiceId: 'choice-a',
      selectedId: 'choice-a',
      showCorrectAnswer: true,
    });
    expect(result.size).toBe(1);
    expect(result.get('choice-a')).toBe('correct');
  });

  // C4 — reveal active, student chose wrong: correct badge only, student's badge suppressed
  it('C4: reveal active + wrong selection → correct badge only, student choice suppressed', () => {
    const result = computeChoiceCorrectness({
      isEvaluateMode: true,
      correctChoiceId: 'choice-a',
      selectedId: 'choice-b',
      showCorrectAnswer: true,
    });
    expect(result.size).toBe(1);
    expect(result.get('choice-a')).toBe('correct');
    expect(result.has('choice-b')).toBe(false);
  });

  // C5 — evaluate mode, student did not answer: flag the correct choice as missed
  it('C5: unanswered in evaluate mode → correct choice marked incorrect (missed)', () => {
    const result = computeChoiceCorrectness({
      isEvaluateMode: true,
      correctChoiceId: 'choice-a',
      selectedId: '',
      showCorrectAnswer: false,
    });
    expect(result.size).toBe(1);
    expect(result.get('choice-a')).toBe('incorrect');
  });

  // C6 — evaluate mode, student chose the right answer
  it('C6: correct selection in evaluate mode → correct badge on correct choice', () => {
    const result = computeChoiceCorrectness({
      isEvaluateMode: true,
      correctChoiceId: 'choice-a',
      selectedId: 'choice-a',
      showCorrectAnswer: false,
    });
    expect(result.size).toBe(1);
    expect(result.get('choice-a')).toBe('correct');
  });

  // C7 — evaluate mode, student chose the wrong answer: both choices badged incorrect
  it('C7: wrong selection in evaluate mode → student choice and correct choice both marked incorrect', () => {
    const result = computeChoiceCorrectness({
      isEvaluateMode: true,
      correctChoiceId: 'choice-a',
      selectedId: 'choice-b',
      showCorrectAnswer: false,
    });
    expect(result.size).toBe(2);
    expect(result.get('choice-b')).toBe('incorrect');
    expect(result.get('choice-a')).toBe('incorrect');
  });

  // C8 — both ids are empty strings: empty selectedId is "no selection", not a wrong answer
  it('C8: empty-string selectedId is treated as unanswered (C5 path), not wrong answer (C7 path)', () => {
    const result = computeChoiceCorrectness({
      isEvaluateMode: true,
      correctChoiceId: 'choice-a',
      selectedId: '',
      showCorrectAnswer: false,
    });
    // Must be C5 (size 1, correct choice marked incorrect) not C7 (size 2)
    expect(result.size).toBe(1);
    expect(result.get('choice-a')).toBe('incorrect');
    expect(result.has('')).toBe(false);
  });
});
