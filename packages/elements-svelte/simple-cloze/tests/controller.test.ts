// Controllers also run server-side, so these run without a DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  createCorrectResponseSession,
  getCorrectness,
  getPartialScore,
  model,
  outcome,
  validate,
} from '../src/controller/index.js';

// A player creates every session entry with `id` and its versioned tag before
// the learner types anything.
const TAG = 'simple-cloze--version-0-0-0-controller-test';
const QUESTION = {
  id: '1',
  element: 'simple-cloze',
  prompt: '<p>What is 2 + 2?</p>',
  correctAnswer: '4',
};

describe('outcome', () => {
  it('reports a player session with no response as empty', async () => {
    const result = await outcome(QUESTION, { id: '1', element: TAG }, { mode: 'evaluate' });

    expect(result).toEqual({ score: 0, empty: true, traceLog: expect.any(Array) });
    expect(result.traceLog.length).toBeGreaterThan(0);
  });

  it('reports a whitespace-only response as empty', async () => {
    const result = await outcome(QUESTION, { id: '1', element: TAG, value: '   ' }, {});

    expect(result.empty).toBe(true);
    expect(result.score).toBe(0);
  });

  it('scores a matching response 1, ignoring case and extra spaces', async () => {
    const result = await outcome(
      { ...QUESTION, correctAnswer: 'New York' },
      { id: '1', element: TAG, value: '  new   york ' },
      { mode: 'evaluate' }
    );

    expect(result).toEqual({ score: 1, empty: false, traceLog: expect.any(Array) });
    expect(result.traceLog.at(-1)).toBe('Final score: 1.');
  });

  it('scores an answer key authored as HTML against the plain text typed', async () => {
    const cases: [string, string][] = [
      ['<p>Salt &amp; pepper</p>', 'salt & pepper'],
      ['<p>caf&eacute;&nbsp;au&#32;lait</p>', 'Café au lait'],
      ['<p>&#x3C0; r&sup2;</p>', 'π r²'],
      ['<p><strong>Par</strong>is</p>', 'paris'],
      ['<p>New</p><p>York</p>', 'new york'],
      ['New<br>York', 'new york'],
    ];
    for (const [correctAnswer, value] of cases) {
      const result = await outcome(
        { ...QUESTION, correctAnswer },
        { id: '1', element: TAG, value }
      );
      expect(result.score, correctAnswer).toBe(1);
    }
  });

  it('reads a `<` that opens no tag as text', async () => {
    for (const correctAnswer of ['3 < 5', '3 &lt; 5', 'a < b > c']) {
      const value = correctAnswer.replace('&lt;', '<');
      const result = await outcome(
        { ...QUESTION, correctAnswer },
        { id: '1', element: TAG, value }
      );
      expect(result.score, correctAnswer).toBe(1);
    }
  });

  it('does not match markup against its source', async () => {
    const result = await outcome(
      { ...QUESTION, correctAnswer: '<p>4</p>' },
      { id: '1', element: TAG, value: '<p>5</p>' }
    );

    expect(result.score).toBe(0);
  });

  it('scores a non-matching response 0 and not empty', async () => {
    const result = await outcome(QUESTION, { id: '1', element: TAG, value: '5' }, {});

    expect(result).toEqual({ score: 0, empty: false, traceLog: expect.any(Array) });
  });

  it('scores outside evaluate mode', async () => {
    // Players score with whatever env they hold; there is no mode gate.
    const session = { id: '1', element: TAG, value: '4' };
    const result = await outcome(QUESTION, session, { mode: 'gather' });

    expect(result.score).toBe(1);
  });

  it('accepts an omitted env', async () => {
    const result = await outcome(QUESTION, { id: '1', element: TAG, value: '4' });

    expect(result.score).toBe(1);
  });

  it('does not score a whitespace response against an empty answer key', async () => {
    const result = await outcome(
      { ...QUESTION, correctAnswer: '' },
      { id: '1', element: TAG, value: '  ' },
      { mode: 'evaluate' }
    );

    expect(result).toMatchObject({ score: 0, empty: true });
  });

  it('never scores a response against a blank answer key', async () => {
    for (const correctAnswer of ['', '   ', '<p>&nbsp;</p>', undefined]) {
      const result = await outcome(
        { ...QUESTION, correctAnswer },
        { id: '1', element: TAG, value: 'x' },
        { mode: 'evaluate' }
      );
      expect(result).toMatchObject({ score: 0, empty: false });
    }
  });

  it('leaves the session untouched', async () => {
    const session = { id: '1', element: TAG, value: '4' };

    await outcome(QUESTION, session, {});

    expect(session).toEqual({ id: '1', element: TAG, value: '4' });
  });
});

describe('getCorrectness', () => {
  it('treats a trimmed-empty response as unanswered', () => {
    expect(getCorrectness(QUESTION, { value: '  ' })).toBe('unanswered');
    expect(getCorrectness(QUESTION, { id: '1', element: TAG })).toBe('unanswered');
    expect(getCorrectness(QUESTION, null)).toBe('unanswered');
  });

  it('never marks a whitespace response correct against a blank key', () => {
    expect(getCorrectness({ ...QUESTION, correctAnswer: '' }, { value: ' ' })).toBe('unanswered');
    expect(getCorrectness({ ...QUESTION, correctAnswer: '  ' }, { value: 'a' })).toBe('incorrect');
  });
});

