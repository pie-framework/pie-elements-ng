// The lodash 4.17.21 helpers PIE elements use. Each function follows the lodash-es source of the
// same name, and comments mark where it departs. lodash-es has no Buffer, so lodash's Buffer
// branches are left out throughout.

type AnyFn = (...args: any[]) => any;
type Iteratee<T, R = unknown> =
  | ((value: T, index: number | string, collection: any) => R)
  | string
  | number
  | object;
type Predicate<T> = Iteratee<T, boolean>;
type PropertyPath = PropertyKey | readonly PropertyKey[];
type Stack = Map<unknown, unknown>;
type EqualCustomizer = (
  value: unknown,
  other: unknown,
  indexOrKey?: PropertyKey,
  parent?: unknown,
  otherParent?: unknown,
  stack?: Stack
) => boolean | undefined;

export interface CancelableFunction<T extends AnyFn> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  cancel(): void;
  flush(): ReturnType<T> | undefined;
}

const CLONE_DEEP_FLAG = 1;
const CLONE_FLAT_FLAG = 2;
const CLONE_SYMBOLS_FLAG = 4;
const COMPARE_PARTIAL_FLAG = 1;
const COMPARE_UNORDERED_FLAG = 2;
const FUNC_ERROR_TEXT = 'Expected a function';
const LARGE_ARRAY_SIZE = 200;
const MAX_ARRAY_LENGTH = 4294967295;
const MAX_MEMOIZE_SIZE = 500;
const MAX_SAFE_INTEGER = 9007199254740991;

const argsTag = '[object Arguments]';
const arrayTag = '[object Array]';
const arrayBufferTag = '[object ArrayBuffer]';
const asyncTag = '[object AsyncFunction]';
const boolTag = '[object Boolean]';
const dataViewTag = '[object DataView]';
const dateTag = '[object Date]';
const errorTag = '[object Error]';
const funcTag = '[object Function]';
const genTag = '[object GeneratorFunction]';
const mapTag = '[object Map]';
const numberTag = '[object Number]';
const objectTag = '[object Object]';
const proxyTag = '[object Proxy]';
const regexpTag = '[object RegExp]';
const setTag = '[object Set]';
const stringTag = '[object String]';
const symbolTag = '[object Symbol]';

const typedArrayTags = new Set(
  ['Float32', 'Float64', 'Int8', 'Int16', 'Int32', 'Uint8', 'Uint8Clamped', 'Uint16', 'Uint32'].map(
    (type) => `[object ${type}Array]`
  )
);
const cloneableTags = new Set([
  argsTag,
  arrayTag,
  arrayBufferTag,
  boolTag,
  dataViewTag,
  dateTag,
  mapTag,
  numberTag,
  objectTag,
  regexpTag,
  setTag,
  stringTag,
  symbolTag,
  ...typedArrayTags,
]);

const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const reEscapeChar = /\\(\\)?/g;
const reFlags = /\w*$/;
const reHasUnescapedHtml = /[&<>"']/;
const reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
const reIsBinary = /^0b[01]+$/i;
const reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/;
const reIsOctal = /^0o[0-7]+$/i;
const reIsPlainProp = /^\w*$/;
const reIsUint = /^(?:0|[1-9]\d*)$/;
const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const reTrimStart = /^\s+/;
const reUnescapedHtml = /[&<>"']/g;
const reWhitespace = /\s/;

const objectProto = Object.prototype;
const hasOwnProperty = objectProto.hasOwnProperty;
const nativeObjectToString = objectProto.toString;
const propertyIsEnumerable = objectProto.propertyIsEnumerable;
const funcToString = Function.prototype.toString;
const objectCtorString = funcToString.call(Object);
const symbolToString = Symbol.prototype.toString;
const symbolValueOf = Symbol.prototype.valueOf;

function isObjectLike(value: unknown): value is Record<PropertyKey, any> {
  return value != null && typeof value == 'object';
}

// SameValueZero, as lodash's `eq`: -0 equals 0 and NaN equals NaN.
function eq(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}

function getRawTag(value: any): string {
  const isOwn = hasOwnProperty.call(value, Symbol.toStringTag);
  const tag = value[Symbol.toStringTag];
  let unmasked = false;
  try {
    value[Symbol.toStringTag] = undefined;
    unmasked = true;
  } catch {}
  const result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[Symbol.toStringTag] = tag;
    } else {
      delete value[Symbol.toStringTag];
    }
  }
  return result;
}

function baseGetTag(value: unknown): string {
  if (value == null) {
    return value === undefined ? '[object Undefined]' : '[object Null]';
  }
  return Symbol.toStringTag in Object(value) ? getRawTag(value) : nativeObjectToString.call(value);
}

