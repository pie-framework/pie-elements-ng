import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { model } from '../src/controller/index.js';

const part = (values: string[], lockChoiceOrder = false) => ({
  choiceMode: 'radio',
  choices: values.map((value, index) => ({ value, label: value, correct: index === 0 })),
  lockChoiceOrder,
});

const QUESTION = { partA: part(['a', 'b', 'c']), partB: part(['d', 'e', 'f']) };

const AUTHORED = { partA: ['a', 'b', 'c'], partB: ['d', 'e', 'f'] };

// With Math.random at 0 the shuffle turns [a, b, c] into [b, c, a]. At 0.999 it keeps the
// authored order, so a render that shuffled again would return AUTHORED.
const SHUFFLED = { partA: ['b', 'c', 'a'], partB: ['e', 'f', 'd'] };

const GATHER = { mode: 'gather', role: 'student' };

/** The choice values of each part, in the order the model returns them. */
const order = (viewModel: any) => ({
  partA: viewModel.partA.choices.map((choice: any) => choice.value),
  partB: viewModel.partB.choices.map((choice: any) => choice.value),
});

/** Writes onto the session it was rendered with, as pie-players' updateSession does. */
const playerUpdateSession = (session: Record<string, unknown>) =>
  vi.fn((_id: string, _element: string, properties: Record<string, unknown>) => {
    Object.assign(session, properties);
    return Promise.resolve();
  });

let random: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  random = vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ebsr model: choice order', () => {
  it("saves each part's shuffle once and renders the same order again", async () => {
    const session = { id: '1', element: 'ebsr' };
    const updateSession = playerUpdateSession(session);

    const first = await model(QUESTION, session, GATHER, updateSession);
    random.mockReturnValue(0.999);
    const second = await model(QUESTION, session, GATHER, updateSession);

    expect(order(first)).toEqual(SHUFFLED);
    expect(order(second)).toEqual(SHUFFLED);
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith('1', 'ebsr', { shuffledValues: SHUFFLED });
  });

  it('gives an instructor the order the student saw', async () => {
    const stored = { partA: ['c', 'a', 'b'], partB: ['f', 'd', 'e'] };
    const session = { id: '1', element: 'ebsr', shuffledValues: stored };
    const updateSession = vi.fn(() => Promise.resolve());

    const result = await model(
      QUESTION,
      session,
      { mode: 'view', role: 'instructor' },
      updateSession
    );

    expect(order(result)).toEqual(stored);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("keeps a part's authored order under its lockChoiceOrder", async () => {
    const session = { id: '1', element: 'ebsr' };
    const updateSession = playerUpdateSession(session);
    const question = { partA: part(['a', 'b', 'c'], true), partB: part(['d', 'e', 'f']) };

    const result = await model(question, session, GATHER, updateSession);

    expect(order(result)).toEqual({ partA: AUTHORED.partA, partB: SHUFFLED.partB });
    expect(updateSession).toHaveBeenCalledWith('1', 'ebsr', {
      shuffledValues: { partB: SHUFFLED.partB },
    });
  });

  it("keeps the authored order under env['@pie-element'].lockChoiceOrder", async () => {
    const session = { id: '1', element: 'ebsr' };
    const updateSession = playerUpdateSession(session);
    const env = { ...GATHER, '@pie-element': { lockChoiceOrder: true } };

    const result = await model(QUESTION, session, env, updateSession);

    expect(order(result)).toEqual(AUTHORED);
    expect(updateSession).not.toHaveBeenCalled();
  });
});
