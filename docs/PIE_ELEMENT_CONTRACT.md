# PIE Element Contract

This is the normative contract for publishable PIE element packages. It covers the JavaScript runtime API and the npm package surface that players, builders, and server-side tooling may rely on.

`docs/API_REFERENCE.md` provides examples and element-specific API detail. `docs/PUBLISHING.md` describes release process. When either disagrees with this document, this document is the contract.

## JavaScript Runtime Contract

### Model, Session, and Environment

Every element consumes a model, a session, and an environment object.

- The model is authored item data. It must include a stable `id` and an `element` tag such as `multiple-choice`: the key under which the item config's `elements` map names the element package. Players match models to elements by that tag.
- The session is learner response data. Its shape is element-specific. The player owns the session object it sets, and the element writes each change into that object, as the Delivery Contract below sets out.
- The environment describes mode and role. Supported modes are `gather`, `view`, and `evaluate`; supported roles are `student` and `instructor`. The authoring view is a separate custom element, described under the Authoring Contract.

Element-specific model and session fields are part of that element's public contract once published. Breaking shape changes require normal semver treatment.

### Controller Module

Controller-bearing elements expose their controller at `@pie-element/<name>/controller`.

The required controller entry point is:

- `model(model, session, env, updateSession?)`: returns the view model used by delivery, author, or print rendering. `updateSession(id, element, properties)` persists `properties`, such as a drawn choice order, into the stored session; `PieUpdateSession` in `@pie-element/shared-types` types it.

Controller modules may also expose these helpers when the element supports the capability:

- `outcome(model, session, env)`: returns scoring output.
- `createDefaultModel(partial?)`: returns a default authoring model.
- `validate(model, config?)`: returns authoring validation errors.
- `createCorrectResponseSession(model, env?)`: returns a correct-answer session.

When a helper is exported, its name and behavior are public API. Do not rename or remove it without a breaking release.

### Custom Element Runtime

Published element view modules export custom element classes. They must not
register their authored top-level PIE tag at package import time. Runtime
registration of authored item tags belongs to the player or host.

If a package renders private child custom elements inside its own implementation,
the package's browser artifact must define those private child tags itself before
the first render depends on them. Private child tags are not authored content
dependencies and players must not discover them from package dependencies, DOM
snippets, or element-specific knowledge.

Private child tag names are global custom element names, so packages must scope
them by the owning package version (for example with a `--version-<encoded>`
suffix), use the same scoped name for registration and rendering, and keep
registration idempotent with `customElements.get(...)` guards. This preserves
side-by-side loading of multiple package versions and mirrors the IIFE behavior
where private child implementations are resolved from the owning package's
dependency tree at build time.

Players set data via properties, not attributes:

- `element.model = model`
- `element.session = session`

Elements declare no `env` property. The environment reaches an element through its controller: `model(model, session, env)` returns the view model the player sets as `element.model`.

Delivery elements announce session changes as the Delivery Contract below sets out, and author elements announce model changes as the Authoring Contract sets out.

### Delivery Contract

The element writes each learner change into the session object the player set, keeping its reference, and then dispatches `session-changed` (`SessionChangedEvent` from `@pie-element/shared-player-events`). Players read the response off their own object: `pie-player` holds its entry in the host's `session.data`, and `pie-item-player` forwards the array it holds, so an element that only replaces its own reference loses the response.

- `detail` is `{ complete, component }`: whether the session is a complete response, and the tag the element is registered under. It carries no session.
- The event bubbles and is composed.
- Setting `model` dispatches `model-set` (`ModelSetEvent`), `detail` `{ complete, component, hasModel }`, a microtask later, so `complete` counts a session the player sets in the same task.
- The item player stops the element's `session-changed` and re-emits one from its own host, adding `detail.session` with the session container it holds.

Svelte elements get this from `defineDeliveryElement` in `@pie-lib/delivery-events-svelte`; React elements mutate the session they were given.

### Authoring Contract

A player registers an element's author view under `<tag>-config` and sets two properties on it, `model` and then `configuration`. The element declares both; an undeclared property lands on the instance, where the element never reads it.

Each edit dispatches one `ModelUpdatedEvent` from `@pie-element/shared-configure-events`, on the author element itself:

- `update` is the whole model, `id` and `element` included. The item player matches the stored model by `id` and drops an update without one; legacy `pie-author` matches by `id` and `element`.
- `reset: true` tells the item player to replace the stored model and `reset: false` to merge `update` over it, so an edit that removes a top-level field sends `reset: true`. Legacy `pie-author` ignores `reset` and always merges, so it keeps a removed field.
- The event bubbles. The item player listens on its root in the capture phase, legacy `pie-author` on its host in the bubble phase.
- It is a `ModelUpdatedEvent` instance: `pie-author` reads `event.update`, the item player `event.detail`, which carries `update` and `reset`.
- `model`, where the element exposes it for reading, holds the edit before the event fires and keeps it when the element is detached and re-attached; `@pie-element/element-player` reads it in its handler. A Svelte custom element remounts from the value last assigned to its property, so a Svelte author assigns each edit through `$host().model`.