function isLength(value: unknown): value is number {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

function isIndex(value: unknown, length?: number): boolean {
  const type = typeof value;
  const limit = length == null ? MAX_SAFE_INTEGER : length;
  return (
    !!limit &&
    (type == 'number' || (type != 'symbol' && reIsUint.test(value as string))) &&
    (value as number) > -1 &&
    (value as number) % 1 == 0 &&
    (value as number) < limit
  );
}

function isArrayLike(value: unknown): value is ArrayLike<any> {
  return value != null && isLength((value as any).length) && !isFunction(value);
}

function isArrayLikeObject(value: unknown): value is ArrayLike<any> & object {
  return isObjectLike(value) && isArrayLike(value);
}

function isArguments(value: unknown): value is IArguments {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

function isTypedArray(value: unknown): value is ArrayBufferView & ArrayLike<number> {
  return isObjectLike(value) && isLength(value.length) && typedArrayTags.has(baseGetTag(value));
}

function isSymbol(value: unknown): value is symbol {
  return typeof value == 'symbol' || (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

function isMap(value: unknown): value is Map<unknown, unknown> {
  return isObjectLike(value) && baseGetTag(value) == mapTag;
}

function isSet(value: unknown): value is Set<unknown> {
  return isObjectLike(value) && baseGetTag(value) == setTag;
}

function isPrototype(value: any): boolean {
  const Ctor = value && value.constructor;
  const proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto;
  return value === proto;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) return false;
  const proto = Object.getPrototypeOf(Object(value));
  if (proto === null) return true;
  const Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return (
    typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString
  );
}

function isStrictComparable(value: unknown): boolean {
  return value === value && !isObject(value);
}

function trimmedEndIndex(string: string): number {
  let index = string.length;
  while (index-- && reWhitespace.test(string.charAt(index))) {}
  return index;
}

function baseTrim(string: string): string {
  return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, '') : string;
}

function toNumber(value: unknown): number {
  if (typeof value == 'number') return value;
  if (isSymbol(value)) return Number.NaN;
  if (isObject(value)) {
    const other = typeof (value as any).valueOf == 'function' ? (value as any).valueOf() : value;
    value = isObject(other) ? (other as any) + '' : other;
  }
  if (typeof value != 'string') return value === 0 ? value : +(value as any);
  const string = baseTrim(value);
  const isBinary = reIsBinary.test(string);
  if (isBinary || reIsOctal.test(string)) return parseInt(string.slice(2), isBinary ? 2 : 8);
  return reIsBadHex.test(string) ? Number.NaN : +string;
}

function toFinite(value: unknown): number {
  if (!value) return value === 0 ? value : 0;
  const number = toNumber(value);
  if (number === Infinity || number === -Infinity) return number < 0 ? -Number.MAX_VALUE : Number.MAX_VALUE;
  return number === number ? number : 0;
}

function toInteger(value: unknown): number {
  const result = toFinite(value);
  const remainder = result % 1;
  return remainder ? result - remainder : result;
}

function baseToString(value: any): string {
  if (typeof value == 'string') return value;
  if (Array.isArray(value)) return arrayMap(value, baseToString) + '';
  if (isSymbol(value)) return symbolToString.call(value);
  const result = value + '';
  return result == '0' && 1 / value == -Infinity ? '-0' : result;
}

function toString(value: unknown): string {
  return value == null ? '' : baseToString(value);
}

function toKey(value: unknown): PropertyKey {
  if (typeof value == 'string' || isSymbol(value)) return value as PropertyKey;
  const result = (value as any) + '';
  return result == '0' && 1 / (value as number) == -Infinity ? '-0' : result;
}

function identity<T>(value: T): T {
  return value;
}

function castFunction(value: unknown): AnyFn {
  return typeof value == 'function' ? (value as AnyFn) : identity;
}

function arrayEach(array: any, iteratee: (value: any, index: number, array: any) => unknown): any {
  let index = -1;
  const length = array == null ? 0 : array.length;
  while (++index < length) {
    if (iteratee(array[index], index, array) === false) break;
  }
  return array;
}

function arrayEvery(array: any, predicate: AnyFn): boolean {
  let index = -1;
  const length = array == null ? 0 : array.length;
  while (++index < length) {
    if (!predicate(array[index], index, array)) return false;
  }
  return true;
}

function arrayFilter(array: any, predicate: (value: any, index: number, array: any) => unknown): any[] {
  let index = -1;
  const length = array == null ? 0 : array.length;
  const result: any[] = [];
  while (++index < length) {
    const value = array[index];
    if (predicate(value, index, array)) result.push(value);
  }
  return result;
}

function arrayMap<R>(array: any, iteratee: (value: any, index: number, array: any) => R): R[] {
  let index = -1;
  const length = array == null ? 0 : array.length;
  const result = Array<R>(length);
  while (++index < length) result[index] = iteratee(array[index], index, array);
  return result;
}

function arrayPush<T>(array: T[], values: ArrayLike<T>): T[] {
  let index = -1;
  const { length } = values;
  const offset = array.length;
  while (++index < length) array[offset + index] = values[index];
  return array;
}

function arraySome(array: any, predicate: (value: any, index: number) => unknown): boolean {
  let index = -1;
  const length = array == null ? 0 : array.length;
  while (++index < length) {
    if (predicate(array[index], index)) return true;
  }
  return false;
}

function baseIsNaN(value: unknown): boolean {
  return value !== value;
}

function baseFindIndex(array: any, predicate: AnyFn, fromIndex: number): number {
  const { length } = array;
  let index = fromIndex - 1;
  while (++index < length) {
    if (predicate(array[index], index, array)) return index;
  }
  return -1;
}

function strictIndexOf(array: any, value: unknown, fromIndex: number): number {
  let index = fromIndex - 1;
  const { length } = array;
  while (++index < length) {
    if (array[index] === value) return index;
  }
  return -1;
}

function baseIndexOf(array: any, value: unknown, fromIndex: number): number {
  return value === value
    ? strictIndexOf(array, value, fromIndex)
    : baseFindIndex(array, baseIsNaN, fromIndex);
}

function arrayIncludes(array: any, value: unknown): boolean {
  const length = array == null ? 0 : array.length;
  return !!length && baseIndexOf(array, value, 0) > -1;
}

function arrayIncludesWith(array: any, value: unknown, comparator: AnyFn): boolean {
  let index = -1;
  const length = array == null ? 0 : array.length;
  while (++index < length) {
    if (comparator(value, array[index])) return true;
  }
  return false;
}

// Native Sets stand in for lodash's SetCache: both compare with SameValueZero.
function createCache(values?: any): Set<unknown> {
  const cache = new Set<unknown>();
  const length = values == null ? 0 : values.length;
  for (let index = 0; index < length; index++) cache.add(values[index]);
  return cache;
}

function cacheHas(cache: Set<unknown>, key: unknown): boolean {
  return cache.has(key);
}

function baseSlice<T>(array: ArrayLike<T>, start: number, end: number): T[] {
  let index = -1;
  let { length } = array;
  if (start < 0) start = -start > length ? 0 : length + start;
  end = end > length ? length : end;
  if (end < 0) end += length;
  length = start > end ? 0 : (end - start) >>> 0;
  start >>>= 0;
  const result = Array<T>(length);
  while (++index < length) result[index] = array[index + start];
  return result;
}

function baseTimes<T>(n: number, iteratee: (index: number) => T): T[] {
  let index = -1;
  const result = Array<T>(n);
  while (++index < n) result[index] = iteratee(index);
  return result;
}

function copyArray<T>(source: ArrayLike<T>, array?: T[]): T[] {
  let index = -1;
  const { length } = source;
  const result = array || Array<T>(length);
  while (++index < length) result[index] = source[index];
  return result;
}

function last<T>(array: ArrayLike<T> | null | undefined): T | undefined {
  const length = array == null ? 0 : array.length;
  return length ? array![length - 1] : undefined;
}

function setToArray(set: Set<unknown>): unknown[] {
  let index = -1;
  const result = Array(set.size);
  set.forEach((value) => {
    result[++index] = value;
  });
  return result;
}

function mapToArray(map: Map<unknown, unknown>): unknown[] {
  let index = -1;
  const result = Array(map.size);
  map.forEach((value, key) => {
    result[++index] = [key, value];
  });
  return result;
}

function arrayLikeKeys(value: any, inherited: boolean): string[] {
  const isArr = Array.isArray(value);
  const isArg = !isArr && isArguments(value);
  const isType = !isArr && !isArg && isTypedArray(value);
  const skipIndexes = isArr || isArg || isType;
  const result = skipIndexes ? baseTimes(value.length, String) : [];
  const { length } = result;
  for (const key in value) {
    if (
      (inherited || hasOwnProperty.call(value, key)) &&
      !(
        skipIndexes &&
        (key == 'length' ||
          (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
          isIndex(key, length))
      )
    ) {
      result.push(key);
    }
  }
  return result;
}

function baseKeys(object: any): string[] {
  if (!isPrototype(object)) return Object.keys(Object(object));
  const result: string[] = [];
  for (const key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') result.push(key);
  }
  return result;
}

function nativeKeysIn(object: any): string[] {
  const result: string[] = [];
  if (object != null) {
    for (const key in Object(object)) result.push(key);
  }
  return result;
}

function baseKeysIn(object: any): string[] {
  if (!isObject(object)) return nativeKeysIn(object);
  const isProto = isPrototype(object);
  const result: string[] = [];
  for (const key in object) {
    if (!(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) result.push(key);
  }
  return result;
}

function keys(object: any): string[] {
  return isArrayLike(object) ? arrayLikeKeys(object, false) : baseKeys(object);
}

function keysIn(object: any): string[] {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}

function getSymbols(object: any): symbol[] {
  if (object == null) return [];
  const target = Object(object);
  return Object.getOwnPropertySymbols(target).filter((symbol) =>
    propertyIsEnumerable.call(target, symbol)
  );
}

function getSymbolsIn(object: any): symbol[] {
  const result: symbol[] = [];
  let current = object;
  while (current) {
    arrayPush(result, getSymbols(current));
    current = Object.getPrototypeOf(Object(current));
  }
  return result;
}

function getAllKeys(object: any): PropertyKey[] {
  const result: PropertyKey[] = keys(object);
  return Array.isArray(object) ? result : arrayPush(result, getSymbols(object));
}

function getAllKeysIn(object: any): PropertyKey[] {
  const result: PropertyKey[] = keysIn(object);
  return Array.isArray(object) ? result : arrayPush(result, getSymbolsIn(object));
}

function values(object: any): unknown[] {
  return object == null ? [] : arrayMap(keys(object), (key) => object[key]);
}

function baseAssignValue(object: any, key: PropertyKey, value: unknown): void {
  if (key == '__proto__') {
    Object.defineProperty(object, key, { configurable: true, enumerable: true, value, writable: true });
  } else {
    object[key] = value;
  }
}

function assignValue(object: any, key: PropertyKey, value: unknown): void {
  const objValue = object[key];
  if (
    !(hasOwnProperty.call(object, key) && eq(objValue, value)) ||
    (value === undefined && !(key in object))
  ) {
    baseAssignValue(object, key, value);
  }
}

function copyObject(source: any, props: ArrayLike<PropertyKey>, object?: any): any {
  const isNew = !object;
  const result = object || {};
  let index = -1;
  const { length } = props;
  while (++index < length) {
    const key = props[index];
    if (isNew) {
      baseAssignValue(result, key, source[key]);
    } else {
      assignValue(result, key, source[key]);
    }
  }
  return result;
}

function baseAssign(object: any, source: any): any {
  return object && copyObject(source, keys(source), object);
}

function baseAssignIn(object: any, source: any): any {
  return object && copyObject(source, keysIn(source), object);
}

function copySymbols(source: any, object: any): any {
  return copyObject(source, getSymbols(source), object);
}

function copySymbolsIn(source: any, object: any): any {
  return copyObject(source, getSymbolsIn(source), object);
}

function isIterateeCall(value: unknown, index: unknown, object: unknown): boolean {
  if (!isObject(object)) return false;
  const type = typeof index;
  if (
    type == 'number'
      ? isArrayLike(object) && isIndex(index, object.length)
      : type == 'string' && (index as string) in object
  ) {
    return eq((object as any)[index as PropertyKey], value);
  }
  return false;
}

// lodash's createAssigner without its customizer, which none of these helpers take. A call that
// looks like an iteratee call, as in `reduce(list, assign, {})`, applies only the first source.
function assignSources(
  object: unknown,
  sources: unknown[],
  assigner: (object: any, source: any) => void
): any {
  let index = -1;
  let { length } = sources;
  const guard = length > 2 ? sources[2] : undefined;
  if (guard && isIterateeCall(sources[0], sources[1], guard)) length = 1;
  const target = Object(object);
  while (++index < length) {
    const source = sources[index];
    if (source) assigner(target, source);
  }
  return target;
}

function baseFor(object: any, iteratee: AnyFn, keysFunc: (object: any) => string[]): any {
  let index = -1;
  const iterable = Object(object);
  const props = keysFunc(object);
  let { length } = props;
  while (length--) {
    const key = props[++index];
    if (iteratee(iterable[key], key, iterable) === false) break;
  }
  return object;
}

function baseForOwn(object: any, iteratee: AnyFn): any {
  return object && baseFor(object, iteratee, keys);
}

function baseEach(collection: any, iteratee: AnyFn): any {
  if (collection == null) return collection;
  if (!isArrayLike(collection)) return baseForOwn(collection, iteratee);
  const { length } = collection;
  let index = -1;
  const iterable = Object(collection);
  while (++index < length) {
    if (iteratee(iterable[index], index, iterable) === false) break;
  }
  return collection;
}

function isFlattenable(value: any): boolean {
  return Array.isArray(value) || isArguments(value) || !!(value && value[Symbol.isConcatSpreadable]);
}

function baseFlatten(
  array: any,
  depth: number,
  predicate: (value: unknown) => boolean = isFlattenable,
  isStrict = false,
  result: any[] = []
): any[] {
  let index = -1;
  const { length } = array;
  while (++index < length) {
    const value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

function baseDifference(array: any, values: any[], comparator?: AnyFn): any[] {
  let index = -1;
  let includes: (values: any, value: unknown, comparator?: any) => boolean = arrayIncludes;
  let isCommon = true;
  const { length } = array;
  const result: any[] = [];
  const valuesLength = values.length;
  let lookup: any = values;
  if (!length) return result;
  if (comparator) {
    includes = arrayIncludesWith;
    isCommon = false;
  } else if (values.length >= LARGE_ARRAY_SIZE) {
    includes = cacheHas;
    isCommon = false;
    lookup = createCache(values);
  }
  outer: while (++index < length) {
    let value = array[index];
    const computed = value;
    value = comparator || value !== 0 ? value : 0;
    if (isCommon && computed === computed) {
      let valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (lookup[valuesIndex] === computed) continue outer;
      }
      result.push(value);
    } else if (!includes(lookup, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

function castArrayLikeObject(value: unknown): ArrayLike<any> {
  return isArrayLikeObject(value) ? value : [];
}

function baseIntersection(arrays: ArrayLike<any>[]): any[] {
  const length = arrays[0].length;
  const othLength = arrays.length;
  let othIndex = othLength;
  const caches: Array<Set<unknown> | undefined> = Array(othLength);
  let maxLength = Infinity;
  const result: any[] = [];
  while (othIndex--) {
    const array = arrays[othIndex];
    maxLength = Math.min(array.length, maxLength);
    caches[othIndex] =
      length >= 120 && array.length >= 120 ? createCache(othIndex ? array : undefined) : undefined;
  }
  const array = arrays[0];
  let index = -1;
  const seen = caches[0];
  outer: while (++index < length && result.length < maxLength) {
    let value = array[index];
    const computed = value;
    value = value !== 0 ? value : 0;
    if (!(seen ? cacheHas(seen, computed) : arrayIncludes(result, computed))) {
      othIndex = othLength;
      while (--othIndex) {
        const cache = caches[othIndex];
        if (!(cache ? cacheHas(cache, computed) : arrayIncludes(arrays[othIndex], computed))) {
          continue outer;
        }
      }
      if (seen) seen.add(computed);
      result.push(value);
    }
  }
  return result;
}

function baseUniq(array: any, comparator?: AnyFn): any[] {
  let index = -1;
  let includes: (values: any, value: unknown, comparator?: any) => boolean = arrayIncludes;
  const { length } = array;
  let isCommon = true;
  const result: any[] = [];
  if (comparator) {
    isCommon = false;
    includes = arrayIncludesWith;
  } else if (length >= LARGE_ARRAY_SIZE) {
    return setToArray(new Set(array));
  }
  outer: while (++index < length) {
    let value = array[index];
    const computed = value;
    value = comparator || value !== 0 ? value : 0;
    if (isCommon && computed === computed) {
      let seenIndex = result.length;
      while (seenIndex--) {
        if (result[seenIndex] === computed) continue outer;
      }
      result.push(value);
    } else if (!includes(result, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

function stringToPathUncached(string: string): string[] {
  const result: string[] = [];
  if (string.charCodeAt(0) === 46 /* . */) result.push('');
  string.replace(rePropName, (match, number, quote, subString) => {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : number || match);
    return match;
  });
  return result;
}

// lodash's memoizeCapped: the cache starts over once it holds MAX_MEMOIZE_SIZE paths.
const stringToPathCache = new Map<string, string[]>();
function stringToPath(string: string): string[] {
  if (stringToPathCache.size === MAX_MEMOIZE_SIZE) stringToPathCache.clear();
  let result = stringToPathCache.get(string);
  if (result === undefined) {
    result = stringToPathUncached(string);
    stringToPathCache.set(string, result);
  }
  return result;
}

function isKey(value: unknown, object?: unknown): boolean {
  if (Array.isArray(value)) return false;
  const type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol(value)) {
    return true;
  }
  return (
    reIsPlainProp.test(value as string) ||
    !reIsDeepProp.test(value as string) ||
    (object != null && (value as PropertyKey) in Object(object))
  );
}

function castPath(value: unknown, object?: unknown): any[] {
  if (Array.isArray(value)) return value;
  return isKey(value, object) ? [value] : stringToPath(toString(value));
}

function baseGet(object: any, path: unknown): any {
  const parts = castPath(path, object);
  let index = 0;
  const { length } = parts;
  let current = object;
  while (current != null && index < length) current = current[toKey(parts[index++])];
  return index && index == length ? current : undefined;
}

function baseSet(object: any, path: unknown, value: unknown): any {
  if (!isObject(object)) return object;
  const parts = castPath(path, object);
  let index = -1;
  const { length } = parts;
  const lastIndex = length - 1;
  let nested: any = object;
  while (nested != null && ++index < length) {
    const key = toKey(parts[index]);
    let newValue = value;
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return object;
    if (index != lastIndex) {
      const objValue = nested[key];
      newValue = isObject(objValue) ? objValue : isIndex(parts[index + 1]) ? [] : {};
    }
    assignValue(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}

function baseHasIn(object: any, key: PropertyKey): boolean {
  return object != null && key in Object(object);
}

function hasPath(object: any, path: unknown, hasFunc: (object: any, key: PropertyKey) => boolean): boolean {
  const parts = castPath(path, object);
  let index = -1;
  let { length } = parts;
  let result = false;
  let key: PropertyKey | undefined;
  let current = object;
  while (++index < length) {
    key = toKey(parts[index]);
    result = current != null && hasFunc(current, key);
    if (!result) break;
    current = current[key];
  }
  if (result || ++index != length) return result;
  length = current == null ? 0 : current.length;
  return (
    !!length &&
    isLength(length) &&
    isIndex(key, length) &&
    (Array.isArray(current) || isArguments(current))
  );
}

function hasIn(object: unknown, path: unknown): boolean {
  return object != null && hasPath(object, path, baseHasIn);
}

function parent(object: any, path: any[]): any {
  return path.length < 2 ? object : baseGet(object, baseSlice(path, 0, -1));
}

// The prototype-pollution guard comes from lodash 4.17.23.
function baseUnset(object: any, path: unknown): boolean {
  const parts = castPath(path, object);
  let index = -1;
  const { length } = parts;
  if (!length) return true;
  const isRootPrimitive = object == null || (typeof object !== 'object' && typeof object !== 'function');
  while (++index < length) {
    const key = parts[index];
    if (typeof key !== 'string') continue;
    if (key === '__proto__' && !hasOwnProperty.call(object, '__proto__')) return false;
    if (
      key === 'constructor' &&
      index + 1 < length &&
      typeof parts[index + 1] === 'string' &&
      parts[index + 1] === 'prototype'
    ) {
      if (isRootPrimitive && index === 0) continue;
      return false;
    }
  }
  const target = parent(object, parts);
  return target == null || delete target[toKey(last(parts))];
}

function basePickBy(object: any, paths: unknown[], predicate: (value: unknown, path: any) => unknown): any {
  let index = -1;
  const { length } = paths;
  const result = {};
  while (++index < length) {
    const path = paths[index];
    const value = baseGet(object, path);
    if (predicate(value, path)) baseSet(result, castPath(path, object), value);
  }
  return result;
}

function baseProperty(key: PropertyKey): AnyFn {
  return (object: any) => (object == null ? undefined : object[key]);
}

function basePropertyDeep(path: unknown): AnyFn {
  return (object: any) => baseGet(object, path);
}

function property(path: unknown): AnyFn {
  return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
}

function equalArrayBuffers(buffer: ArrayBuffer, other: ArrayBuffer): boolean {
  return buffer.byteLength == other.byteLength && baseIsEqual(new Uint8Array(buffer), new Uint8Array(other));
}

function equalArrays(
  array: any,
  other: any,
  bitmask: number,
  customizer: EqualCustomizer | undefined,
  stack: Stack
): boolean {
  const isPartial = bitmask & COMPARE_PARTIAL_FLAG;
  const arrLength = array.length;
  const othLength = other.length;
  if (arrLength != othLength && !(isPartial && othLength > arrLength)) return false;
  const arrStacked = stack.get(array);
  const othStacked = stack.get(other);
  if (arrStacked && othStacked) return arrStacked == other && othStacked == array;
  let index = -1;
  let result = true;
  const seen = bitmask & COMPARE_UNORDERED_FLAG ? new Set<number>() : undefined;
  stack.set(array, other);
  stack.set(other, array);
  while (++index < arrLength) {
    const arrValue = array[index];
    const othValue = other[index];
    let compared: boolean | undefined;
    if (customizer) {
      compared = isPartial
        ? customizer(othValue, arrValue, index, other, array, stack)
        : customizer(arrValue, othValue, index, array, other, stack);
    }
    if (compared !== undefined) {
      if (compared) continue;
      result = false;
      break;
    }
    if (seen) {
      if (
        !arraySome(other, (othItem, othIndex) => {
          if (
            !seen.has(othIndex) &&
            (arrValue === othItem || baseIsEqual(arrValue, othItem, bitmask, customizer, stack))
          ) {
            return seen.add(othIndex);
          }
          return false;
        })
      ) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || baseIsEqual(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }
  stack.delete(array);
  stack.delete(other);
  return result;
}

function equalByTag(
  object: any,
  other: any,
  tag: string,
  bitmask: number,
  customizer: EqualCustomizer | undefined,
  stack: Stack
): boolean {
  switch (tag) {
    case dataViewTag:
      return (
        object.byteLength == other.byteLength &&
        object.byteOffset == other.byteOffset &&
        equalArrayBuffers(object.buffer, other.buffer)
      );
    case arrayBufferTag:
      return equalArrayBuffers(object, other);
    case boolTag:
    case dateTag:
    case numberTag:
      return eq(+object, +other);
    case errorTag:
      return object.name == other.name && object.message == other.message;
    case regexpTag:
    case stringTag:
      return object == other + '';
    case mapTag:
    case setTag: {
      const isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      if (object.size != other.size && !isPartial) return false;
      const stacked = stack.get(object);
      if (stacked) return stacked == other;
      const convert = tag == mapTag ? mapToArray : setToArray;
      stack.set(object, other);
      const result = equalArrays(
        convert(object),
        convert(other),
        bitmask | COMPARE_UNORDERED_FLAG,
        customizer,
        stack
      );
      stack.delete(object);
      return result;
    }
    case symbolTag:
      return symbolValueOf.call(object) == symbolValueOf.call(other);
  }
  return false;
}

function equalObjects(
  object: any,
  other: any,
  bitmask: number,
  customizer: EqualCustomizer | undefined,
  stack: Stack
): boolean {
  const isPartial = bitmask & COMPARE_PARTIAL_FLAG;
  const objProps = getAllKeys(object);
  const objLength = objProps.length;
  const othLength = getAllKeys(other).length;
  if (objLength != othLength && !isPartial) return false;
  let index = objLength;
  while (index--) {
    const key = objProps[index];
    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) return false;
  }
  const objStacked = stack.get(object);
  const othStacked = stack.get(other);
  if (objStacked && othStacked) return objStacked == other && othStacked == object;
  let result = true;
  stack.set(object, other);
  stack.set(other, object);
  let skipCtor = !!isPartial;
  while (++index < objLength) {
    const key = objProps[index];
    const objValue = object[key];
    const othValue = other[key];
    let compared: boolean | undefined;
    if (customizer) {
      compared = isPartial
        ? customizer(othValue, objValue, key, other, object, stack)
        : customizer(objValue, othValue, key, object, other, stack);
    }
    if (
      !(compared === undefined
        ? objValue === othValue || baseIsEqual(objValue, othValue, bitmask, customizer, stack)
        : compared)
    ) {
      result = false;
      break;
    }
    skipCtor ||= key == 'constructor';
  }
  if (result && !skipCtor) {
    const objCtor = object.constructor;
    const othCtor = other.constructor;
    if (
      objCtor != othCtor &&
      'constructor' in object &&
      'constructor' in other &&
      !(
        typeof objCtor == 'function' &&
        objCtor instanceof objCtor &&
        typeof othCtor == 'function' &&
        othCtor instanceof othCtor
      )
    ) {
      result = false;
    }
  }
  stack.delete(object);
  stack.delete(other);
  return result;
}

function baseIsEqualDeep(
  object: any,
  other: any,
  bitmask: number,
  customizer: EqualCustomizer | undefined,
  stack: Stack | undefined
): boolean {
  const objIsArr = Array.isArray(object);
  const othIsArr = Array.isArray(other);
  let objTag = objIsArr ? arrayTag : baseGetTag(object);
  let othTag = othIsArr ? arrayTag : baseGetTag(other);
  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;
  const objIsObj = objTag == objectTag;
  const isSameTag = objTag == othTag;
  if (isSameTag && !objIsObj) {
    return objIsArr || isTypedArray(object)
      ? equalArrays(object, other, bitmask, customizer, stack || new Map())
      : equalByTag(object, other, objTag, bitmask, customizer, stack || new Map());
  }
  // lodash calls `value()` here on an object with an own `__wrapped__` key, to unwrap its chain
  // wrappers. This package has none, so such an object compares by its keys.
  if (!isSameTag) return false;
  return equalObjects(object, other, bitmask, customizer, stack || new Map());
}

function baseIsEqual(
  value: unknown,
  other: unknown,
  bitmask = 0,
  customizer?: EqualCustomizer,
  stack?: Stack
): boolean {
  if (value === other) return true;
  if (value == null || other == null || (!isObjectLike(value) && !isObjectLike(other))) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, stack);
}

function getMatchData(object: any): Array<[PropertyKey, unknown, boolean]> {
  return keys(object).map((key) => [key, object[key], isStrictComparable(object[key])]);
}

function matchesStrictComparable(key: PropertyKey, srcValue: unknown): AnyFn {
  return (object: any) =>
    object != null && object[key] === srcValue && (srcValue !== undefined || key in Object(object));
}

function baseIsMatch(object: any, matchData: Array<[PropertyKey, unknown, boolean]>): boolean {
  let index = matchData.length;
  const length = index;
  if (object == null) return !length;
  const target = Object(object);
  while (index--) {
    const [key, srcValue, strict] = matchData[index];
    if (strict ? srcValue !== target[key] : !(key in target)) return false;
  }
  while (++index < length) {
    const [key, srcValue, strict] = matchData[index];
    const objValue = target[key];
    if (strict) {
      if (objValue === undefined && !(key in target)) return false;
    } else if (!baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG)) {
      return false;
    }
  }
  return true;
}

function baseMatches(source: object): AnyFn {
  const matchData = getMatchData(source);
  if (matchData.length == 1 && matchData[0][2]) {
    return matchesStrictComparable(matchData[0][0], matchData[0][1]);
  }
  return (object: unknown) => object === source || baseIsMatch(object, matchData);
}

function baseMatchesProperty(path: unknown, srcValue: unknown): AnyFn {
  if (isKey(path) && isStrictComparable(srcValue)) {
    return matchesStrictComparable(toKey(path), srcValue);
  }
  return (object: unknown) => {
    const objValue = get(object, path as PropertyPath);
    return objValue === undefined && objValue === srcValue
      ? hasIn(object, path)
      : baseIsEqual(srcValue, objValue, COMPARE_PARTIAL_FLAG | COMPARE_UNORDERED_FLAG);
  };
}

function baseIteratee(value: unknown): AnyFn {
  if (typeof value == 'function') return value as AnyFn;
  if (value == null) return identity;
  if (typeof value == 'object') {
    return Array.isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
  }
  return property(value);
}

function baseCreate(proto: unknown): any {
  return isObject(proto) ? Object.create(proto) : {};
}

function initCloneArray(array: any): any {
  const { length } = array;
  const result = new array.constructor(length);
  // A `RegExp#exec` result: the clone keeps its `index` and `input`.
  if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}

function initCloneObject(object: any): any {
  return typeof object.constructor == 'function' && !isPrototype(object)
    ? baseCreate(Object.getPrototypeOf(Object(object)))
    : {};
}

function cloneArrayBuffer(arrayBuffer: any): any {
  const result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array(result).set(new Uint8Array(arrayBuffer));
  return result;
}

function cloneTypedArray(typedArray: any, isDeep: boolean): any {
  const buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}

function initCloneByTag(object: any, tag: string, isDeep: boolean): any {
  const Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag:
      return cloneArrayBuffer(object);
    case boolTag:
    case dateTag:
      return new Ctor(+object);
    case dataViewTag: {
      const buffer = isDeep ? cloneArrayBuffer(object.buffer) : object.buffer;
      return new Ctor(buffer, object.byteOffset, object.byteLength);
    }
    case mapTag:
    case setTag:
      return new Ctor();
    case numberTag:
    case stringTag:
      return new Ctor(object);
    case regexpTag: {
      const result = new Ctor(object.source, reFlags.exec(object) as any);
      result.lastIndex = object.lastIndex;
      return result;
    }
    case symbolTag:
      return Object(symbolValueOf.call(object));
  }
  return typedArrayTags.has(tag) ? cloneTypedArray(object, isDeep) : undefined;
}

function baseClone(
  value: any,
  bitmask: number,
  customizer?: (value: any, key?: PropertyKey, object?: any, stack?: Stack) => unknown,
  key?: PropertyKey,
  object?: any,
  stack?: Stack
): any {
  let result: any;
  const isDeep = !!(bitmask & CLONE_DEEP_FLAG);
  const isFlat = !!(bitmask & CLONE_FLAT_FLAG);
  const isFull = !!(bitmask & CLONE_SYMBOLS_FLAG);
  if (customizer) result = object ? customizer(value, key, object, stack) : customizer(value);
  if (result !== undefined) return result;
  if (!isObject(value)) return value;
  const isArr = Array.isArray(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) return copyArray(value, result);
  } else {
    const tag = baseGetTag(value);
    const isFunc = tag == funcTag || tag == genTag;
    if (tag == objectTag || tag == argsTag || (isFunc && !object)) {
      result = isFlat || isFunc ? {} : initCloneObject(value);
      if (!isDeep) {
        return isFlat
          ? copySymbolsIn(value, baseAssignIn(result, value))
          : copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags.has(tag)) return object ? value : {};
      result = initCloneByTag(value, tag, isDeep);
    }
  }
  const cloneStack = stack || new Map();
  const stacked = cloneStack.get(value);
  if (stacked) return stacked;
  cloneStack.set(value, result);
  if (isSet(value)) {
    value.forEach((subValue: unknown) => {
      result.add(baseClone(subValue, bitmask, customizer, subValue as PropertyKey, value, cloneStack));
    });
  } else if (isMap(value)) {
    value.forEach((subValue: unknown, subKey: unknown) => {
      result.set(subKey, baseClone(subValue, bitmask, customizer, subKey as PropertyKey, value, cloneStack));
    });
  }
  const keysFunc = isFull ? (isFlat ? getAllKeysIn : getAllKeys) : isFlat ? keysIn : keys;
  const props = isArr ? undefined : keysFunc(value);
  arrayEach(props || value, (subValue: any, index: number) => {
    let subKey: PropertyKey = index;
    let item = subValue;
    if (props) {
      subKey = subValue;
      item = (value as any)[subKey];
    }
    assignValue(result, subKey, baseClone(item, bitmask, customizer, subKey, value, cloneStack));
  });
  return result;
}

function customOmitClone(value: unknown): unknown {
  return isPlainObject(value) ? undefined : value;
}

function negate(predicate: AnyFn): AnyFn {
  if (typeof predicate != 'function') throw new TypeError(FUNC_ERROR_TEXT);
  return function (this: unknown, ...args: unknown[]) {
    return !predicate.apply(this, args);
  };
}

function pickBy(object: any, predicate: unknown): any {
  if (object == null) return {};
  const props = arrayMap(getAllKeysIn(object), (prop) => [prop]);
  const fn = baseIteratee(predicate);
  return basePickBy(object, props, (value, path) => fn(value, path[0]));
}

function findIndex(array: any, predicate: AnyFn, fromIndex: unknown): number {
  const length = array == null ? 0 : array.length;
  if (!length) return -1;
  let index = fromIndex == null ? 0 : toInteger(fromIndex);
  if (index < 0) index = Math.max(length + index, 0);
  return baseFindIndex(array, predicate, index);
}

function unzip(array: unknown[]): unknown[][] {
  if (!(array && array.length)) return [];
  let length = 0;
  const groups = arrayFilter(array, (group) => {
    if (!isArrayLikeObject(group)) return false;
    length = Math.max(group.length, length);
    return true;
  });
  return baseTimes(length, (index) => arrayMap(groups, baseProperty(index)));
}

// Reads Math.random when called, where lodash-es captures it when the module loads, so a test
// that replaces Math.random after importing still controls the order.
function shuffleSelf<T>(array: T[]): T[] {
  let index = -1;
  const { length } = array;
  const lastIndex = length - 1;
  while (++index < length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = array[rand];
    array[rand] = array[index];
    array[index] = value;
  }
  return array;
}

export function assign<T extends object>(object: T, ...sources: Array<object | null | undefined>): T {
  return assignSources(object, sources, (target, source) => {
    if (isPrototype(source) || isArrayLike(source)) {
      copyObject(source, keys(source), target);
      return;
    }
    for (const key in source) {
      if (hasOwnProperty.call(source, key)) assignValue(target, key, source[key]);
    }
  });
}

export function chunk<T>(array: ArrayLike<T> | null | undefined, size?: number, guard?: unknown): T[][] {
  const chunkSize = (guard ? isIterateeCall(array, size, guard) : size === undefined)
    ? 1
    : Math.max(toInteger(size), 0);
  const length = array == null ? 0 : array.length;
  if (!length || chunkSize < 1) return [];
  let index = 0;
  let resIndex = 0;
  const result = Array<T[]>(Math.ceil(length / chunkSize));
  while (index < length) {
    result[resIndex++] = baseSlice(array!, index, (index += chunkSize));
  }
  return result;
}

export function clone<T>(value: T): T {
  return baseClone(value, CLONE_SYMBOLS_FLAG);
}

export function cloneDeep<T>(value: T): T {
  return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
}

export function compact<T>(array: ArrayLike<T> | null | undefined): T[] {
  let index = -1;
  const length = array == null ? 0 : array.length;
  const result: T[] = [];
  while (++index < length) {
    const value = array![index];
    if (value) result.push(value);
  }
  return result;
}

export function concat<T>(array: T[] | null | undefined, ...values: Array<T | T[]>): T[] {
  if (!arguments.length) return [];
  return arrayPush(Array.isArray(array) ? copyArray(array) : [array as T], baseFlatten(values, 1));
}

export function debounce<T extends AnyFn>(
  func: T,
  wait?: number,
  options?: { leading?: boolean; trailing?: boolean; maxWait?: number }
): CancelableFunction<T> {
  let lastArgs: Parameters<T> | undefined;
  let lastThis: unknown;
  let maxWait = 0;
  let result: ReturnType<T> | undefined;
  let timerId: ReturnType<typeof setTimeout> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let leading = false;
  let maxing = false;
  let trailing = true;
  if (typeof func != 'function') throw new TypeError(FUNC_ERROR_TEXT);
  const delay = toNumber(wait) || 0;
  if (isObject(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? Math.max(toNumber(options.maxWait) || 0, delay) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  const invokeFunc = (time: number) => {
    const args = lastArgs as Parameters<T>;
    const thisArg = lastThis;
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  };

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime as number);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = delay - timeSinceLastCall;
    return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  };

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - (lastCallTime as number);
    const timeSinceLastInvoke = time - lastInvokeTime;
    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxing && timeSinceLastInvoke >= maxWait)
    );
  };

  const trailingEdge = (time: number) => {
    timerId = undefined;
    if (trailing && lastArgs) return invokeFunc(time);
    lastArgs = lastThis = undefined;
    return result;
  };

  const timerExpired = (): void => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      trailingEdge(time);
      return;
    }
    timerId = setTimeout(timerExpired, remainingWait(time));
  };

  const leadingEdge = (time: number) => {
    lastInvokeTime = time;
    timerId = setTimeout(timerExpired, delay);
    return leading ? invokeFunc(time) : result;
  };

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking) {
      if (timerId === undefined) return leadingEdge(lastCallTime);
      if (maxing) {
        clearTimeout(timerId);
        timerId = setTimeout(timerExpired, delay);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) timerId = setTimeout(timerExpired, delay);
    return result;
  } as CancelableFunction<T>;

  debounced.cancel = () => {
    if (timerId !== undefined) clearTimeout(timerId);
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  };
  debounced.flush = () => (timerId === undefined ? result : trailingEdge(Date.now()));

  return debounced;
}

export function defaults<T extends object>(
  object: T,
  ...sources: Array<Record<string, unknown> | null | undefined>
): T {
  const target = Object(object);
  let index = -1;
  let { length } = sources;
  const guard = length > 2 ? sources[2] : undefined;
  if (guard && isIterateeCall(sources[0], sources[1], guard)) length = 1;
  while (++index < length) {
    const source: any = sources[index];
    for (const key of keysIn(source)) {
      const value = target[key];
      if (
        value === undefined ||
        (eq(value, (objectProto as any)[key]) && !hasOwnProperty.call(target, key))
      ) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

export function difference<T>(array: T[] | null | undefined, ...values: T[][]): T[] {
  return isArrayLikeObject(array)
    ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true))
    : [];
}

export function differenceWith<T, U>(
  array: T[] | null | undefined,
  values: U[] | null | undefined,
  comparator: (a: T, b: U) => boolean
): T[];
export function differenceWith(array: unknown, ...values: unknown[]): unknown[] {
  const comparator = last(values);
  return isArrayLikeObject(array)
    ? baseDifference(
        array,
        baseFlatten(values, 1, isArrayLikeObject, true),
        isArrayLikeObject(comparator) ? undefined : (comparator as AnyFn)
      )
    : [];
}

export function every<T>(
  collection: T[] | Record<string, T> | null | undefined,
  predicate?: Predicate<T>,
  guard?: unknown
): boolean {
  const iteratee = baseIteratee(guard && isIterateeCall(collection, predicate, guard) ? undefined : predicate);
  if (Array.isArray(collection)) return arrayEvery(collection, iteratee);
  let result = true;
  baseEach(collection, (value: T, index: number | string, iterable: unknown) => {
    result = !!iteratee(value, index, iterable);
    return result;
  });
  return result;
}

export function escape(value: unknown): string {
  const string = toString(value);
  return string && reHasUnescapedHtml.test(string)
    ? string.replace(reUnescapedHtml, (chr) => htmlEscapes[chr])
    : string;
}

export function find<T>(
  collection: T[] | Record<string, T> | null | undefined,
  predicate?: Predicate<T>,
  fromIndex = 0
): T | undefined {
  const iterable = Object(collection);
  if (isArrayLike(collection)) {
    const index = findIndex(collection, baseIteratee(predicate), fromIndex);
    return index > -1 ? iterable[index] : undefined;
  }
  const iteratee = baseIteratee(predicate);
  const props = keys(collection);
  const index = findIndex(props, (key: string) => iteratee(iterable[key], key, iterable), fromIndex);
  return index > -1 ? iterable[props[index]] : undefined;
}

export function findKey<T>(object: Record<string, T> | null | undefined, predicate?: Predicate<T>): string | undefined {
  const iteratee = baseIteratee(predicate);
  let result: string | undefined;
  baseForOwn(object, (value: T, key: string, iterable: unknown) => {
    if (iteratee(value, key, iterable)) {
      result = key;
      return false;
    }
    return undefined;
  });
  return result;
}

export function flatten<T>(array: Array<T | T[]> | null | undefined): T[] {
  const length = array == null ? 0 : array.length;
  return length ? baseFlatten(array, 1) : [];
}

export function flatMap<T, R>(collection: T[] | Record<string, T> | null | undefined, iteratee?: Iteratee<T, R | R[]>): R[] {
  return baseFlatten(map(collection, iteratee as any), 1);
}

export function forEach<T>(
  collection: T[] | Record<string, T> | null | undefined,
  iteratee: (value: T, index: number | string, collection: any) => void
): T[] | Record<string, T> | null | undefined {
  return Array.isArray(collection)
    ? arrayEach(collection, castFunction(iteratee))
    : baseEach(collection, castFunction(iteratee));
}

export function get(object: unknown, path: PropertyPath, defaultValue?: unknown): any {
  const result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

export function groupBy<T>(collection: T[] | Record<string, T> | null | undefined, iteratee?: Iteratee<T>): Record<string, T[]> {
  const fn = baseIteratee(iteratee);
  const result: any = {};
  const setter = (value: T) => {
    const key = fn(value);
    if (hasOwnProperty.call(result, key)) {
      result[key].push(value);
    } else {
      baseAssignValue(result, key, [value]);
    }
  };
  if (Array.isArray(collection)) {
    for (let index = 0; index < collection.length; index++) setter(collection[index]);
  } else {
    baseEach(collection, (value: T) => {
      setter(value);
    });
  }
  return result;
}

export function head<T>(array: T[] | null | undefined): T | undefined {
  return array && array.length ? array[0] : undefined;
}

export function initial<T>(array: T[] | null | undefined): T[] {
  const length = array == null ? 0 : array.length;
  return length ? baseSlice(array!, 0, -1) : [];
}

export function includes<T>(
  collection: T[] | string | Record<string, T> | null | undefined,
  value: T | string,
  fromIndex?: number,
  guard?: unknown
): boolean {
  const target: any = isArrayLike(collection) ? collection : values(collection);
  let index = fromIndex && !guard ? toInteger(fromIndex) : 0;
  const { length } = target;
  if (index < 0) index = Math.max(length + index, 0);
  return isString(target)
    ? index <= length && target.indexOf(value as string, index) > -1
    : !!length && baseIndexOf(target, value, index) > -1;
}

export function intersection<T>(...arrays: Array<T[] | null | undefined>): T[] {
  const mapped = arrayMap(arrays, castArrayLikeObject);
  return mapped.length && mapped[0] === arrays[0] ? baseIntersection(mapped) : [];
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (
    isArrayLike(value) &&
    (Array.isArray(value) ||
      typeof value == 'string' ||
      typeof (value as any).splice == 'function' ||
      isTypedArray(value) ||
      isArguments(value))
  ) {
    return !value.length;
  }
  const tag = baseGetTag(value);
  if (tag == mapTag || tag == setTag) return !(value as any).size;
  if (isPrototype(value)) return !baseKeys(value).length;
  for (const key in value as any) {
    if (hasOwnProperty.call(value, key)) return false;
  }
  return true;
}

export function isEqual(a: unknown, b: unknown): boolean {
  return baseIsEqual(a, b);
}

export function isEqualWith(a: unknown, b: unknown, customizer?: EqualCustomizer): boolean {
  const fn = typeof customizer == 'function' ? customizer : undefined;
  const result = fn ? fn(a, b) : undefined;
  return result === undefined ? baseIsEqual(a, b, 0, fn) : !!result;
}

export function isFinite(value: unknown): boolean {
  return Number.isFinite(value);
}

export function isFunction(value: unknown): value is AnyFn {
  if (!isObject(value)) return false;
  const tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

export function isNumber(value: unknown): value is number {
  return typeof value == 'number' || (isObjectLike(value) && baseGetTag(value) == numberTag);
}

export function isObject(value: unknown): value is object {
  const type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

export function isString(value: unknown): value is string {
  return (
    typeof value == 'string' ||
    (!Array.isArray(value) && isObjectLike(value) && baseGetTag(value) == stringTag)
  );
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function map<T, R>(collection: T[] | Record<string, T> | null | undefined, iteratee?: Iteratee<T, R>): R[] {
  const fn = baseIteratee(iteratee);
  if (Array.isArray(collection)) return arrayMap(collection, fn);
  let index = -1;
  const result: R[] = isArrayLike(collection) ? Array((collection as ArrayLike<T>).length) : [];
  baseEach(collection, (value: T, key: number | string, iterable: unknown) => {
    result[++index] = fn(value, key, iterable);
  });
  return result;
}

function baseGt(value: any, other: any): boolean {
  return value > other;
}

function baseExtremum(array: ArrayLike<any>, iteratee: AnyFn, comparator: (value: any, other: any) => boolean): any {
  let index = -1;
  const { length } = array;
  let computed: any;
  let result: any;
  while (++index < length) {
    const value = array[index];
    const current = iteratee(value);
    if (
      current != null &&
      (computed === undefined ? current === current && !isSymbol(current) : comparator(current, computed))
    ) {
      computed = current;
      result = value;
    }
  }
  return result;
}

export function max<T>(array: ArrayLike<T> | null | undefined): T | undefined {
  return array && array.length ? baseExtremum(array, identity, baseGt) : undefined;
}

function safeGet(object: any, key: PropertyKey): unknown {
  if (key === 'constructor' && typeof object[key] === 'function') return undefined;
  if (key == '__proto__') return undefined;
  return object[key];
}

function assignMergeValue(object: any, key: PropertyKey, value: unknown): void {
  if ((value !== undefined && !eq(object[key], value)) || (value === undefined && !(key in object))) {
    baseAssignValue(object, key, value);
  }
}

function baseMerge(object: any, source: any, stack: Stack): void {
  if (object === source) return;
  baseFor(
    source,
    (srcValue: unknown, key: string) => {
      if (isObject(srcValue)) {
        baseMergeDeep(object, source, key, stack);
      } else {
        assignMergeValue(object, key, srcValue);
      }
    },
    keysIn
  );
}

function baseMergeDeep(object: any, source: any, key: PropertyKey, stack: Stack): void {
  const objValue = safeGet(object, key);
  const srcValue = safeGet(source, key);
  const stacked = stack.get(srcValue);
  if (stacked) {
    assignMergeValue(object, key, stacked);
    return;
  }
  let newValue: any = srcValue;
  let isCommon = true;
  const isArr = Array.isArray(srcValue);
  const isTyped = !isArr && isTypedArray(srcValue);
  if (isArr || isTyped) {
    if (Array.isArray(objValue)) {
      newValue = objValue;
    } else if (isArrayLikeObject(objValue)) {
      newValue = copyArray(objValue);
    } else if (isTyped) {
      isCommon = false;
      newValue = cloneTypedArray(srcValue, true);
    } else {
      newValue = [];
    }
  } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
    newValue = objValue;
    if (isArguments(objValue)) {
      newValue = copyObject(objValue, keysIn(objValue));
    } else if (!isObject(objValue) || isFunction(objValue)) {
      newValue = initCloneObject(srcValue);
    }
  } else {
    isCommon = false;
  }
  if (isCommon) {
    stack.set(srcValue, newValue);
    baseMerge(newValue, srcValue, stack);
    stack.delete(srcValue);
  }
  assignMergeValue(object, key, newValue);
}

// lodash 4.17 `merge`: arrays and plain objects merge by key and index, an undefined source
// value never overwrites an existing key, and other objects are assigned by reference.
export function merge<T extends object>(object: T, ...sources: Array<Record<string, any> | null | undefined>): T {
  return assignSources(object, sources, (target, source) => baseMerge(target, source, new Map()));
}

export function omit<T extends Record<string, any>>(
  object: T | null | undefined,
  ...paths: Array<PropertyPath | readonly PropertyPath[]>
): Partial<T> {
  let result: any = {};
  if (object == null) return result;
  let isDeep = false;
  const castPaths = arrayMap(flatten(paths as any[]), (path) => {
    const parts = castPath(path, object);
    isDeep ||= parts.length > 1;
    return parts;
  });
  copyObject(object, getAllKeysIn(object), result);
  if (isDeep) {
    result = baseClone(result, CLONE_DEEP_FLAG | CLONE_FLAT_FLAG | CLONE_SYMBOLS_FLAG, customOmitClone);
  }
  let length = castPaths.length;
  while (length--) baseUnset(result, castPaths[length]);
  return result;
}

export function omitBy<T extends Record<string, any>>(object: T | null | undefined, predicate?: Predicate<any>): Partial<T> {
  return pickBy(object, negate(baseIteratee(predicate)));
}

export function pick<T extends Record<string, any>>(
  object: T | null | undefined,
  ...paths: Array<PropertyPath | readonly PropertyPath[]>
): Partial<T> {
  if (object == null) return {};
  return basePickBy(object, flatten(paths as any[]), (_value, path) => hasIn(object, path));
}

function baseRange(start: unknown, end: unknown, step: unknown, fromRight: boolean): number[] {
  if (step && typeof step != 'number' && isIterateeCall(start, end, step)) {
    end = step = undefined;
  }
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

export function reduce<T, R>(
  collection: T[] | Record<string, T> | null | undefined,
  iteratee: (accumulator: R, value: T, index: number | string, collection: any) => R,
  accumulator: R
): R;
export function reduce<T>(
  collection: T[] | Record<string, T> | null | undefined,
  iteratee: (accumulator: T, value: T, index: number | string, collection: any) => T
): T | undefined;
export function reduce(collection: any, iteratee: unknown, accumulator?: unknown): unknown {
  let initAccum = arguments.length < 3;
  const fn = baseIteratee(iteratee);
  let result = accumulator;
  if (Array.isArray(collection)) {
    let index = -1;
    const { length } = collection;
    if (initAccum && length) result = collection[++index];
    while (++index < length) result = fn(result, collection[index], index, collection);
    return result;
  }
  baseEach(collection, (value: unknown, index: number | string, iterable: unknown) => {
    if (initAccum) {
      initAccum = false;
      result = value;
    } else {
      result = fn(result, value, index, iterable);
    }
  });
  return result;
}

export function remove<T>(array: T[], predicate?: Predicate<T>): T[] {
  const result: T[] = [];
  if (!(array && array.length)) return result;
  let index = -1;
  const indexes: number[] = [];
  const { length } = array;
  const fn = baseIteratee(predicate);
  while (++index < length) {
    const value = array[index];
    if (fn(value, index, array)) {
      result.push(value);
      indexes.push(index);
    }
  }
  // lodash's basePullAt: splices from the end, skipping repeated indexes.
  let pending = indexes.length;
  let previous: number | undefined;
  while (pending--) {
    const pulled = indexes[pending];
    if (pending == indexes.length - 1 || pulled !== previous) {
      previous = pulled;
      Array.prototype.splice.call(array, pulled, 1);
    }
  }
  return result;
}

export function set<T extends object>(object: T, path: PropertyPath, value: unknown): T {
  return object == null ? object : baseSet(object, path, value);
}

export function shuffle<T>(array: T[] | null | undefined): T[] {
  return shuffleSelf(Array.isArray(array) ? copyArray(array) : (values(array) as T[]));
}

export function tail<T>(array: T[] | null | undefined): T[] {
  const length = array == null ? 0 : array.length;
  return length ? baseSlice(array!, 1, length) : [];
}

export function takeRight<T>(array: ArrayLike<T> | null | undefined, n?: number, guard?: unknown): T[] {
  const length = array == null ? 0 : array.length;
  if (!length) return [];
  const count = guard || n === undefined ? 1 : toInteger(n);
  const start = length - count;
  return baseSlice(array!, start < 0 ? 0 : start, length);
}

export function throttle<T extends AnyFn>(
  func: T,
  wait?: number,
  options?: { leading?: boolean; trailing?: boolean }
): CancelableFunction<T> {
  let leading = true;
  let trailing = true;
  if (typeof func != 'function') throw new TypeError(FUNC_ERROR_TEXT);
  if (isObject(options)) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, { leading, maxWait: wait, trailing });
}

export function times<T = number>(n: number, iteratee?: (index: number) => T): T[] {
  let count = toInteger(n);
  if (count < 1 || count > MAX_SAFE_INTEGER) return [];
  let index = MAX_ARRAY_LENGTH;
  const length = Math.min(count, MAX_ARRAY_LENGTH);
  const fn = castFunction(iteratee);
  count -= MAX_ARRAY_LENGTH;
  const result = baseTimes(length, fn);
  while (++index < count) fn(index);
  return result;
}

let idCounter = 0;
export function uniqueId(prefix?: string): string {
  const id = ++idCounter;
  return toString(prefix) + id;
}

export function uniq<T>(array: ArrayLike<T> | null | undefined): T[] {
  return array && array.length ? baseUniq(array) : [];
}

export function uniqWith<T>(array: T[] | null | undefined, comparator: (a: T, b: T) => boolean): T[] {
  const fn = typeof comparator == 'function' ? comparator : undefined;
  return array && array.length ? baseUniq(array, fn) : [];
}

export function zip(...arrays: unknown[][]): unknown[][] {
  return unzip(arrays);
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
