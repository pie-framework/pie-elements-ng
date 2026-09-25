# @pie-element/shared-lodash

## 0.1.1-next.2

### Patch Changes

- d242e4c: The placement-ordering controller scores responses of two or more tiles, where it threw for every one (PIE-1098). Its scorer called js-combinatorics 0.5's `combination(seed, size)` against the 2.x dependency, which counts combinations instead; the upstream sync now rewrites that call to 2.x's `Combination` class.

  `uniq` from `@pie-element/shared-lodash` returns `[]` for a value without a length, as lodash does, where it threw on a non-iterable.

## 0.1.1-next.1

### Patch Changes

- Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.

## 0.1.1-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
