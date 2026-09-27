import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getShuffledChoices, lockChoices } from '../src/persistence.js';

const CHOICES = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];

// With Math.random pinned at 0, the Fisher-Yates shuffle turns [a, b, c] into [b, c, a].
const SHUFFLED = ['b', 'c', 'a'];

const values = (choices: { value: unknown }[] | undefined) => choices?.map((c) => c.value);

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getShuffledChoices', () => {
  it('saves a new shuffle under the session id and element', async () => {
    const updateSession = vi.fn().mockResolvedValue(undefined);
    const session = { id: '1', element: 'pie-element' };

    const result = await getShuffledChoices(CHOICES, session, updateSession, 'value');

    expect(values(result)).toEqual(SHUFFLED);
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith('1', 'pie-element', { shuffledValues: SHUFFLED });
  });

  // An element that shuffles each of its parts passes a stand-in session per part, and its
  // own updater collects the order under that part.
  it('saves a new shuffle for a stand-in session with no id or element', async () => {
    const updateSession = vi.fn().mockResolvedValue(undefined);

    const result = await getShuffledChoices(
      CHOICES,
      { shuffledValues: [] },
      updateSession,
      'value'
    );

    expect(values(result)).toEqual(SHUFFLED);
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(updateSession).toHaveBeenCalledWith(undefined, undefined, { shuffledValues: SHUFFLED });
  });

  it('returns the stored order and saves nothing', async () => {
    const updateSession = vi.fn().mockResolvedValue(undefined);
    const session = { id: '1', element: 'pie-element', shuffledValues: ['c', 'a', 'b'] };

    const result = await getShuffledChoices(CHOICES, session, updateSession, 'value');

    expect(values(result)).toEqual(['c', 'a', 'b']);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('reads a stored order from session.data ahead of session.shuffledValues', async () => {
    const session = { data: { shuffledValues: ['c', 'b', 'a'] }, shuffledValues: ['a', 'c', 'b'] };

    const result = await getShuffledChoices(CHOICES, session, vi.fn(), 'value');

    expect(values(result)).toEqual(['c', 'b', 'a']);
  });

  it('returns only the choices a stored order lists', async () => {
    const session = { shuffledValues: ['c', 'removed', 'a'] };

    const result = await getShuffledChoices(CHOICES, session, vi.fn(), 'value');

    expect(values(result)).toEqual(['c', 'a']);
  });

  it('saves 0 as a choice key', async () => {
    const updateSession = vi.fn().mockResolvedValue(undefined);
    const choices = [{ value: 0 }, { value: 1 }];

    await getShuffledChoices(choices, { id: '1', element: 'pie-element' }, updateSession, 'value');

    expect(updateSession).toHaveBeenCalledWith('1', 'pie-element', { shuffledValues: [1, 0] });
  });

  it('treats a stored [null] as no order and saves a new shuffle', async () => {
    const updateSession = vi.fn().mockResolvedValue(undefined);
    const session = {
      id: '1',
      element: 'pie-element',
      shuffledValues: [null as unknown as string],
    };

    const result = await getShuffledChoices(CHOICES, session, updateSession, 'value');

    expect(values(result)).toEqual(SHUFFLED);
    expect(updateSession).toHaveBeenCalledWith('1', 'pie-element', { shuffledValues: SHUFFLED });
  });

  it('saves nothing when no choice has the key', async () => {
    const updateSession = vi.fn().mockResolvedValue(undefined);

    await getShuffledChoices(CHOICES, {}, updateSession, 'missing');

    expect(updateSession).not.toHaveBeenCalled();
  });

  it('returns undefined without a session', async () => {
    const updateSession = vi.fn().mockResolvedValue(undefined);

    const result = await getShuffledChoices(CHOICES, undefined, updateSession, 'value');

    expect(result).toBeUndefined();
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('returns the shuffle when saving it fails', async () => {
    const updateSession = vi.fn().mockRejectedValue(new Error('save failed'));
    const session = { id: '1', element: 'pie-element' };

    const result = await getShuffledChoices(CHOICES, session, updateSession, 'value');

    expect(values(result)).toEqual(SHUFFLED);
  });

  it('shuffles without saving when there is no updateSession', async () => {
    const result = await getShuffledChoices(CHOICES, { id: '1', element: 'pie-element' });

    expect(values(result)).toEqual(SHUFFLED);
  });
});

describe('lockChoices', () => {
  const env = (lockChoiceOrder?: boolean, role: 'student' | 'instructor' = 'student') => ({
    '@pie-element': { lockChoiceOrder },
    role,
  });

  // PIE-714: the role plays no part, so an instructor sees the order the student saw.
  it.each([
    { modelLock: true, envLock: true, role: 'student', expected: true },
    { modelLock: true, envLock: false, role: 'student', expected: true },
    { modelLock: false, envLock: true, role: 'student', expected: true },
    { modelLock: false, envLock: false, role: 'student', expected: false },
    { modelLock: undefined, envLock: true, role: 'student', expected: true },
    { modelLock: undefined, envLock: false, role: 'student', expected: false },
    { modelLock: undefined, envLock: undefined, role: 'student', expected: false },
    { modelLock: true, envLock: false, role: 'instructor', expected: true },
    { modelLock: false, envLock: true, role: 'instructor', expected: true },
    { modelLock: false, envLock: false, role: 'instructor', expected: false },
    { modelLock: undefined, envLock: undefined, role: 'instructor', expected: false },
  ] as const)(
    'model lock $modelLock, env lock $envLock, $role: locked is $expected',
    ({ modelLock, envLock, role, expected }) => {
      expect(lockChoices({ lockChoiceOrder: modelLock }, undefined, env(envLock, role))).toBe(
        expected
      );
    }
  );

  it('follows the model when there is no env', () => {
    expect(lockChoices({ lockChoiceOrder: true }, undefined, undefined)).toBe(true);
    expect(lockChoices({ lockChoiceOrder: false }, undefined, undefined)).toBe(false);
  });

  it('ignores the session', () => {
    const session = { shuffledValues: ['a', 'b'] };

    expect(lockChoices({ lockChoiceOrder: false }, session, env(false, 'instructor'))).toBe(false);
    expect(lockChoices({ lockChoiceOrder: true }, session, env(false, 'instructor'))).toBe(true);
  });
});
