# PIE Elements NG - Project Instructions

## Project Context

**PIE Elements NG** is a next-generation rewrite of the PIE elements framework using a unified component architecture. Each element is a single package handling all modes (controller, student, preview, evaluation, authoring) instead of three separate packages.

Use [`CONTEXT.md`](CONTEXT.md) as the canonical domain-language glossary. When naming model/session/controller concepts or writing PRDs, prefer those terms and update `CONTEXT.md` when a durable term is resolved.

**Critical Requirements**:

- **WCAG 2.2 Level AA compliance**: Mandatory for all interaction components
- **Bun runtime**: Node.js is supported but Bun 1.3.11+ is primary
- **Svelte 5 with runes**: Modern reactive patterns required
- **Feature parity**: Must match all 21 QTI 2.2 interaction types from original pie-elements
- **Strict TypeScript**: No `any` allowed (enforced by Biome)

## Spec-driven workflow (PRDs)

This project uses lightweight PRDs (Product Requirements Documents) under [`docs/prds/`](docs/prds/) for significant changes. PRDs capture the *intent* of a feature; the test suite remains the source of truth for *behaviour*.

**When a task has or needs a PRD**:

- New elements (net-new `@pie-element/*` packages or substantial new interaction types).
- Non-trivial extensions of existing elements (anything that adds an authoring-visible config, a new mode, or a materially new delivery surface).
- Cross-cutting platform changes that touch model / session / event contracts across multiple elements (e.g. shared-stimulus container, parameterized items, event consistency work).
- Authoring-surface changes that shift how authors compose item content.

**When a task does not need a PRD**:

- Bug fixes, refactors with no behaviour change, demo-app or e2e-test tweaks, pure docs / README changes, version bumps and dependency updates. A PR description is enough.

**PRD layout in this repo**:

- One subdirectory per element or feature: `docs/prds/<slug>/`.
- The PRD body is `PRD.md` inside that subdirectory. The filename is explicit about the content and doesn't overload "README" with two meanings (the folder-level `docs/prds/README.md` is the conventions doc). Trade-off: GitHub / Cursor won't auto-render the directory to the PRD — that's accepted.
- Optional sibling folders — `wireframes/`, `examples/`, `notes/` — hold supporting artifacts. Most PRDs stay as a single `PRD.md`; only add siblings when there is real content for them.
- Facet files — `delivery.md`, `authoring.md`, `print.md` — are only introduced when a facet outgrows `PRD.md` (~two screens of element-specific markdown). The default is a single `PRD.md` covering all facets; don't split pre-emptively. When split, the model / session / event shape still lives in `PRD.md`, never duplicated into a facet file.
- The copy-paste starter is `docs/prds/_template.md` (a single top-level file, not a subdir).

**PRDs are functional, not project-managed**:

PRDs in this repo capture **status, what we're building, what we're deliberately leaving out, the delivered surface, a worked example, and accessibility**. They deliberately **do not** include:

- Owner, created-date, last-updated-date fields (git already tracks this).
- A separate dated decision log.

The information a decision log would carry — *why didn't we do the obvious alternative?* — is preserved by **inlining** it next to the relevant Non-goal or Proposed-surface bullet (e.g. "Not an extension of `categorize` — the overlap region is a first-class zone `categorize` can't represent …"). This keeps rationale co-located with the content it justifies and prevents drift.

Do not re-add owner / date fields to PRDs even if a template you've seen elsewhere includes them.

**Status field** (present on every PRD, inline in the meta line under the H1):

- **Proposal** — circulating for review; surface may still change. Agents reading a Proposal must not treat the "Proposed surface" as fixed; surface disagreement rather than silently implement against it.
- **Accepted** — agreed contract; safe to code against regardless of whether implementation is complete, in flight, or not yet started.
- **Superseded** — replaced by another PRD; the status line links to the replacement.

There is no `Shipped` status — once Accepted, tests own behaviour and release tags / CHANGELOG own release state.

