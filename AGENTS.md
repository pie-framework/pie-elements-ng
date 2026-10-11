# PIE Elements NG - Project Instructions

This file is the single project guidance entry point for agent tools: the project brief, the canonical rules, and the inventory of project skills. Any harness that needs project rules reads it. One that cannot gets a pointer file, never a copy, because copies drift silently until two agents give contradictory answers. `.claude/CLAUDE.md` is that pointer for Claude Code.

## Project Context

**PIE Elements NG** is a next-generation rewrite of the PIE elements framework using a unified component architecture. Each element is a single package handling all modes (controller, student, preview, evaluation, authoring) instead of three separate packages.

Use [`CONTEXT.md`](CONTEXT.md) as the canonical domain-language glossary. When naming model/session/controller concepts or writing PRDs, prefer those terms and update `CONTEXT.md` when a durable term is resolved.

**Critical Requirements**:

- **WCAG 2.2 Level AA** for all interaction components.
- **Bun 1.3.11+** is the primary runtime; Node.js 20+ is supported.
- **Svelte 5 with runes** for the elements written here, compiled to native custom elements; the React 18 elements ported from pie-elements ship as custom elements too.
- **Feature parity**: Must match all 21 QTI 2.2 interaction types from original pie-elements.
- **Strict TypeScript** (`strict` in `tsconfig.base.json`): no `any` allowed.

Stack, with exact versions in `package.json`: Vite 8 and Turbo 2; Vitest 4 and Playwright with `@axe-core/playwright`; Biome 2, which replaces ESLint and Prettier; TipTap 3; MathJax 4.1.3, loaded at runtime by `@pie-element/shared-math-rendering-mathjax`, and MathQuill for math input.

## Spec-driven workflow (PRDs)

Significant changes get a lightweight PRD (Product Requirements Document) at `docs/prds/<slug>/PRD.md`. A PRD captures a feature's intent; the test suite remains the source of truth for its behaviour. A task needs one when it adds an element (a net-new `@pie-element/*` package or a substantial new interaction type), extends one non-trivially (an authoring-visible config, a new mode or a materially new delivery surface), changes model/session/event contracts across several elements, or shifts how authors compose item content. Bug fixes, behaviour-neutral refactors, demo-app and e2e tweaks, docs, version bumps and dependency updates need only a PR description, and a documentation-only change needs no PR ([Documentation-only changes](#documentation-only-changes)).

[`docs/prds/README.md`](docs/prds/README.md) owns the bar, the layout and facet files, the status vocabulary and status log, what a PRD leaves out, wireframes, open questions and the rules for keeping PRDs short. [`docs/prds/venn-classification/PRD.md`](docs/prds/venn-classification/PRD.md) is the canonical example for length and tone.

**Working with a PRD in this codebase**:

1. If a PRD exists for the task, read `PRD.md` first at the start of the session, and the `delivery.md` / `authoring.md` / `print.md` facet files whose concern the task touches. Treat its "Proposed surface" as the starting contract and do not silently substitute alternatives. A **Proposal**'s surface is not fixed yet: surface disagreement instead of implementing against it.
2. If you propose changing the contract during implementation, surface it explicitly in the PR description and update the relevant section of the PRD in the same change, inline.
3. If a task meets the bar and has no PRD, draft one from `docs/prds/_template.md` into `docs/prds/<slug>/PRD.md`; do not start implementation against an undocumented surface.
4. Never add owner or date fields, or a dated decision log, even when a template you have seen elsewhere includes them. The why-not-the-obvious-alternative goes inline next to its Non-goal or Proposed-surface bullet.

## Legacy Repositories

`pie-elements` and `pie-lib` are legacy. This repo is the source of truth for `packages/elements-react/*` and `packages/lib-react/*`: fixes are made and published here, and no tooling copies code in from the legacy repos. A fix that exists only in a legacy repo is ported by hand.

The legacy repos take no further work. A defect that also lives in a legacy copy is fixed here only: do not change the legacy repo, and do not propose a follow-up, task or ticket for it.

### React package invariants

