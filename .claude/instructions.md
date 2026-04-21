# PIE Elements NG - Project Instructions

## Project Context

**PIE Elements NG** is a next-generation rewrite of the PIE elements framework using a unified component architecture. Each element is a single package handling all modes (controller, student, preview, evaluation, authoring) instead of three separate packages.

**Critical Requirements**:

- **WCAG 2.2 Level AA compliance**: Mandatory for all interaction components
- **Bun runtime**: Node.js is supported but Bun 1.1.42+ is primary
- **Svelte 5 with runes**: Modern reactive patterns required
- **Feature parity**: Must match all 21 QTI 2.2 interaction types from original pie-elements
- **Strict TypeScript**: No `any` allowed (enforced by Biome)

## Spec-driven workflow (PRDs)

This project uses lightweight PRDs (Product Requirements Documents) under [`docs/prds/`](../docs/prds/) for significant changes. PRDs capture the *intent* of a feature; the test suite remains the source of truth for *behaviour*.

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

See [`docs/prds/README.md`](../docs/prds/README.md) for the full conventions and [`docs/prds/venn-classification/PRD.md`](../docs/prds/venn-classification/PRD.md) for the canonical example PRD that anchors the expected length and tone.

## Upstream Sync (Maintainers Only)

**For maintainers syncing from upstream:**

- **pie-elements**: Must be checked out at `../pie-elements` (sibling directory)
- **pie-lib**: Must be checked out at `../pie-lib` (sibling directory)

CLI upstream commands (`upstream:update`, `upstream:check`, `upstream:sync`, etc.) depend on finding `pie-elements` and `pie-lib` as siblings. These commands copy files from `../pie-elements` to `packages/elements-react` and from `../pie-lib` to `packages/lib-react`.

**For regular developers:**

The synced packages (`packages/elements-react/*` and `packages/lib-react/*`) are committed to git. You don't need to check out pie-elements or pie-lib - just `git pull` to get the latest synced packages.

**Edit policy for synced packages:**

- Do not directly edit files under `packages/elements-react/*` or `packages/lib-react/*`.
- Make source fixes in upstream repos (`../pie-elements`, `../pie-lib`) and sync them into this repo using `upstream:update` or targeted `upstream:sync`.
- Only use direct local edits in those synced folders when explicitly approved as an emergency local-only debugging patch.

## Technology Stack

- **Runtime**: Bun 1.1.42+ (Node.js 20.0+ also supported)
- **UI Framework**: Svelte 5 (primary), React 18 (secondary), Web Components (planned)
- **Build**: Vite 6+ with Turbo for monorepo orchestration
- **Testing**: Vitest 4.x (unit/component) + Playwright 1.56+ (E2E)
- **Accessibility**: @axe-core/playwright for automated checks
- **Linting**: Biome 2.3+ (replaces ESLint/Prettier)
- **Rich Text**: TipTap 3.14 with Math extension
- **Math Rendering**: KaTeX 0.16, MathLive 0.108, Speech Rule Engine 5.0

## Monorepo Structure

```text
pie-element/
├── packages/
│   ├── core/                      # Core PIE interfaces & types
│   ├── cli/                       # oclif-based CLI tools
│   ├── shared/
│   │   ├── types/                # Shared TypeScript types
│   │   ├── utils/                # Shared utilities
│   │   └── test-utils/           # Test harnesses & fixtures
│   ├── elements-svelte/          # Svelte elements (4 implemented)
│   │   ├── multiple-choice/
│   │   ├── slider/
│   │   ├── upload/
│   │   └── media/
│   ├── elements-react/           # React elements (20+ implemented)
│   │   ├── multiple-choice/
│   │   ├── hotspot/
│   │   ├── match/
│   │   ├── graphing/
│   │   └── [16 more...]
│   ├── elements-wc/              # Web Components (planned)
│   ├── lib-svelte/               # Svelte shared libraries
│   │   ├── a11y/                # Accessibility utilities
│   │   ├── config-ui/           # Configuration UI components
│   │   ├── math/                # Math rendering
│   │   └── ui/                  # General UI components
│   └── lib-react/                # React shared libraries (25+ packages)
└── apps/
    ├── element-demo/            # Shared element demo
    └── esm-player-test/         # ESM player testing
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

Each element exports three entry points:

- `element.ts` - Custom element wrapper (web component)
- `controller.ts` - Server/client-side logic (PIE controller)
- `author.ts` - Configuration UI (authoring mode)

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
- Element packages must not self-register custom elements (no `customElements.define(...)` in element runtime entries such as `index.iife.ts`).
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
- Keep `exports["./controller"]` as the primary ESM entry for standard consumers; the root shim exists only for builder compatibility.

### Framework Agnostic

- Can be used as web components in any framework
- React elements use Material UI + React JSS
- Svelte elements use Svelte 5 runes
- Web Components planned for maximum portability

### Math Support

- **KaTeX**: Static math rendering
- **MathLive**: Interactive math input
- **Speech Rule Engine**: Accessibility for math content
- **TipTap Math extension**: Rich text with embedded math

### Accessibility First

- WCAG 2.2 Level AA compliance mandatory
- Axe-core integration in Playwright tests
- Focus management and keyboard navigation
- Screen reader support verified

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

- `upstream:*` - Sync with upstream pie-elements
- `packages:*` - Generate package configs
- `verify:*` - Verify builds

## Publishing & Versioning

- **Changesets**: Version management
- **CI/CD**: GitHub Actions (ci.yml, e2e.yml, release.yml)
- **Automated releases**: Via GitHub Actions
- **Default bump policy**: Always use `patch` by default for releases/versioning.
- Use `minor` or `major` only when the user explicitly requests it.
- **Selective publish only**: Publish only selected packages and changeset-propagated dependents, never all unpublished packages.
- **Manual npm publish command**: For manual package publishing in this monorepo, always use `sh scripts/publish-with-env-token.sh --packages <pkg1,pkg2>` (single package example: `sh scripts/publish-with-env-token.sh --packages @pie-element/<name>`).
- **No raw npm publish for manual releases**: Do not run `npm publish` directly for manual releases in this repo; use the publish script so package selection and token auth are handled consistently.
- **Independent versions (current policy)**: Packages version independently (no workspace-wide lockstep assumption).
- **Upstream sync versioning**: `upstream:update` must preserve/copy upstream package versions for synced `elements-react` and `lib-react` packages.

## Current Work Focus

**Goal**: Achieve feature parity with original pie-elements (21 QTI 2.2 interaction types).

**Progress**:

- Svelte: 4 elements implemented
- React: 20+ elements implemented
- Web Components: Planned

Maintain strict accessibility compliance and comprehensive test coverage as you implement remaining elements.
