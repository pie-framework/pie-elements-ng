# PIE Elements NG

Domain language for PIE element packages: authored interaction components, their controller contracts, and the runtime surfaces consumed by PIE players.

## Language

### Elements and Authoring

**Element**:
A self-contained interaction component implementing a single QTI interaction type, exposed as a web component and a controller.
_Avoid_: Item, widget, component

**Author**:
A person who creates and configures an **Element** using the authoring surface.
_Avoid_: Item creator, content editor

**Authoring surface**:
The `configure` mode UI through which an **Author** edits an **Element**'s **Model**.
_Avoid_: Admin UI, config UI

**PRD**:
A lightweight, intent-capturing spec at `docs/prds/<slug>/PRD.md`; PRDs own what to build, while tests own behavior.
_Avoid_: Spec, requirements doc, ticket

### Core Data Shapes

**Model**:
The authored configuration of an **Element**, serialized as JSON and owned by the content platform.
_Avoid_: Question, config, item data

**Session**:
A learner's in-progress or submitted response to an **Element**; mutable during `gather` mode.
_Avoid_: Response, answer, submission

**ViewModel**:
The read-only, mode-specific projection of **Model** and **Session** computed by a **Controller** and handed to the delivery component.
_Avoid_: Derived model, view data

**Environment**:
The runtime context passed alongside a **Model** and **Session**: `mode` and `role`, plus optional flags.
_Avoid_: Env, config

**Outcome**:
The scoring result, with `score` in `[0, 1]` and an `empty` flag, produced by `controller.outcome()`.
_Avoid_: Result, grade, score object

**ValidationErrors**:
A key-to-message map returned by `controller.validate()` when a **Model** is malformed.
_Avoid_: Errors, form errors

### Controller

**Controller**:
The framework-agnostic logic layer that implements `model()`, `outcome()`, `createDefaultModel()`, `validate()`, and `createCorrectResponseSession()`.
_Avoid_: Backend, scorer, engine

**`model()`**:
The controller method that produces a **ViewModel** from a **Model**, **Session**, and **Environment**.
_Avoid_: Render, transform

**`outcome()`**:
The controller method that produces an **Outcome** from a submitted **Model** and **Session**.
_Avoid_: Score, grade, evaluate

**`createDefaultModel()`**:
The controller method that returns a safe, author-ready **Model** with sensible defaults.
_Avoid_: Default config, empty model

**`createCorrectResponseSession()`**:
The controller method that returns a **Session** in which every answer matches the authored correct answer.
_Avoid_: Correct session, answer key session

### Modes and Roles

**`gather` mode**:
The live, interactive mode in which a learner records a response; mutation of **Session** is expected.
_Avoid_: Student mode, input mode, active mode

**`view` mode**:
A read-only rendering of the **Element** with no scoring feedback, used for preview and review.
_Avoid_: Preview mode, read-only

**`evaluate` mode**:
A read-only rendering that shows the learner's submitted **Session** alongside per-answer correctness and a correct-answer reveal.
_Avoid_: Feedback mode, scoring mode

**`configure` mode**:
The authoring mode in which an **Author** edits the **Model** via the authoring surface.
_Avoid_: Author mode, edit mode

**Student**:
The learner role; interacts with an **Element** in `gather` mode.
_Avoid_: Learner as the primary term, test-taker

**Instructor**:
The privileged role that may see correct answers in `view` and `evaluate` modes.
_Avoid_: Teacher, reviewer

### Player Integration

**Player**:
The host component in `pie-players` that owns element lifecycle, registration, and **Session** persistence.
_Avoid_: Host, shell, wrapper

**Item**:
The JSON artifact the **Player** delivers to the learner: markup, **Model** array, and element map.
_Avoid_: Question, PieItem except in cross-project contexts

**Passage**:
Shared reading or visual context rendered by the **Player** alongside one or more **Items**.
_Avoid_: Stimulus except in QTI contexts, reading passage

**`session-changed` event**:
The DOM event an **Element** dispatches to notify the **Player** that its **Session** changed; the **Player** owns persistence.
_Avoid_: `pie.session_changed` in new code

**`model-set` event**:
The DOM event an **Element** dispatches after its `model` property is applied.
_Avoid_: `pie.model_set` except when discussing legacy behavior

**PNP (Personal Needs Profile)**:
The per-learner accessibility record passed to the **Player** at session start; individual elements receive accessibility flags through **Environment**.
_Avoid_: Accessibility settings, PNP record as a generic config bucket

**Tool**:
An assistive utility, such as calculator, ruler, or text-to-speech, that the **Player** provides at the assessment level.
_Avoid_: Accommodation

**Accommodation**:
An accessibility support scoped to a specific learner via the **PNP** and surfaced to elements through **Environment** flags.
_Avoid_: Tool

### Build and Delivery

**ESM bundle**:
The primary build output: standard ECMAScript modules published to npm and loadable natively by modern browsers.
_Avoid_: ES module as a vague package label, native module

**IIFE bundle**:
A self-contained `index.iife.js` output built for legacy player consumption.
_Avoid_: UMD bundle, global bundle

