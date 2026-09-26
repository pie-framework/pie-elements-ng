# PIE Element Contract

This is the normative contract for publishable PIE element packages. It covers the JavaScript runtime API and the npm package surface that players, builders, and server-side tooling may rely on.

`docs/API_REFERENCE.md` provides examples and element-specific API detail. `docs/PUBLISHING.md` describes release process. When either disagrees with this document, this document is the contract.

## JavaScript Runtime Contract

### Model, Session, and Environment

Every element consumes a model, a session, and an environment object.

- The model is authored item data. It must include a stable `id` and an `element` package name such as `@pie-element/multiple-choice`.
- The session is learner response data. Its shape is element-specific. The player owns the session object it sets, and the element writes each change into that object, as the Delivery Contract below sets out.
- The environment describes mode and role. Supported modes are `gather`, `view`, `evaluate`, and `configure`; supported roles are `student` and `instructor`.

Element-specific model and session fields are part of that element's public contract once published. Breaking shape changes require normal semver treatment.

### Controller Module

Controller-bearing elements expose their controller at `@pie-element/<name>/controller`.

The required controller entry point is:

- `model(model, session, env, updateSession?)`: returns the view model used by delivery, author, or print rendering.

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
- `element.env = env`

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

Publishable packages expose generated artifacts only. Package entry points must resolve to `dist` files except for the root `controller.js` compatibility shim described below.

### Dist-Only Surface

Package `exports`, `main`, `module`, `types`, `unpkg`, and `jsdelivr` entries must point at generated `dist` artifacts. Packages must not publish or expose raw `src`, `.ts`, `.tsx`, `.svelte`, or `.svelte.ts` files as public API.

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
- The browser ESM React contract is React 18. Synced packages must not preserve
  React 16/17 compatibility shims in browser-facing dependency policy.
- `dependencies` and `peerDependencies` are install metadata only; they are not browser runtime singleton contracts.
- Browser JS output must stay within the policy size budget unless the policy is intentionally changed.
- Hosts load no element CSS. A stylesheet the bundled code imports ships beside the chunks, and
  the chunk that imports it loads it before evaluating; see
  [`PACKAGING_ARCHITECTURE.md`](PACKAGING_ARCHITECTURE.md#browser-esm-stylesheets). A stylesheet
  in `dist/browser` that no reachable module loads fails the publish check.
- Browser ESM output must not leak runtime `require` calls. The shared browser
  build may rewrite known Rolldown CJS helper calls only for the allow-listed
  interop targets documented in
  [`PACKAGING_ARCHITECTURE.md`](PACKAGING_ARCHITECTURE.md#browser-esm-commonjs-interop);
  unsupported helper targets must fail the build.

If a new dependency should become a shared browser singleton, update `tools/vite/browser-esm-policy.json`, package generation, publish checks, and `pie-players` import-map handling in the same change.

### Legacy-Compatible Print Packaging

Packages that declare `exports["./print"]` may additionally publish a second, unrelated print artifact at the package root:

- `module/print.js` (and its sourcemap `module/print.js.map`)
- any stylesheet `module/print.js` imports, which `module/print.js` loads itself as browser ESM chunks do

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

When multiple elements request different minor or patch versions of a shared singleton, the player may select the highest same-major version and report the conflict through console and instrumentation. Different major versions, or attempts to upgrade a singleton after it has already been injected, fail the load and are also reported.

### IIFE

IIFE is a legacy runtime strategy but remains supported. Builders import package exports, including `@pie-element/<name>/controller`, `@pie-element/<name>/configure` and `@pie-element/<name>/print`, and may rely on the root `controller.js`, `configure.js` and `print.js` shims for filesystem alias compatibility.

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
