# Ubiquitous Language

## Elements and authoring

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Element** | A self-contained interaction component implementing a single QTI interaction type, exposed as a web component and a controller | Item, widget, component |
| **Author** | A person who creates and configures an **Element** using the authoring surface | Item creator, content editor |
| **Authoring surface** | The `configure` mode UI through which an **Author** edits an **Element**'s **Model** | Admin UI, config UI |
| **PRD** | A lightweight, intent-capturing spec (`docs/prds/<slug>/PRD.md`) that is the source of truth for *what* to build; tests own *behaviour* | Spec, requirements doc, ticket |

## Core data shapes

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Model** | The authored configuration of an **Element** (prompt, answer key, scoring policy, etc.) — serialised as JSON and owned by the content platform | Question, config, item data |
| **Session** | A learner's in-progress or submitted response to an **Element** — mutable during `gather` mode | Response, answer, submission |
| **ViewModel** | The read-only, mode-specific projection of **Model** + **Session** computed by a **Controller** and handed to the delivery component | Derived model, view data |
| **Environment** | The runtime context passed alongside a **Model** and **Session**: `mode` + `role`, plus optional flags | Env, config |
| **Outcome** | The scoring result (`score` in `[0, 1]`, `empty` flag) produced by `controller.outcome()` after a **Session** is submitted | Result, grade, score object |
| **ValidationErrors** | A key → message map returned by `controller.validate()` when a **Model** is malformed | Errors, form errors |

## Controller

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Controller** | The framework-agnostic logic layer that implements `model()`, `outcome()`, `createDefaultModel()`, `validate()`, and `createCorrectResponseSession()` | Backend, scorer, engine |
| **`model()`** | The controller method that produces a **ViewModel** from a **Model**, **Session**, and **Environment** | Render, transform |
| **`outcome()`** | The controller method that produces an **Outcome** from a submitted **Model** + **Session** | Score, grade, evaluate |
| **`createDefaultModel()`** | The controller method that returns a safe, author-ready **Model** with sensible defaults | Default config, empty model |
| **`createCorrectResponseSession()`** | The controller method that returns a **Session** in which every answer matches the authored correct answer | Correct session, answer key session |

## Modes and roles

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **`gather` mode** | The live, interactive mode in which a learner records a response; mutation of **Session** is expected | Student mode, input mode, active mode |
| **`view` mode** | A read-only rendering of the **Element** with no scoring feedback; used for preview and review | Preview mode, read-only |
| **`evaluate` mode** | A read-only rendering that shows the learner's submitted **Session** alongside per-answer correctness and a correct-answer reveal | Feedback mode, scoring mode |
| **`configure` mode** | The authoring mode in which an **Author** edits the **Model** via the authoring surface | Author mode, edit mode |
| **Student** | The learner role; interacts with an **Element** in `gather` mode | Learner (internal alias acceptable), test-taker |
| **Instructor** | The privileged role that may see correct answers in `view` and `evaluate` modes | Teacher, reviewer |

## Player integration

These terms describe how **Elements** built in this repo are consumed by the surrounding platform (primarily `pie-players`). An element author in this repo does not implement these; they appear in contracts the element must honour.

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Player** | The host component (ItemPlayer or SectionPlayer in `pie-players`) that owns element lifecycle, registration, and **Session** persistence; elements must not self-register their custom-element tags | Host, shell, wrapper |
| **Item** | The JSON artifact (`ConfigEntity` / `ItemEntity`) the **Player** delivers to the learner: markup + **Model** array + element map. A single **Item** may embed multiple **Elements** | Question, PieItem (acceptable in cross-project contexts) |
| **Passage** | Shared reading or visual context rendered by the **Player** alongside one or more **Items**; not a concept owned by individual elements | Stimulus (acceptable in QTI contexts), Reading passage |
| **`session-changed` event** | The DOM event (`CustomEvent<{ complete: boolean, component: string }>`) an **Element** dispatches to notify the **Player** that its **Session** has changed; the **Player** is responsible for persistence | `pie.session_changed` (a legacy alias in older elements; `session-changed` is the current standard) |
| **`model-set` event** | The DOM event an **Element** dispatches after its `model` property is applied; used by the **Player** to confirm readiness | `pie.model_set` (legacy alias) |
| **PNP (Personal Needs Profile)** | The per-learner record of accessibility **Accommodations** passed to the **Player** at session start; individual elements receive accessibility flags via **Environment** (e.g. `reducedMotion`) | Accessibility settings, PNP record |
| **Tool** | An assistive utility (calculator, ruler, text-to-speech) that the **Player** provides to all learners; configured at the assessment level, not within an individual **Element** | Accommodation (distinct: Tools are universal; Accommodations are per-learner) |
| **Accommodation** | An accessibility support scoped to a specific learner via the **PNP** (e.g. screen reader, high-contrast, extended time); surfaced to elements through **Environment** flags | Tool |
| **`pie-api-aws` builder** | The build pipeline that bundles element packages for delivery; requires a top-level `controller.js` shim in each package root for filesystem-alias resolution | Bundle builder |