**Subpath export**:
A named entry in `package.json` `"exports"` that exposes a distinct build artifact, such as `./delivery`, `./controller`, or `./author`.
_Avoid_: Export path, submodule

**`pie` field**:
The `package.json` field that tells the `pie-api-aws` builder which **Controller** entry to use.
_Avoid_: Pie config, controller pointer

**Controller shim**:
A top-level `controller.js` file in the package root required for `pie-api-aws` filesystem-alias resolution.
_Avoid_: Root export shim as a general ESM export

**`pie-api-aws` builder**:
The legacy build service that produces IIFE player bundles and self-contained CommonJS controller bundles from published npm packages.
_Avoid_: Bundle builder when the specific service matters

**Shared library bundle**:
A DLL-style IIFE produced by `pie-shared-lib-builder` and loaded once by the browser so IIFE element bundles can reference large shared dependencies.
_Avoid_: DLL bundle unless discussing the builder internals

**Externalized dependency**:
A dependency deliberately excluded from an element's IIFE bundle and resolved at runtime from a **Shared library bundle** already on the page.
_Avoid_: External, excluded dependency

**Import map**:
A `<script type="importmap">` declaration that maps bare module specifiers to CDN or static package URLs.
_Avoid_: Module map

**Versioned tag name**:
The custom-element tag name encoding the element version so multiple versions of the same element can coexist on one page.
_Avoid_: Version-suffixed tag

**`PIE_REGISTRY`**:
The `window.PIE_REGISTRY` global object maintained by the **Player** to track versioned custom-element tags and associated **Controller** instances.
_Avoid_: Element registry, global registry

**`docs.contract.json`**:
The per-element `PieDocsContract` file that declares element name, framework, and per-view source pointers for static documentation generation.
_Avoid_: Docs config, element manifest

**Tree-shaking**:
Dead-code elimination performed by the ESM build toolchain.
_Avoid_: Dead-code elimination when the packaging behavior is specifically Rollup/Vite tree-shaking

**Turbo**:
The monorepo task orchestrator that runs build, test, and lint tasks across packages in dependency order with output caching.
_Avoid_: Task runner as a substitute when cache semantics matter

### Publishing and Versioning

**Changeset**:
A file-based record of a version bump and changelog entry, consumed by the Changesets release tool.
_Avoid_: Version file, changelog entry

**Patch**:
The default bump magnitude for a release; use `minor` or `major` only when explicitly requested.
_Avoid_: Bump, hotfix

**Upstream sync**:
The `upstream:*` CLI process that copies source from `../pie-elements` and `../pie-lib` into `packages/elements-react` and `packages/lib-react`.
_Avoid_: Merge, import

**Synced packages**:
The packages under `packages/elements-react/` and `packages/lib-react/` whose source is managed by **Upstream sync**.
_Avoid_: Vendored packages

## Relationships

- A **Model** is authored by one **Author** using the **Authoring surface** and versioned independently of a **Session**.
- A **Controller** produces a **ViewModel** by combining a **Model**, **Session**, and **Environment**.
- A **Controller** produces an **Outcome** from a completed **Session**; it never mutates the **Session**.
- A **PRD** specifies intent; the test suite owns behavior. If they disagree, the tests win and the PRD is updated in the same change.
- An **Element** dispatches `session-changed` to notify its **Player** of **Session** mutations; the **Player** owns persistence and never delegates that to the **Element**.
- A **Tool** is available to all learners in a session; an **Accommodation** is scoped to a specific learner via the **PNP** and reaches the **Element** through **Environment** flags.
- Each **Element** package produces both an **ESM bundle** and an **IIFE bundle**; both expose the same component class.
- The **`pie-api-aws` builder** reads the **`pie` field** to find the `./controller` **Subpath export**, then produces a self-contained CommonJS controller bundle.
- A **Versioned tag name** is assigned by the **Player**, not the **Element**; elements must never call `customElements.define()` themselves so the **Player** can coordinate the **`PIE_REGISTRY`** across the page.

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

- "item" is used loosely for both the **Element** and the **Item**. Use **Item** for the top-level content artifact; use **Element** for the interaction package. Never use "item" unqualified.
- "model" sometimes means the authored **Model** and sometimes the **ViewModel**. Reserve **Model** for the authored config and **ViewModel** for the controller output.
- "session" vs "response": in the element layer, **Session** is canonical. Avoid "response" as a substitute because it is ambiguous with HTTP responses and QTI response concepts.
- "mode" appears in both **Environment** `mode` and an **Element**'s separate `configure` mode. Be explicit about which mode you mean.
- `session-changed` vs `pie.session_changed`: the modern event name is `session-changed`; `pie.session_changed` is a legacy alias retained for backward compatibility.
- **Tool** vs **Accommodation**: both support learners, but a **Tool** is available to everyone while an **Accommodation** is scoped to a learner via **PNP**.
- "bundle" may mean **ESM bundle**, **IIFE bundle**, or **Shared library bundle**. Always qualify which bundle type you mean.
- "controller" has a package-resolution meaning in addition to the domain meaning. Qualify when the context is build pipeline resolution rather than runtime controller behavior.
