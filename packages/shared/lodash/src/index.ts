type AnyFn = (...args: any[]) => any;
type Iteratee<T, R = unknown> =
  | ((value: T, index: number | string, collection: any) => R)
  | string
  | number
  | object;
type Predicate<T> = Iteratee<T, boolean>;

export interface CancelableFunction<T extends AnyFn> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
}

const objectProto = Object.prototype;
const objectCtorString = Function.prototype.toString.call(Object);

function isObjectLike(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === 'object' && value !== null;
}

// SameValueZero, as lodash's `eq`: -0 equals 0 and NaN equals NaN.
function eq(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

function isArrayLike(value: unknown): value is ArrayLike<unknown> {
  if (value == null || typeof value === 'function') return false;
  const { length } = value as { length?: unknown };
  return typeof length === 'number' && Number.isSafeInteger(length) && length >= 0;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObjectLike(value) || objectProto.toString.call(value) !== '[object Object]') return false;
  const proto = Object.getPrototypeOf(value);
  if (proto === null) return true;
  const Ctor = objectProto.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor === 'function' && Ctor instanceof Ctor && Function.prototype.toString.call(Ctor) === objectCtorString;
}

function isTypedArray(value: unknown): value is ArrayBufferView & ArrayLike<number> {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

function toFinite(value: unknown): number {
  if (!value) return value === 0 ? value : 0;
  const number = typeof value === 'symbol' ? Number.NaN : Number(value);
  if (number === Infinity || number === -Infinity) return number < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  return number === number ? number : 0;
}

function toInteger(value: unknown): number {
  const result = toFinite(value);
  const remainder = result % 1;
  return remainder ? result - remainder : result;
}

function toPath(path: string | number | Array<string | number>): Array<string | number> {
  if (Array.isArray(path)) return path;
  if (typeof path === 'number') return [path];
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean);
}

function property(path: string | number | Array<string | number>) {
  return (value: unknown) => get(value, path);
}

function hasIn(object: unknown, path: string | number | Array<string | number>): boolean {
  if (object == null) return false;
  if (!Array.isArray(path) && path in Object(object)) return true;
  let current = object as any;
  for (const key of toPath(path)) {
    if (current == null || !(key in Object(current))) return false;
    current = current[key];
  }
  return true;
}

// The partial comparison behind lodash's `matches` and `matchesProperty`: every key of
// `source` is in `value` and matches, and each element of a source array matches a distinct
// element of the value array.
function isMatch(value: unknown, source: unknown): boolean {
  if (eq(value, source)) return true;
  if (!isObjectLike(value) || !isObjectLike(source)) return false;
  if (value instanceof Date || source instanceof Date) {
    return value instanceof Date && source instanceof Date && eq(value.getTime(), source.getTime());
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(value) || value.length < source.length) return false;
    const matched = new Set<number>();
    for (const expected of source) {
      const index = value.findIndex((item, candidate) => !matched.has(candidate) && isMatch(item, expected));
      if (index < 0) return false;
      matched.add(index);
    }
    return true;
  }
  if (Array.isArray(value)) return false;
  return Object.keys(source).every((key) => key in value && isMatch(value[key], source[key]));
}

function matches(source: object) {
  const keys = Object.keys(source);
  return (value: unknown) => {
    if (value === source) return true;
    if (value == null) return keys.length === 0;
    const object = Object(value);
    return keys.every((key) => key in object && isMatch(object[key], (source as any)[key]));
  };
}

function matchesProperty(path: string | number | Array<string | number>, source: unknown) {
  return (value: unknown) => {
    const actual = get(value, path);
    return actual === undefined && source === undefined ? hasIn(value, path) : isMatch(actual, source);
  };
}

function toIteratee<T, R = unknown>(iteratee?: Iteratee<T, R>): (value: T, index: number | string, collection: any) => R {
  if (typeof iteratee === 'function') return iteratee as any;
  if (iteratee == null) return ((value: T) => value) as any;
  if (typeof iteratee === 'object') {
    return (Array.isArray(iteratee) ? matchesProperty(iteratee[0], iteratee[1]) : matches(iteratee)) as any;
  }
  return property(iteratee) as any;
}

export function assign<T extends object>(object: T, ...sources: Array<object | null | undefined>): T {
  return Object.assign(object, ...sources.filter(Boolean));
}

