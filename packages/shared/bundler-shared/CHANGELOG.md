# @pie-element/element-bundler

## 0.1.3

### Patch Changes

- [#346](https://github.com/pie-framework/pie-elements-ng/pull/346) [`ae2012f`](https://github.com/pie-framework/pie-elements-ng/commit/ae2012f2dae12fa6324aa0e0f78ea3e024c81142) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the dev-dependencies group across 1 directory with 3 updates

- [#368](https://github.com/pie-framework/pie-elements-ng/pull/368) [`56c8b29`](https://github.com/pie-framework/pie-elements-ng/commit/56c8b290be64f5d38d8b34fb39962d85f03e624e) Thanks [@chillenious](https://github.com/chillenious)! - docs: remove the finished PIE-753 plan, the unused eval specs and a stale test snapshot

## 0.1.2

### Patch Changes

- [#190](https://github.com/pie-framework/pie-elements-ng/pull/190) [`ec4e868`](https://github.com/pie-framework/pie-elements-ng/commit/ec4e8687ea62c2ddd01ed46c7dcf7824f8b2f279) Thanks [@chillenious](https://github.com/chillenious)! - Builds of the same dependencies for different bundles, such as separate `editor` and `client-player` requests, run one after another, because they install into and write to the same directory.

- [#190](https://github.com/pie-framework/pie-elements-ng/pull/190) [`0b4b1a9`](https://github.com/pie-framework/pie-elements-ng/commit/0b4b1a99b570e806908e00fd4b0dcfe3fb1107be) Thanks [@chillenious](https://github.com/chillenious)! - Svelte rune modules (`.svelte.ts`, `.svelte.js`) are compiled by Svelte, so runes such as `$state` work in a bundle.

- [#190](https://github.com/pie-framework/pie-elements-ng/pull/190) [`0611171`](https://github.com/pie-framework/pie-elements-ng/commit/0611171b7de5361b3c73a47e2a3093e707095659) Thanks [@chillenious](https://github.com/chillenious)! - Exports `findWorkspacePackages` and `workspaceDependencyClosure`, which give the workspace packages a `workspace-fast` build of given elements reads, so a caller can key its bundle cache on them.

- [#190](https://github.com/pie-framework/pie-elements-ng/pull/190) [`67e7141`](https://github.com/pie-framework/pie-elements-ng/commit/67e71412d9e75d401660f30dece72b7e3bac3e55) Thanks [@chillenious](https://github.com/chillenious)! - `workspace-fast` builds bundle every workspace package from its sources, so no element, shared or `@pie-lib` package needs building first and an edited element bundles its current source. Workspace packages are linked by package name, and Svelte components compile with `customElement` as the elements' own builds do.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`82406bf`](https://github.com/pie-framework/pie-elements-ng/commit/82406bf47738f81d020706b639f5f22748bcd5d0) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#175](https://github.com/pie-framework/pie-elements-ng/issues/175) from pie-framework/fix/author-shim-cross-element-bundles

- [#197](https://github.com/pie-framework/pie-elements-ng/pull/197) [`06c1926`](https://github.com/pie-framework/pie-elements-ng/commit/06c19262622bd79d217c593b0c5f3cb2c92c98d6) Thanks [@chillenious](https://github.com/chillenious)! - Subpath imports of `@pie-lib/math-rendering` and `@pie-lib/pie-toolbox`, and imports of packages whose names begin with theirs, such as `@pie-lib/math-rendering-accessible`, bundle from `node_modules`; the two packages themselves stay external.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`f690873`](https://github.com/pie-framework/pie-elements-ng/commit/f69087385125a2cd5fd72f701b0748e7a3d16efc) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#207](https://github.com/pie-framework/pie-elements-ng/issues/207) from pie-framework/chore/retire-superseded-packages

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`ce67393`](https://github.com/pie-framework/pie-elements-ng/commit/ce67393e5fefd8736fca96e7c92a36a129b068f3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#210](https://github.com/pie-framework/pie-elements-ng/issues/210) from pie-framework/dependabot/github_actions/actions/cache-6

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`83c260d`](https://github.com/pie-framework/pie-elements-ng/commit/83c260df429821faaf3ea6a0de218985998b3094) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#255](https://github.com/pie-framework/pie-elements-ng/issues/255) from pie-framework/fix/demo-e2e-dib-shuffle-optional-peers

- [#142](https://github.com/pie-framework/pie-elements-ng/pull/142) [`8d69fb5`](https://github.com/pie-framework/pie-elements-ng/commit/8d69fb58ff9b482b46d74a9165ac4a4da700b8c9) Thanks [@chillenious](https://github.com/chillenious)! - Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.
  
  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

## 0.1.2-next.7

### Patch Changes

- Merge pull request #255 from pie-framework/fix/demo-e2e-dib-shuffle-optional-peers

## 0.1.2-next.6

### Patch Changes

- Builds of the same dependencies for different bundles, such as separate `editor` and `client-player` requests, run one after another, because they install into and write to the same directory.
- Svelte rune modules (`.svelte.ts`, `.svelte.js`) are compiled by Svelte, so runes such as `$state` work in a bundle.
- Exports `findWorkspacePackages` and `workspaceDependencyClosure`, which give the workspace packages a `workspace-fast` build of given elements reads, so a caller can key its bundle cache on them.
- `workspace-fast` builds bundle every workspace package from its sources, so no element, shared or `@pie-lib` package needs building first and an edited element bundles its current source. Workspace packages are linked by package name, and Svelte components compile with `customElement` as the elements' own builds do.
- Merge pull request #175 from pie-framework/fix/author-shim-cross-element-bundles
- Subpath imports of `@pie-lib/math-rendering` and `@pie-lib/pie-toolbox`, and imports of packages whose names begin with theirs, such as `@pie-lib/math-rendering-accessible`, bundle from `node_modules`; the two packages themselves stay external.
- Merge pull request #207 from pie-framework/chore/retire-superseded-packages
- Merge pull request #210 from pie-framework/dependabot/github_actions/actions/cache-6
- Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.
  
  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

## 0.1.2-next.5

### Patch Changes

- Merge pull request #210 from pie-framework/dependabot/github_actions/actions/cache-6

## 0.1.2-next.4

### Patch Changes

- Merge pull request #207 from pie-framework/chore/retire-superseded-packages

## 0.1.2-next.3

### Patch Changes

- 06c1926: Subpath imports of `@pie-lib/math-rendering` and `@pie-lib/pie-toolbox`, and imports of packages whose names begin with theirs, such as `@pie-lib/math-rendering-accessible`, bundle from `node_modules`; the two packages themselves stay external.

## 0.1.2-next.2

### Patch Changes

- ec4e868: Builds of the same dependencies for different bundles, such as separate `editor` and `client-player` requests, run one after another, because they install into and write to the same directory.
- 0b4b1a9: Svelte rune modules (`.svelte.ts`, `.svelte.js`) are compiled by Svelte, so runes such as `$state` work in a bundle.
- 0611171: Exports `findWorkspacePackages` and `workspaceDependencyClosure`, which give the workspace packages a `workspace-fast` build of given elements reads, so a caller can key its bundle cache on them.
- 67e7141: `workspace-fast` builds bundle every workspace package from its sources, so no element, shared or `@pie-lib` package needs building first and an edited element bundles its current source. Workspace packages are linked by package name, and Svelte components compile with `customElement` as the elements' own builds do.

## 0.1.2-next.1

### Patch Changes

- Merge pull request #175 from pie-framework/fix/author-shim-cross-element-bundles

## 0.1.2-next.0

### Patch Changes

- 8d69fb5: Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

## 0.1.1

### Rename and Scope Notes

- e131840: Prepare the player and bundler packages for the next publish cycle.
  Includes release updates for `element-player`, `print-player`, and `bundler-shared`.

## 0.1.2

### Patch Changes

- Renamed package from `@pie-element/bundler-shared` to `@pie-element/element-bundler`.
- Clarified scope: this package currently produces IIFE bundles and is not required for ESM bundle workflows.
