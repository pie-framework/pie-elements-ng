# PIE Elements NG

Modern PIE (Platform Independent Elements) implementation built with Svelte 5, Bun, and Turbo.

## Project Overview

This monorepo contains PIE-compliant assessment elements built with modern tooling:

- **Svelte 5** with Runes for UI components
- **Bun** for fast package management and testing
- **Turbo** for optimized monorepo builds
- **TypeScript** throughout for type safety
- **Vite** for lightning-fast builds
- **Biome** for linting and formatting
- **Playwright** for E2E testing

## What is PIE?

PIE (Platform Independent Elements) is a specification for building portable, interactive assessment items that work across different platforms.

### Unified Component Architecture

**Unlike the original pie-elements**, this project uses a **unified component architecture** where each element is a single component that handles all modes:

1. **Controller** - Server/client-side logic for transformations and scoring
2. **Student Interaction** (gather mode) - Interactive component for learners answering questions
3. **Preview** (view mode) - Read-only display without interaction
4. **Evaluation** (evaluate mode) - Show scoring, feedback, and correct answers
5. **Authoring** (configure mode) - Rich text editing and configuration UI for educators

**Key Difference**: Instead of three separate npm packages (@pie-element/X, @pie-element/X-configure, @pie-element/X-controller), we have **ONE package per element** with mode-switching capabilities.

### Feature Parity Goal

This project aims for **complete feature parity** with the original pie-elements framework, including:

**Core Features:**

- ✅ All QTI 2.2 interaction types (21 total)
- ✅ Rich text editing with TipTap (math support via MathLive + KaTeX)
- ✅ Full authoring/configuration UI
- ✅ Student interaction modes (gather/view/evaluate)
- ✅ WCAG 2.2 Level AA accessibility compliance

**Optional Features:**

- 📋 Print mode (optional but recommended) - Static rendering for paper tests and answer keys
- 📋 Mini players (optional) - Compact preview components for item browsing
- 🚧 Advanced features (audio, keyboard shortcuts, custom styling)

## Project Structure

```
pie-elements-ng/
├── packages/
│   ├── core/                   # Core PIE interfaces
│   ├── multiple-choice/        # Multiple choice element
│   └── lib-*/                  # Shared libraries
└── apps/
    └── example/                # SvelteKit demo app
```

## Getting Started

### Prerequisites

- Bun 1.1.42 or later
- Node.js 20.0.0 or later (for compatibility)

### Installation

```bash
bun install
```

### Development

```bash
# Run all packages in dev mode
bun run dev

# Run example app only
cd apps/example
bun run dev
```

### Building

```bash
# Build all packages
bun run build
```

### Testing

```bash
# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e

# Run evaluation system (comprehensive YAML-driven tests)
bun run evals              # All evaluations
bun run evals:svelte       # Svelte elements only
bun run evals:react        # React elements only
bun run evals:ui           # Interactive UI mode
bun run evals:headed       # Headed browser mode
```

### Linting

```bash
# Check code
bun run lint

# Auto-fix issues
bun run lint:fix
```

## Creating a New Element

```bash
# TODO: CLI coming soon
bun run create-element <element-name>
```

## Evaluation System

PIE Elements NG includes a comprehensive YAML-driven evaluation system for testing elements across 10 dimensions:

1. **Rendering** - Display correctness in all modes
2. **Interactions** - User input handling
3. **Accessibility** - WCAG 2.2 Level AA compliance
4. **State Management** - Session/model changes
5. **Scoring** - Outcome calculations
6. **Browser Compatibility** - Cross-browser support
7. **Performance** - Load time and responsiveness
8. **Configuration** - Config option application
9. **Error Handling** - Invalid input handling
10. **Testing** - Unit test coverage

### Quick Start

```bash
# Run all evaluations
bun run evals

# Run with UI for debugging
bun run evals:ui
```

### Writing Evaluations

See [docs/evals/CONTRIBUTING.md](./docs/evals/CONTRIBUTING.md) for the complete guide.

Quick example:

```yaml
version: 1
component:
  element: "@pie-element/multiple-choice"
  framework: "svelte"

evals:
  - id: "mc/simple/correct-answer"
    severity: "error"
    intent: "Validates correct answer yields score of 1.0"

    steps:
      - action: navigate
        path: "/multiple-choice"

      - action: click
        target:
          description: "Correct choice"
          hint: 'input[value="A"]'

      - action: axe
        expected:
          maxViolations: 0
          wcagLevel: "AA"
```

For more details, see:

- [Evaluation System README](./docs/evals/README.md)
- [Contributing Guide](./docs/evals/CONTRIBUTING.md)
- [YAML Schema](./docs/evals/schema.json)

## Documentation

### Getting Started

- [**USAGE.md**](./docs/USAGE.md) - Quick start guide with installation and usage examples
- [**API_REFERENCE.md**](./docs/API_REFERENCE.md) - Complete API documentation for all interfaces and props

### Development

- [**ARCHITECTURE.md**](./docs/ARCHITECTURE.md) - System design and unified component architecture
- [**CONTRIBUTING.md**](./docs/CONTRIBUTING.md) - Contributing guidelines and development setup
- [**testing.md**](./docs/testing.md) - Testing strategy and tools

### Guides

- [**ACCESSIBILITY.md**](./docs/ACCESSIBILITY.md) - WCAG 2.2 Level AA compliance and testing
- [**THEMING.md**](./docs/THEMING.md) - Customization with DaisyUI themes and CSS variables
- [**TROUBLESHOOTING.md**](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [**rich-text-editor.md**](./docs/rich-text-editor.md) - TipTap editor usage and integration

### Advanced

- [**PUBLISHING.md**](./docs/PUBLISHING.md) - Release workflow and publishing to npm
- [**web-components-strategy.md**](./docs/web-components-strategy.md) - Web Components distribution strategy
- [**print-mode.md**](./docs/print-mode.md) - Print mode implementation guide
- [**mini-players.md**](./docs/mini-players.md) - Compact preview components guide

### Evaluation System

- [**evals/README.md**](./docs/evals/README.md) - Evaluation system overview
- [**evals/CONTRIBUTING.md**](./docs/evals/CONTRIBUTING.md) - Writing evaluation specs
- [**evals/STYLE-TESTING.md**](./docs/evals/STYLE-TESTING.md) - Style and visual regression testing

### Migration

- [**migration/UPSTREAM_SYNC_GUIDE.md**](./docs/migration/UPSTREAM_SYNC_GUIDE.md) - **Complete guide** for syncing from upstream pie-elements and pie-lib

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines on contributing to this project.

## License

MIT
