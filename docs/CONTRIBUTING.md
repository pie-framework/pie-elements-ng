# Contributing to PIE Elements

Thank you for your interest in contributing to PIE Elements! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Creating a New Element](#creating-a-new-element)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Publishing](#publishing)

## Getting Started

### Prerequisites

- **Bun** 1.3.6 or later
- **Node.js** 20.0.0 or later (for compatibility)
- **Git** for version control

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/pie-element.git
cd pie-element
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/ORIGINAL-ORG/pie-element.git
```

## Development Setup

### Install Dependencies

```bash
bun install
```

### Build All Packages

```bash
bun run build
```

### Run Development Server

```bash
# Run all packages in dev mode
bun run dev

# Or run the React examples app only
bun run react-examples
```

### Run Tests

```bash
# Unit tests
bun run test

# E2E tests
bun run test:e2e

# Evaluation tests
bun run evals

# With coverage
bun run test:coverage
```

### Lint and Format

```bash
# Check code
bun run lint

# Auto-fix issues
bun run lint:fix
```

## Project Structure

```
pie-element/
├── packages/
│   ├── core/                      # Core PIE interfaces
│   ├── elements-svelte/           # Svelte element implementations
│   │   ├── media/                 # Media element
│   │   ├── multiple-choice/       # Multiple choice element
│   │   ├── slider/                # Slider element
│   │   └── upload/                # Upload element
│   ├── elements-react/            # React element implementations
│   │   ├── hotspot/               # Hotspot element
│   │   ├── multiple-choice/       # Multiple choice element
│   │   └── number-line/           # Number line element
│   ├── lib-svelte/                # Shared Svelte libraries
│   ├── lib-react/                 # Shared React libraries
│   └── shared/                    # Shared utilities
├── apps/
│   ├── examples-react/            # React examples app
│   └── local-esm-cdn/             # Local CDN for ESM modules
└── docs/                          # Documentation
```

## Creating a New Element

### 1. Directory Structure

Create a new element directory following the symmetric pattern where student, authoring, and controller are peer folders:

```bash
mkdir -p packages/elements-svelte/my-element/src/{student,authoring,controller}
```

**Note**: Use `authoring` instead of `configure` for the configuration UI folder. This follows a consistent naming pattern where each folder represents a specific mode or aspect of the element.

### 2. Controller Implementation

Create the PIE controller (framework-agnostic logic):

**`packages/elements-svelte/my-element/src/controller/index.ts`**

```typescript
import type { PieModel, PieController } from '@pie-framework/pie-configure-events';

export interface MyElementModel extends PieModel {
  prompt: string;
  // Add your model properties
}

export interface MyElementSession {
  value?: unknown;
  // Add your session properties
}

/**
 * Transform question model for rendering
 */
export async function model(
  question: MyElementModel,
  session: MyElementSession | null,
  env: PieEnvironment
): Promise<ViewModel> {
  // Transform model based on mode and role
  return {
    prompt: question.prompt,
    disabled: env.mode === 'view' || env.mode === 'evaluate',
    // Return view model
  };
}

/**
 * Calculate outcome/score
 */
export async function outcome(
  question: MyElementModel,
  session: MyElementSession,
  env: PieEnvironment
): Promise<PieOutcome> {
  // Calculate score based on session
  const score = calculateScore(question, session);

  return {
    score,
    // Add feedback, rationale, etc.
  };
}

// Export controller interface
export const controller: PieController = {
  model,
  outcome,
};
```

### 3. Student Component

Create the Svelte component for student interaction:

**`packages/elements-svelte/my-element/src/delivery/MyElement.svelte`**

```svelte
<script lang="ts">
  import type { MyElementModel, MyElementSession } from '../controller';
  import type { PieEnvironment } from '@pie-element/core';
  import { Prompt } from '@pie-element/lib-ui';

  interface Props {
    model: MyElementModel;
    session?: MyElementSession;
    env: PieEnvironment;
    onSessionChange?: (session: MyElementSession) => void;
  }

  let { model, session = $bindable(), env, onSessionChange } = $props<Props>();

  // Derived states
  const isDisabled = $derived(
    env.mode === 'view' || env.mode === 'evaluate'
  );

  // Event handlers
  function handleChange(value: unknown) {
    session = { ...session, value };
    onSessionChange?.(session);
  }
</script>

<div class="pie-my-element">
  <Prompt prompt={model.prompt} />

  <!-- Your element UI here -->
  <div class="interaction">
    <!-- Add your interaction controls -->
  </div>
</div>

<style>
  .pie-my-element {
    padding: 1rem;
  }

  .interaction {
    margin-top: 1rem;
  }
</style>
```

### 4. Authoring Component

Create the authoring/configuration UI:

**`packages/elements-svelte/my-element/src/authoring/MyElementConfig.svelte`**

```svelte
<script lang="ts">
  import type { MyElementModel } from '../controller';
  import { RichTextEditor } from '@pie-element/lib-ui';

  interface Props {
    model: MyElementModel;
    onModelChange?: (model: MyElementModel) => void;
  }

  let { model = $bindable(), onModelChange } = $props<Props>();

  function updatePrompt(html: string) {
    model = { ...model, prompt: html };
    onModelChange?.(model);
  }
</script>

<div class="config-section">
  <label>Prompt</label>
  <RichTextEditor
    value={model.prompt}
    placeholder="Enter the question prompt..."
    minHeight={150}
    onChange={updatePrompt}
  />
</div>

<!-- Add more configuration options -->

<style>
  .config-section {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
</style>
```

### 5. Package Configuration

**`packages/elements-svelte/my-element/package.json`**

```json
{
  "name": "@pie-element/my-element",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": {
      "svelte": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./controller": "./src/controller/index.ts"
  },
  "svelte": "./src/index.ts",
  "files": ["dist", "src"],
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@pie-element/core": "workspace:*",
    "@pie-element/lib-ui": "workspace:*"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^5.0.2",
    "svelte": "^5.17.0",
    "vite": "^6.0.7",
    "vitest": "^2.1.8"
  }
}
```

### 6. Testing

Create tests for your element:

**`packages/elements-svelte/my-element/src/controller/index.test.ts`**

```typescript
import { describe, expect, it } from 'vitest';
import { model, outcome } from './index';

