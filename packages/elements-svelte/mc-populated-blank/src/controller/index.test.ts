/**
 * Unit tests for the McPopulatedBlank controller.
 *
 * Cases are grouped by exported function.
 *
 * getCorrectness
 *   G1. No session → unanswered
 *   G2. No choiceId → unanswered
 *   G3. Correct choice selected → correct
 *   G4. Wrong choice selected → incorrect
 *
 * outcome
 *   O1. Empty session → score 0, empty: true
 *   O2. No choiceId → score 0, empty: true
 *   O3. Correct choice → score 1, empty: false
 *   O4. Wrong choice → score 0, empty: false
 *   O5. traceLog includes mode, selected id, correct id, final score
 *
 * model — choice ordering
 *   M1. shuffle=false → original order preserved
 *   M2. shuffle=true, instructor role → original order locked
 *   M3. shuffle=true, lockChoiceOrder=true → original order locked
 *   M4. shuffle=true, stored shuffle in session.data.shuffledValues → restored
 *   M5. shuffle=true, stored shuffle in session.shuffledValues (legacy) → restored
 *   M6. shuffle=true, stored shuffle has unknown ids → extras appended at end
 *   M7. shuffle=true, no stored shuffle → shuffled; updateSession called with new order
 *   M8. shuffle=true, no stored shuffle, no updateSession → shuffled silently (no throw)
 *
 * model — output fields
 *   M9. evaluate mode → correctness, responseCorrect, correctChoiceId present
 *   M10. gather mode → correctness fields absent
 *   M11. instructor + view mode → teacherInstructions included when enabled
 *   M12. student role → teacherInstructions always null
 *   M13. prompt included when promptEnabled=true
 *   M14. prompt null when promptEnabled=false
 *   M15. audioUrl null when hasAudio=false
 *   M16. audioUrl passed through when hasAudio=true
 *   M17. disabled=true in view/evaluate mode, false in gather
 *
 * validate
 *   V1. Valid question → empty errors object
 *   V2. promptEnabled + empty prompt → prompt error
 *   V3. populate_blank with no blank token → template error
 *   V4. populate_blank with two blank tokens → template error
 *   V5. audio_mc_only with a blank token → template error
 *   V6. Unknown interactionMode → interactionMode error
 *   V7. Fewer than two choices → choices error
 *   V8. Choice missing id → choices error
 *   V9. Text mode choice missing labelHtml → choices error
 *   V10. Image mode choice missing imageUrl → choices error
 *   V11. Image mode choice missing imageAlt → choices error
 *   V12. correctChoiceId not in choices → correctChoiceId error
 *   V13. hasAudio=true with no audioUrl → audioUrl error
 *   V14. layoutLimits with a non-positive value → layoutLimits error
 *   V15. layoutLimits with a valid value → no error
 *
 * createCorrectResponseSession
 *   CR1. Instructor + mode≠evaluate → session with correct choiceId
 *   CR2. Student role → null
 *   CR3. Evaluate mode → null
 */

import { describe, expect, it, vi } from 'vitest';
import {
  getCorrectness,
  outcome,
  model,
  validate,
  createCorrectResponseSession,
} from './index';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const CHOICES = [
  { id: 'a', labelHtml: '<p>Alpha</p>' },
  { id: 'b', labelHtml: '<p>Beta</p>' },
  { id: 'c', labelHtml: '<p>Gamma</p>' },
];

const BASE_QUESTION = {
  id: '1',
  element: 'mc-populated-blank',
  template: '<p>The answer is {{blank}}.</p>',
  interactionMode: 'populate_blank' as const,
  choiceMode: 'text' as const,
  choices: CHOICES,
  correctChoiceId: 'b',
  hasAudio: false,
  shuffle: false,
};

const GATHER_ENV = { mode: 'gather' as const, role: 'student' as const };
const EVALUATE_ENV = { mode: 'evaluate' as const, role: 'student' as const };
const INSTRUCTOR_VIEW_ENV = { mode: 'view' as const, role: 'instructor' as const };

// ---------------------------------------------------------------------------
// getCorrectness
// ---------------------------------------------------------------------------