export function chunk<T>(array: T[] | null | undefined, size = 1): T[][] {
  if (!array?.length || size < 1) return [];
  const result: T[][] = [];
  for (let index = 0; index < array.length; index += size) {
    result.push(array.slice(index, index + size));
  }
  return result;
}

export function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.slice() as T;
  if (isObjectLike(value)) return { ...(value as any) };
  return value;
}

export function cloneDeep<T>(value: T): T {
  if (!isObjectLike(value)) return value;
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map((item) => cloneDeep(item)) as T;
  const result: Record<PropertyKey, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = cloneDeep(item);
  }
  return result as T;
}

export function compact<T>(array: T[] | null | undefined): T[] {
  return (array ?? []).filter(Boolean);
}

export function concat<T>(array: T[] | null | undefined, ...values: Array<T | T[]>): T[] {
  const result = [...(array ?? [])];
  for (const value of values) {
    if (Array.isArray(value)) {
      result.push(...value);
    } else {
      result.push(value);
    }
  }
  return result;
}

export function debounce<T extends AnyFn>(
  fn: T,
  wait = 0,
  options: { leading?: boolean; trailing?: boolean; maxWait?: number } = {}
): CancelableFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let maxTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;
  let lastResult: ReturnType<T> | undefined;
  const leading = options.leading === true;
  const trailing = options.trailing !== false;

  const invoke = () => {
    if (!lastArgs) return lastResult;
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    lastResult = fn.apply(thisArg, args);
    return lastResult;
  };

  const cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (maxTimeoutId) clearTimeout(maxTimeoutId);
    timeoutId = undefined;
    maxTimeoutId = undefined;
    lastArgs = undefined;
    lastThis = undefined;
  };

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    const shouldCallLeading = leading && !timeoutId;
    lastArgs = args;
    lastThis = this;
    if (shouldCallLeading) {
      invoke();
    }
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      if (maxTimeoutId) {
        clearTimeout(maxTimeoutId);
        maxTimeoutId = undefined;
      }
      if (trailing) {
        invoke();
      } else {
        lastArgs = undefined;
        lastThis = undefined;
      }
    }, wait);
    if (options.maxWait !== undefined && !maxTimeoutId) {
      maxTimeoutId = setTimeout(() => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = undefined;
        maxTimeoutId = undefined;
        if (trailing || !leading) {
          invoke();
        } else {
          lastArgs = undefined;
          lastThis = undefined;
        }
      }, options.maxWait);
    }
    return lastResult;
  } as CancelableFunction<T>;

  debounced.cancel = cancel;
  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId);
      maxTimeoutId = undefined;
    }
    return invoke();
  };

  return debounced;
}

export function defaults<T extends object>(object: T, ...sources: Array<Record<string, unknown> | null | undefined>): T {
  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      if ((object as any)[key] === undefined) {
        (object as any)[key] = value;
      }
    }
  }
  return object;
}

export function difference<T>(array: T[] | null | undefined, ...values: T[][]): T[] {
  const excluded = new Set(values.flat());
  return (array ?? []).filter((item) => !excluded.has(item));
}

export function differenceWith<T, U>(array: T[] | null | undefined, values: U[] | null | undefined, comparator: (a: T, b: U) => boolean): T[] {
  return (array ?? []).filter((item) => !(values ?? []).some((other) => comparator(item, other)));
}

export function every<T>(collection: T[] | Record<string, T> | null | undefined, predicate?: Predicate<T>): boolean {
  const fn = toIteratee(predicate);
  const entries = Array.isArray(collection) ? collection.entries() : Object.entries(collection ?? {});
  for (const [key, value] of entries as Iterable<[number | string, T]>) {
    if (!fn(value, key, collection)) return false;
  }
  return true;
}