describe('MyElement Controller', () => {
  it('returns correct view model', async () => {
    const question = {
      id: '1',
      element: 'my-element',
      prompt: 'Test prompt'
    };
    const session = null;
    const env = { mode: 'gather', role: 'student' };

    const viewModel = await model(question, session, env);

    expect(viewModel.prompt).toBe('Test prompt');
    expect(viewModel.disabled).toBe(false);
  });

  it('calculates correct score', async () => {
    const question = {
      id: '1',
      element: 'my-element',
      prompt: 'Test'
    };
    const session = { value: 'correct-answer' };
    const env = { mode: 'evaluate', role: 'student' };

    const result = await outcome(question, session, env);

    expect(result.score).toBe(1.0);
  });
});
```

### 7. Add a Demo Entry

Per-package demos live inside each element package:

- `packages/elements-react/<element>/docs/demo` for synced React elements
- (Svelte elements can add their own `docs/demo` as they are implemented)

If the element comes from upstream, run:
```bash
bun run upstream:sync --element my-element
```

This copies `docs/demo` into the element package and generates `demo.html` + `demo.mjs`
so the demo can run standalone after a build.

### 8. Add Evaluations

Create YAML evaluation specs:

**`docs/evals/elements-svelte/my-element/evals.yaml`**

```yaml
version: 1

component:
  element: "@pie-element/my-element"
  framework: "svelte"

examplesApp:
  app: "@pie-element/<element>"
  routeTemplate: "/docs/demo/demo.html"

evals:
  - id: "my-element/basic/interaction"
    severity: "error"
    intent: "Validates basic user interaction works correctly"

    steps:
      - action: navigate
        path: "/docs/demo/demo.html"
        params:
          mode: "gather"

      - action: click
        target:
          description: "Answer option"
          hint: '.answer-option'

      - action: axe
        expected:
          maxViolations: 0
          wcagLevel: "AA"
