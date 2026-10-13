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

// lodash-es captures Math.random when it loads, so the draws the shuffle test sets are installed
// before any import.
const random = vi.hoisted(() => {
  const native = Math.random;
  const state = { draws: [] as number[] };
  Math.random = () => state.draws.shift() ?? native();
  return state;
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

// The tag comes from a getter, which lodash cannot unmask.
class Tagged {
  get [Symbol.toStringTag]() {
    return 'Tagged';
  }
}

const sym = Symbol('s');
const noop = () => {};

const indexes = (length: number) => Array.from({ length }, (_, index) => index);

const holes = (length: number, entries: Record<number, unknown>): unknown[] =>
  Object.assign(new Array(length), entries);

function argsOf(..._values: unknown[]): IArguments {
  // biome-ignore lint/complexity/noArguments: lodash handles arguments objects as their own kind.
  return arguments;
}

// What `map` and `reduce` pass a callback: lodash detects this shape and drops the extra arguments.
const iterateeCall = (collection: unknown[], index: number) => [
  collection[index],
  index,
  collection,
];

// A recording iteratee keeps its calls on itself, where the argument comparison after each case
// reads them. `returns` computes what it returns.
const recorder = (returns?: (...args: any[]) => unknown) => {
  const calls: unknown[][] = [];
  return Object.assign(
    (...args: unknown[]) => {
      calls.push(args);
      return returns?.(...args);
    },
    { calls }
  );
};

// isEqualWith passes its stack last, and lodash's stack is its own class, so the recording stops
// at the fifth argument.
const customizerRecorder = () => {
  const calls: unknown[][] = [];
  return Object.assign(
    (...args: unknown[]) => void calls.push([args.length, ...args.slice(0, 5)]),
    { calls }
  );
};

// Inputs follow the call shapes in packages/elements-react and packages/lib-react, plus the inputs
// lodash defines behaviour for: -0, NaN, holes, string and zero steps, descending ranges, predicate
// shorthands, iteratee calls, and each kind of value its clone and equality code branch on.
const conformance: Record<string, Case[]> = {
  assign: [
    ['sources', () => [{ a: 1 }, { b: 2 }, { a: 3 }]],
    ['nullish sources', () => [{ a: 1 }, null, undefined, { b: 2 }]],
    ['undefined overwrites', () => [{ a: 1 }, { a: undefined }]],
    ['0 over -0', () => [{ a: -0 }, { a: 0 }]],
    ['inherited keys', () => [{}, Object.create({ inh: 1 })]],
    ['array source', () => [{}, [1, 2]]],
    ['string source', () => [{}, 'ab']],
    ['primitive target', () => [1, { a: 1 }]],
    ['undefined target', () => [undefined, { a: 1 }]],
    ['iteratee call', () => [{}, ...iterateeCall([{ a: 1 }, { b: 2 }], 1)]],
  ],
  chunk: [
    ['pairs', () => [[1, 2, 3, 4, 5], 2]],
    ['default size', () => [[1, 2, 3]]],
    ['zero size', () => [[1, 2, 3], 0]],
    ['fractional size', () => [[1, 2, 3, 4], 1.5]],
    ['string size', () => [[1, 2, 3, 4], '2']],
    ['string', () => ['abc', 2]],
    ['null', () => [null, 2]],
    ['iteratee call', () => iterateeCall([[0], [9], [1, 2, 3]], 2)],
  ],
  clone: [
    ['array', () => [[1, { a: 1 }]]],
    ['object', () => [{ a: { b: 1 } }]],
    ['-0', () => [-0]],
    ['date', () => [new Date(5)]],
    ['instance', () => [new Point(1, 2)]],
    ['map', () => [new Map([[1, { a: 1 }]])]],
    ['set', () => [new Set([1, 2])]],
    ['regexp', () => [/a/g]],
    ['exec result', () => [/a(b)/.exec('xab')]],
    ['symbol key', () => [{ [sym]: 1, a: 2 }]],
    ['arguments', () => [argsOf(1, 2)]],
    ['boxed number', () => [Object(1)]],
    ['null prototype', () => [Object.assign(Object.create(null), { a: 1 })]],
    ['typed array', () => [new Uint8Array([1, 2])]],
    ['function', () => [Math.max]],
    ['error', () => [new Error('x')]],
    ['custom toStringTag', () => [new Tagged()]],
  ],
  cloneDeep: [
    ['nested', () => [{ a: [1, { b: -0 }], c: Number.NaN, d: undefined, e: null }]],
    ['date', () => [{ d: new Date(5) }]],
    ['instance', () => [{ p: new Point(1, 2) }]],
    ['map and set', () => [{ m: new Map([[1, { a: 1 }]]), s: new Set([{ b: 1 }]) }]],
    ['regexp', () => [{ r: /a/g }]],
    ['sparse', () => [holes(3, { 0: 1, 2: 3 })]],
    ['symbol key', () => [{ [sym]: { a: 1 }, b: 2 }]],
    ['arguments', () => [{ args: argsOf(1, { a: 2 }) }]],
    ['boxed values', () => [{ n: Object(1), s: Object('a'), b: Object(false) }]],
    ['typed array', () => [{ t: new Uint8Array([1, 2]) }]],
    ['function and error', () => [{ f: Math.max, e: new Error('x') }]],
    ['null prototype', () => [{ o: Object.assign(Object.create(null), { a: 1 }) }]],
    [
      'cycle',
      () => {
        const value: Record<string, unknown> = { a: 1 };
        value.self = value;
        return [value];
      },
    ],
  ],
  compact: [
    ['falsy values', () => [[0, -0, 1, false, 2, '', 3, null, undefined, Number.NaN]]],
    ['object', () => [{ a: 1 }]],
    ['string', () => ['a0']],
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
    ['non-array first', () => [1, 2]],
    ['null first', () => [null, [1]]],
    ['arguments value', () => [[1], argsOf(2, 3)]],
    ['no arguments', () => []],
  ],
  defaults: [
    ['missing keys', () => [{ a: 1 }, { a: 2, b: 3 }]],
    ['undefined existing', () => [{ a: undefined }, { a: 2 }]],
    ['null existing', () => [{ a: null }, { a: 2 }]],
    ['shallow', () => [{ a: { x: 1 } }, { a: { y: 2 }, b: 1 }]],
    ['several sources', () => [{ a: 1 }, { b: 2 }, { b: 3, c: 4 }]],
    ['Object.prototype keys', () => [{}, { toString: 1, constructor: 2 }]],
    ['inherited source keys', () => [{}, Object.create({ inh: 1 })]],
    ['undefined target', () => [undefined, { a: 1 }]],
    ['iteratee call', () => [{}, ...iterateeCall([{ a: 1 }, { b: 2 }], 1)]],
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
    ['non-array values', () => [[1, 2], 1, [2]]],
    ['string', () => ['ab', ['a']]],
    ['arguments', () => [argsOf(1, 2), [1]]],
    ['large values', () => [[1, 2, 300, -0], indexes(250)]],
  ],
  differenceWith: [
    ['isEqual', () => [[{ x: 1 }, { x: 2 }], [{ x: 2 }], lodashEs.isEqual]],
    ['comparator arguments', () => [[1, 2], [3], recorder()]],
    ['without comparator', () => [[1, 2], [2]]],
  ],
  escape: [
    ['html', () => ['<a href="x">&\'</a>']],
    ['number', () => [5]],
    ['array', () => [[1, '<']]],
    ['null', () => [null]],
    ['undefined', () => [undefined]],
    ['-0', () => [-0]],
    ['symbol', () => [sym]],
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
    ['string', () => ['ab', (char: string) => char < 'c']],
    ['arguments', () => [argsOf(1, 0), Boolean]],
    ['iteratee arguments', () => [{ a: 1 }, recorder(() => true)]],
    ['null', () => [null, Boolean]],
    ['iteratee call', () => iterateeCall([[1, 2], [0]], 0)],
  ],
  find: [
    ['function', () => [[1, 2, 3], (value: number) => value > 1]],
    ['iteratee arguments', () => [['a', 'b'], recorder()]],
    ['object iteratee arguments', () => [{ a: 1 }, recorder()]],
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
    ['iteratee arguments', () => [{ a: 1, b: 2 }, recorder()]],
    ['matches', () => [{ a: { active: false }, b: { active: true } }, { active: true }]],
    ['matchesProperty', () => [{ a: { active: false }, b: { active: true } }, ['active', true]]],
    ['property', () => [{ a: { active: false }, b: { active: true } }, 'active']],
    ['array', () => [['x', 'y'], (value: string) => value === 'y']],
    ['string', () => ['ab', (char: string) => char === 'b']],
    ['null', () => [null, Boolean]],
  ],
  flatten: [
    ['one level', () => [[1, [2, [3]]]]],
    ['arguments', () => [[1, argsOf(2, 3)]]],
    ['string', () => ['ab']],
    ['holes', () => [holes(3, { 0: [1], 2: 3 })]],
    ['null', () => [null]],
  ],
  flatMap: [
    ['function', () => [[1, 2], (value: number) => [value, value * 2]]],
    ['object', () => [{ a: [1, 2], b: [3] }, (group: number[]) => group.slice(-1)]],
    ['one level', () => [[1], (value: number) => [[value]]]],
    ['property', () => [[{ a: [1] }, { a: [2] }], 'a']],
    ['iteratee arguments', () => [['a', 'b'], recorder((value: string) => [value])]],
  ],
  forEach: [
    ['array', () => [[1, 2], recorder()]],
    ['object', () => [{ a: 1, b: 2 }, recorder()]],
    ['early exit', () => [[1, 2, 3], recorder((value: number) => value !== 2)]],
    ['object early exit', () => [{ a: 1, b: 2 }, recorder(() => false)]],
    ['string', () => ['ab', recorder()]],
    ['null', () => [null, recorder()]],
    ['non-function iteratee', () => [[1, 2], 'a']],
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
    ['empty path', () => [{ '': 1 }, '']],
    ['empty array path', () => [{ a: 1 }, [], 'd']],
    ['quoted key', () => [{ a: { 'b.c': 1 } }, 'a["b.c"]']],
    ['unquoted bracket key', () => [{ a: { b: 1 } }, 'a[b]']],
    ['leading dot', () => [{ '': { a: 1 } }, '.a']],
    ['symbol', () => [{ [sym]: 1 }, sym]],
    ['inherited', () => [Object.create({ inh: 1 }), 'inh']],
    ['-0 key', () => [{ '-0': 'negative', 0: 'zero' }, -0]],
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
    ['single argument', () => [['1', '2', '3'], Number.parseInt]],
    ['iteratee arguments', () => [['a', 'b'], recorder()]],
    ['object collection', () => [{ a: 1, b: 2, c: 3 }, (value: number) => value % 2]],
    ['__proto__ key', () => [['a'], () => '__proto__']],
  ],
  head: [
    ['values', () => [[1, 2]]],
    ['empty', () => [[]]],
    ['string', () => ['ab']],
    ['null', () => [null]],
  ],
  includes: [
    ['array', () => [['0', '1'], '1']],
    ['NaN', () => [[Number.NaN], Number.NaN]],
    ['-0', () => [[-0], 0]],
    ['string', () => ['abc', 'b']],
    ['object values', () => [{ a: 1 }, 1]],
    ['fromIndex', () => [[1, 2, 1], 1, 1]],
    ['negative fromIndex', () => [[1, 2, 3], 1, -2]],
    ['string fromIndex', () => ['abc', 'a', 1]],
    ['empty string at the end', () => ['abc', '', 3]],
    ['empty string past the end', () => ['abc', '', 4]],
    ['guard', () => [[1, 2], 1, 1, true]],
    ['null', () => [null, 1]],
  ],
  initial: [
    ['values', () => [[1, 2, 3]]],
    ['string', () => ['abc']],
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
    ['non-array argument', () => [[1, 2], 1]],
    ['string first', () => ['ab', ['a']]],
    ['single array', () => [[1, 1, 2]]],
    ['large arrays', () => [indexes(150), indexes(250).slice(100)]],
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
    ['arguments', () => [argsOf()]],
    ['typed array', () => [new Uint8Array(0)]],
    ['prototype', () => [Point.prototype]],
    ['String object', () => [Object('a')]],
    ['splice object', () => [{ length: 0, splice: noop }]],
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
    ['wrapped number', () => [Object(1), 1]],
    ['string and String', () => ['a', Object('a')]],
    ['instances', () => [new Point(1, 2), new Point(1, 2)]],
    ['instance and plain object', () => [new Point(1, 2), { x: 1, y: 2 }]],
    ['null prototype and plain object', () => [Object.create(null), {}]],
    [
      'maps in any order',
      () => [
        new Map([
          [1, 'a'],
          [2, 'b'],
        ]),
        new Map([
          [2, 'b'],
          [1, 'a'],
        ]),
      ],
    ],
    ['map difference', () => [new Map([[1, 'a']]), new Map([[1, 'b']])]],
    ['sets of objects', () => [new Set([{ a: 1 }, { b: 2 }]), new Set([{ b: 2 }, { a: 1 }])]],
    ['set difference', () => [new Set([1]), new Set([2])]],
    ['regexps', () => [/a/g, /a/g]],
    ['regexp flags', () => [/a/g, /a/i]],
    ['symbol keys', () => [{ [sym]: 1 }, { [sym]: 1 }]],
    ['symbol key difference', () => [{ [sym]: 1 }, { [sym]: 2 }]],
    ['arguments and object', () => [argsOf(1, 2), { 0: 1, 1: 2 }]],
    ['typed arrays', () => [new Uint8Array([1, 2]), new Uint8Array([1, 2])]],
    ['typed array kinds', () => [new Uint8Array([1]), new Int8Array([1])]],
    ['array buffers', () => [new Uint8Array([1, 2]).buffer, new Uint8Array([1, 2]).buffer]],
    ['data views', () => [new DataView(new ArrayBuffer(2)), new DataView(new ArrayBuffer(2))]],
    ['errors', () => [new Error('x'), new Error('x')]],
    ['error types', () => [new Error('x'), new TypeError('x')]],
    ['boxed booleans', () => [Object(true), Object(true)]],
    ['array with an extra key', () => [Object.assign([1], { x: 1 }), [1]]],
    [
      'cycles',
      () => {
        const value: Record<string, unknown> = { x: 1 };
        const other: Record<string, unknown> = { x: 1 };
        value.self = value;
        other.self = other;
        return [value, other];
      },
    ],
    ['own toStringTag', () => [{ [Symbol.toStringTag]: 'Map' }, { [Symbol.toStringTag]: 'Map' }]],
    ['custom toStringTag', () => [new Tagged(), new Tagged()]],
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
    [
      'customizer arguments',
      () => [{ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }, customizerRecorder()],
    ],
    [
      'customizer arguments for maps',
      () => [new Map([[1, 'a']]), new Map([[1, 'a']]), customizerRecorder()],
    ],
    ['non-function customizer', () => [{ a: 1 }, { a: 1 }, 'x']],
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
    ['async function', () => [async () => 1]],
    [
      'generator function',
      () => [
        function* () {
          yield 1;
        },
      ],
    ],
    ['proxy', () => [new Proxy(() => 1, {})]],
    ['object', () => [{}]],
  ],
  isNumber: [
    ['3', () => [3]],
    ['NaN', () => [Number.NaN]],
    ['Infinity', () => [Infinity]],
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
    ['array of strings', () => [['a']]],
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
    ['object iteratee arguments', () => [{ a: 1, b: 2 }, recorder()]],
    ['array-like', () => [{ length: 2, 0: 'a', 1: 'b' }, recorder()]],
    ['string', () => ['ab', (char: string) => char.toUpperCase()]],
    ['map collection', () => [new Map([[1, 2]]), recorder()]],
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
    ['symbol first', () => [[sym, 1]]],
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
    ['map by reference', () => [{}, { m: new Map([[1, 2]]) }]],
    ['object into instance', () => [{ p: new Point(1, 2) }, { p: { z: 3 } }]],
    ['function by reference', () => [{}, { f: Math.max }]],
    ['object onto function', () => [{ f: Math.max }, { f: { k: 1 } }]],
    ['typed array copy', () => [{}, { t: new Uint8Array([1, 2]) }]],
    ['typed array into array', () => [{ t: [9, 9, 9] }, { t: new Uint8Array([1, 2]) }]],
    ['arguments source', () => [{}, { a: argsOf(1, 2) }]],
    ['object into arguments', () => [{ a: argsOf(1) }, { a: { k: 1 } }]],
    ['array into object', () => [{ a: { 0: 'x', k: 1 } }, { a: [1] }]],
    ['object into array', () => [{ a: [1, 2] }, { a: { k: 1 } }]],
    ['object onto primitive', () => [{ a: 1 }, { a: { k: 1 } }]],
    ['inherited source keys', () => [{}, Object.create({ inh: 1 })]],
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
    ['iteratee call', () => [{}, ...iterateeCall([{ a: 1 }, { b: 2 }], 1)]],
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
    ['deep path', () => [{ a: { b: 1, c: 2 } }, 'a.b']],
    ['array path', () => [{ 'a.b': 1, a: { b: 2 } }, [['a', 'b']]]],
    ['nested path lists', () => [{ a: 1, b: 2, c: 3 }, ['a', ['b']]]],
    ['symbol key', () => [{ [sym]: 1, a: 2 }, 'a']],
    ['inherited', () => [Object.create({ inh: 1 }), 'x']],
    ['instance by reference', () => [{ p: new Point(1, 2), q: 1 }, 'p.x']],
    ['null', () => [null, 'a']],
  ],
  omitBy: [
    [
      'falsy values',
      () => [{ a: 0, b: 1, c: '', d: 'x', e: undefined }, (value: unknown) => !value],
    ],
    ['predicate arguments', () => [{ a: 1, b: 2 }, recorder()]],
    ['matches', () => [{ a: { x: 1 }, b: { x: 2 } }, { x: 1 }]],
    ['inherited', () => [Object.create({ inh: 1 }), () => false]],
    ['symbol key', () => [{ [sym]: 1, a: 2 }, (value: number) => value === 2]],
    ['null', () => [null, Boolean]],
  ],
  pick: [
    ['keys array', () => [{ a: 1, b: 2, c: 3 }, ['a']]],
    ['rest keys', () => [{ value: 1, label: 'x', other: 2 }, 'value', 'label']],
    ['number key', () => [{ 0: 'a', 1: 'b' }, 0]],
    ['missing key', () => [{ a: 1 }, 'z']],
    ['undefined value', () => [{ a: undefined }, 'a']],
    ['deep path', () => [{ a: { b: 1, c: 2 } }, 'a.b']],
    ['quoted path', () => [{ a: { 'b.c': 1 } }, 'a["b.c"]']],
    ['path lists', () => [{ a: 1, b: 2, c: 3 }, [['a'], 'b']]],
    ['inherited', () => [Object.create({ inh: 1 }), 'inh']],
    ['symbol', () => [{ [sym]: 1, a: 2 }, sym]],
    ['array source', () => [[1, 2, 3], '1']],
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
    ['iteratee call', () => iterateeCall([1, 2, 3], 1)],
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
    ['iteratee call', () => iterateeCall([1, 2, 3], 1)],
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
    ['no accumulator', () => [[1, 2, 3], (sum: number, value: number) => sum + value]],
    [
      'no accumulator over an object',
      () => [{ a: 1, b: 2 }, (sum: number, value: number) => sum + value],
    ],
    ['no accumulator over nothing', () => [[], (sum: number, value: number) => sum + value]],
    ['undefined accumulator', () => [[1, 2], recorder(), undefined]],
    ['iteratee arguments without accumulator', () => [['a', 'b', 'c'], recorder()]],
    ['string', () => ['abc', (reversed: string, char: string) => char + reversed, '']],
    ['null', () => [null, (acc: unknown) => acc, 5]],
  ],
  remove: [
    ['function', () => [[1, 2, 3, 4], (value: number) => value % 2 === 0]],
    ['predicate arguments', () => [['a', 'b', 'a'], recorder((value: string) => value === 'a')]],
    ['property', () => [[{ a: 0 }, { a: 1 }], 'a']],
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
    ['leading zero key', () => [{}, 'a.01', 1]],
    ['null in path', () => [{ a: null }, 'a.b', 1]],
    ['primitive in path', () => [{ a: 1 }, 'a.b', 2]],
    ['template key', () => [{ answers: {} }, 'answers.alternate1', { marks: [] }]],
    ['quoted key', () => [{}, 'a["b.c"]', 1]],
    ['symbol', () => [{}, sym, 1]],
    ['-0 over 0', () => [{ a: 0 }, 'a', -0]],
    ['undefined into missing key', () => [{}, 'a', undefined]],
    ['null object', () => [null, 'a', 1]],
  ],
  tail: [
    ['values', () => [[1, 2, 3]]],
    ['string', () => ['abc']],
    ['null', () => [null]],
  ],
  takeRight: [
    ['2', () => [[1, 2, 3], 2]],
    ['default', () => [[1, 2, 3]]],
    ['more than length', () => [[1, 2, 3], 5]],
    ['0', () => [[1, 2, 3], 0]],
    ['fraction', () => [[1, 2, 3], 1.5]],
    ['undefined', () => [[1, 2, 3], undefined]],
    ['negative', () => [[1, 2, 3], -1]],
    ['string', () => ['abc', 2]],
    ['null', () => [null, 1]],
    ['iteratee call', () => iterateeCall([[0], [0], [1, 2, 3]], 2)],
  ],
  times: [
    ['3', () => [3]],
    ['String', () => [3, String]],
    ['negative', () => [-2]],
    ['fraction', () => [2.5]],
    ['string count', () => ['3']],
    ['NaN', () => [Number.NaN]],
    ['non-function iteratee', () => [2, 'a']],
    ['iteratee arguments', () => [2, recorder()]],
  ],
  uniq: [
    ['numbers', () => [[1, 1, 2]]],
    ['-0 then 0', () => [[-0, 0]]],
    ['0 then -0', () => [[0, -0]]],
    ['NaN', () => [[Number.NaN, Number.NaN, 1]]],
    ['string', () => ['aab']],
    ['object', () => [{ foo: true }]],
    ['large', () => [indexes(250).map((index) => index % 10)]],
    ['large with -0', () => [[-0, ...indexes(250)]]],
    ['null', () => [null]],
  ],
  uniqWith: [
    ['isEqual', () => [[{ x: 1 }, { x: 1 }, { x: 2 }], lodashEs.isEqual]],
    ['comparator arguments', () => [[1, 2, 3], recorder()]],
    ['non-function comparator', () => [[1, 1, 2], 'x']],
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
    ['non-array arguments', () => [[1, 2], 'ab', null]],
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

// Where a clone holds one of the input's objects, or holds one object at two paths.
const references = (result: unknown, input: unknown) => {
  const found: string[] = [];
  const first = new Map<unknown, string>();
  const walk = (value: any, source: any, path: string) => {
    if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return;
    if (value === source) found.push(`${path} is the input's`);
    if (first.has(value)) {
      found.push(`${path} is ${first.get(value)}`);
      return;
    }
    first.set(value, path);
    if (ArrayBuffer.isView(value) && ArrayBuffer.isView(source) && value.buffer === source.buffer) {
      found.push(`${path}.buffer is the input's`);
    }
    if (value instanceof Map) {
      for (const [key, entry] of value) {
        walk(key, source instanceof Map && source.has(key) ? key : undefined, `${path}<key>`);
        walk(entry, source instanceof Map ? source.get(key) : undefined, `${path}<${key}>`);
      }
    }
    if (typeof value === 'object') {
      for (const key of Reflect.ownKeys(value)) {
        walk(value[key], source?.[key], `${path}.${String(key)}`);
      }
    }
  };
  walk(result, input, 'result');
  return found;
};

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

  it.each([
    ['clone', 'nested object', () => ({ a: { b: 1 } })],
    ['clone', 'map values', () => new Map([[1, { a: 1 }]])],
    ['clone', 'typed array', () => new Uint8Array([1, 2])],
    [
      'cloneDeep',
      'shared object',
      () => {
        const shared = { k: 1 };
        return { a: shared, b: [shared] };
      },
    ],
    [
      'cloneDeep',
      'cycle',
      () => {
        const value: Record<string, unknown> = { a: 1 };
        value.self = value;
        return value;
      },
    ],
    [
      'cloneDeep',
      'map keys',
      () => {
        const key = { k: 1 };
        return new Map([[key, key]]);
      },
    ],
    ['cloneDeep', 'function and error', () => ({ f: Math.max, e: new Error('x') })],
    ['cloneDeep', 'typed array', () => ({ t: new Uint8Array([1, 2]) })],
  ])('%s shares what lodash shares: %s', (name, _label, makeInput) => {
    const shared = (cloneFn: AnyFunction) => {
      const input = makeInput();
      return references(cloneFn(input), input);
    };
    expect(shared(subject[name])).toStrictEqual(shared(reference[name]));
  });

  // Authored JSON reaches these helpers with an own `__proto__` key, and authored keys become
  // paths.
  it.each([
    ['merge', 'top level', () => [{}, JSON.parse('{"__proto__": {"polluted": true}, "a": 1}')]],
    [
      'merge',
      'nested',
      () => [{ correct: {} }, JSON.parse('{"correct": {"__proto__": {"polluted": true}}}')],
    ],
    ['assign', 'own __proto__ key', () => [{}, JSON.parse('{"__proto__": {"polluted": true}}')]],
    ['defaults', 'own __proto__ key', () => [{}, JSON.parse('{"__proto__": {"polluted": true}}')]],
    [
      'cloneDeep',
      'own __proto__ key',
      () => [JSON.parse('{"a": {"__proto__": {"polluted": true}}}')],
    ],
    ['set', '__proto__ path', () => [{}, '__proto__.polluted', true]],
    ['set', 'constructor.prototype path', () => [{}, 'constructor.prototype.polluted', true]],
    ['set', '__proto__ array path', () => [{}, ['__proto__', 'polluted'], true]],
  ])('%s leaves Object.prototype alone: %s', (name, _label, makeArgs) => {
    try {
      expect(outcome(() => subject[name](...makeArgs()))).toStrictEqual(
        outcome(() => reference[name](...makeArgs()))
      );
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    } finally {
      delete (Object.prototype as Record<string, unknown>).polluted;
    }
  });

  // lodash 4.17.21's omit deletes from Object.prototype through these paths. 4.17.23 refuses them,
  // and so does this package.
  it.each([
    '__proto__.sacrificial',
    'constructor.prototype.sacrificial',
    ['__proto__', 'sacrificial'],
  ])('omit leaves Object.prototype alone: %j', (path) => {
    Object.defineProperty(Object.prototype, 'sacrificial', {
      configurable: true,
      value: 1,
      writable: true,
    });
    try {
      expect(vendored.omit({ a: 1 }, path)).toStrictEqual({ a: 1 });
      expect((Object.prototype as Record<string, unknown>).sacrificial).toBe(1);
    } finally {
      delete (Object.prototype as Record<string, unknown>).sacrificial;
    }
  });

  // An own `constructor` key defeats toStrictEqual's type check, so these compare entries.
  it.each([
    ['groupBy', () => [['a', 'b'], () => 'constructor']],
    ['merge', () => [{}, { constructor: { a: 1 } }]],
  ])('%s writes an own constructor key', (name, makeArgs) => {
    const entries = (fn: AnyFunction) => {
      const result = fn(...makeArgs());
      return [Object.getPrototypeOf(result) === Object.prototype, Object.entries(result)];
    };
    expect(entries(subject[name])).toStrictEqual(entries(reference[name]));
  });

  // lodash takes an object with an own `__wrapped__` key for its chain wrapper and calls its
  // `value` method. This package has no chain wrapper and compares such an object by its keys.
  it('isEqual compares an object with a __wrapped__ key by its keys', () => {
    expect(isEqual({ __wrapped__: 1 }, { __wrapped__: 1 })).toBe(true);
    expect(isEqual({ __wrapped__: 1 }, { __wrapped__: 2 })).toBe(false);
    expect(() => lodashEs.isEqual({ __wrapped__: 1 }, { __wrapped__: 1 })).toThrow(TypeError);
  });

  it('uniqueId counts up from a prefix', () => {
    const ids = (uniqueId: AnyFunction) => {
      const [first, second] = [uniqueId('x-'), uniqueId('x-')];
      return [
        /^x-\d+$/.test(first),
        Number(second.slice(2)) - Number(first.slice(2)),
        typeof uniqueId(),
        /^\d+$/.test(uniqueId(null)),
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

  it('shuffle orders as lodash does for the same draws', () => {
    const shuffled = (shuffle: AnyFunction) => {
      random.draws = [0.9, 0.1, 0.5, 0.3, 0.7, 0.2, 0.8, 0.4];
      return [shuffle([1, 2, 3, 4, 5]), shuffle({ a: 1, b: 2, c: 3 })];
    };
    expect(shuffled(vendored.shuffle)).toStrictEqual(shuffled(lodashEs.shuffle));
  });

  it.each(['debounce', 'throttle'])('%s throws for a non-function', (name) => {
    expect(outcome(() => subject[name](null))).toStrictEqual(outcome(() => reference[name](null)));
  });

  it.each(['debounce', 'throttle'])("%s calls with the last call's this and arguments", (name) => {
    const calls = (limit: AnyFunction) => {
      vi.useFakeTimers({ now: 0 });
      try {
        const seen: unknown[] = [];
        const limited = limit(function (this: unknown, ...args: unknown[]) {
          seen.push([this, args]);
        }, 50);
        limited.call({ id: 'a' }, 1, 2);
        limited.call({ id: 'b' }, 3);
        vi.advanceTimersByTime(100);
        return seen;
      } finally {
        vi.useRealTimers();
      }
    };
    expect(calls(subject[name])).toStrictEqual(calls(reference[name]));
  });

  // [wait, options, script]: a number calls the function at that time with the time as its
  // argument; 'flush' and 'cancel' call those methods at the time of the step before.
  const timings: Array<
    [string, number | string, object | undefined, Array<number | 'flush' | 'cancel'>]
  > = [
    ['debounce', 100, undefined, [0, 50, 120, 400]],
    ['debounce', 50, { leading: false, trailing: true }, [0, 20, 40, 200, 230]],
    ['debounce', 100, { leading: true, trailing: false }, [0, 50, 120, 300, 350]],
    ['debounce', 100, { leading: true }, [0, 50, 300]],
    ['debounce', 100, { maxWait: 150 }, [0, 50, 100, 150, 200, 250, 600]],
    ['debounce', 300, undefined, [0, 100, 'flush', 200, 'cancel', 700]],
    ['debounce', 100, undefined, ['flush', 0, 'flush', 'cancel', 'flush']],
    ['debounce', '100', undefined, [0, 50, 200]],
    ['throttle', 100, undefined, [0, 30, 60, 90, 400]],
    ['throttle', 100, undefined, [0, 30, 60, 90, 150, 400]],
    ['throttle', 100, { trailing: undefined }, [0, 30, 150]],
    ['throttle', 0, undefined, [0, 0, 10]],
    ['throttle', 500, { leading: true, trailing: false }, [0, 100, 450, 520, 1100]],
  ];

  it.each(timings)('%s(%j, %j) over %j', (name, wait, options, script) => {
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
