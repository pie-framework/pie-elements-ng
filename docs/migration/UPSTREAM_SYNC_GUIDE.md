# Upstream Sync Guide: PIE Elements Migration

**Status:** ✅ Active (CLI-based)
**Last Updated:** 2025-01-08

## Table of Contents

1. [Overview](#overview)
2. [Migration Philosophy](#migration-philosophy)
3. Two-Step Process
4. [ESM Compatibility Analysis](#esm-compatibility-analysis)
5. [Syncing Code from Upstream](#syncing-code-from-upstream)
6. [CLI Commands Reference](#cli-commands-reference)
7. [Element Migration Workflow](#element-migration-workflow)
8. [Handling Upstream Changes](#handling-upstream-changes)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide describes the complete process for migrating PIE elements from the upstream [pie-elements](https://github.com/PieLabs/pie-elements) and [pie-lib](https://github.com/PieLabs/pie-lib) repositories to this modern TypeScript/Svelte/React implementation.

### Key Principle

**React packages are largely COPIES of pie-elements and pie-lib.** This means:

- ✅ **React UI components are synced** - they are THE POINT
- ✅ **Controllers are synced** - framework-agnostic business logic
- ✅ **Dependencies should match** - always update to match upstream
- ✅ **Each element is self-contained** - controllers live inside each element package
- ✅ **Code duplication is acceptable** - for self-contained architecture

**Svelte packages** are written from scratch using the same controller pattern, not synced from upstream (since upstream has no Svelte code).

---

## Migration Philosophy

### What We're Building

**PIE Elements NG** is a modern reimplementation supporting **BOTH** Svelte AND React:

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Upstream Repositories                        │
│                                                                 │
│  pie-elements (React + JS)        pie-lib (React + JS)          │
│  ├── React UI                     ├── React components          │
│  ├── Controllers (logic)          ├── Shared utilities          │
│  └── Dependencies                 └── Math/text libraries       │
│                                                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  │ 1. Determine ESM compatibility
                  │ 2. Sync ENTIRE React packages
                  │    (UI + controllers + deps)
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                    pie-element                              │
│                                                                 │
│  📦 REACT PACKAGES (copied from upstream):                      │
│  ├── packages/elements-react/{element}/                         │
│  │   ├── src/delivery/         ← React UI (synced)               │
│  │   ├── src/author/           ← React UI (synced)               │
│  │   └── src/controller/      ← Logic (synced)                  │
│  └── packages/lib-react/{lib}/ ← Shared libs (synced)           │
│                                                                 │
│  ✨ SVELTE PACKAGES (written from scratch):                     │
│  └── packages/elements-svelte/{element}/                        │
│      ├── src/delivery/         ← Svelte UI (new)                 │
│      ├── src/author/           ← Svelte UI (new)                 │
│      └── src/controller/      ← Symlink to React controller     │
│                                                                 │
│  🔧 MODERN INFRASTRUCTURE:                                       │
│  └── Bun, Vite, TypeScript, Turbo, ESM                          │
└─────────────────────────────────────────────────────────────────┘
```text

### Self-Contained Architecture

**Each element package is entirely self-contained:**

- ✅ Controllers live inside each element: `packages/elements-react/{element}/src/controller/`
- ✅ No shared controller packages in `packages/shared/`
- ✅ Code duplication is acceptable for independence
- ✅ Each element can be versioned and deployed independently

---

## Two-Step Process

**IMPORTANT:** Migration is a two-step process:

### Step 1: Determine ESM Compatibility

**Before syncing any code**, analyze which PIE elements support ESM:

```bash
bun run cli upstream:analyze-esm --verbose
```text

This generates `esm-compatible-elements.json` containing:

- ✅ Elements that can be migrated (no ESM blockers)
- ❌ Elements that are blocked (e.g., using Slate v0.x, Enzyme)

**Output example:**

```text
📊 ESM COMPATIBILITY REPORT
======================================================================

📦 Elements:
   Total:              35
   CommonJS-free:      28 ✅  (no CommonJS deps)
   ESM player ready:   22 ✅  (full ESM + exports)
   Blocked:            7 ❌

📚 PIE Lib Packages:
   Total:      15
   Compatible: 12 ✅
   Blocked:    3 ❌

✅ ESM Player Ready (22):
   • multiple-choice
     - type: module ✅
     - exports: . ✅
     - exports: ./controller ✅
     - deps: none
   • hotspot
     - type: module ✅
     - exports: . ✅
     - exports: ./controller ✅
     - deps: @pie-lib/pie-toolbox

⚠️  CommonJS-free but not ESM Player Ready (6):
   • number-line
     ❌ Missing "type": "module"
     ❌ Missing "./controller" export
   ...

❌ Blocked Elements (7):
   • extended-text-entry
     - slate@0.36.0 - Slate v0.x is not ESM compatible
   • math-inline
     - slate@0.36.0 - Slate v0.x is not ESM compatible
   ...
```

### Step 2: Sync Only Compatible Elements

**After analysis**, sync code only from ESM-compatible elements:

```bash
# Sync specific compatible element
bun run cli upstream:sync --element=multiple-choice

# Sync all compatible elements
bun run cli upstream:sync
```

The sync command automatically respects the ESM compatibility report and will warn if you try to sync a blocked element.

---

## ESM Compatibility Analysis

### Why ESM Matters

**ESM (ECMAScript Modules)** is required for modern JavaScript:

- ✅ **Tree-shaking**: Better dead code elimination
- ✅ **Static analysis**: Build-time dependency analysis
- ✅ **Native browser support**: No bundler needed
- ✅ **Future-proof**: Industry standard
- ✅ **Modern tooling**: Vite, Turbo require ESM

**CommonJS blockers** prevent migration and must be resolved first.

### Known ESM Blockers

Common packages that prevent ESM builds:

- **Slate v0.x** (`slate@0.36.x`): Old rich text editor (replaced by TipTap in pie-element)
- **Enzyme**: React testing library (replaced by React Testing Library)
- **Old build tools**: Webpack plugins, outdated Babel presets

### Running ESM Analysis

Runtime probes always run in **deep** mode and **resolve all PIE packages locally** (`@pie-element/*`, `@pie-lib/*`).
Only non-PIE dependencies are fetched from the configured CDN.

```bash
# Analyze all elements with strict ESM validation + deep runtime probes (default)
bun run cli upstream:analyze-esm

# Verbose output with detailed dependency info
bun run cli upstream:analyze-esm --verbose

# Skip ESM player validation (only check CommonJS blockers)
bun run cli upstream:analyze-esm --no-validate-esm-player

# Custom output path
bun run cli upstream:analyze-esm --output=./esm-report.json

# Runtime probe tuning (deep probes are always enabled)
bun run cli upstream:analyze-esm --runtime-max-depth=8 --runtime-max-modules=400

# Custom upstream paths
PIE_ELEMENTS_PATH=/custom/path/pie-elements \
PIE_LIB_PATH=/custom/path/pie-lib \
bun run cli upstream:analyze-esm

# Override local PIE resolution paths (non-PIE deps still come from CDN)
bun run cli upstream:analyze-esm \
  --runtime-local-pie-elements-path=/custom/path/pie-elements \
  --runtime-local-pie-lib-path=/custom/path/pie-lib

# Override CDN base (non-PIE deps only)
bun run cli upstream:analyze-esm --runtime-cdn-base-url=https://esm.sh
```

### ESM Player Validation

**New in Phase 1:** The analysis now validates if elements are compatible with the `pie-esm-player` (browser-native ESM loading).

**Three levels of compatibility:**

1. **❌ Blocked** - Has CommonJS dependencies (cannot migrate)
2. **⚠️ CommonJS-free** - No CommonJS deps but missing ESM package structure
3. **✅ ESM Player Ready** - No CommonJS deps AND proper ESM package structure

**ESM Player Requirements:**

The pie-esm-player requires elements to have:

- ✅ `"type": "module"` in package.json
- ✅ `exports` field with `"."` export pointing to ESM (.js file)
- ✅ `exports` field with `"./controller"` export for controllers
- ⚠️ `"sideEffects": false` (recommended for tree-shaking)

**Why this matters:**

The [pie-esm-player](https://github.com/PieLabs/pie-players/tree/main/packages/pie-esm-player) loads PIE elements dynamically using browser-native ESM with import maps. Elements must have the proper package.json structure to work with this loading mechanism.

**Example package.json for ESM player:**

```json
{
  "name": "@pie-element/multiple-choice",
  "version": "11.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./controller": {
      "types": "./dist/controller/index.d.ts",
      "import": "./dist/controller/index.js"
    }
  },
  "sideEffects": false
}
```

### Understanding the Report

The analysis generates a JSON report with:

```typescript
interface CompatibilityReport {
  // Elements with no CommonJS dependencies
  elements: string[];

  // PIE Lib packages ready to migrate
  pieLibPackages: string[];

  // Elements blocked by CommonJS (with reasons)
  blockedElements: Record<string, string[]>;

  // NEW: Elements ready for pie-esm-player
  esmPlayerReady: string[];

  // NEW: Detailed ESM player validation per element
  esmValidation: Record<string, {
    compatible: boolean;          // ESM player ready?
    packageJson: {
      hasTypeModule: boolean;     // "type": "module"
      hasExportsField: boolean;   // "exports" field exists
      hasMainExport: boolean;     // "." export exists
      hasControllerExport: boolean; // "./controller" export exists
      sideEffectsFree: boolean;   // "sideEffects": false
      mainExportIsEsm: boolean;   // Main export points to .js
      controllerExportIsEsm: boolean; // Controller export points to .js
    };
    blockers: string[];           // What prevents ESM player compatibility
    warnings: string[];           // Non-blocking issues
  }>;

  // Detailed per-element analysis
  elementDetails: Record<string, {
    compatible: boolean;
    directDeps: string[];      // All direct dependencies
    pieLibDeps: string[];      // PIE Lib dependencies
    blockers: string[];        // What blocks ESM
  }>;

  // Detailed per-lib analysis
  pieLibDetails: Record<string, {
    compatible: boolean;
    usedBy: string[];          // Which elements use this
    blockers: string[];        // What blocks ESM
  }>;

  summary: {
    totalElements: number;
    compatibleElements: number;  // CommonJS-free
    blockedElements: number;     // Has CommonJS deps
    esmPlayerReady: number;      // NEW: ESM player ready
  };
}
```

### Handling Blockers

#### Direct Blockers

Element directly depends on incompatible package:

```json
{
  "extended-text-entry": {
    "blockers": [
      "slate@0.36.0 - Slate v0.x is not ESM compatible"
    ]
  }
}
```

**Solution:** Upgrade or replace the blocking dependency in upstream.

#### Transitive Blockers

Element's pie-lib dependencies have blockers:

```json
{
  "multiple-choice": {
    "blockers": [
      "@pie-lib/editable-html -> slate@0.36.0 - Slate v0.x is not ESM compatible"
    ]
  }
}
```

**Solution:** Fix the pie-lib package first, then re-analyze.

#### High-Impact Blockers

Some pie-lib packages block multiple elements:

```json
{
  "editable-html": {
    "usedBy": ["multiple-choice", "text-entry", "hotspot"],
    "blockers": ["slate@0.36.0 - Slate v0.x is not ESM compatible"]
  }
}
```

**Strategy:** Fix high-impact pie-lib packages first to unblock many elements at once.

### Resolving Blockers Upstream

To fix blockers, make changes in upstream repositories:

**For pie-lib packages:**

```bash
cd ../pie-lib/packages/editable-html

# Example: Replace Slate v0.36 with TipTap
bun remove slate slate-react
bun add @tiptap/core @tiptap/react

# Update imports and code
# Test thoroughly
# Create PR in pie-lib
```

**For element packages:**

```bash
cd ../pie-elements/packages/extended-text-entry

# Example: Replace Enzyme with React Testing Library
bun remove enzyme enzyme-adapter-react-16
bun add --dev @testing-library/react @testing-library/jest-dom

# Update tests
# Create PR in pie-elements
```

**After fixing upstream:**

```bash
cd pie-element
bun run cli upstream:analyze-esm
# Check if more elements are now compatible
```

---

## Syncing Code from Upstream

### Prerequisites

**1. Clone upstream repositories as siblings:**

```bash
cd ~/projects
git clone https://github.com/PieLabs/pie-elements.git
git clone https://github.com/PieLabs/pie-lib.git

# Directory structure:
# ~/projects/
#   pie-elements/
#   pie-lib/
#   pie-element/
```

**2. Build the CLI:**

```bash
cd pie-element/tools/cli
bun install
bun run build
```

### What Gets Synced

#### Controllers (Always Synced)

**Framework-agnostic business logic:**

- ✅ Synced to `packages/elements-react/{element}/src/controller/`
- ✅ Converted from JavaScript to TypeScript (`.js` → `.ts`)
- ✅ Self-contained within each element
- ✅ Includes: `index.ts`, `defaults.ts`, `utils.ts`

**What controllers do:**

- `model(question, session, env)` - Transform model for rendering
- `outcome(question, session, env)` - Calculate score and feedback

#### React UI Components (Synced by default)

**React components ARE the point - they should be synced:**

- ✅ Synced to `packages/elements-react/{element}/src/delivery/` (student/teacher UI)
- ✅ Synced to `packages/elements-react/{element}/src/author/` (authoring UI)
- ✅ Converted from `.jsx` to `.tsx`
- ✅ Updated imports to use pie-element libraries

**Philosophy:** React packages are COPIES of upstream (not custom implementations).

#### PIE Lib Packages (Auto-synced)

**Shared utilities and UI components:**

- ✅ Synced to `packages/lib-react/{package}/`
- ✅ Includes shared UI components, math rendering, etc.
- ✅ Converted to TypeScript
- ✅ Automatically includes transitive `@pie-lib/*` dependencies required by synced elements

#### Dependencies

**Dependencies should match upstream and always be updated:**

- ✅ Copy `package.json` dependencies from upstream
- ✅ Update to match upstream versions
- ✅ Only exception: ESM-incompatible packages (must be fixed first)

#### What's NOT Synced

- ❌ Tests (we write our own evaluation specs)
- ❌ Build configuration (we use Vite, not upstream tools)
- ❌ Svelte UI (written from scratch, no Svelte in upstream)

### Sync Commands

#### Dry Run (Preview Changes)

```bash
# Preview what will be synced
bun run cli upstream:sync --dry-run

# Preview specific element
bun run cli upstream:sync --element=multiple-choice --dry-run
```

#### Sync (Default)

```bash
# Sync all compatible elements (controllers + React UI + demos)
bun run cli upstream:sync

# Sync a specific compatible element
bun run cli upstream:sync --element=multiple-choice
```

### JavaScript to TypeScript Conversion

The sync process automatically converts JavaScript to TypeScript:

**File conversions:**

- `.js` → `.ts`
- `.jsx` → `.tsx`

**TypeScript handling:**

- Adds `@ts-nocheck` header for gradual migration
- Preserves original JavaScript logic
- Allows incremental type improvements

**Example:**

```typescript
// @ts-nocheck
// Synced from pie-elements commit abc1234
// Original file: packages/multiple-choice/controller/src/index.js

import defaults from './defaults';

export function model(question, session, env) {
  // ... synced controller logic
}
```

### Git History Preservation

Synced files include header comments tracking upstream commits:

```typescript
// @ts-nocheck
// Synced from pie-elements
// Original file: packages/multiple-choice/controller/src/index.js
// Upstream commit: abc1234567890
// Sync date: 2025-01-08
```

---

## CLI Commands Reference

### Installation

```bash
cd tools/cli
bun install
bun run build

# Or use directly from project root
bun run cli <command>
```

### upstream:analyze-esm

**Analyze ESM compatibility** (Step 1 of migration):

```bash
# Basic analysis
bun run cli upstream:analyze-esm

# Verbose output
bun run cli upstream:analyze-esm --verbose

# Custom output
bun run cli upstream:analyze-esm --output=./report.json

# Custom paths
PIE_ELEMENTS_PATH=/path/pie-elements \
PIE_LIB_PATH=/path/pie-lib \
bun run cli upstream:analyze-esm
```

### upstream:sync

**Sync code from upstream** (Step 2 of migration):

```bash
# Dry run (preview)
bun run cli upstream:sync --dry-run

# Sync specific element
bun run cli upstream:sync --element=multiple-choice

# Sync all compatible elements (controllers + React UI + demos)
bun run cli upstream:sync
```

### upstream:check

**Check for upstream changes:**

```bash
# Check all elements
bun run cli upstream:check

# Verbose output
bun run cli upstream:check --verbose

# Check specific element
bun run cli upstream:check --element=multiple-choice
```

**What it does:**

- Compares file modification dates
- Lists newer upstream files
- Shows file size differences

### upstream:track

**Track commit history:**

```bash
# Show commits since last check
bun run cli upstream:track

# Record current state
bun run cli upstream:track --record
```

**What it does:**

- Tracks commit SHAs from upstream
- Shows new commits since last check
- Helps identify what needs review

### upstream:deps

**Compare dependencies:**

```bash
# Compare versions
bun run cli upstream:deps

# Verbose output
bun run cli upstream:deps --verbose
```

**What it does:**

- Tracks shared libraries (katex, mathlive, dompurify, tiptap)
- Shows version mismatches
- Recommends updates

### packages:init-synced-elements

**Initialize package.json files for synced React elements:**

```bash
# Initialize all elements (creates package.json and vite.config.ts)
bun run cli packages:init-synced-elements

# Preview without making changes
bun run cli packages:init-synced-elements --dry-run

# Initialize specific element
bun run cli packages:init-synced-elements --element=categorize

# Verbose output
bun run cli packages:init-synced-elements --verbose
```

**What it does:**

- Creates package.json files for synced React elements
- Reads upstream package.json to extract dependencies
- Maps @pie-lib dependencies to workspace:*
- Creates vite.config.ts for building
- Skips elements that already have package.json

**When to use:**

- After syncing new elements with `upstream:sync`
- When setting up a newly synced element package
- When you need to regenerate package configuration

### Configuration

**Default paths:**

```typescript
const config = {
  pieElements: '../pie-elements',
  pieLib: '../pie-lib',
  pieElementsNg: process.cwd(),
};
```

**Override with environment variables:**

```bash
export PIE_ELEMENTS_PATH=/custom/path/pie-elements
export PIE_LIB_PATH=/custom/path/pie-lib
```

---

## Element Migration Workflow

### Complete Migration Process

**For each element, follow these steps:**

#### 1. Analyze ESM Compatibility

```bash
cd pie-element

# Run analysis
bun run cli upstream:analyze-esm --verbose

# Check specific element
cat esm-compatible-elements.json | jq '.elementDetails["multiple-choice"]'
```

**Decision:**

- ✅ **Compatible** → Proceed to step 2
- ❌ **Blocked** → Fix blockers upstream first

#### 2. Sync React Package from Upstream

```bash
# Preview what will be synced
bun run cli upstream:sync --element=multiple-choice --dry-run

# Sync entire element package (React UI + controller + demos)
bun run cli upstream:sync --element=multiple-choice

# Synced to:
# packages/elements-react/multiple-choice/
# ├── src/
# │   ├── delivery/          ← React UI (synced)
# │   ├── author/            ← React UI (synced)
# │   └── controller/       ← Business logic (synced)
# ├── package.json          ← Dependencies (synced)
# └── vite.config.ts        ← Our build config
```

#### 3. Review and Test React Package

```bash
# Review changes
git diff packages/elements-react/multiple-choice/

# Install dependencies
bun install

# Build
cd packages/elements-react/multiple-choice
bun run build

# Test
bun test
```

#### 4. Implement Svelte UI (Optional)

**Svelte is written from scratch, not synced. Note the new directory structure with delivery/ and author/ subdirectories:**

```svelte
<!-- packages/elements-svelte/multiple-choice/src/delivery/index.svelte -->
<script lang="ts">
  import type { MultipleChoiceModel, SessionData } from '../types';
  import type { PieEnvironment } from '@pie-element/core';

  interface Props {
    model: MultipleChoiceModel;
    session?: SessionData;
    env: PieEnvironment;
  }

  let { model, session = $bindable({ value: null }), env }: Props = $props();

  // Use same controller as React (symlink or shared)
  import { model as controllerModel } from '../../../elements-react/multiple-choice/src/controller';

  let viewModel = $derived.by(async () => {
    return await controllerModel(model, session, env);
  });

  function handleChoiceSelect(value: string) {
    session = { value };
  }
</script>

<div class="multiple-choice">
  <div class="prompt" bind:innerHTML={model.prompt}></div>

  {#each viewModel.choices as choice}
    <label>
      <input
        type={model.choiceMode === 'radio' ? 'radio' : 'checkbox'}
        value={choice.value}
        checked={session?.value === choice.value}
        on:change={() => handleChoiceSelect(choice.value)}
        disabled={viewModel.disabled}
      />
      <span bind:innerHTML={choice.label}></span>
    </label>
  {/each}
</div>
```

#### 5. Write Evaluations

```yaml
# packages/elements-react/multiple-choice/evals/basic.yaml
version: 1
component:
  element: "@pie-element/multiple-choice"
  framework: "react"

evals:
  - id: "mc/rendering/displays-prompt"
    severity: "error"
    intent: "Verifies prompt renders correctly"
    steps:
      - action: navigate
        path: "/multiple-choice"
      - action: snapshot
        expected:
          contains: "What is 2 + 2?"

  - id: "mc/interactions/select-choice"
    severity: "error"
    intent: "Verifies choice selection works"
    steps:
      - action: click
        target:
          description: "Choice B"
          hint: 'input[value="b"]'
      - action: evaluate
        expression: "session.value === 'b'"
        expected: true

  - id: "mc/accessibility/keyboard-navigation"
    severity: "error"
    intent: "Verifies WCAG 2.2 Level AA compliance"
    steps:
      - action: press
        key: "Tab"
      - action: press
        key: "Space"
      - action: axe
        expected:
          maxViolations: 0
          wcagLevel: "AA"
```

**Run evaluations:**

```bash
bun run evals:react
```

#### 6. Documentation

```markdown
# Multiple Choice Element

## Installation

\`\`\`bash
bun add @pie-element/multiple-choice
\`\`\`

## Usage

### React

\`\`\`tsx
import { MultipleChoice } from '@pie-element/multiple-choice';

<MultipleChoice
  model={model}
  session={session}
  env={env}
  onSessionChange={setSession}
/>
\`\`\`

### Svelte

\`\`\`svelte
<script>
  import { MultipleChoice } from '@pie-element/multiple-choice';

  let session = $state({ value: null });
</script>

<MultipleChoice {model} bind:session {env} />
\`\`\`
```

#### 7. Update Tracking

```bash
# Record successful migration
bun run cli upstream:track --record
```

### Migration Checklist

Use this checklist for each element:

#### Pre-Migration

- [ ] Run `bun run cli upstream:analyze-esm`
- [ ] Verify element is ESM-compatible
- [ ] Resolve any ESM blockers upstream
- [ ] Review upstream changes with `bun run cli upstream:check`

#### React Package

- [ ] Sync React package: `bun run cli upstream:sync --element=X`
- [ ] Review synced code for correctness
- [ ] Verify dependencies match upstream
- [ ] Test React UI in all modes (student, authoring, view, evaluate)
- [ ] Build successfully: `bun run build`

#### Svelte Implementation (Optional)

- [ ] Create `student/` mode component
- [ ] Create `authoring/` mode component
- [ ] Reuse synced controller
- [ ] Add proper TypeScript types
- [ ] Implement accessibility features
- [ ] Test Svelte UI

#### Testing

- [ ] Write evaluation specs (10 dimensions)
- [ ] Test all modes (gather, view, evaluate, authoring)
- [ ] Test accessibility (WCAG 2.2 Level AA)
- [ ] Test keyboard navigation
- [ ] Test screen readers
- [ ] Add unit tests for controller

#### Documentation

- [ ] Write element README
- [ ] Add usage examples (React + Svelte)
- [ ] Document props and API
- [ ] Add to main docs

#### Publishing

- [ ] Add to package.json exports
- [ ] Configure build in vite.config.ts
- [ ] Add to Turbo pipeline
- [ ] Create changeset for release
- [ ] Verify build works

---

## Handling Upstream Changes

### Weekly Workflow

**Check for upstream changes regularly:**

```bash
# 1. Check for changes
bun run cli upstream:check --verbose

# 2. Review what changed in upstream
cd ../pie-elements
git log --oneline packages/multiple-choice/ | head -10
git show <commit-sha>

# 3. Determine if syncing is appropriate
# ✅ Bug fixes in controllers → Sync
# ✅ Logic improvements → Sync
# ✅ React UI improvements → Sync (they're THE POINT!)
# ✅ New features → Sync
# ✅ Dependency updates → Sync (after ESM check)
# ⚠️ Breaking changes → Evaluate carefully

# 4. Re-run ESM analysis if dependencies changed
cd ../pie-element
bun run cli upstream:analyze-esm --element=multiple-choice

# 5. Sync if still compatible
bun run cli upstream:sync --element=multiple-choice

# 6. Review changes
git diff packages/elements-react/multiple-choice/

# 7. Test
bun test packages/elements-react/multiple-choice
bun run evals

# 8. Commit
git add packages/elements-react/multiple-choice
git commit -m "fix(multiple-choice): sync upstream improvements

Synced from pie-elements commit abc1234
- Fixed partial credit calculation
- Updated React UI styling
- Bumped dependencies"

# 9. Update tracking
bun run cli upstream:track --record
```

### Handling Breaking Changes

If upstream makes breaking changes:

**1. Review carefully:**

```bash
cd ../pie-elements
git show <commit-sha>
git log --oneline packages/multiple-choice/ | head -20
```

**2. Determine impact:**

- Does it affect controller API?
- Does it change model structure?
- Does it require UI updates?
- Does it affect consumers?

**3. Create a plan:**

- Can we sync directly?
- Do we need to adapt Svelte implementation?
- Do we need to coordinate with upstream?
- Do we need a major version bump?

**4. Make changes:**

```bash
# Sync element
bun run cli upstream:sync --element=multiple-choice

# Update Svelte if needed
# Update tests
# Update documentation
```

**5. Use Changesets for versioning:**

```bash
bun changeset
# Select "major" for breaking changes
```

### Selective Syncing

**When to sync:**

- ✅ Bug fixes
- ✅ Logic improvements
- ✅ New features
- ✅ React UI improvements
- ✅ Dependency updates (if ESM-compatible)
- ✅ Performance optimizations
- ✅ Accessibility improvements

**What NOT to sync:**

- ❌ Upstream build configuration (we use Vite)
- ❌ Upstream tests (we use evaluations)
- ❌ ESM-incompatible dependencies (fix upstream first)

---

## Best Practices

### 1. Two-Step Process Always

**Never skip ESM analysis:**

```bash
# ✅ Good: Always analyze first
bun run cli upstream:analyze-esm
bun run cli upstream:sync --element=X

# ❌ Bad: Syncing without checking compatibility
bun run cli upstream:sync --element=X  # Might fail!
```

### 2. Sync React Packages Completely

**React packages are COPIES - sync everything:**

```bash
# ✅ Good: Sync entire React package
bun run cli upstream:sync --element=X

# ❌ Bad: Cherry-picking parts
# (Don't manually copy just controller or just UI)
```

### 3. Keep Dependencies in Sync

**Dependencies should match upstream:**

```bash
# After syncing, check dependencies
cd packages/elements-react/multiple-choice
cat package.json

# Update if needed
bun install
```

### 4. Test After Every Sync

**Always test synced code:**

```bash
# Build
bun run build

# Unit tests
bun test

# Evaluations
bun run evals

# Manual testing
bun run dev
```

### 5. Regular Upstream Checks

**Check weekly for upstream changes:**

```bash
# Weekly routine
bun run cli upstream:check
bun run cli upstream:analyze-esm  # If dependencies changed
bun run cli upstream:track --record
```

### 6. Self-Contained Architecture

**Each element is independent:**

- ✅ Controllers in `packages/elements-react/{element}/src/controller/`
- ✅ No shared controller packages
- ✅ Code duplication is acceptable
- ✅ Independent versioning

```bash
# ❌ Wrong: Don't sync to shared location
# packages/shared/multiple-choice-controller/  # OLD, WRONG

# ✅ Right: Sync to element package
# packages/elements-react/multiple-choice/src/controller/  # CORRECT
```

### 7. Document Divergences

If you intentionally diverge from upstream:

```typescript
// NOTE: Diverged from upstream
// Reason: Upstream uses MathJax, we use MathLive
// Decision: 2025-01-08
// Issue: #123
```

### 8. Coordinate with Upstream

For significant changes:

1. Discuss in pie-elements GitHub discussions
2. Create RFC issue outlining approach
3. Get buy-in from maintainers
4. Make changes incrementally
5. Contribute fixes back to upstream when possible

---

## Troubleshooting

### "pie-elements not found"

**Problem:** CLI can't find upstream repositories.

**Solution:**

```bash
# Ensure repos are cloned as siblings
ls -la ..
# Should show: pie-elements/, pie-lib/, pie-element/

# Or set environment variables
export PIE_ELEMENTS_PATH=/custom/path/pie-elements
export PIE_LIB_PATH=/custom/path/pie-lib
```

### Element Shows as Blocked

**Problem:** Element is marked as ESM-incompatible.

**Solution:**

```bash
# 1. Check why it's blocked
cat esm-compatible-elements.json | jq '.elementDetails["your-element"]'

# 2. Identify blockers
# Output shows: "slate@0.36.0 - Slate v0.x is not ESM compatible"

# 3. Fix upstream (see "Resolving Blockers Upstream" section)
cd ../pie-elements/packages/your-element
bun remove slate
bun add @tiptap/core  # or other ESM-compatible alternative

# 4. Re-analyze
cd ../../../pie-element
bun run cli upstream:analyze-esm

# 5. Sync if now compatible
bun run cli upstream:sync --element=your-element
```

### False Positives in ESM Analysis

**Problem:** Element marked as blocked but you know it's compatible.

**Solution:**

```bash
# 1. Check the report
cat esm-compatible-elements.json | jq '.elementDetails["your-element"]'

# 2. Verify actual dependencies
cd ../pie-elements/packages/your-element
cat package.json | jq '.dependencies'

# 3. If blocker pattern is wrong, update CLI
cd ../../../pie-element/tools/cli
# Edit src/commands/upstream/analyze-esm.ts
# Update ESM_BLOCKERS array

# 4. Rebuild CLI
bun run build

# 5. Re-analyze
cd ../..
bun run cli upstream:analyze-esm
```

### Sync Fails with Type Errors

**Problem:** Synced TypeScript code has type errors.

**Solution:**

Synced files include `@ts-nocheck` for gradual migration:

```typescript
// @ts-nocheck  ← This allows gradual typing
```

To improve types gradually:

```bash
# 1. Remove @ts-nocheck from one file
# 2. Add proper types
# 3. Test
bun run build

# 4. Commit
git commit -m "types(multiple-choice): add types to controller"
```

### Build Failures

**Problem:** Element won't build.

**Solution:**

```bash
# 1. Check vite.config.ts
cat packages/elements-react/multiple-choice/vite.config.ts

# 2. Verify imports resolve
cd packages/elements-react/multiple-choice
bun run build 2>&1 | grep "Cannot find"

# 3. Install dependencies
bun install

# 4. Check for circular dependencies
bun run build --verbose
```

### Missing Elements in Analysis

**Problem:** Element not appearing in ESM analysis.

**Solution:**

Elements might be filtered out:

```typescript
// CLI filters these:
- 'pie-models' (not an element)
- 'deprecated' packages
- Packages with 'tool' in name
```

Check if element exists:

```bash
ls ../pie-elements/packages/your-element/package.json
```

### Dependency Conflicts

**Problem:** Dependency versions conflict between elements.

**Solution:**

```bash
# 1. Check what upstream uses
cd ../pie-elements/packages/multiple-choice
cat package.json | jq '.dependencies.react'

# 2. Match upstream version
cd ../../../pie-element/packages/elements-react/multiple-choice
bun add react@<upstream-version>

# 3. Update lockfile
bun install
```

---

## Maintenance Schedule

### Daily

- [ ] Monitor CI builds
- [ ] Review PRs
- [ ] Address test failures

### Weekly

- [ ] Run `bun run cli upstream:check`
- [ ] Review upstream changes
- [ ] Run `bun run cli upstream:analyze-esm` (if deps changed)
- [ ] Sync relevant updates
- [ ] Record tracking: `bun run cli upstream:track --record`

### Monthly

- [ ] Run `bun run cli upstream:deps`
- [ ] Update dependencies if needed
- [ ] Run full test suite
- [ ] Review evaluation coverage
- [ ] Update documentation

### Quarterly

- [ ] Review migration progress
- [ ] Update element priority list
- [ ] Plan next quarter's elements
- [ ] Coordinate with upstream maintainers
- [ ] Review ESM compatibility improvements

---

## Related Documents

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines
- [CLI README](../../tools/cli/README.md) - Detailed CLI usage

---

## Summary: Key Takeaways

1. **Two-step process:**
   - Step 1: `bun run cli upstream:analyze-esm` (determine compatibility)
   - Step 2: `bun run cli upstream:sync` (sync compatible code)

2. **React packages are COPIES:**
   - Sync React UI components (they're THE POINT!)
   - Sync controllers
   - Sync dependencies (match upstream)

3. **Self-contained architecture:**
   - Controllers live in each element package
   - No shared controller packages
   - Code duplication is acceptable

4. **Dependencies must match:**
   - Always update to match upstream
   - Only exception: ESM blockers (fix upstream first)

5. **Test thoroughly:**
   - Run evaluations after every sync
   - Test all modes (student, authoring, view, evaluate)
   - Verify accessibility (WCAG 2.2 Level AA)

---

**Remember:** We're building a modern, maintainable implementation while staying in sync with upstream improvements. Quality and correctness matter more than speed.