**Status log (optional)** — when a PRD transitions between status values, add a one-line entry to a `## Status log` section at the bottom. State transitions only, not content churn (git shows content changes). No dates (git has them). A fresh Proposal with no transitions does not need this section.

**Working with a PRD in this codebase**:

1. If a PRD exists for the task (`docs/prds/<slug>/PRD.md`, plus any `delivery.md` / `authoring.md` / `print.md` facet files), read `PRD.md` first at the start of the session; read the facet files too if the task touches their concern. Treat the "Proposed surface" section of `PRD.md` as the starting contract — do not silently substitute alternatives.
2. If you propose changing the contract during implementation, surface it explicitly in the PR description and update the relevant section of the PRD in the same change (inline, not as a log entry).
3. If a PRD does *not* exist for a task that meets the "needs a PRD" bar above, draft one from `docs/prds/_template.md` into `docs/prds/<slug>/PRD.md`; do not start implementation against an undocumented surface.
4. Wireframes belong under `docs/prds/<slug>/wireframes/` (or another path under that PRD directory); link them from `PRD.md` with a repo-relative path rather than duplicating large images elsewhere, unless the PRD-specific wireframe intentionally diverges.
5. Use the PRD's "Open questions" list for genuinely-undecided items. When a question is resolved, *remove* the bullet and inline the resolution into the relevant functional section — do not keep a "resolved" list.

**Keeping PRDs healthy in an LLM-in-the-loop workflow**:

- **Keep them short** — one screen of markdown. Do not auto-expand sections that add no information.
- **Lean on examples and non-goals** rather than long acceptance-criteria lists. A worked example plus an explicit "Non-goals" list constrains agent behaviour better than dense prose.
- **Inline the *why-we-didn't-do-the-obvious-alternative*** next to the relevant Non-goal or field. That's where rationale lives in this repo.
- **Skip full TypeScript signatures inside PRDs** — sketch model/session shape in 4-6 fields; full TS lives in code, where it can stay accurate.
- **Resist generic boilerplate sections** (Performance, Security, etc.) unless there is element-specific content for them. A short PRD with only true claims beats a long PRD that pads with truisms.

See [`docs/prds/README.md`](docs/prds/README.md) for the full conventions and [`docs/prds/venn-classification/PRD.md`](docs/prds/venn-classification/PRD.md) for the canonical example PRD that anchors the expected length and tone.

## Legacy Repositories

`pie-elements` and `pie-lib` are legacy. This repo is the source of truth for `packages/elements-react/*` and `packages/lib-react/*`: fixes are made and published here, and no tooling copies code in from the legacy repos. A fix that exists only in a legacy repo is ported by hand.

Source files in those packages that still carry an "automatically synced from pie-elements" header are ordinary source. Edit them directly.

### React package invariants

Enforced by `check:publish-surface`.

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

After changing these packages, re-verify behavior in `apps/element-demo` and run:

```bash
bun run verify:element-contracts
bun run lint:all && bun run test
```

## Shared Infra Guardrails

Shared infrastructure must stay generic. Do not introduce element-specific or package-specific workarounds in:

- `packages/shared/bundler-shared/**`
- `packages/element-player/**`
- shared runtime infrastructure used across elements

Prefer generic fixes that apply by pattern or capability: resolver rules, transforms, compatibility hooks. If a problem affects several elements, fix it in the shared infrastructure rather than adding one-off aliases for a single package.

Only add a package-specific exception when the user explicitly requests a temporary workaround. Mark it temporary, explain exit criteria, and remove it once a generic fix exists.

## Technology Stack

Exact versions live in `package.json`; the majors are:

- **Runtime**: Bun 1.3.11+ (Node.js 20+ also supported)
- **UI Framework**: Svelte 5 for elements written here, React 18 for the elements that began as pie-elements ports; every element ships as a custom element
- **Build**: Vite 8 with Turbo 2 for monorepo orchestration
- **Testing**: Vitest 4 (unit/component) + Playwright (E2E)
- **Accessibility**: @axe-core/playwright for automated checks
- **Linting**: Biome 2 (replaces ESLint/Prettier)
- **Rich Text**: TipTap 3 with a math extension
- **Math Rendering**: MathJax 4.1.3, loaded at runtime by `@pie-element/shared-math-rendering-mathjax`; MathQuill for math input

