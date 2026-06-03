# PIE Element Contract

This is the normative contract for publishable PIE element packages. It covers the JavaScript runtime API and the npm package surface that players, builders, and server-side tooling may rely on.

`docs/API_REFERENCE.md` provides examples and element-specific API detail. `docs/PUBLISHING.md` describes release process. When either disagrees with this document, this document is the contract.

## JavaScript Runtime Contract

### Model, Session, and Environment

Every element consumes a model, a session, and an environment object.

- The model is authored item data. It must include a stable `id` and an `element` package name such as `@pie-element/multiple-choice`.
- The session is learner response data. Its shape is element-specific and must be treated as immutable by players; emit a replacement object when it changes.
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

Published element view modules export custom element classes. They must not register tags at package import time. Runtime registration belongs to the player or host.

Players set data via properties, not attributes:

- `element.model = model`
- `element.session = session`
- `element.env = env`

Elements emit session changes as DOM events with the replacement session in `event.detail`. Authoring views may emit model changes with the replacement model in `event.detail`.

## NPM Packaging Contract

Publishable packages expose generated artifacts only. Package entry points must resolve to `dist` files except for the root `controller.js` compatibility shim described below.

### Dist-Only Surface

Package `exports`, `main`, `module`, `types`, `unpkg`, and `jsdelivr` entries must point at generated `dist` artifacts. Packages must not publish or expose raw `src`, `.ts`, `.tsx`, `.svelte`, or `.svelte.ts` files as public API.

Sourcemaps may be published, but they must include source content so consumers can debug without unpacked source files.

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

If a new dependency should become a shared browser singleton, update `tools/vite/browser-esm-policy.json`, package generation, publish checks, and `pie-players` import-map handling in the same change.

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

IIFE is a legacy runtime strategy but remains supported. Builders import package exports, including `@pie-element/<name>/controller` and `@pie-element/<name>/configure`, and may rely on the root `controller.js` and `configure.js` shims for filesystem alias compatibility.

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