- Every `packages/elements-react/*` package declares `react` and `react-dom` in
  `dependencies` at a caret range on `sharedDependencyVersions` in
  `tools/vite/browser-esm-policy.json`, and never in `peerDependencies`. A React peer lets
  pnpm and yarn bind the element to the host's React, so a React 19 host would run the
  element's React 18 build on React 19. Legacy webpack bundlers (`builder.pie-api.com`)
  install `dependencies` and never peers, so without the dependency `node_modules/react` is
  absent and every `@mui` / `@emotion` / `@dnd-kit` peer fails with
  `Module not found: Can't resolve 'react'`.
- Library packages (`@pie-lib/*`, `@pie-element/shared-*`) keep React peer-only. The
  consuming element owns the installable pin.

`bun run check:publish-surface` enforces both. It runs inside `bun run lint:all` and
`release:publish` (through `verify:element-contracts`), and in no CI job before release. After
changing these packages, re-verify behavior in `apps/element-demo` and run:

```bash
bun run verify:element-contracts
bun run lint:all && bun run test
```

## Shared Infra Guardrails

Shared infrastructure stays generic. Do not introduce element-specific or package-specific workarounds in:

- `packages/shared/bundler-shared/**`
- `packages/element-player/**`
- shared runtime infrastructure used across elements

Prefer generic fixes that apply by pattern or capability: resolver rules, transforms, compatibility hooks. If a problem affects several elements, fix it in the shared infrastructure instead of adding one-off aliases for a single package.

Only add a package-specific exception when the user explicitly requests a temporary workaround. Mark it temporary, explain exit criteria, and remove it once a generic fix exists.

## Monorepo Structure

```text
pie-elements-ng/
├── packages/
│   ├── elements-react/           # 27 React elements ported from pie-elements, owned here
│   ├── elements-svelte/          # Svelte elements written here: mc-populated-blank, simple-cloze,
│   │                             #   venn-classification, video-stimulus
│   ├── lib-react/                # @pie-lib/* React libraries ported from pie-lib, owned here
│   ├── lib-svelte/               # Svelte libraries: config-ui, delivery-events, editable-html-tiptap, media
│   ├── shared/                   # @pie-element/shared-* (types, controller-utils, math-rendering-mathjax,
│   │                             #   editor-runtime, theming, ...), element-bundler, @pie-lib/translator
│   ├── element-player/           # @pie-element/element-player
│   ├── element-theme/            # @pie-element/element-theme
│   └── element-theme-daisyui/    # @pie-element/element-theme-daisyui
├── apps/                         # Demo and test apps, see apps/README.md
└── tools/
    ├── cli/                      # oclif CLI, see CLI Tools
    └── vite/                     # Shared Vite configs and browser-esm-policy.json
```

## Code Quality Standards

**After completing each feature or fix**:

1. Run Biome with auto-fix: `bun run lint:fix`.
2. Type-check each package you changed: `bunx tsc --noEmit -p packages/<group>/<name>`. The root `tsconfig.json` has no inputs, so `bunx tsc --noEmit` at the root checks nothing.
3. Fix all errors and warnings before marking the task as complete.

No Svelte type check runs in the build, the hooks or CI; the `.ts` files of Svelte packages are type-checked by their build's `tsc` step.

**Before any merge request**:

