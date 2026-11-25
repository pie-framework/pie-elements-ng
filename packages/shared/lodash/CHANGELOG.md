# @pie-element/shared-lodash

## 0.1.5

### Patch Changes

- [#718](https://github.com/pie-framework/pie-elements-ng/pull/718) [`32d8334`](https://github.com/pie-framework/pie-elements-ng/commit/32d83340a0939d588bea7ab6297964ac68665821) Thanks [@chillenious](https://github.com/chillenious)! - chore: bump Kit, DaisyUI and Vite, share the IIFE and resolver configs, fix the dev:demo port lock

## 0.1.4

### Patch Changes

- [#552](https://github.com/pie-framework/pie-elements-ng/pull/552) [`b00321c`](https://github.com/pie-framework/pie-elements-ng/commit/b00321cc5bc48b72de24f6e5db52fb446a5e9e8d) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the dev-dependencies group across 1 directory with 3 updates

- [#559](https://github.com/pie-framework/pie-elements-ng/pull/559) [`efc633c`](https://github.com/pie-framework/pie-elements-ng/commit/efc633cb4a3b7870f2237d374d43bcd6d1b18d8c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.4 to 8.3.5

- [#570](https://github.com/pie-framework/pie-elements-ng/pull/570) [`0585bc2`](https://github.com/pie-framework/pie-elements-ng/commit/0585bc20bf7669c380e6a30e6f8816152063d514) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vitest from 4.1.11 to 5.0.5

- [#641](https://github.com/pie-framework/pie-elements-ng/pull/641) [`6b3a398`](https://github.com/pie-framework/pie-elements-ng/commit/6b3a3987fe0b11cc885d75168622ccbfa85d5e44) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the test-dependencies group across 1 directory with 2 updates

- [#647](https://github.com/pie-framework/pie-elements-ng/pull/647) [`7d3a323`](https://github.com/pie-framework/pie-elements-ng/commit/7d3a32301eb3393937961919256da39e57e8104f) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.5 to 8.3.6

- [#655](https://github.com/pie-framework/pie-elements-ng/pull/655) [`174a4b8`](https://github.com/pie-framework/pie-elements-ng/commit/174a4b8c7273efcf8da799eccc7cf8577bcf062e) Thanks [@chillenious](https://github.com/chillenious)! - build: ship third-party license notices in every bundling package

- [#656](https://github.com/pie-framework/pie-elements-ng/pull/656) [`ab1c731`](https://github.com/pie-framework/pie-elements-ng/commit/ab1c7310a6129afbbcfff49d9055ad726e2b9356) Thanks [@chillenious](https://github.com/chillenious)! - fix(packaging): ship the MIT LICENSE in every publishable package

## 0.1.3

### Patch Changes

- [#501](https://github.com/pie-framework/pie-elements-ng/pull/501) [`6bf1082`](https://github.com/pie-framework/pie-elements-ng/commit/6bf1082d7732ff9c28a010d0344c1749852c43d3) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.1.5 to 8.3.4

- [#522](https://github.com/pie-framework/pie-elements-ng/pull/522) [`a844bb7`](https://github.com/pie-framework/pie-elements-ng/commit/a844bb73f4e37e005c5913fa03db0da12560007e) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump lodash-es from 4.17.21 to 4.18.1

## 0.1.2

### Patch Changes

- [#364](https://github.com/pie-framework/pie-elements-ng/pull/364) [`852dfe3`](https://github.com/pie-framework/pie-elements-ng/commit/852dfe3d20c85c32996b986b6b20b0347896ee6e) Thanks [@chillenious](https://github.com/chillenious)! - `isEqual`, `range`, `rangeRight`, `merge`, `max` and `find` behave as in lodash 4.17. `isEqual` treats -0 as equal to 0, so graphing and graphing-solution-set score a correct answer with a -0 coordinate as correct before the session is stored as well as after. `range` and `rangeRight` coerce string arguments (a string step used to loop forever), count down when the end is below the start, repeat the start for a zero step and no longer add a value past the end through float drift. `merge` merges arrays by index, keeps a value when the source holds `undefined`, assigns class instances by reference and never writes through `__proto__`. `max` skips `NaN`, and `find` takes the `[path, value]` and partial-object shorthands and a `fromIndex`.

- [#367](https://github.com/pie-framework/pie-elements-ng/pull/367) [`5b59ed8`](https://github.com/pie-framework/pie-elements-ng/commit/5b59ed851bef7689a172cbb9ac2df6661e5950fc) Thanks [@chillenious](https://github.com/chillenious)! - Every helper now follows lodash 4.17, and `omit` refuses prototype paths as lodash 4.17.23 does. `clone` and `cloneDeep` keep prototypes, `Map`, `Set`, `RegExp`, symbol keys and shared or circular references. `get` and `set` parse paths as lodash does, including quoted brackets, empty segments and a key that contains a dot; `pick` and `omit` take deep paths, and `omit` copies inherited keys. `escape` returns `''` for `null` and `undefined`, `defaults` returns a new object for a missing target, `reduce` without an accumulator starts from the first element, `groupBy` passes its iteratee the value alone, `remove` tests every element before it splices, `debounce` and `throttle` throw a `TypeError` for a non-function, and `shuffle` draws its swaps in lodash's order.

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