## Build and delivery

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **ESM bundle** | The primary build output: standard ECMAScript modules published to npm, loadable natively by modern browsers without a bundler intermediary | ES module, native module |
| **IIFE bundle** | A self-contained Immediately Invoked Function Expression output (`index.iife.js`) built alongside the ESM bundle for legacy player consumption; attaches the element class to a named global rather than using `import` | UMD bundle, global bundle |
| **Subpath export** | A named entry in `package.json` `"exports"` that exposes a distinct build artifact (e.g. `./delivery`, `./controller`, `./author`); the **Player** and build tooling address these directly | Export path, submodule |
| **`pie` field** | The `package.json` field (`{ "controller": "@pie-element/<name>/controller" }`) that tells the `pie-api-aws` builder which subpath export is the **Controller** entry | Pie config, controller pointer |
| **Controller shim** | A top-level `controller.js` file in the package root (`export * from './dist/controller/index.js'`) required for `pie-api-aws` filesystem-alias resolution; not used by standard ESM consumers | Root export shim |
| **`pie-api-aws` builder** | The legacy build service that produces IIFE player bundles and self-contained CommonJS controller bundles from published npm packages; reads the `pie` field to locate each **Controller** | Bundle builder, bundler service |
| **Shared library bundle** | A DLL-style IIFE (`@pie-lib/<name>-module`) produced by `pie-shared-lib-builder` and loaded once by the browser; allows IIFE element bundles to reference large shared deps (e.g. MathJax) without duplicating them per element | DLL bundle |
| **Externalized dependency** | A dependency that is deliberately excluded from an element's IIFE bundle and instead resolved at runtime from a **Shared library bundle** already on the page; in ESM, the browser's module cache serves the same role | External, excluded dep |
| **Import map** | A `<script type="importmap">` declaration that maps bare module specifiers (e.g. `"@pie-lib/math-rendering"`) to CDN URLs; allows ESM elements to use standard import syntax without a bundler | Module map |
| **Versioned tag name** | The custom-element tag name encoding the element version (e.g. `multiple-choice--version-12-0-0`), generated by the **Player** via `makeUniqueTags()` to allow multiple versions of the same element to coexist on one page without `customElements` registration conflicts | Version-suffixed tag |
| **`PIE_REGISTRY`** | The `window.PIE_REGISTRY` global object maintained by the **Player** that tracks which versioned custom-element tags are loaded, loading, or have an associated **Controller** instance; necessary because `customElements` itself is global and does not store controller associations | Element registry, global registry |
| **`docs.contract.json`** | The per-element JSON file (`PieDocsContract`) that declares element name, framework, and per-view source pointers; consumed by the `docs:generate` CLI command to produce static element documentation | Docs config, element manifest |
| **Tree-shaking** | Dead-code elimination performed by the ESM build toolchain (Vite / Rollup); removes unused exports from dependencies so that only reachable code ends up in the bundle | Dead-code elimination |
| **Turbo** | The monorepo task orchestrator that runs build, test, and lint tasks across packages in dependency order with output caching | Task runner |

## Publishing and versioning

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Changeset** | A file-based record of a version bump and changelog entry, consumed by the Changesets release tool | Version file, changelog entry |
| **Patch** | The default bump magnitude for a release; use `minor` or `major` only when explicitly requested | Bump, hotfix |
| **Upstream sync** | The `upstream:*` CLI process that copies source from `../pie-elements` and `../pie-lib` into `packages/elements-react` and `packages/lib-react` | Merge, import |
| **Synced packages** | The packages under `packages/elements-react/` and `packages/lib-react/` whose source is managed by **Upstream sync**; do not edit directly | Vendored packages |

## Relationships

