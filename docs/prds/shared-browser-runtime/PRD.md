# Shared browser runtime

Status: **Proposal** · Impl. path: Cross-cutting

## Context

Every element's `dist/browser/*` entry is its own Rolldown build that externalizes only React, React DOM and the JSX runtimes ([`browser-esm-policy.json`](../../../tools/vite/browser-esm-policy.json)). Each element therefore inlines its own `@pie-lib/*`, MUI, Emotion, react-transition-group, dnd-kit, `@tiptap/react`, i18next and MathQuill, and a page with several elements downloads and evaluates the same stack once per element. The editor engine is already shared on the esm strategy through [`@pie-element/shared-editor-runtime`](../../PIE_ELEMENT_CONTRACT.md#shared-editor-runtime); that package is the precedent this design generalizes and replaces.

`./delivery` (preserveModules, externals resolved by the host bundler) dedupes the stack but binds the host's React: under a React 19 host the element's pinned React 18 and the `@pie-lib` libraries' host React 19 render one tree, and React throws error #31. That route is closed by the project invariant that framework dependencies never bind the host's React.

Reliability and robustness take priority over efficiency. Byte savings are the motivation, and no saving is taken at the cost of a new way to break: a page that mixes element releases may cost bytes, and must still work.

## Goals

- A page with several React elements loads one copy of the React-bound UI stack, the editor engine and the shared React-free libraries per runtime version on the page.
- Elements from different releases on one page each run against the runtime version they were built with, on the npm preloaded path and on the esm strategy.
- The host's React, import map and bundler aliases can never reach an element or the runtime.
- The switch is deliberate and reversible: `./browser/*`, `./delivery`, `module/print.js` and the IIFE builds keep their current bytes and behaviour until a host or `pie-players` opts in, and afterwards.
- Every failure the runtime adds is prevented by a build or publish gate, or detected at load and answered by the self-contained `./browser/*` lane.

## Non-goals

- **Changing IIFE, `module/print.js` or `./delivery`.** IIFE stays as-is; `module/print.js` stays self-contained because its loader injects no import map ([legacy-print PRD](../legacy-print-compatibility/PRD.md)); `./delivery` stays the Node/builder lane.
- **Sharing Svelte.** Each Svelte element keeps bundling its own Svelte; the runtime contains no Svelte, and Svelte elements take only React-free modules from it, the editor engine among them.
- **One runtime per page.** The editor runtime serves every element from the highest caret-compatible version on the page. This design pins exact versions and lets versions coexist, because a shared UI stack changes on every `@pie-lib` release and a forced upgrade under an older element is a break.
- **Host-provided modules.** Nothing in the runtime is resolved against the host; the runtime has no `dependencies`, no `peerDependencies` and no bare imports.

## Proposed surface

### Runtime package

`@pie-element/shared-browser-runtime` (`packages/shared/browser-runtime`) is browser ESM only, built like the editor runtime: one module per specifier it provides, modules importing each other by relative path, shared code in common chunks, everything bundled, React included. `pie.browserModules` maps each provided specifier to a view name, and the module for a view is `dist/browser/<view>.js`.

Admission is by package, with one invariant: a package in the runtime is never also bundled in an element's runtime-lane output, so no React context, style cache or registry exists twice within one runtime version.

