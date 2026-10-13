# @pie-element/cli

## 0.1.3

### Patch Changes

- [#268](https://github.com/pie-framework/pie-elements-ng/pull/268) [`cf1ccc0`](https://github.com/pie-framework/pie-elements-ng/commit/cf1ccc0d25c0c136dc01dab014c68a083ed595ed) Thanks [@chillenious](https://github.com/chillenious)! - chore: remove upstream sync tooling (PIE-1144)

- [#269](https://github.com/pie-framework/pie-elements-ng/pull/269) [`1462bca`](https://github.com/pie-framework/pie-elements-ng/commit/1462bca685db8352a2e00fa25f5d1acce07a8ab4) Thanks [@chillenious](https://github.com/chillenious)! - fix(editable-html-tip-tap): paste rich text from outside the editor as plain text (PIE-1145)

- [#346](https://github.com/pie-framework/pie-elements-ng/pull/346) [`ae2012f`](https://github.com/pie-framework/pie-elements-ng/commit/ae2012f2dae12fa6324aa0e0f78ea3e024c81142) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the dev-dependencies group across 1 directory with 3 updates

- [#354](https://github.com/pie-framework/pie-elements-ng/pull/354) [`61f2129`](https://github.com/pie-framework/pie-elements-ng/commit/61f2129c2f37fb1c5740381a79245850e529537c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump @oclif/core from 4.11.4 to 5.1.2
- Updated dependencies [[`2265dfc`](https://github.com/pie-framework/pie-elements-ng/commit/2265dfc5cf97e7485b0a90476f0233438c7df98a), [`2cf661c`](https://github.com/pie-framework/pie-elements-ng/commit/2cf661cf27cd6b6732667db14f4c0a9113ae541c)]:
  - @pie-element/element-bundler@0.1.3

## 0.1.2

### Patch Changes

- [#166](https://github.com/pie-framework/pie-elements-ng/pull/166) [`fbc32d5`](https://github.com/pie-framework/pie-elements-ng/commit/fbc32d52d3284a6f48f6893fdade5efa6565d990) Thanks [@chillenious](https://github.com/chillenious)! - Read upstream commits from the repository passed in, even when run from a git hook.

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`2bb02ad`](https://github.com/pie-framework/pie-elements-ng/commit/2bb02ad58032658871f6456960a25346a13ccb66) Thanks [@chillenious](https://github.com/chillenious)! - Depend on `i18next` alone: the package no longer declares React, `prop-types`, `debug` or `@pie-element/shared-lodash`, none of which it imports. Add English and Spanish strings for the Svelte elements mc-populated-blank, simple-cloze and venn-classification, and stop logging i18next's configuration to the console. Upstream sync leaves the package alone, since this repo now owns it.

- [#163](https://github.com/pie-framework/pie-elements-ng/pull/163) [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - `upstream:sync` now forces every `@tiptap/*` dependency of a synced `@pie-lib` package to one exact version instead of taking the upstream manifest's. tiptap pins its own peers exactly from 3.24.0 on, so the mixed set upstream declares resolves a second `@tiptap/core` and breaks ProseMirror on duplicate schema and plugin identity (PIE-1042)

- [#191](https://github.com/pie-framework/pie-elements-ng/pull/191) [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339) Thanks [@chillenious](https://github.com/chillenious)! - The placement-ordering controller scores responses of two or more tiles, where it threw for every one (PIE-1098). Its scorer called js-combinatorics 0.5's `combination(seed, size)` against the 2.x dependency, which counts combinations instead; the upstream sync now rewrites that call to 2.x's `Combination` class.
  
  `uniq` from `@pie-element/shared-lodash` returns `[]` for a value without a length, as lodash does, where it threw on a non-iterable.

- [#199](https://github.com/pie-framework/pie-elements-ng/pull/199) [`c4e2ba3`](https://github.com/pie-framework/pie-elements-ng/commit/c4e2ba313d3137c90af800715606e3f372e4beac) Thanks [@chillenious](https://github.com/chillenious)! - Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`77cf368`](https://github.com/pie-framework/pie-elements-ng/commit/77cf3682b6543028299d8cb74393d75241976b35) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#198](https://github.com/pie-framework/pie-elements-ng/issues/198) from pie-framework/fix/browser-packaging

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`3e7bed4`](https://github.com/pie-framework/pie-elements-ng/commit/3e7bed4be9c77e42f044547304dd67852b873209) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#205](https://github.com/pie-framework/pie-elements-ng/issues/205) from pie-framework/fix/mathjax-esm-adapter

- [#223](https://github.com/pie-framework/pie-elements-ng/pull/223) [`60ec99e`](https://github.com/pie-framework/pie-elements-ng/commit/60ec99e38d3b08ae8fd6a2760caad7dfe4c42175) Thanks [@chillenious](https://github.com/chillenious)! - Declare `@tiptap/extension-bubble-menu` and `@tiptap/extension-floating-menu` at exactly 3.31.3. `@tiptap/react` takes both by caret, so a consumer install would otherwise move them past `@tiptap/core` once Tiptap publishes a newer release. `upstream:sync` now adds them wherever `@tiptap/react` is declared (PIE-1110).

- [#219](https://github.com/pie-framework/pie-elements-ng/pull/219) [`f6d5dd4`](https://github.com/pie-framework/pie-elements-ng/commit/f6d5dd451fb30978c02e949d522ac2f6184e7e3b) Thanks [@chillenious](https://github.com/chillenious)! - `@pie-element/element-player` no longer exports the `Tab` type, and its unused panel components are removed. Upstream sync no longer re-emits source files that no entry of their package reaches.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`2c65849`](https://github.com/pie-framework/pie-elements-ng/commit/2c6584934aa40b35ac55ed4857d875388b0eb707) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#209](https://github.com/pie-framework/pie-elements-ng/issues/209) from pie-framework/fix/final-publish-ng

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`1a1b0e0`](https://github.com/pie-framework/pie-elements-ng/commit/1a1b0e0eddec511795c304714535373cb49199bc) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#233](https://github.com/pie-framework/pie-elements-ng/issues/233) from pie-framework/fix/changesets-version-private-packages

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`83c260d`](https://github.com/pie-framework/pie-elements-ng/commit/83c260df429821faaf3ea6a0de218985998b3094) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#255](https://github.com/pie-framework/pie-elements-ng/issues/255) from pie-framework/fix/demo-e2e-dib-shuffle-optional-peers

- [#142](https://github.com/pie-framework/pie-elements-ng/pull/142) [`8d69fb5`](https://github.com/pie-framework/pie-elements-ng/commit/8d69fb58ff9b482b46d74a9165ac4a4da700b8c9) Thanks [@chillenious](https://github.com/chillenious)! - Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.
  
  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.
- Updated dependencies [[`ec4e868`](https://github.com/pie-framework/pie-elements-ng/commit/ec4e8687ea62c2ddd01ed46c7dcf7824f8b2f279), [`0b4b1a9`](https://github.com/pie-framework/pie-elements-ng/commit/0b4b1a99b570e806908e00fd4b0dcfe3fb1107be), [`0611171`](https://github.com/pie-framework/pie-elements-ng/commit/0611171b7de5361b3c73a47e2a3093e707095659), [`67e7141`](https://github.com/pie-framework/pie-elements-ng/commit/67e71412d9e75d401660f30dece72b7e3bac3e55), [`82406bf`](https://github.com/pie-framework/pie-elements-ng/commit/82406bf47738f81d020706b639f5f22748bcd5d0), [`06c1926`](https://github.com/pie-framework/pie-elements-ng/commit/06c19262622bd79d217c593b0c5f3cb2c92c98d6), [`f690873`](https://github.com/pie-framework/pie-elements-ng/commit/f69087385125a2cd5fd72f701b0748e7a3d16efc), [`ce67393`](https://github.com/pie-framework/pie-elements-ng/commit/ce67393e5fefd8736fca96e7c92a36a129b068f3), [`83c260d`](https://github.com/pie-framework/pie-elements-ng/commit/83c260df429821faaf3ea6a0de218985998b3094), [`8d69fb5`](https://github.com/pie-framework/pie-elements-ng/commit/8d69fb58ff9b482b46d74a9165ac4a4da700b8c9)]:
  - @pie-element/element-bundler@0.1.2

## 0.1.2-next.15

### Patch Changes

- Merge pull request #255 from pie-framework/fix/demo-e2e-dib-shuffle-optional-peers
- Updated dependencies
  - @pie-element/element-bundler@0.1.2-next.7

## 0.1.2-next.14

### Patch Changes

- Read upstream commits from the repository passed in, even when run from a git hook.
- Depend on `i18next` alone: the package no longer declares React, `prop-types`, `debug` or `@pie-element/shared-lodash`, none of which it imports. Add English and Spanish strings for the Svelte elements mc-populated-blank, simple-cloze and venn-classification, and stop logging i18next's configuration to the console. Upstream sync leaves the package alone, since this repo now owns it.
- `upstream:sync` now forces every `@tiptap/*` dependency of a synced `@pie-lib` package to one exact version instead of taking the upstream manifest's. tiptap pins its own peers exactly from 3.24.0 on, so the mixed set upstream declares resolves a second `@tiptap/core` and breaks ProseMirror on duplicate schema and plugin identity (PIE-1042)
- The placement-ordering controller scores responses of two or more tiles, where it threw for every one (PIE-1098). Its scorer called js-combinatorics 0.5's `combination(seed, size)` against the 2.x dependency, which counts combinations instead; the upstream sync now rewrites that call to 2.x's `Combination` class.
  
  `uniq` from `@pie-element/shared-lodash` returns `[]` for a value without a length, as lodash does, where it threw on a non-iterable.
- Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.
- Merge pull request #198 from pie-framework/fix/browser-packaging
- Merge pull request #205 from pie-framework/fix/mathjax-esm-adapter
- Declare `@tiptap/extension-bubble-menu` and `@tiptap/extension-floating-menu` at exactly 3.31.3. `@tiptap/react` takes both by caret, so a consumer install would otherwise move them past `@tiptap/core` once Tiptap publishes a newer release. `upstream:sync` now adds them wherever `@tiptap/react` is declared (PIE-1110).
- `@pie-element/element-player` no longer exports the `Tab` type, and its unused panel components are removed. Upstream sync no longer re-emits source files that no entry of their package reaches.
- Merge pull request #209 from pie-framework/fix/final-publish-ng
- Merge pull request #233 from pie-framework/fix/changesets-version-private-packages
- Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.
  
  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-element/element-bundler@0.1.2-next.6

## 0.1.2-next.13

### Patch Changes

- Updated dependencies
  - @pie-element/element-bundler@0.1.2-next.5

## 0.1.2-next.12

### Patch Changes

- 60ec99e: Declare `@tiptap/extension-bubble-menu` and `@tiptap/extension-floating-menu` at exactly 3.31.3. `@tiptap/react` takes both by caret, so a consumer install would otherwise move them past `@tiptap/core` once Tiptap publishes a newer release. `upstream:sync` now adds them wherever `@tiptap/react` is declared (PIE-1110).

## 0.1.2-next.11

### Patch Changes

- f6d5dd4: `@pie-element/element-player` no longer exports the `Tab` type, and its unused panel components are removed. Upstream sync no longer re-emits source files that no entry of their package reaches.

## 0.1.2-next.10

### Patch Changes

- Merge pull request #209 from pie-framework/fix/final-publish-ng

## 0.1.2-next.9

### Patch Changes

- Updated dependencies
  - @pie-element/element-bundler@0.1.2-next.4

## 0.1.2-next.8

### Patch Changes

- Merge pull request #205 from pie-framework/fix/mathjax-esm-adapter

## 0.1.2-next.7

### Patch Changes

- c4e2ba3: Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.

## 0.1.2-next.6

### Patch Changes

- Merge pull request #198 from pie-framework/fix/browser-packaging
- Updated dependencies [06c1926]
  - @pie-element/element-bundler@0.1.2-next.3

## 0.1.2-next.5

### Patch Changes

- d242e4c: The placement-ordering controller scores responses of two or more tiles, where it threw for every one (PIE-1098). Its scorer called js-combinatorics 0.5's `combination(seed, size)` against the 2.x dependency, which counts combinations instead; the upstream sync now rewrites that call to 2.x's `Combination` class.

  `uniq` from `@pie-element/shared-lodash` returns `[]` for a value without a length, as lodash does, where it threw on a non-iterable.

## 0.1.2-next.4

### Patch Changes

- Updated dependencies [ec4e868]
- Updated dependencies [0b4b1a9]
- Updated dependencies [0611171]
- Updated dependencies [67e7141]
  - @pie-element/element-bundler@0.1.2-next.2

## 0.1.2-next.3

### Patch Changes

- 2bb02ad: Depend on `i18next` alone: the package no longer declares React, `prop-types`, `debug` or `@pie-element/shared-lodash`, none of which it imports. Add English and Spanish strings for the Svelte elements mc-populated-blank, simple-cloze and venn-classification, and stop logging i18next's configuration to the console. Upstream sync leaves the package alone, since this repo now owns it.
- Updated dependencies
  - @pie-element/element-bundler@0.1.2-next.1

## 0.1.2-next.2

### Patch Changes

- fbc32d5: Read upstream commits from the repository passed in, even when run from a git hook.

## 0.1.2-next.1

### Patch Changes

- 4fe8ce6: `upstream:sync` now forces every `@tiptap/*` dependency of a synced `@pie-lib` package to one exact version instead of taking the upstream manifest's. tiptap pins its own peers exactly from 3.24.0 on, so the mixed set upstream declares resolves a second `@tiptap/core` and breaks ProseMirror on duplicate schema and plugin identity (PIE-1042)

## 0.1.2-next.0

### Patch Changes

- 8d69fb5: Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

- Updated dependencies [8d69fb5]
  - @pie-element/element-bundler@0.1.2-next.0

## 0.1.1

### Patch Changes

- Updated dependencies [e131840]
  - @pie-element/element-bundler@0.1.1
