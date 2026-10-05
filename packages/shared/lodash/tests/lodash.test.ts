import * as lodashEs from 'lodash-es';
import { describe, expect, it, vi } from 'vitest';
import * as vendored from '../src/index.js';
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
    expect(uniq({ foo: true } as unknown as number[])).toEqual([]);
    expect(uniq('aab')).toEqual(['a', 'b']);
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

  it('honors debounce and throttle leading/trailing options used by element sources', () => {
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

type AnyFunction = (...args: any[]) => any;
type Case = [label: string, args: () => unknown[]];

const reference = lodashEs as unknown as Record<string, AnyFunction>;
const subject = vendored as unknown as Record<string, AnyFunction>;

class Point {
  constructor(
    public x: number,
    public y: number
  ) {}
}

const holes = (length: number, entries: Record<number, unknown>): unknown[] =>
  Object.assign(new Array(length), entries);

// A recording iteratee keeps its calls on itself, where the argument comparison after each case
// reads them.
const recorder = () => {
  const calls: unknown[][] = [];
  return Object.assign((...args: unknown[]) => void calls.push(args), { calls });
};

// Inputs follow the call shapes in packages/elements-react and packages/lib-react, plus the edge
// values lodash defines: -0, NaN, holes, string and zero steps, descending ranges and the array
// shorthand for predicates.
const conformance: Record<string, Case[]> = {
  assign: [
    ['sources', () => [{ a: 1 }, { b: 2 }, { a: 3 }]],
    ['nullish sources', () => [{ a: 1 }, null, undefined, { b: 2 }]],
    ['undefined overwrites', () => [{ a: 1 }, { a: undefined }]],
  ],
  chunk: [
    ['pairs', () => [[1, 2, 3, 4, 5], 2]],
    ['default size', () => [[1, 2, 3]]],
    ['zero size', () => [[1, 2, 3], 0]],
    ['null', () => [null, 2]],
  ],
  clone: [
    ['array', () => [[1, { a: 1 }]]],
    ['object', () => [{ a: { b: 1 } }]],
    ['-0', () => [-0]],
  ],
  cloneDeep: [
    ['nested', () => [{ a: [1, { b: -0 }], c: Number.NaN, d: undefined, e: null }]],
    ['date', () => [{ d: new Date(5) }]],
  ],
  compact: [
    ['falsy values', () => [[0, -0, 1, false, 2, '', 3, null, undefined, Number.NaN]]],
    ['null', () => [null]],
  ],
  concat: [
    ['arrays and values', () => [[1], 2, [3, [4]]]],
    [
      'xPoints halves',
      () => [
        [-1, -0.5],
        [0.5, 1],
      ],
    ],
  ],
  defaults: [
    ['missing keys', () => [{ a: 1 }, { a: 2, b: 3 }]],
    ['undefined existing', () => [{ a: undefined }, { a: 2 }]],
    ['null existing', () => [{ a: null }, { a: 2 }]],
    ['shallow', () => [{ a: { x: 1 } }, { a: { y: 2 }, b: 1 }]],
    ['several sources', () => [{ a: 1 }, { b: 2 }, { b: 3, c: 4 }]],
  ],
  difference: [
    ['values', () => [[1, 2, 3], [2]]],
    [
      '-0 and NaN',
      () => [
        [-0, 0, Number.NaN, 1],
        [0, Number.NaN],
      ],
    ],
    ['several', () => [[1, 2, 3, 4], [1], [4]]],
  ],
  differenceWith: [
    ['isEqual', () => [[{ x: 1 }, { x: 2 }], [{ x: 2 }], lodashEs.isEqual]],
    ['comparator arguments', () => [[1, 2], [3], recorder()]],
  ],
  escape: [
    ['html', () => ['<a href="x">&\'</a>']],
    ['number', () => [5]],
    ['array', () => [[1, '<']]],
  ],
  every: [
    ['function', () => [[2, 4], (value: number) => value % 2 === 0]],
    ['isArray', () => [[[1], [2]], Array.isArray]],
    ['object collection', () => [{ a: [1] }, Array.isArray]],
    ['empty', () => [[], Array.isArray]],
    ['property', () => [[{ a: 1 }, { a: 0 }], 'a']],
    ['matches', () => [[{ a: 1, b: 2 }], { a: 1 }]],
    [
      'matchesProperty',
      () => [
        [{ a: 1 }, { a: 1 }],
        ['a', 1],
      ],
    ],
    ['null', () => [null, Boolean]],
  ],
  find: [
    ['function', () => [[1, 2, 3], (value: number) => value > 1]],
    ['iteratee arguments', () => [['a', 'b'], recorder()]],
    ['matches', () => [[{ id: 1 }, { id: 2 }], { id: 2 }]],
    ['matches nested subset', () => [[{ a: { b: 1, c: 2 } }], { a: { b: 1 } }]],
    ['matches array subset', () => [[{ a: [{ x: 1, y: 2 }, { z: 3 }] }], { a: [{ z: 3 }] }]],
    ['matches -0', () => [[{ x: -0 }], { x: 0 }]],
    ['matches NaN', () => [[{ x: Number.NaN }], { x: Number.NaN }]],
    ['matches undefined', () => [[{ y: 1 }, { x: undefined }], { x: undefined }]],
    ['matches primitives', () => [['abc', 'de'], { length: 2 }]],
    [
      'matchesProperty',
      () => [
        [
          { id: 1, v: 'a' },
          { id: 2, v: 'b' },
        ],
        ['id', 2],
      ],
    ],
    [
      'matchesProperty path',
      () => [
        [{ a: { b: 1 } }, { a: { b: 2 } }],
        ['a.b', 2],
      ],
    ],
    ['matchesProperty subset', () => [[{ a: [3, 2, 1] }], ['a', [1, 3]]]],
    [
      'matchesProperty undefined',
      () => [
        [{ b: 1 }, { a: undefined }],
        ['a', undefined],
      ],
    ],
    ['property', () => [[{ a: 0 }, { a: 1 }], 'a']],
    ['property path', () => [[{ a: { b: 0 } }, { a: { b: 1 } }], 'a.b']],
    [
      'number property',
      () => [
        [
          [0, 0],
          [0, 3],
        ],
        1,
      ],
    ],
    ['object collection', () => [{ x: 1, y: 2 }, (value: number) => value === 2]],
    ['fromIndex', () => [[1, 2, 3, 2], (value: number) => value === 2, 2]],
    ['negative fromIndex', () => [[1, 2, 3, 2], (value: number) => value === 2, -1]],
    ['fromIndex past the end', () => [[1, 2], () => true, 5]],
    ['string collection', () => ['abc', (char: string) => char === 'b']],
    ['holes', () => [holes(2, { 1: 1 }), (value: unknown) => value === undefined]],
    ['null', () => [null, Boolean]],
    ['no predicate', () => [[0, 1, 2]]],
  ],
  findKey: [
    ['function', () => [{ a: 1, b: 2 }, (value: number) => value === 2]],
    ['matches', () => [{ a: { active: false }, b: { active: true } }, { active: true }]],
    ['matchesProperty', () => [{ a: { active: false }, b: { active: true } }, ['active', true]]],
    ['property', () => [{ a: { active: false }, b: { active: true } }, 'active']],
    ['array', () => [['x', 'y'], (value: string) => value === 'y']],
    ['null', () => [null, Boolean]],
  ],
  flatten: [
    ['one level', () => [[1, [2, [3]]]]],
    ['null', () => [null]],
  ],
  flatMap: [
    ['function', () => [[1, 2], (value: number) => [value, value * 2]]],
    ['object', () => [{ a: [1, 2], b: [3] }, (group: number[]) => group.slice(-1)]],
    ['one level', () => [[1], (value: number) => [[value]]]],
    ['property', () => [[{ a: [1] }, { a: [2] }], 'a']],
  ],
  forEach: [
    ['array', () => [[1, 2], recorder()]],
    ['object', () => [{ a: 1, b: 2 }, recorder()]],
  ],
  get: [
    ['path', () => [{ a: { b: [{ c: 1 }] } }, 'a.b[0].c']],
    ['array path', () => [{ a: { b: 1 } }, ['a', 'b']]],
    ['default', () => [{ a: 1 }, 'b', 'd']],
    ['undefined leaf', () => [{ a: undefined }, 'a', 'd']],
    ['null leaf', () => [{ a: null }, 'a', 'd']],
    ['literal dotted key', () => [{ 'a.b': 1, a: { b: 2 } }, 'a.b']],
    ['string', () => ['abc', 'length']],
    ['null object', () => [null, 'a', 'd']],
    ['number path', () => [[1, 2], 1]],
  ],
  groupBy: [
    [
      'property',
      () => [
        [{ containerIndex: 0 }, { containerIndex: 1 }, { containerIndex: 0 }],
        'containerIndex',
      ],
    ],
    ['function', () => [[1.2, 1.5, 2.1], Math.floor]],
    ['length', () => [['one', 'two', 'three'], 'length']],
  ],
  head: [
    ['values', () => [[1, 2]]],
    ['empty', () => [[]]],
    ['null', () => [null]],
  ],
  includes: [
    ['array', () => [['0', '1'], '1']],
    ['NaN', () => [[Number.NaN], Number.NaN]],
    ['-0', () => [[-0], 0]],
    ['string', () => ['abc', 'b']],
    ['object values', () => [{ a: 1 }, 1]],
  ],
  initial: [
    ['values', () => [[1, 2, 3]]],
    ['null', () => [null]],
  ],
  intersection: [
    [
      'values',
      () => [
        [1, 2, 3],
        [2, 3, 4],
      ],
    ],
    [
      'duplicates',
      () => [
        [2, 2, 1],
        [2, 1],
      ],
    ],
    ['-0', () => [[-0], [0]]],
    ['NaN', () => [[Number.NaN], [Number.NaN]]],
    ['three', () => [['a', 'b'], ['b', 'a'], ['b']]],
  ],
  isArray: [
    ['array', () => [[]]],
    ['array-like', () => [{ length: 0 }]],
  ],
  isEmpty: [
    ['{}', () => [{}]],
    ['[]', () => [[]]],
    ['""', () => ['']],
    ['0', () => [0]],
    ['true', () => [true]],
    ['map', () => [new Map([[1, 1]])]],
    ['set', () => [new Set()]],
    ['function', () => [() => 1]],
    ['instance', () => [new Point(1, 2)]],
    ['length object', () => [{ length: 0 }]],
    ['null', () => [null]],
    ['date', () => [new Date(0)]],
  ],
  isEqual: [
    ['-0 and 0', () => [-0, 0]],
    ['nested -0', () => [{ x: -0 }, { x: 0 }]],
    ['NaN', () => [Number.NaN, Number.NaN]],
    ['nested NaN', () => [[Number.NaN], [Number.NaN]]],
    ['deep', () => [{ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }]],
    ['deep difference', () => [{ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] }]],
    [
      'key order',
      () => [
        { a: 1, b: 2 },
        { b: 2, a: 1 },
      ],
    ],
    ['undefined key', () => [{ a: undefined }, {}]],
    ['hole and value', () => [holes(3, { 0: 1, 2: 3 }), [1, 2, 3]]],
    ['hole and undefined', () => [holes(3, { 0: 1, 2: 3 }), [1, undefined, 3]]],
    ['dates', () => [new Date(1), new Date(1)]],
    ['invalid dates', () => [new Date(Number.NaN), new Date(Number.NaN)]],
    ['array and object', () => [[1], { 0: 1 }]],
    ['null and undefined', () => [null, undefined]],
    ['same function', () => [Math.max, Math.max]],
    ['different functions', () => [() => 1, () => 1]],
    [
      'segment points',
      () => [
        { x: 4, y: -0 },
        { x: 4, y: 0 },
      ],
    ],
  ],
  isEqualWith: [
    ['custom', () => [1, '1', (a: unknown, b: unknown) => String(a) === String(b)]],
    [
      'closeTo',
      () => [
        { v: 1.001 },
        { v: 1.002 },
        (a: unknown, b: unknown) =>
          typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) < 0.01 : undefined,
      ],
    ],
    ['-0 without customizer result', () => [{ v: -0 }, { v: 0 }, () => undefined]],
  ],
  isFinite: [
    ['3', () => [3]],
    ['Infinity', () => [Infinity]],
    ['"3"', () => ['3']],
    ['NaN', () => [Number.NaN]],
  ],
  isFunction: [
    ['function', () => [() => 1]],
    ['class', () => [Point]],
    ['object', () => [{}]],
  ],
  isNumber: [
    ['3', () => [3]],
    ['NaN', () => [Number.NaN]],
    ['Number', () => [Object(3)]],
    ['"3"', () => ['3']],
  ],
  isObject: [
    ['{}', () => [{}]],
    ['function', () => [() => 1]],
    ['null', () => [null]],
    ['"s"', () => ['s']],
  ],
  isString: [
    ['s', () => ['s']],
    ['String', () => [Object('s')]],
    ['1', () => [1]],
  ],
  isUndefined: [
    ['undefined', () => [undefined]],
    ['null', () => [null]],
  ],
  map: [
    ['function', () => [[1, 2], (value: number) => value * 2]],
    ['object', () => [{ a: 1, b: 2 }, (value: number, key: string) => `${key}${value}`]],
    ['iteratee arguments', () => [['a', 'b'], recorder()]],
    ['property', () => [[{ id: 1 }, { id: 2 }], 'id']],
    ['matches', () => [[{ id: 1 }, { id: 2 }], { id: 2 }]],
    [
      'matchesProperty',
      () => [
        [{ id: 1 }, { id: 2 }],
        ['id', 2],
      ],
    ],
    ['identity', () => [[1, 2]]],
    ['null', () => [null, (value: unknown) => value]],
  ],
  max: [
    ['numbers', () => [[1, 3, 2]]],
    ['NaN first', () => [[Number.NaN, 1, 2]]],
    ['NaN between', () => [[1, Number.NaN, 2]]],
    ['only NaN', () => [[Number.NaN]]],
    ['empty', () => [[]]],
    ['null', () => [null]],
    ['undefined entries', () => [[undefined, 1]]],
    ['null entries', () => [[null, 2]]],
    ['strings', () => [['a', 'c', 'b']]],
    ['number and string', () => [[1, '2']]],
    ['-0 first', () => [[-0, 0]]],
    ['0 first', () => [[0, -0]]],
    ['infinities', () => [[-Infinity, Infinity]]],
    ['holes', () => [holes(4, { 1: 1, 3: 3 })]],
  ],
  merge: [
    ['nested objects', () => [{ a: { b: 1 } }, { a: { c: 2 } }]],
    ['arrays by index', () => [{ a: [1, 2, 3] }, { a: [4] }]],
    ['array of objects', () => [{ a: [{ x: 1 }, { y: 2 }] }, { a: [{ z: 3 }] }]],
    ['nested arrays', () => [{ a: [[1, 2]] }, { a: [[3]] }]],
    ['holes in source', () => [{ a: [1, 2, 3] }, { a: holes(2, { 1: 5 }) }]],
    ['undefined keeps value', () => [{ a: 1 }, { a: undefined }]],
    ['undefined into missing key', () => [{}, { a: undefined }]],
    ['null overwrites', () => [{ a: 1 }, { a: null }]],
    ['-0 onto 0', () => [{ a: 0 }, { a: -0 }]],
    ['NaN onto NaN', () => [{ a: Number.NaN }, { a: Number.NaN }]],
    [
      'copy into {}',
      () => [{}, { label: 'x', value: '1', feedback: { type: 'none' }, nested: [1, [2]] }],
    ],
    ['several sources', () => [{}, { label: 'x', correct: true }, { correct: false }]],
    [
      'feedback over defaults',
      () => [
        {
          correct: { default: 'Correct', type: 'none' },
          incorrect: { default: 'Incorrect', type: 'none' },
        },
        { correct: { type: 'custom', custom: 'yay' }, incorrect: undefined },
      ],
    ],
    [
      'feedback with undefined input',
      () => [
        {},
        {
          correct: { type: 'default', default: 'Correct' },
          partial: { type: 'default', default: 'Nearly' },
        },
        undefined,
      ],
    ],
    ['date by reference', () => [{}, { d: new Date(5) }]],
    ['instance by reference', () => [{}, { p: new Point(1, 2) }]],
    ['object into instance', () => [{ p: new Point(1, 2) }, { p: { z: 3 } }]],
    ['function by reference', () => [{}, { f: Math.max }]],
    ['typed array copy', () => [{}, { t: new Uint8Array([1, 2]) }]],
    ['array into object', () => [{ a: { 0: 'x', k: 1 } }, { a: [1] }]],
    ['object into array', () => [{ a: [1, 2] }, { a: { k: 1 } }]],
    ['object onto primitive', () => [{ a: 1 }, { a: { k: 1 } }]],
    [
      'shared source object',
      () => {
        const shared = { k: [1] };
        return [{}, { a: shared }, { b: shared }];
      },
    ],
    [
      'cyclic source',
      () => {
        const source: Record<string, unknown> = { a: 1 };
        source.self = source;
        return [{}, source];
      },
    ],
    ['undefined target', () => [undefined, { a: 1 }]],
    ['null source', () => [{ a: 1 }, null]],
    [
      'placement-ordering question',
      () => [
        { config: { choices: [{ id: 'c1' }, { id: 'c2' }], alternateResponses: [] } },
        { config: { alternateResponses: [['c2', 'c1']] } },
      ],
    ],
  ],
  omit: [
    ['key', () => [{ a: 1, b: 2 }, 'a']],
    ['keys', () => [{ value: 1, id: 2, x: 3 }, ['value', 'id']]],
    ['empty label', () => [{ x: 1, y: 2, label: '' }, 'label']],
    ['null', () => [null, 'a']],
  ],
  omitBy: [
    [
      'falsy values',
      () => [{ a: 0, b: 1, c: '', d: 'x', e: undefined }, (value: unknown) => !value],
    ],
    ['null', () => [null, Boolean]],
  ],
  pick: [
    ['keys array', () => [{ a: 1, b: 2, c: 3 }, ['a']]],
    ['rest keys', () => [{ value: 1, label: 'x', other: 2 }, 'value', 'label']],
    ['number key', () => [{ 0: 'a', 1: 'b' }, 0]],
    ['missing key', () => [{ a: 1 }, 'z']],
    ['undefined value', () => [{ a: undefined }, 'a']],
    ['null', () => [null, 'a']],
  ],
  range: [
    ['end', () => [4]],
    ['start and end', () => [1, 5]],
    ['step', () => [0, 20, 5]],
    ['negative end', () => [-4]],
    ['descending', () => [5, 1]],
    ['descending step', () => [0, -4, -1]],
    ['wrong-sign step', () => [1, 5, -1]],
    ['zero step', () => [1, 4, 0]],
    ['zero step from 0', () => [0, 10, 0]],
    ['fractional step', () => [-1, 1, 0.1]],
    ['quarter step', () => [0, 1, 0.25]],
    ['tenth step', () => [0, 1, 0.1]],
    ['inexact end', () => [0, 2.1, 0.3]],
    ['string step', () => [-10, 10, '1']],
    ['string bounds', () => ['1', '4']],
    ['NaN', () => [Number.NaN]],
    ['NaN step', () => [0, 3, Number.NaN]],
    ['explicit undefined end', () => [3, undefined]],
    ['explicit undefined step', () => [5, 1, undefined]],
    ['null end', () => [5, null]],
    ['-0 start', () => [-0, 2]],
    ['plot ticks', () => [-5, 5, 0.5]],
    ['protractor', () => [0, 181, 10]],
    ['xPoints right', () => [0.785 + 0.5, 10 + 0.5, 0.5]],
  ],
  rangeRight: [
    ['end', () => [4]],
    ['start and end', () => [1, 5]],
    ['descending', () => [5, 1]],
    ['zero step', () => [1, 4, 0]],
    ['string step', () => [0, 3, '1']],
    ['NaN', () => [Number.NaN]],
    ['xPoints left', () => [0, -10 - 0.5, -0.5]],
    ['xPoints left tenth', () => [0, -1 - 0.1, -0.1]],
  ],
  reduce: [
    ['sum', () => [[1, 2, 3], (sum: number, value: number) => sum + value, 0]],
    [
      'object',
      () => [
        { a: 1, b: 2 },
        (acc: object, value: number, key: string) => ({ ...acc, [key]: value * 2 }),
        {},
      ],
    ],
    ['iteratee arguments', () => [['a', 'b'], recorder(), 0]],
    ['null', () => [null, (acc: unknown) => acc, 5]],
  ],
  remove: [
    ['function', () => [[1, 2, 3, 4], (value: number) => value % 2 === 0]],
    ['matches', () => [[{ a: 1 }, { a: 2 }], { a: 1 }]],
    [
      'matchesProperty',
      () => [
        [{ a: 1 }, { a: 2 }],
        ['a', 2],
      ],
    ],
  ],
  set: [
    ['path', () => [{}, 'a.b[0].c', 2]],
    [
      'existing path',
      () => [{ answers: { correctAnswer: { marks: [1] } } }, 'answers.correctAnswer.marks', [2]],
    ],
    ['array path', () => [{}, ['a', '0'], 1]],
    ['numeric key', () => [{}, 'a.0', 1]],
    ['null in path', () => [{ a: null }, 'a.b', 1]],
    ['template key', () => [{ answers: {} }, 'answers.alternate1', { marks: [] }]],
  ],
  tail: [
    ['values', () => [[1, 2, 3]]],
    ['null', () => [null]],
  ],
  takeRight: [
    ['2', () => [[1, 2, 3], 2]],
    ['default', () => [[1, 2, 3]]],
    ['more than length', () => [[1, 2, 3], 5]],
    ['0', () => [[1, 2, 3], 0]],
    ['null', () => [null, 1]],
  ],
  times: [
    ['3', () => [3]],
    ['String', () => [3, String]],
    ['negative', () => [-2]],
    ['fraction', () => [2.5]],
    ['iteratee arguments', () => [2, recorder()]],
  ],
  uniq: [
    ['numbers', () => [[1, 1, 2]]],
    ['-0 then 0', () => [[-0, 0]]],
    ['0 then -0', () => [[0, -0]]],
    ['NaN', () => [[Number.NaN, Number.NaN, 1]]],
    ['string', () => ['aab']],
    ['object', () => [{ foo: true }]],
    ['null', () => [null]],
  ],
  uniqWith: [
    ['isEqual', () => [[{ x: 1 }, { x: 1 }, { x: 2 }], lodashEs.isEqual]],
    ['comparator arguments', () => [[1, 2, 3], recorder()]],
  ],
  zip: [
    [
      'pairs',
      () => [
        ['a', 'b'],
        [1, 2],
      ],
    ],
    ['uneven', () => [['a'], [1, 2]]],
    ['none', () => []],
  ],
};

