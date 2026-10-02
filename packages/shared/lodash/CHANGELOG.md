# @pie-element/shared-lodash

## 0.1.1

### Patch Changes

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.

- [#191](https://github.com/pie-framework/pie-elements-ng/pull/191) [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339) Thanks [@chillenious](https://github.com/chillenious)! - The placement-ordering controller scores responses of two or more tiles, where it threw for every one (PIE-1098). Its scorer called js-combinatorics 0.5's `combination(seed, size)` against the 2.x dependency, which counts combinations instead; the upstream sync now rewrites that call to 2.x's `Combination` class.
  
  `uniq` from `@pie-element/shared-lodash` returns `[]` for a value without a length, as lodash does, where it threw on a non-iterable.

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

## 0.1.1-next.3

### Patch Changes

- Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.
- The placement-ordering controller scores responses of two or more tiles, where it threw for every one (PIE-1098). Its scorer called js-combinatorics 0.5's `combination(seed, size)` against the 2.x dependency, which counts combinations instead; the upstream sync now rewrites that call to 2.x's `Combination` class.
  
  `uniq` from `@pie-element/shared-lodash` returns `[]` for a value without a length, as lodash does, where it threw on a non-iterable.
- Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

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