## Monorepo Structure

```text
pie-elements-ng/
├── packages/
│   ├── elements-react/           # 27 React elements ported from pie-elements, owned here
│   ├── elements-svelte/          # Svelte elements written here: mc-populated-blank, simple-cloze, venn-classification
│   ├── lib-react/                # @pie-lib/* React libraries ported from pie-lib, owned here
│   ├── lib-svelte/               # Svelte libraries: config-ui, delivery-events, editable-html-tiptap
│   ├── shared/                   # @pie-element/shared-* (types, controller-utils, math-rendering-mathjax,
│   │                             #   editor-runtime, theming, ...), element-bundler, @pie-lib/translator
│   ├── element-player/           # @pie-element/element-player
│   ├── element-theme/            # @pie-element/element-theme
│   └── element-theme-daisyui/    # @pie-element/element-theme-daisyui
├── apps/                         # Demo and test apps, see apps/README.md
└── tools/
    ├── cli/                      # oclif CLI: dev:demo, docs, verification
    └── vite/                     # Shared Vite configs and browser-esm-policy.json
```

## Code Quality Standards

**After completing each feature or fix**:

1. Run Biome with auto-fix: `bun run lint:fix` or `npx @biomejs/biome check --write .`
2. Run TypeScript type checking: `bunx tsc --noEmit`
3. Run Svelte type checking: `bunx svelte-check` (from `apps/element-demo`)
4. Fix all errors and warnings before marking the task as complete

These checks ensure:

- Code follows project style standards
- No type errors are introduced
- Svelte components are valid and type-safe
- Changes don't break existing functionality

**Before any merge request**:

1. TypeScript compilation passes: `bun run typecheck`
2. Svelte components validated: `bun run check`
3. All tests pass: `bun test`
4. E2E tests pass: `bun run test:e2e`
5. Accessibility tests pass (axe-core)
6. Biome linting clean: `bun run lint`
7. Coverage meets thresholds (V8 provider)

## Testing Strategy

- **Unit tests**: Vitest with happy-dom environment
- **Component tests**: Testing Library (Svelte + React variants)
- **E2E tests**: Playwright with accessibility checks
- **Evaluation system**: YAML-driven comprehensive testing (10 dimensions)
- **Coverage**: HTML/JSON/text reports via V8 provider

**Test dimensions** (evaluation system):

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

Components handle multiple modes:

- `gather` - Student interaction mode (answer collection)
- `view` - Read-only preview
- `evaluate` - Scoring and feedback display
- `configure` - Author editing/configuration

## Build System

- **Vite**: Bundles each element with three entry points
- **Turbo**: Task orchestration with dependency ordering
- **TypeScript**: Declaration file generation (`--emitDeclarationOnly`)

**Build commands**:

```bash
bun run build          # Build all packages (Turbo)
bun run dev            # Watch mode
bun run typecheck      # Type checking
bun run check          # Svelte component validation
```

## Special Patterns

### Web Components and Reactivity

- Treat custom elements as imperative APIs: set properties, not attributes.
- Element package modules must not register the element's own tag: no `customElements.define(...)` for it in `index.ts` or the `delivery`, `author` and `print` entries. The exception is the standalone per-element IIFE script. The React elements' sync-generated `src/index.iife.ts` registers the tag behind a `customElements.get` guard, because a page that loads `dist/index.iife.js` with a `<script>` tag has no player to do it. The Svelte `index.iife.ts` entries export the class only.
- Custom element registration is the responsibility of PIE item/element players, which own lifecycle and registry coordination.
- In Svelte custom-element components (`<svelte:options customElement={...}>`), never include `tag: '...'`. Svelte will auto-define that tag at module evaluation time, which conflicts with player-controlled registration and causes `CustomElementRegistry` duplicate-name errors.
- Do not assume attribute updates are reactive for object data.
- For model/session updates, reassign new objects when needed to trigger updates.
- When using controller-based elements, rebuild and re-set the element model on mode/session changes.