// Timing and randomness are compared by behaviour below rather than by return value.
const comparedByBehaviour = ['debounce', 'throttle', 'shuffle', 'uniqueId'];

const outcome = (run: () => unknown) => {
  try {
    return { returned: run() };
  } catch (error) {
    return { threw: (error as Error).constructor.name };
  }
};

// Functions are fresh per case, so they compare by their recorded calls, or by position.
const comparableArgs = (args: unknown[]) =>
  args.map((arg) =>
    typeof arg === 'function' ? ((arg as { calls?: unknown }).calls ?? 'function') : arg
  );

describe('lodash 4.17 conformance', () => {
  it('has cases for every export', () => {
    const exported = Object.keys(vendored).filter((name) => name !== 'default');
    expect(exported.sort()).toEqual([...Object.keys(conformance), ...comparedByBehaviour].sort());
    expect(Object.keys(vendored.default).sort()).toEqual(exported.sort());
  });

  for (const [name, cases] of Object.entries(conformance)) {
    it.each(cases)(`${name}: %s`, (_label, makeArgs) => {
      const subjectArgs = makeArgs();
      const referenceArgs = makeArgs();
      expect(outcome(() => subject[name](...subjectArgs))).toStrictEqual(
        outcome(() => reference[name](...referenceArgs))
      );
      expect(comparableArgs(subjectArgs)).toStrictEqual(comparableArgs(referenceArgs));
    });
  }

  // Authored JSON reaches merge with an own `__proto__` key, at the top level or under a key the
  // target already holds.
  it.each([
    ['top level', () => [{}, JSON.parse('{"__proto__": {"polluted": true}, "a": 1}')]],
    [
      'nested',
      () => [{ correct: {} }, JSON.parse('{"correct": {"__proto__": {"polluted": true}}}')],
    ],
  ])('merge leaves Object.prototype alone: %s', (_label, makeArgs) => {
    try {
      expect(vendored.merge(...(makeArgs() as [object]))).toStrictEqual(
        lodashEs.merge(...(makeArgs() as [object]))
      );
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    } finally {
      delete (Object.prototype as Record<string, unknown>).polluted;
    }
  });

  it('uniqueId counts up from a prefix', () => {
    const ids = (uniqueId: AnyFunction) => {
      const [first, second] = [uniqueId('x-'), uniqueId('x-')];
      return [
        /^x-\d+$/.test(first),
        Number(second.slice(2)) - Number(first.slice(2)),
        typeof uniqueId(),
      ];
    };
    expect(ids(vendored.uniqueId)).toEqual(ids(lodashEs.uniqueId));
  });

  it('shuffle returns a permutation in a new array', () => {
    const shuffled = (shuffle: AnyFunction) => {
      const input = [1, 2, 3, 4, 5];
      const result = shuffle(input);
      return [result === input, [...result].sort(), input, shuffle(null), shuffle([])];
    };
    expect(shuffled(vendored.shuffle)).toStrictEqual(shuffled(lodashEs.shuffle));
  });

  // [wait, options, script]: a number calls the function at that time with the time as its
  // argument; 'flush' and 'cancel' call those methods at the time of the step before.
  const timings: Array<[string, number, object | undefined, Array<number | 'flush' | 'cancel'>]> = [
    ['debounce', 100, undefined, [0, 50, 120, 400]],
    ['debounce', 50, { leading: false, trailing: true }, [0, 20, 40, 200, 230]],
    ['debounce', 100, { leading: true, trailing: false }, [0, 50, 120, 300, 350]],
    ['debounce', 300, undefined, [0, 100, 'flush', 200, 'cancel', 700]],
    ['throttle', 100, undefined, [0, 30, 60, 90, 400]],
    ['throttle', 500, { leading: true, trailing: false }, [0, 100, 450, 520, 1100]],
  ];

  it.each(timings)('%s(%i, %j) over %j', (name, wait, options, script) => {
    const timeline = (limit: AnyFunction) => {
      vi.useFakeTimers({ now: 0 });
      try {
        const invoked: number[][] = [];
        const limited = limit(
          (at: number) => {
            invoked.push([Date.now(), at]);
            return at;
          },
          wait,
          options
        );
        const returned = script.map((step) => {
          if (step === 'flush') return limited.flush();
          if (step === 'cancel') return limited.cancel();
          vi.advanceTimersByTime(step - Date.now());
          return limited(step);
        });
        vi.advanceTimersByTime(2000);
        return { invoked, returned };
      } finally {
        vi.useRealTimers();
      }
    };
    expect(timeline(subject[name])).toStrictEqual(timeline(reference[name]));
  });
});
