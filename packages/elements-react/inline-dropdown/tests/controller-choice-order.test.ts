import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { model } from '../src/controller/index.js';

const QUESTION = {
  markup: '<p>The {{0}} jumped {{1}} the moon.</p>',
  choices: {
    0: [
      { label: 'cow', value: 'a', correct: true },
      { label: 'dog', value: 'b' },
      { label: 'cat', value: 'c' },
    ],
    1: [
      { label: 'over', value: 'd', correct: true },
      { label: 'under', value: 'e' },
      { label: 'past', value: 'f' },
    ],
  },
};

const AUTHORED = { 0: ['a', 'b', 'c'], 1: ['d', 'e', 'f'] };

// With Math.random at 0 the shuffle turns [a, b, c] into [b, c, a]. At 0.999 it keeps the
// authored order, so a render that shuffled again would return AUTHORED.
const SHUFFLED = { 0: ['b', 'c', 'a'], 1: ['e', 'f', 'd'] };

const GATHER = { mode: 'gather', role: 'student' };

/** The choice values of each area, in the order the model returns them. */
const order = (viewModel: any) =>
  Object.fromEntries(
    Object.entries(viewModel.choices).map(([key, choices]: [string, any]) => [
      key,
      choices.map((choice: any) => choice.value),
    ])
  );

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

describe('inline-dropdown model: choice order', () => {
  it("saves each area's shuffle once and renders the same order again", async () => {
    const session = { id: '1', element: 'inline-dropdown' };
    const updateSession = playerUpdateSession(session);

    const first = await model(QUESTION, session, GATHER, updateSession);
    random.mockReturnValue(0.999);
    const second = await model(QUESTION, session, GATHER, updateSession);

    expect(order(first)).toEqual(SHUFFLED);
    expect(order(second)).toEqual(SHUFFLED);
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith('1', 'inline-dropdown', {
      shuffledValues: SHUFFLED,
    });
  });

  it('gives an instructor the order the student saw', async () => {
    const stored = { 0: ['c', 'a', 'b'], 1: ['f', 'd', 'e'] };
    const session = { id: '1', element: 'inline-dropdown', shuffledValues: stored };
    const updateSession = vi.fn(() => Promise.resolve());

    const result = await model(
      { ...QUESTION, choiceRationaleEnabled: false },
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
    const session = { id: '1', element: 'inline-dropdown' };
    const updateSession = playerUpdateSession(session);

    const result = await model(question, session, env, updateSession);

    expect(order(result)).toEqual(AUTHORED);
    expect(updateSession).not.toHaveBeenCalled();
  });
});
