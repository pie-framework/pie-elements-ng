import type { PieEnvironment } from '@pie-shared/types';
import { describe, expect, it, vi } from 'vitest';
import { clamp, debounce, isEmpty, showFeedback, showRationale, shuffle, uuid } from './utils';

describe('isEmpty', () => {
  it('returns true for null', () => {
    expect(isEmpty(null)).toBe(true);
  });

  it('returns true for undefined', () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  it('returns true for empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('returns false for object with properties', () => {
    expect(isEmpty({ id: 'test' })).toBe(false);
  });

  it('returns false for session with only id', () => {
    expect(isEmpty({ id: 'session-1' })).toBe(false);
  });
});

describe('showFeedback', () => {
  it('returns true when mode is evaluate and feedback is enabled', () => {
    const env: PieEnvironment = { mode: 'evaluate', role: 'student' };
    expect(showFeedback(env, true)).toBe(true);
  });

  it('returns false when mode is evaluate and feedback is disabled', () => {
    const env: PieEnvironment = { mode: 'evaluate', role: 'student' };
    expect(showFeedback(env, false)).toBe(false);
  });

  it('returns false when mode is gather and feedback is enabled', () => {
    const env: PieEnvironment = { mode: 'gather', role: 'student' };
    expect(showFeedback(env, true)).toBe(false);
  });

  it('returns false when mode is view and feedback is enabled', () => {
    const env: PieEnvironment = { mode: 'view', role: 'student' };
    expect(showFeedback(env, true)).toBe(false);
  });
});

describe('showRationale', () => {
  it('returns true when mode is evaluate, rationale enabled, and role is instructor', () => {
    const env: PieEnvironment = { mode: 'evaluate', role: 'instructor' };
    expect(showRationale(env, true)).toBe(true);
  });

  it('returns false when mode is evaluate, rationale enabled, but role is student', () => {
    const env: PieEnvironment = { mode: 'evaluate', role: 'student' };
    expect(showRationale(env, true)).toBe(false);
  });

  it('returns false when mode is evaluate, role is instructor, but rationale disabled', () => {
    const env: PieEnvironment = { mode: 'evaluate', role: 'instructor' };
    expect(showRationale(env, false)).toBe(false);
  });

  it('returns false when mode is gather, rationale enabled, and role is instructor', () => {
    const env: PieEnvironment = { mode: 'gather', role: 'instructor' };
    expect(showRationale(env, true)).toBe(false);
  });

  it('returns false when mode is view, rationale enabled, and role is instructor', () => {
    const env: PieEnvironment = { mode: 'view', role: 'instructor' };
    expect(showRationale(env, true)).toBe(false);
  });
});

describe('clamp', () => {
  it('returns min when value is below min', () => {
    expect(clamp(5, 10, 20)).toBe(10);
  });

  it('returns max when value is above max', () => {
    expect(clamp(25, 10, 20)).toBe(20);
  });

  it('returns value when within range', () => {
    expect(clamp(15, 10, 20)).toBe(15);
  });

  it('returns min when value equals min', () => {
    expect(clamp(10, 10, 20)).toBe(10);
  });

  it('returns max when value equals max', () => {
    expect(clamp(20, 10, 20)).toBe(20);
  });

  it('handles negative numbers', () => {
    expect(clamp(-5, -10, 0)).toBe(-5);
    expect(clamp(-15, -10, 0)).toBe(-10);
    expect(clamp(5, -10, 0)).toBe(0);
  });

  it('handles decimal numbers', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(-0.5, 0, 1)).toBe(0);
  });
});

describe('uuid', () => {
  it('generates a valid UUID', () => {
    const id = uuid();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidRegex);
  });

  it('generates unique UUIDs', () => {
    const id1 = uuid();
    const id2 = uuid();
    expect(id1).not.toBe(id2);
  });

  it('generates 100 unique UUIDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => uuid()));
    expect(ids.size).toBe(100);
  });
});

describe('debounce', () => {
  it('delays function execution', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('cancels previous calls', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes arguments correctly', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('uses latest arguments when called multiple times', async () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('first');
    debounced('second');
    debounced('third');

    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(fn).toHaveBeenCalledOnce();
    expect(fn).toHaveBeenCalledWith('third');
  });
});

describe('shuffle', () => {
  it('returns array with same length', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result.length).toBe(input.length);
  });

  it('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result.sort()).toEqual(input);
  });

  it('does not mutate original array', () => {
    const input = [1, 2, 3, 4, 5];
    const original = [...input];
    shuffle(input);
    expect(input).toEqual(original);
  });

  it('produces same result with same seed', () => {
    const input = [1, 2, 3, 4, 5];
    const result1 = shuffle(input, 12345);
    const result2 = shuffle(input, 12345);
    expect(result1).toEqual(result2);
  });

  it('produces different results with different seeds', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result1 = shuffle(input, 12345);
    const result2 = shuffle(input, 54321);
    expect(result1).not.toEqual(result2);
  });

  it('produces different results without seed', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result1 = shuffle(input);
    const result2 = shuffle(input);
    // This might occasionally fail due to random chance, but extremely unlikely with 10 elements
    expect(result1).not.toEqual(result2);
  });

  it('handles empty array', () => {
    const result = shuffle([]);
    expect(result).toEqual([]);
  });

  it('handles single element', () => {
    const result = shuffle([1]);
    expect(result).toEqual([1]);
  });

  it('handles two elements', () => {
    const input = ['a', 'b'];
    const result = shuffle(input, 12345);
    expect(result.length).toBe(2);
    expect(result).toContain('a');
    expect(result).toContain('b');
  });
});