`configuration` is the host's customization of the authoring view, merged over the element's defaults. Its entries follow `@pie-lib/config-ui`: an entry's `label` names its field in the design view and its setting in the settings panel, `settings: true` offers that setting, and `settingsPanelDisabled: true` hides the panel. Svelte author elements build the panel from `@pie-lib/config-ui-svelte`.

Layout, styling and the settings an element defines are the element's choice.

`@pie-element/shared-test-utils` checks the property and event rules with `assertAuthorElementProperties(tag)` and `assertAuthorModelUpdate({ tag, model, configuration, edit })`. Each Svelte author element's tests run them.

## NPM Packaging Contract

Publishable packages expose generated artifacts only. Package entry points must resolve to `dist` files except for the root compatibility shims described below.

### Dist-Only Surface

Package `exports`, `main`, `module`, `types`, `unpkg`, and `jsdelivr` entries must point at generated `dist` artifacts. Packages must not publish or expose raw `src`, `.ts`, `.tsx`, `.svelte`, or `.svelte.ts` files as public API.

Every element package also exports `./package.json`, so a host reads the installed version from the package itself.

Sourcemaps may be published, but they must include source content so consumers can debug without unpacked source files.

### Self-Contained Svelte

A client installs a PIE package and nothing else. No publishable manifest lists `svelte` in `dependencies`, `peerDependencies` or `optionalDependencies`, and no shipped JavaScript imports `svelte` or `svelte/*`: Svelte element builds inline the Svelte runtime. `@pie-element/element-bundler` is exempt from the `dependencies` rule, because it compiles elements.

### Controller And Configure Packaging

Controller-bearing packages must publish all of these:

- `pie.controller`: `@pie-element/<name>/controller`
- `exports["./controller"]`: `./dist/controller/index.js`
- `exports["./controller.js"]`: same JS and type targets as `./controller`
- root `controller.js`
- `files`: includes `controller.js` and covers the `dist` output

The root `controller.js` file must contain exactly:

```js
export * from './dist/controller/index.js';
```

Standard ESM consumers use `exports["./controller"]`. The root shim exists for alias-based legacy builders such as `pie-api-aws`.

Author-capable packages must keep `./author` as the modern ESM entry and also
publish a legacy configure alias for older production builders:

- `pie.configure`: `@pie-element/<name>/configure`
- `exports["./configure"]`: same JS and type targets as the author/configure implementation
- root `configure.js`
- `files`: includes `configure.js` and covers the `dist` output

When the modern source entry is `src/author`, the legacy configure export points
at the same generated author artifact:

```json
{
  "./author": { "types": "./dist/author/index.d.ts", "default": "./dist/author/index.js" },
  "./configure": { "types": "./dist/author/index.d.ts", "default": "./dist/author/index.js" }
}
```

The root `configure.js` file must re-export that default class:

```js
export { default } from './dist/author/index.js';
export * from './dist/author/index.js';
```

Standard ESM consumers should prefer `exports["./author"]`. The configure alias
exists so `pie-api-aws` can build `editor.js` for legacy `pie-author` consumers
without learning the modern author subpath first.

Packages that export `./author` also publish a root `author.js`, with the same
contents as `configure.js`, and list it in `files`. Composite elements import
another element's authoring view by `@pie-element/<name>/author`: complex-rubric
imports `@pie-element/rubric/author` and ebsr imports
`@pie-element/multiple-choice/author`. An alias-based builder resolves that
request as a filesystem path, so without the shim the whole bundle fails to
build. The shim has no `exports` entry.

Print-capable packages carry the same root shim contract:

- `exports["./print"]`: the generated print JS and type targets
- `exports["./print.js"]`: same targets as `./print`
- root `print.js`
- `files`: includes `print.js` and covers the `dist` output

The root `print.js` file must re-export the default component:

```js
export { default } from './dist/print/index.js';
export * from './dist/print/index.js';
```

An alias-based builder resolves `@pie-element/<name>/print` as a filesystem path,
so without this shim the request never reaches the exports map. A declared print
export with no resolvable target drops the print view from an IIFE bundle, which
is why the shim is required rather than optional. This is distinct from the
legacy `module/print.js` artifact described below, which serves a different
loader.

### Browser ESM Packaging

Browser ESM is the player-facing module surface. Element packages that support browser ESM expose static files under:

