# PIE Elements - Architecture

## Overview

This is a modern implementation of the PIE (Platform Independent Elements) specification, built with Svelte 5, TypeScript, and contemporary tooling. This document describes the architectural decisions, patterns, and structure of the project.

## Core Philosophy

### Unified Component Architecture

**Unlike the original pie-elements**, this project uses a **unified component architecture** where each element is a single component that handles all modes:

```
Original pie-elements:          This project:
┌─────────────────────┐        ┌──────────────────────┐
│ @pie-element/X      │        │ @pie-element/X       │
│ @pie-element/X-     │   →    │  - student/          │
│   configure         │        │  - authoring/        │
│ @pie-element/X-     │        │  - controller/       │
│   controller        │        │  - Single package    │
└─────────────────────┘        └──────────────────────┘
  (3 packages)                    (1 self-contained pkg)
```

### Key Differences from Original

| Aspect | Original pie-elements | This Project |
|--------|----------------------|--------------|
| **Framework** | React | Svelte 5 (primary) + React |
| **Language** | JavaScript | TypeScript |
| **Package Manager** | npm/yarn | Bun |
| **Build Tool** | Webpack/Rollup | Vite |
| **Monorepo** | Lerna | Turbo |
| **Testing** | Jest | Vitest + Playwright |
| **Components per Element** | 3 packages | 1 package |
| **Mode Switching** | Separate components | Single component with props |

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    PIE Elements                            │
├───────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │            Examples Apps (SvelteKit)               │  │
│  │  - Demo/development interface                      │  │
│  │  - Visual testing playground                       │  │
│  │  - E2E test targets                                │  │
│  └─────────────┬──────────────────────────────────────┘  │
│                │                                           │
│  ┌─────────────▼──────────────────────────────────────┐  │
│  │                 Element Layer                       │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Svelte Elements (elements-svelte/)          │  │  │
│  │  │  - Native Svelte 5 implementations           │  │  │
│  │  │  - Mode-aware components                     │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  React Elements (elements-react/)            │  │  │
│  │  │  - React implementations (ported)            │  │  │
│  │  │  - Compatible with existing consumers        │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Web Components (elements-wc/)               │  │  │
│  │  │  - Framework-agnostic wrappers               │  │  │
│  │  │  - Standard custom elements                  │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────┬──────────────────────────────────────┘  │
│                │                                           │
│  ┌─────────────▼──────────────────────────────────────┐  │
│  │              Library Layer                          │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  UI Libraries (lib-svelte/, lib-react/)      │  │  │
│  │  │  - Shared components (Prompt, Feedback, etc) │  │  │
│  │  │  - Rich text editor (TipTap)                 │  │  │
│  │  │  - Math rendering (KaTeX, MathLive)          │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Shared Utilities (shared/)                  │  │  │
│  │  │  - Types and interfaces                      │  │  │
│  │  │  - Common utilities                          │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └─────────────┬──────────────────────────────────────┘  │
│                │                                           │
│  ┌─────────────▼──────────────────────────────────────┐  │
│  │              Core Layer                             │  │
│  │  - PIE specification interfaces                     │  │
│  │  - PieModel, PieController, PieEnvironment         │  │
│  │  - Framework-agnostic contracts                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└───────────────────────────────────────────────────────────┘
```

## Package Structure

### Element Package Anatomy

Each element follows a consistent, symmetric structure where student UI, authoring UI, and business logic are peer folders at the same level:

```
packages/elements-react/multiple-choice/
├── src/
│   ├── delivery/                # Delivery interaction mode
│   │   ├── index.tsx          # Main student component
│   │   ├── multiple-choice.tsx
│   │   ├── choice.tsx
│   │   ├── choice-input.tsx
│   │   └── session-updater.ts
│   ├── authoring/              # Authoring/configuration mode
│   │   ├── index.ts           # Main authoring component
│   │   └── main.tsx
│   ├── controller/             # Business logic (framework-agnostic)
│   │   ├── index.ts           # PIE controller implementation
│   │   ├── defaults.ts        # Default model configuration
│   │   └── utils.ts           # Helper utilities
│   ├── index.ts               # HTML Custom Element wrapper
│   └── types.ts               # Shared types
├── tests/                      # E2E tests (optional)
│   └── multiple-choice.spec.ts
├── package.json
├── vite.config.ts
└── README.md
```

**Note**: The Svelte elements follow a similar structure but with `.svelte` files instead of `.tsx` files. Future modes like `print/`, `mini/`, or `listview/` can be added as additional peer folders.

### Separation of Concerns

#### 1. Controller (Business Logic)

**Location**: `src/controller/index.ts`

**Responsibility**: Framework-agnostic business logic

**Key Functions**:
- `model()` - Transform question model for rendering
- `outcome()` - Calculate score and feedback

```typescript
export async function model(
  question: MultipleChoiceModel,
  session: SessionData | null,
  env: PieEnvironment
): Promise<ViewModel> {
  // Transform based on mode (gather/view/evaluate/authoring)
  // Apply role-based permissions (student/instructor)
  // Return view model for rendering
}