- **React, React DOM, `react-dom/client`, the JSX runtimes.** In, at the exact version `sharedDependencyVersions` names (18.2.0 today). The runtime's React is private to it, so its version moves independently of every host.
- **The React-bound stack.** In: MUI (`@mui/*`), Emotion, react-transition-group, dnd-kit, `@tiptap/react`, and every `@pie-lib/*` package. Each of them holds a React context or a style cache that a `@pie-lib` component and the element that renders it must read from one copy; a split copy renders with a default theme or a second cache.
- **The editor engine.** Folded in, because `@tiptap/react` lives in the runtime and must link against the same `@tiptap/core` and ProseMirror modules; a separate package would add a second version axis whose agreement nothing checks at load time. `@pie-element/shared-editor-runtime` stays published unchanged until the editor-runtime variant is removed ([Rollout](#rollout)).
- **MathQuill (through `@pie-lib/math-input`) and i18next (through `@pie-lib/translator`).** In, subject to [Shared state](#shared-state): `@pie-lib/editable-html-tip-tap` depends on `math-input`, and `config-ui` on `editable-html-tip-tap`, so keeping MathQuill out keeps most of the stack out.
- **React-free libraries reached by two or more elements** (`@pie-element/shared-*`, and third-party leaves such as `debug` and `clsx`). In.
- **Out.** Svelte; packages only one element reaches, which stay bundled in that element and import React from the runtime; element code.

A barrel specifier such as `@mui/material` pulls the whole package into any page that imports it. Barrel imports of admitted third-party packages are rejected by the lane build, and the 16 source sites that use `@mui/material` or `@mui/icons-material` barrels move to deep imports first. `@pie-lib/*` barrels stay; what they add to single-element pages is part of the step-2 measurement, and render-ui already measures about 60 KB in each of the six measured elements.

Each view exports the full surface of its specifier. A CJS package (React, React DOM, prop-types) gets a generated ESM facade whose named exports are the ones the package defines at build time.

### Specifier scheme

An element's runtime-lane output imports the runtime only through `@pie-element/shared-browser-runtime/<version>/<view>.js`, for example `@pie-element/shared-browser-runtime/1.2.0/mui-material-button.js`. The runtime's `exports` has exactly `"./<version>/*": "./dist/browser/*"` and `./package.json`, rewritten by the version script.

- **Npm path.** The host bundler resolves the specifier through Node resolution from the element's location, which reaches the runtime copy the element's exact `dependencies` pin installed, nested or hoisted. A copy at any other version defines no `./<version>/*` subpath, so a wrong copy (a host override, a resolution bug) fails the host build instead of binding silently.
- **Esm path.** One import-map entry per runtime version maps the prefix `@pie-element/shared-browser-runtime/<version>/` to `<cdn>/@pie-element/shared-browser-runtime@<version>/dist/browser/`. The key is unique per version, so it never collides with another version's entry under the first-rule-wins resolution of multiple import maps, and no scopes are needed.
- **Host isolation.** No lane or runtime module imports `react` or any other bare specifier outside this namespace, so the host's `react` import-map entry, bundler aliases and `node_modules/react` are unreachable.

### Element lane

Each element whose `./browser/*` build reaches an admitted package adds a lane built from the same entries, `tools/vite/element-browser-runtime.config.ts` (and a Svelte sibling), writing `dist/browser/runtime/<view>/index.js`:

- `exports["./browser-runtime/<view>"]` for each `./browser/*` view, with the same types.
- `dependencies["@pie-element/shared-browser-runtime"]` at the exact version (`workspace:*` in the repo), so npm installs it with the element.
- `pie.browserRuntime: { name, version, views }` with `views.<view> = "runtime/<view>"`, the esm adapter's declaration, in the shape of `pie.browserEditorRuntime`.
- A build-time constant marks the lane, and private child tags (EBSR's multiple-choice parts, complex-rubric's) carry it next to the version suffix, so a page that loads one element version through both lanes defines disjoint private tags.
- Each lane entry imports the runtime's `identity.js` and throws a named error when the runtime digest differs from the one the element was built against.

The lane fails when an admitted package's module is bundled, as the editor-runtime lane does for engine modules, naming the specifier to add to `pie.browserModules`. `pie-cli` sync composes the lane into each synced package's build script and writes `pie.browserRuntime`, as it does for the editor runtime.

### Versioning and coexistence

The runtime is versioned by content. Its `package.json` carries `pie.digest`, a hash of the built modules with the identity module excluded; CI rebuilds the runtime and fails when the digest is stale. Because the digest lives in the runtime's own manifest, a `@pie-lib` or lockfile change that alters the runtime is a shipping-file change of the runtime, which [`release-synthesize-changesets.mjs`](../../../scripts/release-synthesize-changesets.mjs) already turns into a release. `bun run version` then rewrites every element's `pie.browserRuntime.version`, its runtime dependency and the runtime's `exports` key, as `sync-editor-runtime-version.mjs` does today, so the elements a release publishes all pin the runtime that release publishes.

- **One release, one runtime.** Elements from one release share one runtime copy.
- **Mixed releases.** npm, pnpm and Yarn nest the second exact version; the esm path maps a second prefix. Each element runs against its own version, at the cost of a second copy of the stack. Nothing is upgraded under an element.

### Shared state

Nothing needs to be shared across elements for correctness. Every React element's custom element mounts its own root with `createRoot(this)` and provides its own theme; the runtime supplies modules and never a root, provider or context value that spans elements. Across runtime versions nothing is shared beyond what the page itself holds, which is the situation of today's per-element bundles.

Within one runtime version, module-level state that each element held privately becomes shared by every element on that version. The admitted packages' module state:

| State | Scope today | In the runtime |
| --- | --- | --- |
| MathQuill embed registry | per element bundle | Shared, and **conflicting**: math-inline and math-templated both register `answerBlock` with different markup, so the element that registers second replaces the other's answer-block markup. Blocker; see [Open questions](#open-questions). `registerEmbed` also refuses a second, different factory for a name and reports it. |
| i18next default instance (`@pie-lib/translator`) | per element bundle | Shared. It is initialized once with static resources, every `t` call passes `lng`, and no package calls `changeLanguage`. |
| Emotion default cache (key `css`) | per element bundle | Shared per version. The key and insertion point stay as they are, so class names and style order match today's single-element pages. |
| MathJax | page (`window.MathJax`, a `Symbol.for` load guard) | Unchanged: one load per page across runtime versions. |
| Element stylesheets (`data-pie-css` hash) | page | Unchanged: installed once per hash, guarded for a missing `document`. |
| `customElements` | page | The runtime defines no element. The player owns public tags; private tags are version- and lane-scoped. |
| Authoring counters (`editable-html` response areas, graphing's last action) | per element bundle | Shared per version; the response-area counter is keyed by element type, and the graphing middleware already serves every instance of one element. |

A new admitted package enters this table before it enters the runtime.

### Failure modes

| Failure | Prevention | Detection and response |
| --- | --- | --- |
| Runtime version missing or unpublished | Publish preflight treats `pie.browserRuntime` as a runtime workspace dependency, so the runtime publishes first or in the same set; `check-version-availability` covers the name | Npm: install fails with the missing version. Esm: the runtime's `package.json` fails to load, and the player loads the element's `./browser/*` and reports it |
| Registry holds different content at the pinned version (the PIE-1041 class) | Publish gate compares an already-published runtime version's tarball with the workspace build | `identity.js` digest check throws at evaluation; the esm player falls back |
| Mismatched runtime surface | Full-surface views; the publish check that every name a lane imports is exported by the pinned runtime's view | Link error on import; the esm player falls back |
| Wrong runtime copy on the npm path | Versioned subpath exists only in the matching copy | Host build fails naming the subpath |
| CDN partial outage | Outside PIE's control | A failed fetch fails the element's module graph before any module in it evaluates, so no runtime is half-initialized; the browser caches the failed URL, so the player falls back to the other lane's URLs and never retries the same one |
| CSS and Emotion injection order | Emotion key and insertion point unchanged; stylesheet installs keep their hash guard | Co-residence screenshots against single-element renders |
| SSR, `window` access | Runtime and lane modules touch no DOM at module scope and use no top-level await | Gate imports every runtime and lane module under Node without DOM globals |
| Duplicate registration | No `customElements.define` reachable in the runtime; lane entries register no public tag; lane-scoped private tags | Existing auto-registration check extended to the lane |
| Multiple React roots | One React per runtime version with one root per element, the supported case; no React element or context crosses a package | Co-residence test mounts, unmounts and remounts elements on one runtime and on two |

### Build and publish gates

In `check:publish-surface`, `verify:element-contracts` and ng CI:

- The runtime has no `dependencies`, `peerDependencies` or bare imports; every `pie.browserModules` view exists; `exports` has exactly the current version's pattern and `./package.json`; `pie.digest` matches a fresh build.
- The lane imports nothing bare outside the pinned version's namespace, and every imported name is exported by the pinned view; no admitted package is bundled; the declared version is exact and equal in `pie.browserRuntime`, `dependencies` and the workspace runtime.
- A runtime version already on npm has the workspace build's content.
- The stylesheet, top-level-await, size and auto-registration rules apply to the lane and the runtime; the runtime gets its own size budget.
- Adding the lane leaves every existing artifact byte-identical: `dist/browser/*` outside `runtime/`, `dist/browser/editor-runtime`, `./delivery`, `module/print.js` and the IIFE builds are compared with a build without the lane.
- Co-residence test: every React element's delivery and author views rendered together in one document on one runtime, and pairs on two runtime versions, compared with each rendered alone (DOM and screenshots).
- The IIFE suite ([`run-iife-suite.mjs`](../../../scripts/run-iife-suite.mjs)) stays green.

### Consumer test matrix

Required green before the switch, against packed tarballs:

- **Npm preloaded path.** npm, pnpm (default and `hoist: false`) and Yarn (node-modules and PnP) × host without React, React 18 and React 19 × Vite (build and dev server) and webpack 5 × item player and section player, registering `/browser-runtime/*` modules with `registerPreloadedElements`.
- **Esm strategy.** Chromium, Firefox (including the es-module-shims path after a rejected import map) and WebKit × host without React, and with its own import map mapping `react` to 18 and to 19 × `moduleResolution` `url` and `import-map`, through `local-esm-cdn` and a jsDelivr-shaped fixture server.
- **Mixed versions.** Two elements pinned to two runtime versions on one page, on both paths; one element version loaded through both lanes on one page; the runtime lane beside `./browser/*` elements.
- **Unchanged paths.** IIFE, `./browser/*` and `module/print.js` consumers pass as before with the lane published.

ng owns the npm path and the tarball fixtures, including a runtime built at two versions; `pie-players` owns the esm path.

### pie-players changes

- **Esm adapter** ([`esm-adapter.ts`](https://github.com/pie-framework/pie-players/blob/develop/packages/players-shared/src/loaders/esm-adapter.ts)). A `sharedRuntime` loader option, off by default and exposed through the item, section and print players' loader options. When on, a package that declares `pie.browserRuntime` loads `pie.browserRuntime.views[view]` in both resolution modes, and the load adds the runtime version's prefix entry to the map it injects. The lane supersedes a package's editor-runtime variant. A package falls back to `./browser/*`, reported through the existing `pie-esm-shared-dependency-conflict` event with a reason, when the runtime's `package.json` or a lane module fails to load, when the identity check throws, or when the page already maps the prefix elsewhere. Elements on the lane need no React entry in the map.
- **CDN providers.** A method for the runtime's base URL; esm.sh must serve runtime files untransformed to support the lane.
- **`local-esm-cdn`** ([`handler.ts`](https://github.com/pie-framework/pie-players/blob/develop/apps/local-esm-cdn/src/core/handler.ts)). Serves the runtime from the ng workspace and leaves specifiers under `@pie-element/shared-browser-runtime/` bare, as it leaves the editor runtime's.
- **Preloaded registration docs** ([`loading-strategies.md`](https://github.com/pie-framework/pie-players/blob/develop/docs/item-player/loading-strategies.md)). The recipe gains `/browser-runtime/*` imports as the opt-in; under the lane, the one-release rule becomes a byte cost.
- **Tests and pad.** The element-loader contract tests, esm e2e specs and the ng esm smoke script cover the lane; the consumer dependency pad gains the new loader option.

### Rollout

Each step ships alone and leaves every existing path unchanged.

1. **Prerequisites in ng.** Resolve the `answerBlock` conflict; move the 16 MUI barrel imports to deep imports; the React peer removal lands.
2. **Runtime and lane in ng**, with the gates, the digest and the version script. Register the new name with ng's trusted publisher before the first publish. Published; nothing consumes it.
3. **Npm matrix in ng CI.**
4. **Opt-in in `pie-players`**, off by default, with the esm matrix and the docs describing the opt-in.
5. **Soak.** Demos and the reference app run with the lane on for two releases, with fallback reports at zero.
6. **Switch.** `pie-players` turns `sharedRuntime` on by default for esm, and the preloaded docs recommend `/browser-runtime/*`. Reverting is the option or the import path; `./browser/*` stays published as the fallback lane.
7. **Removal.** The editor-runtime variant and `@pie-element/shared-editor-runtime` go once the switch has shipped and a consumer audit over the host checkouts, with a positive control, finds no load of `dist/browser/editor-runtime` outside `pie-players`; the package is deprecated on npm. `./browser/*` goes only under the conditions the open question below settles, as a major for each element.

### Savings and costs

Six elements (drag-in-the-blank, explicit-constructed-response, extended-text-entry, inline-dropdown, multiple-choice, passage) through the documented npm `./browser/*` path load 3,934,325 B minified, of which 2.28 MB is duplicated: 1.50 MB React-bound UI stack, 0.44 MB editor engine carried twice, 0.32 MB React-free libraries. Through the esm strategy they load 3,799,688 B, 2.65 MB duplicated, with the engine already shared. A prototype that shared only MUI, Emotion, render-ui, translator and i18next took a six-element esm page (multiple-choice, categorize, match, inline-dropdown, extended-text-entry, drag-in-the-blank) from 3.93 MB to 2.04 MB, 1.20 MB to 0.61 MB gzipped, and single-element pages grew 0.3–10%. The full runtime targets the whole duplicated amount, a floor of about 1.65 MB on the npm path and 1.15 MB on esm before the overhead of full-surface views; step 2 measures that overhead and single-element growth.

Costs:

- **Build lane.** One more Vite build for each element that reaches an admitted package, up to all 30 elements, plus the runtime build.
- **Install size.** Every element install, legacy IIFE builders included, also installs the runtime tarball.
- **Coupling.** On the lane, the elements of one release share one version of every admitted package, and an `@pie-lib` change reaches the lane only through a runtime release.
- **Release cadence.** Every runtime release republishes every element on the lane.
- **Two lanes.** `./browser/*` and the lane are both maintained until the removal criteria hold.
- **Production React.** The runtime ships React's production build, so hosts' development builds get no React development warnings from elements on the lane.

## Worked example

A section page holds multiple-choice from one release, pinning runtime `1.2.0`, and extended-text-entry from the next, pinning `1.3.0`. On the npm path the host's `node_modules` holds `@pie-element/shared-browser-runtime@1.3.0` at the root and `1.2.0` nested under multiple-choice; the host bundler resolves each element's `@pie-element/shared-browser-runtime/<version>/…` imports to its own copy, and the page carries two stacks. On the esm path the player's import map holds two entries:

```json
{
  "@pie-element/shared-browser-runtime/1.2.0/": "https://cdn.jsdelivr.net/npm/@pie-element/shared-browser-runtime@1.2.0/dist/browser/",
  "@pie-element/shared-browser-runtime/1.3.0/": "https://cdn.jsdelivr.net/npm/@pie-element/shared-browser-runtime@1.3.0/dist/browser/"
}
```

Both elements render. After the next release republishes both, the page carries one stack.

## Accessibility

Unchanged: the lane renders the same DOM as `./browser/*`, which the co-residence test compares.

## Open questions

- [ ] `answerBlock`: unify math-inline's and math-templated's answer-block markup in `@pie-lib/math-input` (a visible change for one element in every lane), or keep MathQuill and every library that reaches it out of the runtime (most of the React-bound stack, and most of the saving)?
- [ ] `./browser/*` removal: keep it permanently as the esm fallback lane, or remove it once fallback reports stay at zero over a set window and the consumer audit is clean, giving up the fallback?
- [ ] Single-element growth: should a size threshold block a runtime release, and at what percentage, or is growth reported only?
- [ ] React inside the runtime: stay at 18.2.0, or move the runtime to React 19 now that no host binds it, and when?
- [ ] Soak evidence for the switch: are two releases of demos and the reference app enough, or does the switch wait for production instrumentation from an opted-in host?
