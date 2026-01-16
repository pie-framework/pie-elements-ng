# Lodash Functions Inventory - pie-elements & pie-lib

This inventory lists all lodash functions used in the `../pie-elements` and `../pie-lib` projects, particularly focusing on ESM-compatible elements listed in `esm-compatible-elements.json`.

> **Note:** See [lodash-es-analysis.md](./lodash-es-analysis.md) for detailed analysis of using lodash-es (the ESM version) vs. custom implementations.

## Summary Statistics

### pie-elements
- **Total individual function imports:** 37 unique functions
- **Most used functions:** isEmpty (42), cloneDeep (38), isEqual (26), debounce (15), defaults (11)

### pie-lib  
- **Total individual function imports:** 28 unique functions
- **Most used functions:** isEqual (17), isEmpty (12), cloneDeep (8), range (6), get (4)

### Combined Unique Functions
Total unique lodash functions across both projects: **45**

---

## Complete Function List (Sorted by Combined Usage)

### High Usage (20+ occurrences)
| Function | pie-elements | pie-lib | Total | Complexity |
|----------|--------------|---------|-------|------------|
| `isEmpty` | 42 | 12 | 54 | Simple - checks for empty arrays/objects/strings |
| `cloneDeep` | 38 | 8 | 46 | Medium - deep object cloning |
| `isEqual` | 26 | 17 | 43 | Medium - deep equality comparison |

### Medium Usage (10-19 occurrences)
| Function | pie-elements | pie-lib | Total | Complexity |
|----------|--------------|---------|-------|------------|
| `debounce` | 15 | 2 | 17 | Medium - function debouncing |
| `defaults` | 11 | 0 | 11 | Simple - object default values |

### Low-Medium Usage (5-9 occurrences)
| Function | pie-elements | pie-lib | Total | Complexity |
|----------|--------------|---------|-------|------------|
| `range` | 1 | 6 | 7 | Simple - create number arrays |
| `reduce` | 6 | 0 | 6 | Simple - array reduce (native alternative available) |
| `uniqWith` | 6 | 0 | 6 | Medium - unique by comparator |
| `isNumber` | 5 | 0 | 5 | Simple - type check |

### Low Usage (2-4 occurrences)
| Function | pie-elements | pie-lib | Total | Complexity |
|----------|--------------|---------|-------|------------|
| `isUndefined` | 4 | 1 | 5 | Simple - type check |
| `isObject` | 4 | 0 | 4 | Simple - type check |
| `isArray` | 4 | 0 | 4 | Simple - type check (native available) |
| `map` | 4 | 0 | 4 | Simple - array map (native alternative available) |
| `get` | 3 | 4 | 7 | Simple - safe property access |
| `merge` | 3 | 1 | 4 | Medium - deep object merge |
| `pick` | 3 | 0 | 3 | Simple - select object properties |
| `max` | 3 | 0 | 3 | Simple - max value (native alternative available) |
| `find` | 3 | 0 | 3 | Simple - array find (native alternative available) |
| `escape` | 3 | 0 | 3 | Simple - HTML escape |
| `uniq` | 0 | 3 | 3 | Simple - unique values (native Set available) |
| `tail` | 0 | 3 | 3 | Simple - all but first element |
| `head` | 0 | 3 | 3 | Simple - first element |
| `compact` | 1 | 3 | 4 | Simple - remove falsy values |
| `clone` | 0 | 4 | 4 | Simple - shallow clone |
| `throttle` | 2 | 0 | 2 | Medium - function throttling |
| `uniqueId` | 2 | 0 | 2 | Simple - generate unique ID |
| `isFunction` | 2 | 1 | 3 | Simple - type check |
| `differenceWith` | 2 | 1 | 3 | Medium - array difference with comparator |
| `times` | 0 | 2 | 2 | Simple - repeat function N times |
| `isString` | 0 | 2 | 2 | Simple - type check |
| `isFinite` | 0 | 2 | 2 | Simple - number check |
| `initial` | 0 | 2 | 2 | Simple - all but last element |
| `chunk` | 0 | 2 | 2 | Simple - split array into chunks |

### Single Usage (1 occurrence)
| Function | pie-elements | pie-lib | Total | Complexity |
|----------|--------------|---------|-------|------------|
| `shuffle` | 1 | 1 | 2 | Simple - randomize array |
| `omitBy` | 1 | 0 | 1 | Simple - omit by predicate |
| `omit` | 1 | 0 | 1 | Simple - omit properties |
| `isEqualWith` | 1 | 0 | 1 | Medium - equality with comparator |
| `intersection` | 1 | 0 | 1 | Simple - array intersection |
| `groupBy` | 1 | 0 | 1 | Simple - group by key |
| `forEach` | 1 | 0 | 1 | Simple - iterate (native alternative available) |
| `flatMap` | 1 | 0 | 1 | Simple - map and flatten (native available) |
| `findKey` | 1 | 1 | 2 | Simple - find object key |
| `difference` | 1 | 0 | 1 | Simple - array difference |
| `assign` | 1 | 0 | 1 | Simple - object assign (native available) |
| `takeRight` | 0 | 1 | 1 | Simple - last N elements |
| `set` | 0 | 1 | 1 | Simple - set nested property |
| `remove` | 0 | 1 | 1 | Simple - remove matching elements |
| `includes` | 0 | 1 | 1 | Simple - check inclusion (native available) |