- `dist/browser/delivery/index.js`
- `dist/browser/author/index.js`
- `dist/browser/print/index.js`
- `dist/browser/controller/index.js`

The package exports expose those files as:

- `./browser/delivery`
- `./browser/author`
- `./browser/print`
- `./browser/controller`

Browser ESM entries must not rely on CDN transforms such as jsDelivr `+esm` for element package code. They are built files published by the package.

Browser ESM entries use the shared policy in `tools/vite/browser-esm-policy.json`:

- Bare imports are allowed only when listed in `allowedBareImports`.
- Shared browser singleton versions are exact and declared in `pie.browserSharedDependencies`.
- The browser ESM React contract is React 18, the version `pie.browserSharedDependencies`
  names for the player's import map. Elements declare `react` and `react-dom` at `^18.2.0` in
  `dependencies` and declare no React peer, so every package manager installs an element its own
  React 18 and never binds it to the host's React. The `./browser/*` entries bundle the
  `@pie-lib` libraries and resolve React from the element package; hosts bundle these. The
  `./delivery` entries import the `@pie-lib` libraries, whose React peer resolves the host's React,
  so hosts do not bundle them: under a React 19 host an element and its libraries can run on
  different copies of React. The dependency also installs React for legacy webpack builders, which
  install `dependencies` and never peers. Synced packages must not preserve React 16/17
  compatibility shims in browser-facing dependency policy.
- The import-map path takes its singleton versions from `pie.browserSharedDependencies`;
  `dependencies` and `peerDependencies` do not affect it.
