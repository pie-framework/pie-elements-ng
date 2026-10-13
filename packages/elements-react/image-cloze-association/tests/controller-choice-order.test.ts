import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { model } from '../src/controller/index.js';

const SUN = '<img alt="Sun" src="sun.png"/>';
const MOON = '<img alt="Moon" src="moon.png"/>';
const MARS = '<img alt="Mars" src="mars.png"/>';

const AUTHORED = [SUN, MOON, MARS];

// With Math.random at 0 the shuffle turns [sun, moon, mars] into [moon, mars, sun]. At 0.999 it
// keeps the authored order, so a render that shuffled again would return AUTHORED.
const SHUFFLED = [MOON, MARS, SUN];

const QUESTION = {
  shuffle: true,
  possible_responses: AUTHORED,
  response_containers: [{ x: 0, y: 0, width: '10%', height: '10%' }],
  validation: { valid_response: { score: 1, value: [{ images: [SUN] }] }, alt_responses: [] },
};

const GATHER = { mode: 'gather', role: 'student' };

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

describe('image-cloze-association model: possible response order', () => {
  it('saves the shuffle once and renders the same order again', async () => {
    const session = { id: '1', element: 'image-cloze-association' };
    const updateSession = playerUpdateSession(session);

    const first = await model(QUESTION, session, GATHER, updateSession);
    random.mockReturnValue(0.999);
    const second = await model(
      QUESTION,
      session,
      { mode: 'evaluate', role: 'student' },
      updateSession
    );

    expect(first.possibleResponses).toEqual(SHUFFLED);
    expect(second.possibleResponses).toEqual(SHUFFLED);
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith('1', 'image-cloze-association', {
      shuffledValues: SHUFFLED,
    });
  });

  it('gives an instructor the order the student saw', async () => {
    const stored = [MARS, SUN, MOON];
    const session = { id: '1', element: 'image-cloze-association', shuffledValues: stored };
    const updateSession = vi.fn(() => Promise.resolve());

    const result = await model(
      QUESTION,
      session,
      { mode: 'view', role: 'instructor' },
      updateSession
    );

    expect(result.possibleResponses).toEqual(stored);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('keeps the authored order under lockChoiceOrder', async () => {
    const session = { id: '1', element: 'image-cloze-association' };
    const updateSession = playerUpdateSession(session);

    const result = await model(
      { ...QUESTION, lockChoiceOrder: true },
      session,
      GATHER,
      updateSession
    );

    expect(result.possibleResponses).toEqual(AUTHORED);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("keeps the authored order under env['@pie-element'].lockChoiceOrder", async () => {
    const session = { id: '1', element: 'image-cloze-association' };
    const updateSession = playerUpdateSession(session);
    const env = { ...GATHER, '@pie-element': { lockChoiceOrder: true } };

    const result = await model(QUESTION, session, env, updateSession);

    expect(result.possibleResponses).toEqual(AUTHORED);
    expect(updateSession).not.toHaveBeenCalled();
  });
});