export async function outcome(
  question: MultipleChoiceModel,
  session: SessionData,
  env: PieEnvironment
): Promise<PieOutcome> {
  // Calculate score
  // Generate feedback
  // Return outcome
}
```

**Why Separate**: Controllers are framework-agnostic business logic that can be shared or ported across implementations.

#### 2. Student Component (Interaction)

**Location**: `src/delivery/index.tsx` (React) or `src/delivery/{Element}.svelte` (Svelte)

**Responsibility**: Render question and handle user interaction

**Modes Handled**:
- `gather` - Interactive, user can answer
- `view` - Read-only, show question without interaction
- `evaluate` - Show score, feedback, correct answers

```svelte
<script lang="ts">
  let { model, session = $bindable(), env } = $props<Props>();

  const isDisabled = $derived(
    env.mode === 'view' || env.mode === 'evaluate'
  );
</script>

<div class="pie-multiple-choice">
  <Prompt prompt={model.prompt} />

  {#if env.mode === 'gather'}
    <!-- Interactive choices -->
  {:else if env.mode === 'evaluate'}
    <!-- Show correctness and feedback -->
  {:else}
    <!-- View mode: static display -->
  {/if}
</div>
```

#### 3. Authoring Component (Configuration)

**Location**: `src/authoring/index.ts` (React) or `src/authoring/{Element}Config.svelte` (Svelte)

**Responsibility**: Author/configure question settings

**Features**:
- Rich text editor for prompts
- Choice management (add/remove/edit)
- Configuration options (scoring, feedback, etc.)
- Preview of changes

```svelte
<script lang="ts">
  let { model = $bindable() } = $props<Props>();

  function updatePrompt(html: string) {
    model = { ...model, prompt: html };
  }
</script>

<RichTextEditor
  value={model.prompt}
  onChange={updatePrompt}
/>
```

## PIE Controller Interface

The PIE controller is the core contract that all elements implement:

```typescript
export interface PieController {
  /**
   * Transform question model for rendering
   * @param question - Element configuration
   * @param session - User's current answer/state
   * @param env - Rendering environment (mode, role)
   * @returns View model for component rendering
   */
  model(
    question: PieModel,
    session: SessionData | null,
    env: PieEnvironment
  ): Promise<ViewModel>;

  /**
   * Calculate outcome based on session
   * @param question - Element configuration
   * @param session - User's answer
   * @param env - Evaluation environment
   * @returns Score, feedback, and correctness
   */
  outcome(
    question: PieModel,
    session: SessionData,
    env: PieEnvironment
  ): Promise<PieOutcome>;
}
```

### PieEnvironment

```typescript
export interface PieEnvironment {
  mode: 'gather' | 'view' | 'evaluate' | 'authoring' | 'print';
  role: 'student' | 'instructor';
}
```

**Modes**:
- `gather` - Student answering question
- `view` - Read-only display (no interaction)
- `evaluate` - Show score, feedback, correct answers
- `authoring` - Authoring/configuration interface
- `print` - Static rendering for paper/PDF

**Roles**:
- `student` - Learner interacting with assessment
- `instructor` - Teacher/author viewing or configuring

### PieModel

```typescript
export interface PieModel {
  id: string;
  element: string;
  prompt?: string;
  // Element-specific properties
}
```

### PieOutcome

```typescript
export interface PieOutcome {
  score: number;           // 0.0 to 1.0
  correct?: boolean;       // Binary correct/incorrect
  feedback?: string;       // Feedback message
  rationale?: string;      // Explanation
  // Element-specific outcome data
}
```

## State Management

### Session State

**Session** represents the user's current answer/state for an element.

```typescript
interface Session {
  value?: unknown;  // Element-specific answer data
  // Additional session metadata
}
```

**Flow**:
1. User interacts with element
2. Component updates `session` via `$bindable()`
3. Parent receives `onSessionChange` event
4. Session persisted (by consumer application)
5. On page reload, session passed back to element

### Model State

**Model** represents the question configuration (authored content).

**Immutable**: Models should not change during student interaction. Changes only happen in authoring mode.

### Reactivity with Svelte 5

Svelte 5 runes provide fine-grained reactivity:

```svelte
<script lang="ts">
  // Props (from parent)
  let { model, session = $bindable(), env } = $props<Props>();

  // Local state
  let localState = $state(0);

  // Derived/computed values
  const isDisabled = $derived(env.mode !== 'gather');

  // Side effects
  $effect(() => {
    console.log('Session changed:', session);
  });
</script>
```

## Data Flow

### Gather Mode (Student Interaction)

```
┌─────────────────┐
│  Assessment     │
│  Player/Host    │
└────────┬────────┘
         │ model, session, env
         ▼
┌─────────────────┐
│  PIE Element    │
│  Component      │
└────────┬────────┘
         │ User interacts
         ▼
┌─────────────────┐
│  Update Session │
│  (via bindable) │
└────────┬────────┘
         │ onSessionChange
         ▼
┌─────────────────┐
│  Host Persists  │
│  Session        │
└─────────────────┘
```

### Evaluate Mode (Scoring)

```
┌─────────────────┐
│  Assessment     │
│  Player/Host    │
└────────┬────────┘
         │ Call controller.outcome()
         ▼
┌─────────────────┐
│  Controller     │
│  outcome()      │
└────────┬────────┘
         │ Calculate score
         ▼
┌─────────────────┐
│  Return         │
│  PieOutcome     │
└────────┬────────┘
         │ Pass to component
         ▼
┌─────────────────┐
│  Component      │
│  Renders        │
│  Feedback       │
└─────────────────┘
```

### Authoring Mode (Configuration)

```
┌─────────────────┐
│  Authoring      │
│  Tool           │
└────────┬────────┘
         │ model (editable)
         ▼
┌─────────────────┐
│  Authoring      │
│  Component      │
└────────┬────────┘
         │ User edits
         ▼
┌─────────────────┐
│  Update Model   │
│  (via bindable) │
└────────┬────────┘
         │ onModelChange
         ▼
┌─────────────────┐
│  Host Persists  │
│  Model          │
└─────────────────┘
```

## Dependency Structure

### Dependency Graph

```
┌──────────────────────────────────────┐
│          Examples App                │
│         (SvelteKit)                  │
└──────────────┬───────────────────────┘
               │
       ┌───────▼──────────┐
       │   Elements       │
       │   (Svelte)       │
       └───────┬──────────┘
               │
       ┌───────▼──────────┬────────────┐
       │                  │            │
   ┌───▼──────┐   ┌──────▼───┐   ┌───▼──────┐
   │  lib-ui  │   │  shared  │   │   core   │
   │ (Svelte) │   │  utils   │   │ (types)  │
   └──────────┘   └──────────┘   └──────────┘
```

### Package Dependencies

**Core**: No dependencies (pure interfaces)

**Shared**: Depends on core

**Lib-UI**: Depends on core, may use shared utilities

**Elements**: Depend on core, lib-ui, shared

**Apps**: Depend on elements

### Avoiding Circular Dependencies

- Core defines interfaces only
- Shared utilities are stateless
- Elements don't depend on each other
- Apps are top-level consumers

## Technology Choices

### Why Svelte 5?

**Benefits**:
- Native Web Components support
- Smaller bundle size (~3KB overhead vs 40KB+ for React)
- True reactivity without virtual DOM
- Runes API provides clear, predictable state management
- Excellent TypeScript support

**Trade-offs**:
- Smaller ecosystem than React
- Less community resources
- Learning curve for React developers

### Why TypeScript?

**Benefits**:
- Type safety catches errors early
- Better IDE support (autocomplete, refactoring)
- Self-documenting code
- Easier refactoring
- Improved maintainability

### Why Bun?

**Benefits**:
- Fast package installation (3-5x faster than npm)
- Built-in test runner
- Native TypeScript support
- All-in-one tool (package manager + bundler + runner)

**Trade-offs**:
- Newer, less proven than npm/yarn
- Some compatibility issues (using Vitest instead of Bun test for now)

### Why Vite?

**Benefits**:
- Extremely fast HMR (Hot Module Replacement)
- Native ESM support
- Excellent Svelte integration
- Modern, optimized builds

### Why Turbo?

**Benefits**:
- Fast monorepo builds (caching, parallelization)
- Task orchestration
- Smart dependency graph execution

## Testing Strategy

### Test Pyramid

```
        ┌─────────────┐
        │     E2E     │  ← Few, high-value scenarios
        │ (Playwright)│
        └──────┬──────┘
       ┌───────▼──────────┐
       │   Integration    │  ← Cross-package interactions
       │   (Vitest)       │
       └────────┬─────────┘
   ┌────────────▼────────────────┐
   │        Unit Tests           │  ← Many, fast, focused
   │  (Vitest + Testing Library) │
   └─────────────────────────────┘
```

### Test Categories

1. **Unit Tests** - Controller logic, utilities
2. **Component Tests** - Svelte components with Testing Library
3. **Integration Tests** - Multi-package workflows
4. **E2E Tests** - Full browser automation with Playwright
5. **Accessibility Tests** - axe-core scans
6. **Evaluation Tests** - YAML-driven comprehensive scenarios

See [testing.md](./testing.md) for details.

## Build Process

### Development Build

```bash
bun run dev
```

- Watches for file changes
- Rebuilds affected packages
- Hot module replacement in the demos app
- Fast feedback loop

### Production Build

```bash
bun run build
```

1. Turbo orchestrates build order (respects dependencies)
2. Each package builds with Vite
3. TypeScript compilation
4. Bundle optimization (tree-shaking, minification)
5. Output to `dist/` directories

### Build Output

**ESM** (ES Modules) format for modern bundlers:

```javascript
// dist/index.js
export { default as MultipleChoice } from './MultipleChoice.js';
export { model, outcome } from './controller.js';
```

**Types**: TypeScript definitions generated:

```typescript
// dist/index.d.ts
export declare const MultipleChoice: Component<Props>;
```

## Accessibility

### WCAG 2.2 Level AA Compliance

All elements must meet WCAG 2.2 Level AA standards:

- **Perceivable**: Text alternatives, color contrast, adaptable layouts
- **Operable**: Keyboard navigation, sufficient time, seizure prevention
- **Understandable**: Readable text, predictable behavior, input assistance
- **Robust**: Compatible with assistive technologies

### Testing

Every element must pass:

1. **Automated scans** with axe-core
2. **Keyboard navigation** testing
3. **Screen reader** testing (manual)
4. **Touch target** size validation (44x44px minimum)
5. **Color contrast** checks

See [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/)

## Performance

### Bundle Size Targets

- **Element (Svelte)**: < 15KB gzipped
- **Element (React)**: < 40KB gzipped (includes React runtime)
- **Shared libraries**: < 30KB gzipped each
- **Total for typical assessment**: < 200KB gzipped

### Optimization Techniques

1. **Tree-shaking**: Only include used code
2. **Code splitting**: Load elements on-demand
3. **Dynamic imports**: Lazy-load heavy dependencies (MathLive, etc.)
4. **Svelte compilation**: No runtime overhead
5. **Shared dependencies**: Deduplicate common libraries

### Performance Monitoring

- First Contentful Paint (FCP) < 1s
- Time to Interactive (TTI) < 3s
- Lighthouse score > 90

## Security

### XSS Prevention

- **DOMPurify** sanitizes all HTML content
- Never use `{@html}` without sanitization
- Validate user input on both client and server

### Content Security Policy

Elements should work with strict CSP:

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
```

Note: `'unsafe-inline'` for styles is required for Svelte scoped styles.

## Deployment

### NPM Publishing

Packages are published to npm via GitHub Actions:

1. Developer creates changeset: `bun run changeset`
2. PR merged to main
3. GitHub Action creates "Version Packages" PR
4. Maintainer merges Version PR
5. Packages automatically published to npm

See [PUBLISHING.md](./PUBLISHING.md) for details.

### Versioning

**Semantic Versioning (SemVer)**:

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes

### CDN Distribution

Packages can be loaded from CDN:

```html
<script type="module">
  import { MultipleChoice } from 'https://esm.sh/@pie-element/multiple-choice';
</script>
```

## Extension Points

### Adding New Elements

See [CONTRIBUTING.md](./CONTRIBUTING.md) for step-by-step guide.

Key requirements:

1. Implement PIE controller interface
2. Create student component
3. Create authoring component
4. Add comprehensive tests
5. Document usage

### Custom Themes

Elements use CSS variables for theming:

```css
:root {
  --color-primary: #3b82f6;
  --color-base-100: #ffffff;
  --color-base-content: #1f2937;
}
```

Consumers can override variables to match their brand.

### Plugin System (Future)

Planned extension points:
- Custom validators
- Custom feedback generators
- Custom rendering plugins
- Third-party integrations

## Future Architecture

### Planned Enhancements

1. **Web Components as Primary Output**
   - Framework-agnostic custom elements
   - Standard browser APIs
   - See [web-components-strategy.md](./web-components-strategy.md)

2. **Plugin Architecture**
   - Extensible validation
   - Custom scoring algorithms
   - Third-party integrations

3. **Edge Runtime Support**
   - Deno, Cloudflare Workers compatibility
   - Serverless controller execution

## References

- [PIE Framework](https://github.com/pie-framework)
- [Svelte 5 Documentation](https://svelte.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [Vite Documentation](https://vitejs.dev/)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-07
**Status**: Living Document
