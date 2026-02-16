# PIE Elements NG - Project Instructions

## Project Context

**PIE Elements NG** is a next-generation rewrite of the PIE elements framework using a unified component architecture. Each element is a single package handling all modes (controller, student, preview, evaluation, authoring) instead of three separate packages.

**Critical Requirements**:

- **WCAG 2.2 Level AA compliance**: Mandatory for all interaction components
- **Bun runtime**: Node.js is supported but Bun 1.1.42+ is primary
- **Svelte 5 with runes**: Modern reactive patterns required
- **Feature parity**: Must match all 21 QTI 2.2 interaction types from original pie-elements
- **Strict TypeScript**: No `any` allowed (enforced by Biome)

## Upstream Sync (Maintainers Only)

**For maintainers syncing from upstream:**

- **pie-elements**: Must be checked out at `../pie-elements` (sibling directory)
- **pie-lib**: Must be checked out at `../pie-lib` (sibling directory)

CLI upstream commands (`upstream:update`, `upstream:check`, `upstream:sync`, etc.) depend on finding `pie-elements` and `pie-lib` as siblings. These commands copy files from `../pie-elements` to `packages/elements-react` and from `../pie-lib` to `packages/lib-react`.

**For regular developers:**

The synced packages (`packages/elements-react/*` and `packages/lib-react/*`) are committed to git. You don't need to check out pie-elements or pie-lib - just `git pull` to get the latest synced packages.

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
- Do not assume attribute updates are reactive for object data.
- For model/session updates, reassign new objects when needed to trigger updates.
- When using controller-based elements, rebuild and re-set the element model on mode/session changes.

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

## Current Work Focus

**Goal**: Achieve feature parity with original pie-elements (21 QTI 2.2 interaction types).

**Progress**:

- Svelte: 4 elements implemented
- React: 20+ elements implemented
- Web Components: Planned

Maintain strict accessibility compliance and comprehensive test coverage as you implement remaining elements.