describe('getPartialScore', () => {
  it('follows correctness', () => {
    expect(getPartialScore(QUESTION, { id: '1', element: TAG, value: '4' })).toBe(1);
    expect(getPartialScore(QUESTION, { id: '1', element: TAG, value: '5' })).toBe(0);
    expect(getPartialScore(QUESTION, { id: '1', element: TAG })).toBe(0);
  });
});

describe('validate', () => {
  it('rejects a blank correct answer', () => {
    expect(validate({ ...QUESTION, correctAnswer: '' }).correctAnswer).toBeTruthy();
    expect(validate({ ...QUESTION, correctAnswer: '   ' }).correctAnswer).toBeTruthy();
    expect(validate({ prompt: QUESTION.prompt }).correctAnswer).toBeTruthy();
  });

  it('accepts a model with a correct answer', () => {
    expect(validate(QUESTION)).toEqual({});
  });

  it('requires the prompt only when the configuration says so', () => {
    const noPrompt = { ...QUESTION, prompt: '<p></p>' };

    expect(validate(noPrompt).prompt).toBeUndefined();
    expect(validate(noPrompt, { prompt: { required: true } }).prompt).toBeTruthy();
    expect(validate(QUESTION, { prompt: { required: true } }).prompt).toBeUndefined();
  });
});

describe('createCorrectResponseSession', () => {
  it('returns the answer key without an `element` for an instructor', async () => {
    const session = await createCorrectResponseSession(QUESTION, {
      mode: 'gather',
      role: 'instructor',
    });

    expect(session).toEqual({ id: '1', value: '4' });
    expect(session).not.toHaveProperty('element');
  });

  it('returns an HTML answer key as the text a learner would type', async () => {
    const session = await createCorrectResponseSession(
      { ...QUESTION, correctAnswer: '<p>Salt &amp; pepper</p>' },
      { mode: 'gather', role: 'instructor' }
    );

    expect(session).toEqual({ id: '1', value: 'Salt & pepper' });
  });

  it('returns null for a student', async () => {
    expect(
      await createCorrectResponseSession(QUESTION, { mode: 'gather', role: 'student' })
    ).toBeNull();
  });
});

describe('model', () => {
  const session = { id: '1', element: TAG, value: '5' };

  for (const mode of ['gather', 'view']) {
    for (const role of ['student', 'instructor']) {
      it(`exposes no answer key in ${mode} mode for a ${role}`, async () => {
        const out = await model(QUESTION, session, { mode, role });

        expect(out).not.toHaveProperty('correctAnswer');
        expect(out).not.toHaveProperty('correctness');
        expect(JSON.stringify(out)).not.toContain('"4"');
      });
    }
  }

  it('returns `mode` and `role` rather than the whole env', async () => {
    const out = await model(QUESTION, session, { mode: 'gather', role: 'student' });

    expect(out.mode).toBe('gather');
    expect(out.role).toBe('student');
    expect(out).not.toHaveProperty('env');
    expect(out.disabled).toBe(false);
  });

  it('sends teacher instructions to an instructor unless they are turned off', async () => {
    const question = { ...QUESTION, teacherInstructions: '<p>Read aloud.</p>' };
    const instructor = { mode: 'view', role: 'instructor' };

    expect((await model(question, session, instructor)).teacherInstructions).toBe(
      '<p>Read aloud.</p>'
    );
    expect(
      (await model({ ...question, teacherInstructionsEnabled: false }, session, instructor))
        .teacherInstructions
    ).toBeNull();
    expect(
      (await model(question, session, { mode: 'view', role: 'student' })).teacherInstructions
    ).toBeNull();
  });

  it('leaves view mode to `mode` and `disabled`', async () => {
    const out = await model(QUESTION, session, { mode: 'view', role: 'student' });

    expect(out).toMatchObject({ mode: 'view', disabled: true });
    expect(out).not.toHaveProperty('view');
  });

  it('returns an HTML answer key as plain text in evaluate mode', async () => {
    const out = await model({ ...QUESTION, correctAnswer: '<p>Salt &amp; pepper</p>' }, session, {
      mode: 'evaluate',
      role: 'instructor',
    });

    expect(out.correctAnswer).toBe('Salt & pepper');
  });

  it('returns correctness and the answer key in evaluate mode', async () => {
    const out = await model(QUESTION, session, { mode: 'evaluate', role: 'student' });

    expect(out).toMatchObject({
      mode: 'evaluate',
      disabled: true,
      correctness: 'incorrect',
      correctAnswer: '4',
    });
  });

  it('omits the prompt when it is disabled', async () => {
    const out = await model({ ...QUESTION, promptEnabled: false }, session, { mode: 'gather' });

    expect(out.prompt).toBeNull();
  });

  it('passes the language through for the translated strings', async () => {
    const out = await model({ ...QUESTION, language: 'es_ES' }, session, { mode: 'gather' });

    expect(out.language).toBe('es_ES');
  });
});