### PIE API AWS Builder Controller Compatibility

- The `pie-api-aws` bundle builder may resolve `@pie-element/<name>/controller` via filesystem aliases during client/editor bundling.
- If an element declares `package.json` `pie.controller` as `@pie-element/<name>/controller`, include a top-level `controller.js` shim in the package root:
  - `export * from './dist/controller/index.js';`
- Ensure that shim is published by including `"controller.js"` in `package.json` `files`.
- Keep `exports["./controller"]` and `exports["./controller.js"]` pointing at `./dist/controller/index.js` for standard ESM consumers; the root shim exists only for builder compatibility.
- Packages that export `./configure`, `./author` or `./print` publish the matching root shim (`configure.js`, `author.js`, `print.js`) the same way: it re-exports the default and named exports of that subpath's `./dist/...` target and is listed in `files`. Composite elements depend on `author.js`: complex-rubric imports `@pie-element/rubric/author` and ebsr imports `@pie-element/multiple-choice/author`.
- `bun run check:publish-surface` enforces all four shims.

### Framework Agnostic

- Can be used as web components in any framework
- React elements use Material UI + React JSS
- Svelte elements use Svelte 5 runes
- Web Components planned for maximum portability

### Math Support

- **MathJax 4**: Math rendering with hidden MathML for screen readers ([MATH-RENDERING.md](docs/MATH-RENDERING.md))
- **MathQuill**: Interactive math input (`@pie-lib/math-input`)
- **TipTap Math extension**: Rich text with embedded math (`@pie-lib/editable-html-tip-tap`)

### Accessibility First

- WCAG 2.2 Level AA compliance mandatory
- Axe-core integration in Playwright tests
- Focus management and keyboard navigation
- Screen reader support verified

### Accessibility Scenario Suite

When working under `apps/element-a11y-demo/src/lib/a11y/**`, `apps/element-a11y-demo/test/a11y/**`, `apps/element-a11y-demo/src/lib/samples/**`, or `docs/a11y/**`:

- Use `.claude/skills/accessibility-reviewer-assessments/SKILL.md` for the detailed assessment-specific checklist.
- Prefer dedicated a11y scenarios in `apps/element-a11y-demo/src/lib/a11y/scenarios/catalog.ts` over broad demo inventory coverage.
- Keep automated scope explicit: document Axe-covered checks, custom Playwright checks, manual-only concerns, and unclear gaps in `docs/a11y/`.
- Add reusable checks in `apps/element-a11y-demo/test/a11y/axe-scenarios.spec.ts` only when the concern applies across multiple elements.
- Fixes in `packages/elements-react/*` or `packages/lib-react/*` are made in this repo; see [Legacy Repositories](#legacy-repositories).

### Rich Text Editing

- TipTap 3.14 with ProseMirror
- Math extension for KaTeX
- DOMPurify for HTML sanitization
- Configurable toolbar and extensions

### Drag-and-Drop

- @dnd-kit for accessible drag-and-drop
- Sortable and core packages
- Touch-friendly interactions

## CLI Tools

oclif-based CLI for:

- `packages:*` - Generate package configs
- `verify:*` - Verify builds

## Publishing & Versioning

- **Changesets**: Version management
- **CI/CD**: GitHub Actions (ci.yml, e2e.yml, release.yml)
- **Automated releases**: Via GitHub Actions
- **Two channels, versions only on `master`** (PIE-1121): `develop` publishes `next` snapshots
  and commits no versions; `master` publishes `latest` through a "Version Packages" PR. Never
  put prerelease versions or `.changeset/pre.json` back on `develop`: a `develop` -> `master`
  merge would carry them to `master`, whose stable publish rejects them.
- **`develop` publishes `<version>-next.<datetime>` snapshots**: every merge versions the packages
  it changed with `changeset version --snapshot next` in the runner only, publishes them under the
  `next` dist-tag, and discards the tree (`scripts/release-version-snapshot.mjs`). The base version
  takes the largest bump the pending changesets give a package, dependents included, so `next`
  previews the coming stable release. The script moves the pending changesets aside first, so the
  snapshot versions only the selected packages and their dependents. Every other package is
  pinned, in the runner only, to its own latest `next` release, because `workspace:*` publishes as
  the working-tree version and develop's committed versions are frozen. Versioning runs before
  the build, which embeds the manifest version. A manual Release run on `develop` with
  `snapshot_all` puts every package on `next` at once.
- **Snapshot selection is per package, measured from npm**: a package is selected when its shipping
  files changed after the commit its latest snapshot was built from (npm's `gitHead`), or after its
  last `version` bump in git when no snapshot exists. A bump newer than the snapshot is not a
  release point: a hand-edited version would otherwise hide unreleased code. The latest snapshot is this
  repo's newest `-next.<14-digit datetime>` version, not whatever the `next` tag points at: the
  legacy repos can move that tag. Drop that search once they no longer publish to `next`. That is what
  makes the pipeline self-healing — a run that fails or is cancelled leaves npm pointing at the
  older commit, so the next run picks the packages up. Do not reintroduce a push-range or
  repo-wide "last release commit" baseline: both drop work silently (PIE-1073).
- **Every merged PR gets a changeset**: after a merge into `develop`, CI writes
  `.changeset/pr-<n>.md` (the changed packages at `patch`, the PR title, and a `pr:` line that
  `@changesets/changelog-github` turns into the PR link and author) and commits it to `develop`
  (`scripts/release-record-pr-changeset.mjs`). These accumulate until the next stable release.
- **A hand-written changeset still wins**: a changeset added in the PR keeps its bump type and
  summary, and the recorded one leaves its packages out. Write one whenever the change deserves
  more than its PR title or a `minor`/`major` bump.
- **`master` releases through a version PR, then back-merges**: a `develop` -> `master` merge
  makes `changesets/action` open the "Version Packages" PR; merging it publishes `latest`. CI then
  opens a `master` -> `develop` back-merge PR with the release commit. Merge it before the next
  `develop` -> `master` merge, or consumed changesets come back and are applied twice.
- **`bun run version` needs `GITHUB_TOKEN`**: `@changesets/changelog-github` calls the GitHub API
  while writing changelogs. Locally, run it as `GITHUB_TOKEN=$(gh auth token) bun run version`.
- **Taken versions fail the release**: a stable version npm already holds fails
  `scripts/check-version-availability.mjs`, which `bun run version` runs last. The legacy
  pie-elements and pie-lib repos published many of the same names on the same lines.
- **Non-shipping paths do not release**: changes confined to tests, specs, snapshots and
  package-local vitest/playwright config select nothing and record no changeset. Private
  packages and `.changeset/config.json`'s `ignore` list are never selected.
- **A dropped release is never silent**: after a `develop` run, `scripts/release-report-dropped.mjs`
  compares what the run selected with what the publish script reported as published, and fails an
  otherwise-green run that left any of it unpublished.
- **Default bump policy**: Always use `patch` by default for releases/versioning.
- Use `minor` or `major` only when the user explicitly requests it.
- **Selective publish only**: Publish only selected packages and changeset-propagated dependents, never all unpublished packages.
- **Manual npm publish command**: For manual package publishing in this monorepo, always use `sh scripts/publish-with-env-token.sh --packages <pkg1,pkg2>` (single package example: `sh scripts/publish-with-env-token.sh --packages @pie-element/<name>`).
- **No raw npm publish for manual releases**: Do not run `npm publish` directly for manual releases in this repo; use the publish script so package selection and token auth are handled consistently.
- **Independent versions (current policy)**: Packages version independently (no workspace-wide lockstep assumption).

## Current Work Focus

**Goal**: Achieve feature parity with original pie-elements (21 QTI 2.2 interaction types).

**Progress**:

- Svelte: 4 elements implemented
- React: 20+ elements implemented
- Web Components: Planned

Maintain strict accessibility compliance and comprehensive test coverage as you implement remaining elements.