describe('getCorrectness', () => {
  it('G1: no session → unanswered', () => {
    expect(getCorrectness(BASE_QUESTION, null as any)).toBe('unanswered');
  });

  it('G2: session with no choiceId → unanswered', () => {
    expect(getCorrectness(BASE_QUESTION, {})).toBe('unanswered');
  });

  it('G3: correct choice selected → correct', () => {
    expect(getCorrectness(BASE_QUESTION, { choiceId: 'b' })).toBe('correct');
  });

  it('G4: wrong choice selected → incorrect', () => {
    expect(getCorrectness(BASE_QUESTION, { choiceId: 'a' })).toBe('incorrect');
  });
});

// ---------------------------------------------------------------------------
// outcome
// ---------------------------------------------------------------------------

describe('outcome', () => {
  it('O1: empty session → score 0, empty: true', async () => {
    const result = await outcome(BASE_QUESTION, {}, GATHER_ENV);
    expect(result).toMatchObject({ score: 0, empty: true });
  });

  it('O2: session with no choiceId → score 0, empty: true', async () => {
    const result = await outcome(BASE_QUESTION, { choiceId: '' }, GATHER_ENV);
    expect(result).toMatchObject({ score: 0, empty: true });
  });

  it('O3: correct choice → score 1, empty: false', async () => {
    const result = await outcome(BASE_QUESTION, { choiceId: 'b' }, EVALUATE_ENV);
    expect(result).toMatchObject({ score: 1, empty: false });
  });

  it('O4: wrong choice → score 0, empty: false', async () => {
    const result = await outcome(BASE_QUESTION, { choiceId: 'a' }, EVALUATE_ENV);
    expect(result).toMatchObject({ score: 0, empty: false });
  });

  it('O5: traceLog includes mode, selected id, correct id, final score', async () => {
    const result = await outcome(BASE_QUESTION, { choiceId: 'a' }, EVALUATE_ENV) as any;
    const log = result.traceLog.join('\n');
    expect(log).toContain('evaluate');
    expect(log).toContain('a');
    expect(log).toContain('b');
    expect(log).toContain('0');
  });
});

// ---------------------------------------------------------------------------
// model — choice ordering
// ---------------------------------------------------------------------------