```

## Code Style

### TypeScript

- Use **TypeScript** for all new code
- Provide explicit types for function parameters and return values
- Avoid `any` - use `unknown` when type is truly dynamic
- Use `interface` for object shapes, `type` for unions/intersections

### Svelte 5

- Use **Svelte 5 runes** syntax: `$state`, `$derived`, `$effect`, `$props`
- Use `let { prop = $bindable() }` for two-way binding
- Prefer `onclick` over `on:click` (Svelte 5 style)
- Use `{@html}` carefully and sanitize content

### Component Structure

```svelte
<script lang="ts">
  // 1. Imports
  import { ComponentA } from './ComponentA';

  // 2. Props interface
  interface Props {
    required: string;
    optional?: number;
  }

  // 3. Props destructuring
  let { required, optional = 42 } = $props<Props>();

  // 4. State
  let localState = $state(0);

  // 5. Derived values
  const computed = $derived(localState * 2);

  // 6. Effects
  $effect(() => {
    console.log('Effect', localState);
  });

  // 7. Event handlers
  function handleClick() {
    localState++;
  }
</script>

<!-- 8. Template -->
<div>
  <button onclick={handleClick}>Click</button>
</div>

<!-- 9. Styles -->
<style>
  button {
    padding: 0.5rem 1rem;
  }
</style>
```

### Naming Conventions

- **Files**: PascalCase for components (`MyElement.svelte`), camelCase for utilities (`utils.ts`)
- **Components**: PascalCase (`MyElement`)
- **Variables/Functions**: camelCase (`handleClick`, `isDisabled`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_LENGTH`)
- **Types/Interfaces**: PascalCase (`MyElementModel`)

### Accessibility

- Use semantic HTML elements
- Provide ARIA labels where needed
- Ensure keyboard navigation works
- Test with axe-core: `bun run test:a11y`
- Target WCAG 2.2 Level AA compliance

## Testing

### Test Requirements

Every element must have:

1. **Controller tests** - Test model/outcome logic
2. **Component tests** - Test rendering and interaction
3. **E2E tests** - Test in real browser
4. **Accessibility tests** - Test with axe-core
5. **Evaluation specs** - YAML-driven comprehensive tests

### Writing Tests

See [testing.md](./testing.md) for detailed guide.

Quick example:

```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import MyElement from './MyElement.svelte';

describe('MyElement', () => {
  it('renders prompt', () => {
    const model = { prompt: '<p>Test?</p>' };
    render(MyElement, { model, env: { mode: 'gather', role: 'student' } });

    expect(screen.getByText('Test?')).toBeInTheDocument();
  });
});
```

## Pull Request Process

### Before Submitting

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/my-element
   ```

2. **Make your changes**

3. **Add tests** for new functionality

4. **Run all checks**:
   ```bash
   bun run lint
   bun run test
   bun run build
   ```

5. **Create a changeset** (if changing packages):
   ```bash
   bun run changeset
   ```

6. **Commit with clear message**:
   ```bash
   git commit -m "feat(my-element): add new assessment element"
   ```

   Follow conventional commits format:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation only
   - `style:` - Code style (formatting, no logic change)
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

### Submit Pull Request

1. **Push to your fork**:
   ```bash
   git push origin feature/my-element
   ```

2. **Open PR** on GitHub

3. **Fill out PR template**:
   - Describe what changed
   - Link related issues
   - Add screenshots for UI changes
   - Note any breaking changes

4. **Wait for review**:
   - Address reviewer feedback
   - Make requested changes
   - CI checks must pass

5. **Merge**:
   - Maintainer will merge when approved
   - Delete branch after merge

### PR Checklist

- [ ] Code follows project style
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] Changeset created (if needed)
- [ ] No breaking changes (or clearly documented)
- [ ] Accessibility requirements met
- [ ] PR description is clear

## Publishing

Packages are published automatically via GitHub Actions when changesets are merged.

See [PUBLISHING.md](./PUBLISHING.md) for details on the release process.

### Creating a Changeset

```bash
bun run changeset
```

Select packages, version bump type (major/minor/patch), and write summary.

This creates a file in `.changeset/` that will be processed on merge to main.

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue with reproduction steps
- **Security**: Email security@your-domain.com (don't open public issue)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to PIE Elements NG! 🎉