export function escape(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function find<T>(
  collection: T[] | Record<string, T> | null | undefined,
  predicate?: Predicate<T>,
  fromIndex = 0
): T | undefined {
  const fn = toIteratee(predicate);
  const iterable = Object(collection);
  const keys = isArrayLike(collection) ? undefined : Object.keys(iterable);
  const length = keys ? keys.length : (collection as ArrayLike<T>).length;
  let index = toInteger(fromIndex);
  if (index < 0) index = Math.max(length + index, 0);
  for (; index < length; index++) {
    const key = keys ? keys[index] : index;
    if (fn(iterable[key], key, keys ? iterable : collection)) return iterable[key];
  }
  return undefined;
}

export function findKey<T>(object: Record<string, T> | null | undefined, predicate?: Predicate<T>): string | undefined {
  const fn = toIteratee(predicate);
  for (const [key, value] of Object.entries(object ?? {})) {
    if (fn(value, key, object)) return key;
  }
  return undefined;
}

export function flatten<T>(array: Array<T | T[]> | null | undefined): T[] {
  const result: T[] = [];
  for (const value of array ?? []) {
    if (Array.isArray(value)) {
      result.push(...value);
    } else {
      result.push(value);
    }
  }
  return result;
}

export function flatMap<T, R>(collection: T[] | Record<string, T> | null | undefined, iteratee?: Iteratee<T, R | R[]>): R[] {
  return map(collection, iteratee as any).flat() as R[];
}

export function forEach<T>(
  collection: T[] | Record<string, T> | null | undefined,
  iteratee: (value: T, index: number | string, collection: any) => void
): T[] | Record<string, T> | null | undefined {
  const entries = Array.isArray(collection) ? collection.entries() : Object.entries(collection ?? {});
  for (const [key, value] of entries as Iterable<[number | string, T]>) {
    iteratee(value, key, collection);
  }
  return collection;
}

export function get(object: unknown, path: string | number | Array<string | number>, defaultValue?: unknown): any {
  if (
    !Array.isArray(path) &&
    object != null &&
    Object.prototype.hasOwnProperty.call(Object(object), path)
  ) {
    const directValue = (object as any)[path as any];
    return directValue === undefined ? defaultValue : directValue;
  }

  let current = object as any;
  for (const key of toPath(path)) {
    if (current == null) return defaultValue;
    current = current[key as any];
  }
  return current === undefined ? defaultValue : current;
}

export function groupBy<T>(collection: T[] | Record<string, T> | null | undefined, iteratee?: Iteratee<T>): Record<string, T[]> {
  const fn = toIteratee(iteratee);
  return reduce(
    collection,
    (result, value, key) => {
      const groupKey = String(fn(value, key, collection));
      (result[groupKey] ??= []).push(value);
      return result;
    },
    {} as Record<string, T[]>
  );
}

export function head<T>(array: T[] | null | undefined): T | undefined {
  return array?.[0];
}

export function initial<T>(array: T[] | null | undefined): T[] {
  return (array ?? []).slice(0, -1);
}

export function includes<T>(collection: T[] | string | Record<string, T> | null | undefined, value: T | string): boolean {
  if (typeof collection === 'string') return collection.includes(String(value));
  if (Array.isArray(collection)) return collection.includes(value as T);
  return Object.values(collection ?? {}).includes(value as T);
}

export function intersection<T>(...arrays: Array<T[] | null | undefined>): T[] {
  const [first, ...rest] = arrays;
  return uniq((first ?? []).filter((item) => rest.every((array) => (array ?? []).includes(item))));
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  if (value instanceof Map || value instanceof Set) return value.size === 0;
  if (isObjectLike(value)) return Object.keys(value).length === 0;
  return true;
}

function baseIsEqual(
  a: unknown,
  b: unknown,
  customizer?: (a: unknown, b: unknown) => boolean | undefined
): boolean {
  const custom = customizer?.(a, b);
  if (custom !== undefined) return !!custom;
  if (eq(a, b)) return true;
  if (!isObjectLike(a) || !isObjectLike(b)) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && eq(a.getTime(), b.getTime());
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    // By index, so a hole equals only undefined.
    for (let index = 0; index < a.length; index++) {
      if (!baseIsEqual(a[index], b[index], customizer)) return false;
    }
    return true;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  return (
    keysA.length === keysB.length &&
    keysA.every(
      (key) =>
        objectProto.hasOwnProperty.call(b, key) &&
        baseIsEqual((a as any)[key], (b as any)[key], customizer)
    )
  );
}

export function isEqual(a: unknown, b: unknown): boolean {
  return baseIsEqual(a, b);
}

export function isEqualWith(a: unknown, b: unknown, customizer?: (a: unknown, b: unknown) => boolean | undefined): boolean {
  return baseIsEqual(a, b, customizer);
}

export function isFinite(value: unknown): boolean {
  return Number.isFinite(value);
}

export function isFunction(value: unknown): value is AnyFn {
  return typeof value === 'function';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' || value instanceof Number;
}

export function isObject(value: unknown): value is object {
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string' || value instanceof String;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function map<T, R>(collection: T[] | Record<string, T> | null | undefined, iteratee?: Iteratee<T, R>): R[] {
  const fn = toIteratee(iteratee);
  const entries = Array.isArray(collection) ? collection.entries() : Object.entries(collection ?? {});
  const result: R[] = [];
  for (const [key, value] of entries as Iterable<[number | string, T]>) {
    result.push(fn(value, key, collection) as R);
  }
  return result;
}

export function max<T>(array: ArrayLike<T> | null | undefined): T | undefined {
  let result: NonNullable<T> | undefined;
  for (let index = 0; index < (array?.length ?? 0); index++) {
    const value = (array as ArrayLike<T>)[index];
    // Skips null, undefined, NaN and symbols, then compares with `>`.
    if (value != null && (result === undefined ? value === value && typeof value !== 'symbol' : value > result)) {
      result = value;
    }
  }
  return result;
}

function keysIn(source: object): string[] {
  const isArr = Array.isArray(source);
  const keys = isArr ? Array.from({ length: source.length }, (_value, index) => String(index)) : [];
  for (const key in source) {
    const skip = isArr
      ? /^(?:0|[1-9]\d*)$/.test(key) && Number(key) < source.length
      : key === 'constructor' && !objectProto.hasOwnProperty.call(source, key);
    if (!skip) keys.push(key);
  }
  return keys;
}

function safeGet(object: any, key: string): unknown {
  if (key === '__proto__' || (key === 'constructor' && typeof object[key] === 'function')) return undefined;
  return object[key];
}

function assignMergeValue(object: any, key: string, value: unknown): void {
  if (value === undefined ? key in object : eq(object[key], value)) return;
  if (key === '__proto__') {
    Object.defineProperty(object, key, { configurable: true, enumerable: true, value, writable: true });
  } else {
    object[key] = value;
  }
}

function baseMerge(object: any, source: any, stack: Map<unknown, unknown>): void {
  if (object === source) return;
  for (const key of keysIn(source)) {
    if (isObject(source[key])) {
      baseMergeDeep(object, source, key, stack);
    } else {
      assignMergeValue(object, key, source[key]);
    }
  }
}

function baseMergeDeep(object: any, source: any, key: string, stack: Map<unknown, unknown>): void {
  const objValue = safeGet(object, key);
  const srcValue = safeGet(source, key);
  const stacked = stack.get(srcValue);
  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  let newValue: any = srcValue;
  let recurse = true;
  if (Array.isArray(srcValue) || isTypedArray(srcValue)) {
    if (Array.isArray(objValue)) {
      newValue = objValue;
    } else if (isObjectLike(objValue) && isArrayLike(objValue)) {
      newValue = Array.from(objValue);
    } else if (isTypedArray(srcValue)) {
      recurse = false;
      const TypedArray = srcValue.constructor as new (buffer: ArrayBufferLike, byteOffset: number, length: number) => unknown;
      newValue = new TypedArray(srcValue.buffer.slice(0), srcValue.byteOffset, srcValue.length);
    } else {
      newValue = [];
    }
  } else if (isPlainObject(srcValue)) {
    if (!isObject(objValue) || typeof objValue === 'function') newValue = {};
    else newValue = objValue;
  } else {
    recurse = false;
  }
  if (recurse) {
    stack.set(srcValue, newValue);
    baseMerge(newValue, srcValue, stack);
    stack.delete(srcValue);
  }
  assignMergeValue(object, key, newValue);
}

// lodash 4.17 `merge`: arrays and plain objects merge by key and index, an undefined source
// value never overwrites an existing key, and other objects are assigned by reference.
export function merge<T extends object>(object: T, ...sources: Array<Record<string, any> | null | undefined>): T {
  const target = Object(object);
  for (const source of sources) {
    if (source) baseMerge(target, source, new Map());
  }
  return target;
}

export function omit<T extends Record<string, any>>(object: T | null | undefined, paths: string | string[]): Partial<T> {
  const result: Partial<T> = { ...(object ?? {}) } as Partial<T>;
  for (const path of Array.isArray(paths) ? paths : [paths]) {
    delete (result as Record<string, unknown>)[path];
  }
  return result;
}

export function omitBy<T extends Record<string, any>>(object: T | null | undefined, predicate?: Predicate<any>): Partial<T> {
  const fn = toIteratee(predicate);
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(object ?? {})) {
    if (!fn(value, key, object)) {
      (result as any)[key] = value;
    }
  }
  return result;
}

