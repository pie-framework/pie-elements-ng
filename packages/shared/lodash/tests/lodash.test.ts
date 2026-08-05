import { describe, expect, it, vi } from 'vitest';
import {
  assign,
  chunk,
  clone,
  cloneDeep,
  compact,
  debounce,
  defaults,
  difference,
  differenceWith,
  every,
  escape as escapeHtml,
  find,
  findKey,
  flatten,
  flatMap,
  forEach,
  get,
  groupBy,
  head,
  includes,
  initial,
  intersection,
  isArray,
  isEmpty,
  isEqual,
  isEqualWith,
  isFinite as isFiniteValue,
  isFunction,
  isNumber,
  isObject,
  isString,
  isUndefined,
  map,
  max,
  merge,
  omit,
  omitBy,
  pick,
  range,
  rangeRight,
  reduce,
  remove,
  set,
  shuffle,
  tail,
  takeRight,
  throttle,
  times,
  uniqueId,
  uniq,
  uniqWith,
  zip,
} from '../src/index.js';

describe('vendored lodash helpers', () => {
  it('implements array helpers without mutating unless lodash mutates', () => {
    const values = [1, 2, 3, 4];

    expect(chunk(values, 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(compact([0, 1, false, 2, '', 3])).toEqual([1, 2, 3]);
    expect(difference([1, 2, 3], [2])).toEqual([1, 3]);
    expect(flatten([[1], [2, 3]])).toEqual([1, 2, 3]);
    expect(head(values)).toBe(1);
    expect(initial(values)).toEqual([1, 2, 3]);
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
    expect(tail(values)).toEqual([2, 3, 4]);
    expect(takeRight(values, 2)).toEqual([3, 4]);
    expect(uniq([1, 1, 2, 2])).toEqual([1, 2]);
    expect(uniqWith([{ id: 1 }, { id: 1 }], (a, b) => a.id === b.id)).toEqual([{ id: 1 }]);

    const mutable = [1, 2, 3, 4];
    expect(remove(mutable, (value) => value % 2 === 0)).toEqual([2, 4]);
    expect(mutable).toEqual([1, 3]);
  });

  it('implements object path and clone helpers', () => {
    const source = { a: { b: [{ c: 1 }] }, value: undefined };

    expect(get(source, 'a.b[0].c')).toBe(1);
    expect(get(source, ['a', 'missing'], 'fallback')).toBe('fallback');
    expect(set({}, 'a.b[0].c', 2)).toEqual({ a: { b: [{ c: 2 }] } });
    expect(pick({ a: 1, b: 2, c: 3 }, ['a'])).toEqual({ a: 1 });
    expect(pick({ a: 1, b: 2, c: 3 }, 'a', 'b')).toEqual({ a: 1, b: 2 });
    expect(omit({ a: 1, b: 2 }, ['b'])).toEqual({ a: 1 });
    expect(omitBy(source, isUndefined)).toEqual({ a: source.a });
    expect(defaults({ a: 1 }, { a: 2, b: 3 })).toEqual({ a: 1, b: 3 });
    expect(assign({ a: 1 }, { b: 2 }, { a: 3 })).toEqual({ a: 3, b: 2 });
    expect(merge({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({ a: { b: 1, c: 2 } });

    const shallow = clone(source);
    const deep = cloneDeep(source);
    expect(shallow).not.toBe(source);
    expect(shallow.a).toBe(source.a);
    expect(deep.a).not.toBe(source.a);
    expect(deep).toEqual(source);
  });

  it('matches lodash get by preferring literal dotted keys before path traversal', () => {
    const source = {
      'partA.choiceMode': { label: 'Choice mode' },
      partA: { choiceMode: 'radio' },
    };

    expect(get(source, 'partA.choiceMode')).toEqual({ label: 'Choice mode' });
    expect(get(source, ['partA', 'choiceMode'])).toBe('radio');
  });

  it('implements equality and collection helpers', () => {
    expect(isEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
    expect(isEqualWith(1, '1', (a, b) => String(a) === String(b))).toBe(true);
    expect(
      isEqualWith({ value: 1.001 }, { value: 1.002 }, (a, b) =>
        typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 0.01 : undefined
      )
    ).toBe(true);
    expect(differenceWith([{ id: 1 }, { id: 2 }], [{ id: 2 }], (a, b) => a.id === b.id)).toEqual([
      { id: 1 },
    ]);
    expect(every([2, 4], (value) => value % 2 === 0)).toBe(true);
    expect(find([{ id: 1 }, { id: 2 }], { id: 2 })).toEqual({ id: 2 });
    expect(findKey({ a: { active: false }, b: { active: true } }, { active: true })).toBe('b');
    expect(flatMap([1, 2], (value) => [value, value * 2])).toEqual([1, 2, 2, 4]);
    const visited: string[] = [];
    forEach({ a: 1, b: 2 }, (value, key) => visited.push(`${key}:${value}`));
    expect(visited).toEqual(['a:1', 'b:2']);
    expect(groupBy(['one', 'two', 'six'], 'length')).toEqual({ '3': ['one', 'two', 'six'] });
    expect(includes(['a', 'b'], 'b')).toBe(true);
    expect(map({ a: 1, b: 2 }, (value) => value * 2)).toEqual([2, 4]);
    expect(reduce([1, 2, 3], (sum, value) => sum + value, 0)).toBe(6);
  });

  it('implements type, range, and id helpers', () => {
    expect(isArray([])).toBe(true);
    expect(isEmpty({})).toBe(true);
    expect(isEmpty([1])).toBe(false);
    expect(isFunction(() => {})).toBe(true);
    expect(isFiniteValue(3)).toBe(true);
    expect(isFiniteValue(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isNumber(3)).toBe(true);
    expect(isObject({})).toBe(true);
    expect(isObject(null)).toBe(false);
    expect(isString('x')).toBe(true);
    expect(isUndefined(undefined)).toBe(true);
    expect(max([1, 3, 2])).toBe(3);
    expect(range(1, 4)).toEqual([1, 2, 3]);
    expect(rangeRight(1, 4)).toEqual([3, 2, 1]);
    expect(times(3)).toEqual([0, 1, 2]);
    expect(times(3, (index) => index * 2)).toEqual([0, 2, 4]);
    expect(uniqueId('x-')).toMatch(/^x-\d+$/);
    expect(shuffle([1, 2, 3]).sort()).toEqual([1, 2, 3]);
    expect(zip(['a', 'b'], [1, 2])).toEqual([
      ['a', 1],
      ['b', 2],
    ]);
  });

  it('escapes HTML-sensitive characters', () => {
    expect(escapeHtml('<tag attr="x">&value</tag>')).toBe(
      '&lt;tag attr=&quot;x&quot;&gt;&amp;value&lt;/tag&gt;'
    );
  });

  it('implements debounce and throttle with cancellation', () => {
    vi.useFakeTimers();
    const debouncedFn = vi.fn();
    const throttledFn = vi.fn();
    const debounced = debounce(debouncedFn, 100);
    const throttled = throttle(throttledFn, 100);

    debounced('a');
    debounced('b');
    vi.advanceTimersByTime(99);
    expect(debouncedFn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(debouncedFn).toHaveBeenCalledWith('b');

    throttled('a');
    throttled('b');
    expect(throttledFn).toHaveBeenCalledWith('a');
    vi.advanceTimersByTime(100);
    expect(throttledFn).toHaveBeenCalledWith('b');

    debounced('c');
    debounced.cancel();
    vi.advanceTimersByTime(100);
    expect(debouncedFn).not.toHaveBeenCalledWith('c');
    vi.useRealTimers();
  });

  it('honors debounce and throttle leading/trailing options used by synced sources', () => {
    vi.useFakeTimers();
    const debouncedFn = vi.fn();
    const throttledFn = vi.fn();
    const debounced = debounce(debouncedFn, 100, { leading: true, trailing: false });
    const throttled = throttle(throttledFn, 100, { leading: true, trailing: false });

    debounced('a');
    debounced('b');
    expect(debouncedFn).toHaveBeenCalledTimes(1);
    expect(debouncedFn).toHaveBeenCalledWith('a');
    vi.advanceTimersByTime(100);
    expect(debouncedFn).toHaveBeenCalledTimes(1);

    throttled('a');
    throttled('b');
    expect(throttledFn).toHaveBeenCalledTimes(1);
    expect(throttledFn).toHaveBeenCalledWith('a');
    vi.advanceTimersByTime(100);
    expect(throttledFn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