- A **Model** is authored by one **Author** using the **Authoring surface** and versioned independently of a **Session**.
- A **Controller** produces a **ViewModel** by combining a **Model**, **Session**, and **Environment**.
- A **Controller** produces an **Outcome** from a completed **Session**; it never mutates the **Session**.
- A **PRD** (`Proposal` or `Accepted`) specifies intent; the test suite owns behaviour — if they disagree, the test wins and the PRD is updated in the same PR.
- An **Element** dispatches `session-changed` to notify its **Player** of **Session** mutations; the **Player** owns persistence and never delegates that to the **Element**.
- A **Tool** is available to all learners in a session; an **Accommodation** is scoped to a specific learner via the **PNP** and reaches the **Element** through **Environment** flags.
- Each **Element** package produces both an **ESM bundle** (primary, for modern consumers) and an **IIFE bundle** (legacy, for the `pie-api-aws` builder); both expose the same component class.
- The **`pie-api-aws` builder** reads the **`pie` field** to find the **Controller** subpath export, then produces a self-contained CommonJS controller bundle with all dependencies inlined (no **Externalized dependencies**), while the IIFE player bundle externalizes shared deps via **Shared library bundles**.
- A **Versioned tag name** is assigned by the **Player** (not the **Element**); elements must never call `customElements.define()` themselves so the **Player** can coordinate the **`PIE_REGISTRY`** across the page.

## Example dialogue

> **Dev:** "When a learner changes their answer, what does the **Element** do?"
>
> **Domain expert:** "It updates its local **Session** and dispatches `session-changed` so the **Player** can persist it. The element never writes to storage directly."
>
> **Dev:** "Then when the assessment moves to `evaluate` mode, who calls `outcome()`?"
>
> **Domain expert:** "The **Player** calls `controller.outcome()` with the stored **Session**. The **Controller** returns an **Outcome** — a score in `[0, 1]` and an `empty` flag. The **Player** then sets the element's **Environment** to `evaluate` mode, and the element re-renders by calling `controller.model()` to get a new **ViewModel** that includes correctness state."
>
> **Dev:** "Does the element ever know about the **Passage** rendered next to it?"
>
> **Domain expert:** "No — **Passage** rendering is entirely the **Player**'s concern. The element only sees its own **Model** and **Session**. If an accessibility flag comes from the learner's **PNP** (say, `reducedMotion`), the **Player** maps it into the **Environment** before calling the **Controller**."

## Flagged ambiguities

- **"item"** is used loosely for both the **Element** (the `@pie-element/*` package) and the **Item** (the JSON artifact a **Player** delivers). Use **Item** for the top-level content artifact; use **Element** for the interaction package. Never use "item" unqualified.
- **"model"** is overloaded: sometimes it means the authored **Model** (the JSON config), sometimes the **ViewModel** (the controller output). Reserve **Model** for the authored config and **ViewModel** for the controller output.
- **"session"** vs **"response"**: in the element layer "session" is canonical (the `PieSession` interface). Avoid "response" as a substitute — it is ambiguous with HTTP response and QTI response concepts. In the player layer, "session" may also refer to the full assessment session; qualify with "element session" or "assessment session" when the context is ambiguous.
- **"mode"** appears in two contexts: the **Environment** `mode` field (`gather | view | evaluate`) and an **Element**'s separate `configure` mode. Both are legitimately "modes" but `configure` mode is not part of `PieEnvironment.mode`; it is a UI concern of the authoring surface. Be explicit about which mode you mean.
- **`session-changed` vs `pie.session_changed`**: the modern event name is `session-changed` (from `@pie-element/shared-player-events`); `pie.session_changed` is the legacy alias retained for backward compatibility. New elements dispatch `session-changed`; do not use the legacy form in new code.
- **"Tool" vs "Accommodation"**: both support learners, but a **Tool** is available to everyone (calculator, ruler, text-to-speech) while an **Accommodation** is scoped to a specific learner via the **PNP**. Never treat them as synonyms; the distinction matters for both configuration placement and WCAG compliance reasoning.
- **"bundle"** is ambiguous: it may mean the **ESM bundle** (the `dist/` output consumed by npm / browsers natively), the **IIFE bundle** (`index.iife.js` for legacy players), or the **Shared library bundle** (DLL-style module loaded by the IIFE player). Always qualify which bundle type you mean.
- **"controller"** has a package-resolution meaning in addition to the domain one: the **`pie` field** points to the `./controller` **Subpath export**, and the **Controller shim** (`controller.js`) is a filesystem alias shim for the `pie-api-aws` builder. Neither is the same as calling the **Controller**'s methods at runtime. Qualify when the context is the build pipeline rather than runtime logic.