export function pick<T extends Record<string, any>>(
  object: T | null | undefined,
  ...paths: Array<string | string[]>
): Partial<T> {
  const result: Partial<T> = {};
  for (const path of paths.flat()) {
    if (object && path in object) {
      (result as any)[path] = object[path];
    }
  }
  return result;
}

function baseRange(start: unknown, end: unknown, step: unknown, fromRight: boolean): number[] {
  let from = toFinite(start);
  let to: number;
  if (end === undefined) {
    to = from;
    from = 0;
  } else {
    to = toFinite(end);
  }
  const by = step === undefined ? (from < to ? 1 : -1) : toFinite(step);
  // The count comes first, so accumulated float error cannot add a value past the end.
  let length = Math.max(Math.ceil((to - from) / (by || 1)), 0);
  const result = new Array<number>(length);
  let index = -1;
  while (length--) {
    result[fromRight ? length : ++index] = from;
    from += by;
  }
  return result;
}

export function range(start: number, end?: number, step?: number): number[] {
  return baseRange(start, end, step, false);
}

export function rangeRight(start: number, end?: number, step?: number): number[] {
  return baseRange(start, end, step, true);
}

export function reduce<T, R>(collection: T[] | Record<string, T> | null | undefined, iteratee: (accumulator: R, value: T, index: number | string, collection: any) => R, accumulator: R): R {
  let result = accumulator;
  const entries = Array.isArray(collection) ? collection.entries() : Object.entries(collection ?? {});
  for (const [key, value] of entries as Iterable<[number | string, T]>) {
    result = iteratee(result, value, key, collection);
  }
  return result;
}