- Browser JS output must stay within the policy size budget unless the policy is intentionally changed.
- Hosts load no element CSS. The chunk that imports a stylesheet installs its rules before its
  own code runs, and the assets they reference ship in `dist/browser/assets`; see
  [`PACKAGING_ARCHITECTURE.md`](PACKAGING_ARCHITECTURE.md#browser-esm-stylesheets). A stylesheet
  in `dist/browser` that no reachable module loads fails the publish check.
- Browser ESM modules do not use top-level await, which default Vite 6 builds reject.
- Browser ESM output must not leak runtime `require` calls. The shared browser
  build may rewrite known Rolldown CJS helper calls only for the allow-listed
  interop targets documented in
  [`PACKAGING_ARCHITECTURE.md`](PACKAGING_ARCHITECTURE.md#browser-esm-commonjs-interop);
  unsupported helper targets must fail the build.

If a new dependency should become a shared browser singleton, update `tools/vite/browser-esm-policy.json`, package generation, publish checks, and `pie-players` import-map handling in the same change.

### Shared Editor Runtime

`@pie-element/shared-editor-runtime` publishes the editor engine as browser ESM: `@tiptap/core`,
the `@tiptap/pm/*` ProseMirror modules, and the tiptap extensions and starter kit the elements
import. Its `pie.browserModules` maps each bare specifier it provides to a view, and the module
for a view is `dist/browser/<view>/index.js`:

```json
"pie": {
  "browserModules": {
    "@tiptap/core": "tiptap-core",
    "@tiptap/pm/state": "tiptap-pm-state",
    "@tiptap/starter-kit": "tiptap-starter-kit"
  }
}
```

Runtime modules import each other through relative paths only. They have no bare imports, React
included, and the package has no `dependencies` or `peerDependencies`. Within a caret range the
runtime only adds specifiers and exports, so a variant runs against every compatible runtime
version at or above the one it declares; compatibility and ordering are defined under
[Browser ESM](#browser-esm) below. A change that removes a specifier or an export starts a new
caret range.

An element whose `./browser/*` build bundles the editor engine also publishes an editor-runtime
variant of each browser view at `dist/browser/editor-runtime/<view>/index.js`, built from the same
entries with the runtime's specifiers external. React and React DOM stay external as in
`./browser/*`; `@tiptap/react`, the editable-html components, Emotion, MUI and the element's styles
stay bundled. The variant has no `exports` entry: players load it by path. `./browser/*` is
unchanged and stays self-contained. The element declares the variant in
`pie.browserEditorRuntime`:

```json
"pie": {
  "browserSharedDependencies": { "react": "18.2.0", "react-dom": "18.2.0" },
  "browserEditorRuntime": {
    "name": "@pie-element/shared-editor-runtime",
    "version": "0.1.0",
    "views": {
      "delivery": "editor-runtime/delivery",
      "author": "editor-runtime/author",
      "print": "editor-runtime/print",
      "controller": "editor-runtime/controller"
    }
  }
}
```

- `name` is the runtime package.
- `version` is the exact runtime version the variant was built against. `bun run version`
  rewrites it to the runtime version the same release publishes, and the publish step releases
  the runtime before the elements that declare it.
- `views` maps every `./browser/*` view to its variant's path under `dist/browser`.
- `pie.browserSharedDependencies` names only the bare imports of `./browser/*`. The variant's
  runtime imports resolve through the runtime's `pie.browserModules`.

`check:publish-surface` requires the declaration exactly when `./browser/*` bundles the engine. It
checks that the declared version is exact and equals the workspace runtime's, that the variant's
bare imports are `allowedBareImports` plus the runtime's specifiers, that every name the variant
imports from the runtime is exported by the runtime module, and that the variant bundles no engine
module. The stylesheet, top-level await and size rules above apply to the variant and to the
runtime.

### Legacy-Compatible Print Packaging

Packages that declare `exports["./print"]` may additionally publish a second, unrelated print artifact at the package root:

- `module/print.js` (and its sourcemap `module/print.js.map`)
- `module/assets/`, the assets the stylesheets `module/print.js` installs reference, as browser ESM chunks do

This exists solely so the unmodified, currently-deployed `@pie-framework/pie-print` client loader — which fetches `<pkg>/module/print.js` directly by CDN path and does a bare `import()` with no import map — can load `pie-elements-ng` print bundles. It is **not** part of the `./browser/print` contract above: `dist/browser/print/index.js` stays the artifact for the new `pie-players/pie-print-player`, which does inject an import map. `module/print.js` is fully self-contained instead (no externals, React included), because its loader injects nothing. See [`PRINT_SUPPORT.md`](PRINT_SUPPORT.md) and [`docs/prds/legacy-print-compatibility/PRD.md`](prds/legacy-print-compatibility/PRD.md).

`files` must include `module` for packages that publish it. It is permitted in the packed tarball only when the package declares `exports["./print"]` — packages without a print component may not ship a `module/` directory.

### Runtime Support Export

An element may expose `./runtime-support` when it has runtime support constraints. If present, the export must point at publishable files covered by `files`.

Packages that do not publish `./browser/*` exports must expose `./runtime-support` and mark browser ESM unsupported, for example `supports.esm.delivery = false`. This makes unsupported ESM explicit instead of letting players discover it through missing CDN files.

Packages that publish `./browser/*` exports may omit `./runtime-support` unless they need to disable a runtime strategy or view.

## Runtime Strategy Contract

The same npm package must be usable by three runtime strategies.

### Browser ESM

`pie-players` loads static browser ESM entries and builds an import map for shared browser dependencies from `pie.browserSharedDependencies`.

Two versions of a shared browser dependency are compatible when they fall in the same semver caret
range: the same major version, and below 1.0.0 the same major and minor version. Versions are
ordered by semver precedence, prerelease identifiers included, so `0.1.1-next.9` precedes
`0.1.1-next.10`, which precedes `0.1.1`.

When multiple elements request different compatible versions of a shared singleton, the player may select the highest and report the conflict through console and instrumentation. Incompatible versions, or attempts to upgrade a singleton after it has already been injected, fail the load and are also reported.

A player that loads the shared editor runtime loads each view from `pie.browserEditorRuntime.views`
in place of `./browser/*` and maps every specifier in the runtime's `pie.browserModules` to
`<runtime>@<version>/dist/browser/<view>/index.js` in the import map, so every editor on the page
shares one engine. It serves an element from the highest compatible runtime version the page maps,
which must be at least the version the element declares. A player that cannot serve the declared
version, for example because the page already maps a lower or incompatible runtime, loads that
element's `./browser/*` views, which are self-contained, and reports the conflict through console
and instrumentation. The load does not fail.

### IIFE

IIFE is a legacy runtime strategy but remains supported. Builders import package exports, including `@pie-element/<name>/controller`, `@pie-element/<name>/configure`, `@pie-element/<name>/author` and `@pie-element/<name>/print`, and may rely on the root `controller.js`, `configure.js`, `author.js` and `print.js` shims for filesystem alias compatibility.

A builder that aliases `@pie-element` to a directory resolves those subpaths as
literal paths, so the root shims are what the request lands on. A subpath a
package declares without shipping a resolvable target is omitted from the
generated entry rather than failing the whole bundle.

Element package runtime entry points must not require raw source files to be present in the npm tarball.

### Preloaded

Preloaded mode is not a separate package format. It means the expected custom element tag has already been registered by the host before the player renders.

Package modules must therefore export classes without self-registering tags. This lets ESM, IIFE, and host-preloaded flows share the same class exports while leaving tag ownership to the runtime.

## Verification

Run the aggregate verifier before publishing:

```bash
bun run verify:element-contracts
```

The aggregate verifier runs the contract-relevant checks for:

- npm publish surface and browser ESM policy,
- controller/configure packaging and compatibility shims,
- runtime-support export coverage,
- sourcemap source content.

Release publishing and full lint checks must include this verifier so new elements and regenerated packages cannot silently drift from the contract.