1. Biome, the Svelte `tag:` check and the element contracts pass: `bun run lint:all`
2. Dependency integrity holds: `bun run verify:dependency-integrity --fail-on-hoist`
3. The build passes: `bun run build`. Each package's build runs `tsc`, so this is the type check across all packages.
4. All tests pass: `bun run test` (Vitest; `bun test` starts Bun's own test runner instead)
5. E2E tests pass: `bun run test:e2e`. CI runs them only on manual dispatch.
6. Accessibility tests pass: `bun run test:a11y`. CI runs them on every pull request without blocking the merge.

The lefthook pre-commit hook runs `lint:fix`, `scripts/type-check-staged.mjs` and step 2. The pre-push gate (`scripts/pre-push-gate.mjs`) runs steps 2 to 4, adding `--check-peer-gaps --fail-on-peer` to step 2. CI runs `bun run lint` (step 1 without the element contracts) with `verify:no-local-paths` and `check:repository-metadata`, then steps 2 to 4.

### Documentation-only changes

A change made only of documentation gets no Jira ticket and no branch or pull request of its own. `scripts/lib/change-scope.mjs` defines documentation: `docs/` except the files a test reads, Markdown at the root, `.claude/` and `.agents/`. Package READMEs and changesets are not documentation.

- Commit it to `develop` and push. The pre-push gate skips such a push, and CI on `develop` runs only `lint` for it.
- When a review is wanted, collect the pending documentation in one `docs/` branch and merge it as one pull request. CI runs only `lint` for it.
- A documentation edit that belongs to a code change stays in that change's branch.

## Testing Strategy

- **Unit tests**: Vitest with the happy-dom environment
- **Component tests**: Testing Library (Svelte + React variants)
- **E2E tests**: Playwright with accessibility checks
- **Player evals**: Playwright suites in `apps/esm-player-test/tests/evals`
- **Coverage**: HTML/JSON/text reports via the V8 provider (`bun run test:coverage`)

**Test dimensions**, the coverage checklist the `pie-element-author` skill applies:

1. Rendering accuracy
2. User interactions
3. Accessibility compliance
4. State management
5. Scoring correctness
6. Browser compatibility
7. Performance
8. Configuration validation
9. Error handling
10. Test coverage

## Unified Component Architecture

[`docs/PIE_ELEMENT_CONTRACT.md`](docs/PIE_ELEMENT_CONTRACT.md) specifies the model, session and environment, the controller module, and the custom-element runtime.

### Entry Points per Element

Each element package exports these entry points:

- `.` and `./delivery` - the delivery custom element
- `./author`, with `./configure` as an alias - the author view custom element
- `./controller` - the PIE controller, for server and client
- `./print` - the print view, where the element has one
- `./browser/*` - self-contained browser ESM builds of the same entries
- `./runtime-support` - which views the package supports under browser ESM, where it declares them

### PIE Controller Pattern

Controllers must implement:

- `model()` - Generate view model from question/session/environment
- `outcome()` - Calculate score and provide feedback
- `createDefaultModel()` - Default configuration
- `validate()` - Validate configuration
- `createCorrectResponseSession()` - Generate correct answer

### Mode-Based Rendering

The environment's mode selects how a delivery element renders:

- `gather` - Student interaction mode (answer collection)
- `view` - Read-only preview
- `evaluate` - Scoring and feedback display

Authoring is the separate author custom element (`./author`) and has no mode.

## Build System

- **Vite**: each package's `build` script runs the lanes it has (Node/builder ESM, browser ESM, the browser editor-runtime variant, legacy print, IIFE), most from shared configs in `tools/vite` ([Build Pipeline](docs/PACKAGING_ARCHITECTURE.md#build-pipeline))
- **Turbo**: Task orchestration with dependency ordering
- **TypeScript**: Declaration file generation (`--emitDeclarationOnly`)

**Build commands**:

```bash
bun run build          # Build all packages (Turbo); each package's tsc step type-checks it
bun run dev            # Watch mode
```

## Special Patterns

### Web Components and Reactivity

Versioned `pie-*--version-*` tag names are authored content contracts. A `CustomElementRegistry` definition cannot be replaced, so each simultaneously loaded version registers under its own distinct tag. A private child tag an element defines itself carries its owning package version (a `--version-<encoded>` suffix), uses the same scoped name for registration and rendering, and is defined behind a `customElements.get` guard ([Custom Element Runtime](docs/PIE_ELEMENT_CONTRACT.md#custom-element-runtime)).

- Treat custom elements as imperative APIs: set properties, not attributes.
- Element package modules must not register the element's own tag: no `customElements.define(...)` for it in `index.ts` or the `delivery`, `author` and `print` entries. The exception is the standalone per-element IIFE script. The React elements' `src/index.iife.ts` registers the tag behind a `customElements.get` guard, because a page that loads `dist/index.iife.js` with a `<script>` tag has no player to do it. The Svelte `index.iife.ts` entries export the class only. At publish, `scripts/changeset-publish-resolved-workspaces.mjs` refuses a Svelte element whose dist calls `customElements.define(`.
- Custom element registration is the responsibility of PIE item/element players, which own lifecycle and registry coordination.
- In Svelte custom-element components (`<svelte:options customElement={...}>`), never include `tag: '...'`. Svelte will auto-define that tag at module evaluation time, which conflicts with player-controlled registration and causes `CustomElementRegistry` duplicate-name errors. `bun run lint` fails on it (`scripts/verify-no-svelte-custom-element-tag.mjs`).
- Do not assume attribute updates are reactive for object data.
- For model/session updates, reassign new objects when needed to trigger updates.
- When using controller-based elements, rebuild and re-set the element model on mode/session changes.
- Avoid reactive loops when the controller updates the session: guard against re-setting identical session objects.

### PIE API AWS Builder Controller Compatibility

- The `pie-api-aws` bundle builder may resolve `@pie-element/<name>/controller` via filesystem aliases during client/editor bundling.
- If an element declares `package.json` `pie.controller` as `@pie-element/<name>/controller`, include a top-level `controller.js` shim in the package root:
  - `export * from './dist/controller/index.js';`
- Ensure that shim is published by including `"controller.js"` in `package.json` `files`.
- Keep `exports["./controller"]` and `exports["./controller.js"]` pointing at `./dist/controller/index.js` for standard ESM consumers; the root shim exists only for builder compatibility.
- Packages that export `./configure`, `./author` or `./print` publish the matching root shim (`configure.js`, `author.js`, `print.js`) the same way: it re-exports the default and named exports of that subpath's `./dist/...` target and is listed in `files`. Composite elements depend on `author.js`: complex-rubric imports `@pie-element/rubric/author` and ebsr imports `@pie-element/multiple-choice/author`.
- `bun run check:publish-surface` enforces all four shims.

### Browser ESM Packaging

- Player-facing browser ESM is static package files: a package that supports it exports `./browser/<view>` at `./dist/browser/<view>/index.js`, which pie-players loads directly, with no CDN package transform such as jsDelivr `+esm`.
- `tools/vite/browser-esm-policy.json` governs browser ESM externals. Adding a shared external updates that policy and pie-players' import-map generation together; a dependency the policy does not list stays bundled.

The contract's [Browser ESM Packaging](docs/PIE_ELEMENT_CONTRACT.md#browser-esm-packaging) specifies the surface.

### Framework Agnostic

- Every element is a custom element, usable in any framework
- React elements use Material UI + React JSS
- Svelte elements use Svelte 5 runes

### Math And Rich Text

- **MathJax 4**: Math rendering with hidden MathML for screen readers ([MATH-RENDERING.md](docs/MATH-RENDERING.md))
- **MathQuill**: Interactive math input (`@pie-lib/math-input`)
- **TipTap 3** on ProseMirror (`@pie-lib/editable-html-tip-tap`): rich text with a configurable toolbar and extensions, its math extension rendering through MathJax
- **DOMPurify**: sanitizes authored model HTML (`@pie-element/shared-utils`)

### Accessibility First

- Axe-core integration in Playwright tests
- Focus management and keyboard navigation
- Screen reader support verified

### Host Accessibility Settings

Elements, and the modules they run such as the MathJax adapter, follow pie-players
[ADR 0003](https://github.com/pie-framework/pie-players/blob/develop/docs/adr/0003-elements-read-accessibility-settings-from-a-host-neutral-context.md)
when they read the student's accessibility settings. No element does yet: the accessibility review
of 2026-10-05 kept `mathml` for every student, and the provider ships with its first consumer.

- An element learns the student's accessibility settings only from the
  `Symbol.for("pie.accessibility")` context, whose key and type `@pie-players/pie-context` exports
  with the first consumer, and never imports `@pie-players/pie-assessment-toolkit`. A setting that
  changes rendering travels through that context; `env` keeps the settings that change the model.
- The mapping from a profile to support ids lives in the host, which resolves it through the
  toolkit's policy precedence. An element maps a fixed support id to a fixed behaviour, because
  item configs pin element versions and a rule inside an element is frozen into each of them.
- The context value only grows: fields are added, never removed or redefined. Consumers ignore
  support ids they do not recognize, and an unanswered request means defaults, never a wait for a
  provider.

### Accessibility Scenario Suite

When working under `apps/element-a11y-demo/src/lib/a11y/**`, `apps/element-a11y-demo/test/a11y/**`, `apps/element-a11y-demo/src/lib/samples/**`, or `docs/a11y/**`:

- Use `.claude/skills/accessibility-reviewer-assessments/SKILL.md` for the detailed assessment-specific checklist.
- Prefer dedicated a11y scenarios in `apps/element-a11y-demo/src/lib/a11y/scenarios/catalog.ts` over broad demo inventory coverage.
- Keep automated scope explicit: document Axe-covered checks, custom Playwright checks, manual-only concerns, and unclear gaps in `docs/a11y/`.
- Add reusable checks in `apps/element-a11y-demo/test/a11y/axe-scenarios.spec.ts` only when the concern applies across multiple elements.
- Fixes in `packages/elements-react/*` or `packages/lib-react/*` are made in this repo; see [Legacy Repositories](#legacy-repositories).

### Drag-and-Drop

- @dnd-kit for accessible drag-and-drop
- Sortable and core packages
- Touch-friendly interactions

## CLI Tools

The oclif CLI in `tools/cli` runs as `bun run cli <command>`:

- `dev:demo` - the unified demo app for all elements (`apps/element-demo`); `bun run dev:demo` runs it
- `dev:test-bundler` - tests the PIE bundler service with local workspace packages
- `docs:generate`, `docs:verify` - generate, or check the freshness of, the HTML docs artifacts built from per-element docs contracts
- `packages:enable-publishing` - clears `private` flags and Changesets ignore entries
- `verify:controllers` - checks that element packages publish controller modules correctly
- `verify:dependency-integrity` - classifies transitive, hoist-reliant, broken and missing-peer dependency resolution; `bun run verify:dependency-integrity` runs it
- `verify:react-build` - verifies React element builds

## Publishing & Versioning

[`docs/PUBLISHING.md`](docs/PUBLISHING.md) owns the release flow: Changesets, `next` snapshots
from `develop` selected per package from npm's `gitHead`, a `.changeset/pr-<n>.md` that CI records
for every merged PR, and `latest` from `master` through a "Version Packages" PR followed by a
`master` -> `develop` back-merge. The binding rules:

- **Versions only on `master`** (PIE-1121). Never put prerelease versions or
  `.changeset/pre.json` back on `develop`: a `develop` -> `master` merge would carry them to
  `master`, whose stable publish rejects them.
- **Snapshot selection is measured from npm, per package.** Do not reintroduce a push-range or
  repo-wide "last release commit" baseline: both drop work silently (PIE-1073).
- **Merge the back-merge PR before the next `develop` -> `master` merge**, or consumed changesets
  come back and are applied twice.
- **Default bump policy**: `patch`. Use `minor` or `major` only when the user explicitly requests
  it. A changeset added in the PR keeps its bump type and summary over the recorded one; write
  one whenever the change deserves more than its PR title or a `minor`/`major` bump.
- **Non-shipping paths do not release**: changes confined to tests, specs, snapshots and
  package-local vitest/playwright config select nothing and record no changeset. Private
  packages and `.changeset/config.json`'s `ignore` list are never selected.
- **Selective publish only**: publish only selected packages and changeset-propagated
  dependents, never all unpublished packages.
- **Manual npm publish command**: always `sh scripts/publish-with-env-token.sh --packages <pkg1,pkg2>`
  (single package: `--packages @pie-element/<name>`), never a raw `npm publish`, so package
  selection and token auth are handled consistently.
- **Independent versions (current policy)**: packages version independently, with no
  workspace-wide lockstep assumption.

Workflows: `ci.yml` (pushes and PRs), `a11y.yml` (PRs), `e2e.yml` and `iife-tests.yml`
(manual dispatch), `record-changeset.yml` (pushes to `develop`), `release.yml` (pushes to
`master` and `develop`), `pages.yml` and `pr-notifications.yml`.

## Skills

Canonical project skills live in `.claude/skills/`:

- `accessibility-reviewer-assessments` — WCAG 2.2 AA and assessment-specific accessibility
  review of test-taking interfaces.
- `conversation-to-prd` — turns a conversation, feature discussion or implementation plan into
  a draft PRD under `docs/prds/`; user-invoked only.
- `pie-controller-reviewer` — reviews a controller for correctness, scoring accuracy and contract
  compliance.
- `pie-element-author` — implements a new element or a non-trivial extension end to end, from
  PRD review through tests.
- `pie-prd-author` — drafts or updates a PRD following `docs/prds/README.md`.

## Current Work Focus

**Goal**: Achieve feature parity with original pie-elements (21 QTI 2.2 interaction types).

**Progress**:

- Svelte: 4 elements implemented
- React: 27 elements implemented

Maintain strict accessibility compliance and comprehensive test coverage as you implement remaining elements.