export function remove<T>(array: T[], predicate?: Predicate<T>): T[] {
  const fn = toIteratee(predicate);
  const removed: T[] = [];
  for (let index = array.length - 1; index >= 0; index--) {
    if (fn(array[index], index, array)) {
      removed.unshift(...array.splice(index, 1));
    }
  }
  return removed;
}

export function set<T extends object>(object: T, path: string | number | Array<string | number>, value: unknown): T {
  const parts = toPath(path);
  let current = object as any;
  parts.forEach((key, index) => {
    if (index === parts.length - 1) {
      current[key] = value;
      return;
    }
    const nextKey = parts[index + 1];
    current[key] ??= typeof nextKey === 'number' || /^\d+$/.test(String(nextKey)) ? [] : {};
    current = current[key];
  });
  return object;
}

export function shuffle<T>(array: T[] | null | undefined): T[] {
  const result = [...(array ?? [])];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function tail<T>(array: T[] | null | undefined): T[] {
  return (array ?? []).slice(1);
}

export function takeRight<T>(array: T[] | null | undefined, count = 1): T[] {
  return count <= 0 ? [] : (array ?? []).slice(-count);
}

export function throttle<T extends AnyFn>(
  fn: T,
  wait = 0,
  options: { leading?: boolean; trailing?: boolean } = {}
): CancelableFunction<T> {
  return debounce(fn, wait, {
    leading: options.leading !== false,
    trailing: options.trailing !== false,
    maxWait: wait,
  });
}

export function times<T = number>(count: number, iteratee?: (index: number) => T): T[] {
  const fn = iteratee ?? ((index: number) => index as T);
  return Array.from({ length: Math.max(0, count) }, (_value, index) => fn(index));
}

let uniqueIdCounter = 0;
export function uniqueId(prefix = ''): string {
  uniqueIdCounter += 1;
  return `${prefix}${uniqueIdCounter}`;
}

export function uniq<T>(array: ArrayLike<T> | null | undefined): T[] {
  // lodash returns [] for anything without a length rather than throwing on a non-iterable.
  return array != null && array.length ? Array.from(new Set(Array.from(array))) : [];
}

export function uniqWith<T>(array: T[] | null | undefined, comparator: (a: T, b: T) => boolean): T[] {
  const result: T[] = [];
  for (const item of array ?? []) {
    if (!result.some((existing) => comparator(item, existing))) {
      result.push(item);
    }
  }
  return result;
}

export function zip(...arrays: unknown[][]): unknown[][] {
  const maxLength = Math.max(0, ...arrays.map((array) => array.length));
  return Array.from({ length: maxLength }, (_value, index) => arrays.map((array) => array[index]));
}

const lodash = {
  assign,
  chunk,
  clone,
  cloneDeep,
  compact,
  concat,
  debounce,
  defaults,
  difference,
  differenceWith,
  every,
  escape,
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
  isFinite,
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
};

export default lodash;
