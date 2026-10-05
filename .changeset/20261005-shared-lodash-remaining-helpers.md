---
"@pie-element/shared-lodash": patch
---

Every helper now follows lodash 4.17, and `omit` refuses prototype paths as lodash 4.17.23 does. `clone` and `cloneDeep` keep prototypes, `Map`, `Set`, `RegExp`, symbol keys and shared or circular references. `get` and `set` parse paths as lodash does, including quoted brackets, empty segments and a key that contains a dot; `pick` and `omit` take deep paths, and `omit` copies inherited keys. `escape` returns `''` for `null` and `undefined`, `defaults` returns a new object for a missing target, `reduce` without an accumulator starts from the first element, `groupBy` passes its iteratee the value alone, `remove` tests every element before it splices, `debounce` and `throttle` throw a `TypeError` for a non-function, and `shuffle` draws its swaps in lodash's order.
