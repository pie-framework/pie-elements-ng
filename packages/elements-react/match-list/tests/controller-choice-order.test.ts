import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { model } from '../src/controller/index.js';

const prompt = (id: number) => ({ id, title: `Prompt ${id}`, relatedAnswer: id + 3 });
const answer = (id: number) => ({ id, title: `Answer ${id}` });

// Prompt 0 checks that an id of 0 is saved like any other.
const QUESTION = {
  prompts: [prompt(0), prompt(1), prompt(2)],
  answers: [answer(3), answer(4), answer(5)],
  lockChoiceOrder: false,
};

const AUTHORED = { prompts: [0, 1, 2], answers: [3, 4, 5] };

// With Math.random at 0 the shuffle turns [0, 1, 2] into [1, 2, 0]. At 0.999 it keeps the
// authored order, so a render that shuffled again would return AUTHORED.
const SHUFFLED = { prompts: [1, 2, 0], answers: [4, 5, 3] };

const GATHER = { mode: 'gather', role: 'student' };

/** The prompt and answer ids, in the order the model returns them. */
const order = (viewModel: any) => ({
  prompts: viewModel.config.prompts.map((item: any) => item.id),
  answers: viewModel.config.answers.map((item: any) => item.id),
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

describe('match-list model: choice order', () => {
  it('saves the prompt and answer shuffles once and renders the same order again', async () => {
    const session = { id: '1', element: 'match-list' };
    const updateSession = playerUpdateSession(session);

    const first = await model(QUESTION, session, GATHER, updateSession);
    random.mockReturnValue(0.999);
    const second = await model(QUESTION, session, GATHER, updateSession);

    expect(order(first)).toEqual(SHUFFLED);
    expect(order(second)).toEqual(SHUFFLED);
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith('1', 'match-list', { shuffledValues: SHUFFLED });
  });

  it('gives an instructor the order the student saw', async () => {
    const stored = { prompts: [2, 0, 1], answers: [5, 3, 4] };
    const session = { id: '1', element: 'match-list', shuffledValues: stored };
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

  it.each([
    ['lockChoiceOrder', { ...QUESTION, lockChoiceOrder: true }, GATHER],
    [
      "env['@pie-element'].lockChoiceOrder",
      QUESTION,
      { ...GATHER, '@pie-element': { lockChoiceOrder: true } },
    ],
  ])('keeps the authored order under %s', async (_lock, question, env) => {
    const session = { id: '1', element: 'match-list' };
    const updateSession = playerUpdateSession(session);

    const result = await model(question, session, env, updateSession);

    expect(order(result)).toEqual(AUTHORED);
    expect(updateSession).not.toHaveBeenCalled();
  });
});