---

## Functions by Replacement Difficulty

### Easy to Replace (Native or Simple Implementation)
These functions have native JavaScript equivalents or are trivial to implement:
- `isArray` → `Array.isArray()`
- `isUndefined` → `value === undefined`
- `isObject` → `typeof value === 'object' && value !== null`
- `isNumber` → `typeof value === 'number'`
- `isString` → `typeof value === 'string'`
- `isFinite` → `Number.isFinite()`
- `isFunction` → `typeof value === 'function'`
- `map` → `Array.prototype.map()`
- `find` → `Array.prototype.find()`
- `reduce` → `Array.prototype.reduce()`
- `forEach` → `Array.prototype.forEach()`
- `flatMap` → `Array.prototype.flatMap()`
- `includes` → `Array.prototype.includes()`
- `assign` → `Object.assign()`
- `max` → `Math.max(...array)`
- `head` → `array[0]` or `array.at(0)`
- `tail` → `array.slice(1)`
- `initial` → `array.slice(0, -1)`
- `takeRight` → `array.slice(-n)`
- `uniq` → `[...new Set(array)]`
- `isEmpty` → Simple helper function
- `compact` → `array.filter(Boolean)`
- `pick` → Object destructuring or simple helper
- `omit` → Object destructuring or simple helper

### Medium Complexity (Straightforward Implementation)
These functions are more complex but still reasonable to implement:
- `cloneDeep` → Structured clone or recursive function
- `isEqual` → Deep comparison function
- `debounce` → Timing-based wrapper
- `throttle` → Timing-based wrapper
- `range` → Simple loop generator
- `shuffle` → Fisher-Yates algorithm
- `chunk` → Array slicing loop
- `times` → Loop with callback
- `get` → Safe property access with path
- `set` → Safe property setting with path
- `merge` → Recursive object merge
- `defaults` → Object spreading with fallbacks
- `groupBy` → Reduce with object accumulator
- `findKey` → Object iteration
- `difference` → Set operations
- `intersection` → Set operations
- `differenceWith` → Custom comparison loop
- `uniqWith` → Custom comparison filter
- `escape` → String replacement
- `uniqueId` → Counter or random generator

### Complex (Consider Keeping or Using Alternative Library)
These functions have complex edge cases:
- `isEqualWith` → Custom comparator deep equality (rare usage)
- `omitBy` → Predicate-based filtering (rare usage)

---

## ESM-Compatible Elements and Their Lodash Usage

Based on `esm-compatible-elements.json`, here are the elements and their lodash dependencies:

### Elements with Lodash Usage

1. **multiple-choice** - isEmpty, isEqual, isArray, debounce, defaults, uniqueId
2. **number-line** - isEmpty, cloneDeep, isEqual, debounce, defaults, max, get, find, isNumber, reduce
3. **placement-ordering** - isEmpty, cloneDeep, isEqual, defaults, uniqWith, differenceWith, pick, omit, reduce, shuffle
4. **match** - isEmpty, isEqual, defaults, get, find
5. **match-list** - isEmpty, cloneDeep, isEqual, debounce
6. **math-inline** - isEmpty, cloneDeep, isEqual, debounce, defaults, throttle
7. **ebsr** - isEmpty, cloneDeep, isEqual, defaults, escape, forEach
8. **hotspot** - isEmpty, cloneDeep, isEqual, defaults
9. **image-cloze-association** - isEmpty, cloneDeep, isEqual
10. **likert** - isEmpty, defaults
11. **matrix** - isEmpty, defaults
12. **multi-trait-rubric** - isEmpty, cloneDeep, defaults
13. **passage** - isEmpty, escape
14. **select-text** - isEmpty, cloneDeep, isEqual
15. **rubric** - (from pie-lib)
16. **drawing-response** - isEmpty, cloneDeep, isObject

### pie-lib Packages with Lodash Usage

1. **math-rendering** - cloneDeep, compact
2. **math-input** - isEmpty, isEqual, range, times, uniq, head, tail, compact
3. **text-select** - isEmpty, cloneDeep, range, chunk, get, clone, isUndefined
4. **controller-utils** - isEmpty, isEqual, clone
5. **render-ui** - findKey
6. **drag** - differenceWith

---

## Recommendations