describe('model — choice ordering', () => {
  it('M1: shuffle=false → original order preserved', async () => {
    const result = await model({ ...BASE_QUESTION, shuffle: false }, {}, GATHER_ENV);
    expect(result.choices.map((c: any) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('M2: shuffle=true, instructor role → original order locked', async () => {
    const result = await model(
      { ...BASE_QUESTION, shuffle: true },
      {},
      { mode: 'view', role: 'instructor' }
    );
    expect(result.choices.map((c: any) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('M3: shuffle=true, lockChoiceOrder=true → original order locked', async () => {
    const result = await model(
      { ...BASE_QUESTION, shuffle: true, lockChoiceOrder: true },
      {},
      GATHER_ENV
    );
    expect(result.choices.map((c: any) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('M4: shuffle=true, stored shuffle in session.data.shuffledValues → order restored', async () => {
    const session = { data: { shuffledValues: ['c', 'a', 'b'] } };
    const result = await model({ ...BASE_QUESTION, shuffle: true }, session, GATHER_ENV);
    expect(result.choices.map((c: any) => c.id)).toEqual(['c', 'a', 'b']);
  });

  it('M5: shuffle=true, stored shuffle in session.shuffledValues (legacy) → order restored', async () => {
    const session = { shuffledValues: ['b', 'c', 'a'] };
    const result = await model({ ...BASE_QUESTION, shuffle: true }, session, GATHER_ENV);
    expect(result.choices.map((c: any) => c.id)).toEqual(['b', 'c', 'a']);
  });

  it('M6: shuffle=true, stored shuffle has unknown id → known ids first, extras appended', async () => {
    const session = { data: { shuffledValues: ['c', 'a', 'unknown'] } };
    const result = await model({ ...BASE_QUESTION, shuffle: true }, session, GATHER_ENV);
    const ids = result.choices.map((c: any) => c.id);
    expect(ids[0]).toBe('c');
    expect(ids[1]).toBe('a');
    expect(ids[2]).toBe('b'); // leftover appended
    expect(ids).not.toContain('unknown');
  });

  it('M7: shuffle=true, no stored shuffle → shuffled; updateSession called with new order', async () => {
    const session = { id: 'sess-1', element: 'mc-populated-blank' };
    const updateSession = vi.fn().mockResolvedValue(undefined);
    await model({ ...BASE_QUESTION, shuffle: true }, session, GATHER_ENV, updateSession);
    expect(updateSession).toHaveBeenCalledOnce();
    const [id, element, data] = updateSession.mock.calls[0];
    expect(id).toBe('sess-1');
    expect(element).toBe('mc-populated-blank');
    expect(data.shuffledValues).toHaveLength(3);
    expect(new Set(data.shuffledValues)).toEqual(new Set(['a', 'b', 'c']));
  });

  it('M8: shuffle=true, no stored shuffle, no updateSession → shuffled silently without throw', async () => {
    const session = { id: 'sess-1', element: 'mc-populated-blank' };
    const result = await model({ ...BASE_QUESTION, shuffle: true }, session, GATHER_ENV);
    expect(result.choices).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// model — output fields
// ---------------------------------------------------------------------------

describe('model — output fields', () => {
  it('M9: evaluate mode → correctness, responseCorrect, correctChoiceId in output', async () => {
    const result = await model(BASE_QUESTION, { choiceId: 'b' }, EVALUATE_ENV);
    expect(result.correctness).toBe('correct');
    expect(result.responseCorrect).toBe(true);
    expect(result.correctChoiceId).toBe('b');
  });

  it('M10: gather mode → correctness fields absent', async () => {
    const result = await model(BASE_QUESTION, { choiceId: 'b' }, GATHER_ENV);
    expect(result.correctness).toBeUndefined();
    expect(result.responseCorrect).toBeUndefined();
    expect(result.correctChoiceId).toBeUndefined();
  });

  it('M11: instructor + view mode → teacherInstructions included when enabled', async () => {
    const q = {
      ...BASE_QUESTION,
      teacherInstructions: 'Do this.',
      teacherInstructionsEnabled: true,
    };
    const result = await model(q, {}, INSTRUCTOR_VIEW_ENV);
    expect(result.teacherInstructions).toBe('Do this.');
  });

  it('M12: student role → teacherInstructions always null', async () => {
    const q = {
      ...BASE_QUESTION,
      teacherInstructions: 'Do this.',
      teacherInstructionsEnabled: true,
    };
    const result = await model(q, {}, GATHER_ENV);
    expect(result.teacherInstructions).toBeNull();
  });

  it('M13: promptEnabled=true → prompt included', async () => {
    const q = { ...BASE_QUESTION, promptEnabled: true, prompt: '<p>Hello</p>' };
    const result = await model(q, {}, GATHER_ENV);
    expect(result.prompt).toBe('<p>Hello</p>');
  });

  it('M14: promptEnabled=false → prompt null', async () => {
    const q = { ...BASE_QUESTION, promptEnabled: false, prompt: '<p>Hello</p>' };
    const result = await model(q, {}, GATHER_ENV);
    expect(result.prompt).toBeNull();
  });

  it('M15: hasAudio=false → audioUrl null', async () => {
    const q = { ...BASE_QUESTION, hasAudio: false, audioUrl: 'https://example.com/a.mp3' };
    const result = await model(q, {}, GATHER_ENV);
    expect(result.audioUrl).toBeNull();
  });

  it('M16: hasAudio=true → audioUrl passed through', async () => {
    const q = { ...BASE_QUESTION, hasAudio: true, audioUrl: 'https://example.com/a.mp3' };
    const result = await model(q, {}, GATHER_ENV);
    expect(result.audioUrl).toBe('https://example.com/a.mp3');
  });

  it('M17: disabled=false in gather mode, disabled=true in view mode', async () => {
    const gather = await model(BASE_QUESTION, {}, GATHER_ENV);
    const view = await model(BASE_QUESTION, {}, { mode: 'view', role: 'student' });
    expect(gather.disabled).toBe(false);
    expect(view.disabled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validate
// ---------------------------------------------------------------------------

describe('validate', () => {
  it('V1: valid question → empty errors', () => {
    expect(validate(BASE_QUESTION)).toEqual({});
  });

  it('V2: promptEnabled + empty prompt → prompt error', () => {
    const errors = validate({ ...BASE_QUESTION, promptEnabled: true, prompt: '' });
    expect(errors.prompt).toBeTruthy();
  });

  it('V3: populate_blank with no blank token → template error', () => {
    const errors = validate({ ...BASE_QUESTION, template: '<p>No token here.</p>' });
    expect(errors.template).toBeTruthy();
  });

  it('V4: populate_blank with two blank tokens → template error', () => {
    const errors = validate({ ...BASE_QUESTION, template: '<p>{{blank}} and {{blank}}</p>' });
    expect(errors.template).toBeTruthy();
  });

  it('V5: audio_mc_only with a blank token in template → template error', () => {
    const errors = validate({
      ...BASE_QUESTION,
      interactionMode: 'audio_mc_only',
      template: '<p>{{blank}}</p>',
    });
    expect(errors.template).toBeTruthy();
  });

  it('V6: unknown interactionMode → interactionMode error', () => {
    const errors = validate({ ...BASE_QUESTION, interactionMode: 'unknown' as any });
    expect(errors.interactionMode).toBeTruthy();
  });

  it('V7: fewer than two choices → choices error', () => {
    const errors = validate({ ...BASE_QUESTION, choices: [CHOICES[0]] });
    expect(errors.choices).toBeTruthy();
  });

  it('V8: choice missing id → choices error', () => {
    const errors = validate({
      ...BASE_QUESTION,
      choices: [{ id: '', labelHtml: '<p>A</p>' }, CHOICES[1]],
    });
    expect(errors.choices).toBeTruthy();
  });

  it('V9: text mode choice missing labelHtml → choices error', () => {
    const errors = validate({
      ...BASE_QUESTION,
      choiceMode: 'text',
      choices: [{ id: 'a', labelHtml: '' }, CHOICES[1]],
    });
    expect(errors.choices).toBeTruthy();
  });

  it('V10: image mode choice missing imageUrl → choices error', () => {
    const errors = validate({
      ...BASE_QUESTION,
      choiceMode: 'image',
      choices: [
        { id: 'a', imageUrl: '', imageAlt: 'Alt' },
        { id: 'b', imageUrl: 'https://example.com/b.png', imageAlt: 'B' },
      ],
    });
    expect(errors.choices).toBeTruthy();
  });

  it('V11: image mode choice missing imageAlt → choices error', () => {
    const errors = validate({
      ...BASE_QUESTION,
      choiceMode: 'image',
      choices: [
        { id: 'a', imageUrl: 'https://example.com/a.png', imageAlt: '' },
        { id: 'b', imageUrl: 'https://example.com/b.png', imageAlt: 'B' },
      ],
    });
    expect(errors.choices).toBeTruthy();
  });

  it('V12: correctChoiceId not in choices → correctChoiceId error', () => {
    const errors = validate({ ...BASE_QUESTION, correctChoiceId: 'z' });
    expect(errors.correctChoiceId).toBeTruthy();
  });

  it('V13: hasAudio=true with no audioUrl → audioUrl error', () => {
    const errors = validate({ ...BASE_QUESTION, hasAudio: true, audioUrl: '' });
    expect(errors.audioUrl).toBeTruthy();
  });

  it('V14: layoutLimits with non-positive value → layoutLimits error', () => {
    const errors = validate({
      ...BASE_QUESTION,
      layoutLimits: { blankStandaloneWidthRem: -1 } as any,
    });
    expect(errors.layoutLimits).toBeTruthy();
  });

  it('V15: layoutLimits with valid positive value → no error', () => {
    const errors = validate({
      ...BASE_QUESTION,
      layoutLimits: { blankStandaloneWidthRem: 8 } as any,
    });
    expect(errors.layoutLimits).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// createCorrectResponseSession
// ---------------------------------------------------------------------------

describe('createCorrectResponseSession', () => {
  it('CR1: instructor + mode≠evaluate → session with correct choiceId', async () => {
    const result = await createCorrectResponseSession(BASE_QUESTION, {
      mode: 'view',
      role: 'instructor',
    });
    expect(result).toMatchObject({ choiceId: 'b' });
  });

  it('CR2: student role → null', async () => {
    const result = await createCorrectResponseSession(BASE_QUESTION, {
      mode: 'view',
      role: 'student',
    });
    expect(result).toBeNull();
  });

  it('CR3: evaluate mode (instructor) → null', async () => {
    const result = await createCorrectResponseSession(BASE_QUESTION, {
      mode: 'evaluate',
      role: 'instructor',
    });
    expect(result).toBeNull();
  });
});