### Priority 1: Replace High-Usage Simple Functions
Focus on these first as they provide the most impact:
- `isEmpty` (54 uses) - Simple implementation
- `isArray` (4 uses) - Use native `Array.isArray()`
- `isUndefined` (5 uses) - Use `=== undefined`
- `isNumber` (5 uses) - Use `typeof === 'number'`
- `map`, `find`, `reduce`, `forEach` - Use native array methods

### Priority 2: Create Utility Library for Medium-Complexity Functions
These are used frequently and worth having good implementations:
- `cloneDeep` (46 uses) - Consider `structuredClone()` or custom implementation
- `isEqual` (43 uses) - Deep comparison utility
- `debounce` (17 uses) - Timing utility
- `defaults` (11 uses) - Object defaults utility
- `get` (7 uses) - Safe property access

### Priority 3: Case-by-Case for Low-Usage Functions
Evaluate each usage:
- Some might be replaced inline
- Some might be worth small utility functions
- Some might be refactorable to avoid the need

### Total Potential Impact
Replacing lodash across ESM-compatible elements could:
- Reduce bundle size significantly (lodash is ~71KB minified)
- Improve tree-shaking capabilities
- Simplify dependency management
- Modernize codebase with native JS features


---

## Additional Findings

### Full Lodash Import Usage
Some files import the entire lodash library (`import _ from 'lodash'`), which makes it harder to tree-shake. These files are found in:

**pie-elements:**
- placement-ordering (controller) - Uses `_.isEmpty()` directly
- graphing/graphing-solution-set (controller/utils) - Uses various methods
- math-inline, math-templated - Uses multiple methods
- number-line - Test files use full import
- Various test files

**pie-lib:**
- math-input - Uses `_.times()`, `_.flatten()` and other methods
- graphing-utils - Uses various methods
- math-rendering - Test files use full import

### Additional Lodash Functions Found
When importing the full library, these additional functions were detected:
- `flatten` - Flatten nested arrays (native `Array.prototype.flat()` available)
- `times` - Used in math-input for repeating operations
- `keys` - Object.keys() alternative (native available)
- `values` - Object.values() alternative (native available)  
- `extend` - Similar to assign/merge
- `each` - Similar to forEach (native available)

### Notes on Full Library Imports
Files importing the full lodash library should be refactored to:
1. Import specific functions only (`import isEmpty from 'lodash/isEmpty'`)
2. Replace with native equivalents where possible
3. Use custom utilities for complex functions

This will significantly improve tree-shaking and reduce bundle sizes in the ESM-compatible elements.

---

## Implementation Strategy

### Phase 1: Low-Hanging Fruit (Quick Wins)
Replace simple type checks and native equivalents immediately:
```javascript
// Before → After
import isArray from 'lodash/isArray' → Array.isArray()
import isUndefined from 'lodash/isUndefined' → value === undefined
import isNumber from 'lodash/isNumber' → typeof value === 'number'
import map from 'lodash/map' → array.map()
import find from 'lodash/find' → array.find()
import reduce from 'lodash/reduce' → array.reduce()
import includes from 'lodash/includes' → array.includes()
import assign from 'lodash/assign' → Object.assign()
import max from 'lodash/max' → Math.max(...array)
import uniq from 'lodash/uniq' → [...new Set(array)]
import compact from 'lodash/compact' → array.filter(Boolean)
```

### Phase 2: Create Shared Utils Package
Create `@pie-elements/shared-utils` with implementations for:
- `isEmpty` - Most used (54 occurrences)
- `cloneDeep` - High usage (46 occurrences) 
- `isEqual` - High usage (43 occurrences)
- `debounce` - Medium usage (17 occurrences)
- `defaults` - Medium usage (11 occurrences)
- `get` - Low-medium usage (7 occurrences)
- `range` - Low-medium usage (7 occurrences)

### Phase 3: Element-Specific Complex Functions
For elements with unique needs:
- `uniqWith`, `differenceWith` in placement-ordering
- `throttle` in math-inline
- `merge` in various config packages

### Phase 4: Refactor Full Lodash Imports
Convert all `import _ from 'lodash'` to specific imports or utilities.

---

## Estimated Impact

### Bundle Size Reduction
- Lodash full: ~71KB minified, ~24KB gzipped
- Per-method imports: ~1-3KB each minified
- Custom utilities: ~0.5-2KB each minified
- **Potential savings per element: 15-40KB minified**

### Elements Most Affected (by lodash usage)
1. placement-ordering - Heavy usage (10+ functions)
2. number-line - Heavy usage (10+ functions)
3. math-inline - Medium usage (6+ functions)
4. multiple-choice - Medium usage (6+ functions)
5. ebsr - Medium usage (6+ functions)

### Migration Effort Estimate
- Phase 1 (simple replacements): ~100 occurrences across 16 elements
- Phase 2 (shared utils): Create 7 utility functions
- Phase 3 (element-specific): ~20 complex cases
- Phase 4 (refactor full imports): ~30 files

Total functions to migrate: ~200 import statements across all ESM-compatible elements and pie-lib packages.
