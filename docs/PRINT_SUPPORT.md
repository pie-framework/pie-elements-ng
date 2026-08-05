# Print Support in PIE Elements

This document explains the print architecture and how the two different print players work together.

## Print Rendering Options

### Do You Need a Print Player?

**Short answer:** Not always! Print components are self-contained and work with regular players.

**Print components are just delivery components with transformations:**
- They call `preparePrintModel()` internally
- They render using the same delivery component
- You can render them with any player by passing appropriate props

**Use print players when:**
- ✅ You want explicit print-focused APIs (`role` instead of complex env)
- ✅ You need multi-element items (passage + questions)
- ✅ You have markup strings from a CMS
- ✅ You want to match production patterns (pieoneer, content systems)

**Don't need print players if:**
- ✅ You can use the interactive player with print-appropriate props
- ✅ You're rendering single elements
- ✅ You have direct access to components (not markup strings)

## Two Print Players, Two Use Cases

### 1. Element-Level Print Player (Development)

**Package:** `@pie-element/element-player` (this repository)
**Component:** `<pie-element-player view="print">`
**Purpose:** Testing and developing individual element print views

```html
<pie-element-player
  view="print"
  element-name="multiple-choice"
  role="student"
  model={model}
></pie-element-player>
```

**Use Cases:**
- Element development and testing
- Element documentation
- Single element demos
- Quick print preview during development

**Location:** [packages/element-player/src/players/PieElementPlayer.svelte](../packages/element-player/src/players/PieElementPlayer.svelte)

### 2. Item-Level Print Player (Production)

**Package:** `@pie-players/pie-print-player` (pie-players repository)
**Component:** `<pie-print>`
**Purpose:** Production rendering of complete assessment items

```html
<pie-print config={itemConfig}></pie-print>
```

Where `itemConfig` includes:
- `item.markup` - HTML with multiple elements
- `item.elements` - Package version map
- `item.models` - Array of element models
- `options.role` - student/instructor

**Use Cases:**
- Production applications (pieoneer, content delivery)
- Multi-element assessments (passage + questions)
- Markup-driven rendering
- Floater elements (rubrics, standalone components)

**Location:** `packages/print-player` in the `pie-players` repository.

> Note: this repo also contains a `packages/print-player` (`@pie-element/print-player`).
> It is **superseded** — its resolver loads `dist/print/index.js` (the bundler
> artifact, which is not browser-loadable) and it does not inject a React import
> map. Use `@pie-players/pie-print-player` for production print.

## Print Element Architecture

**Current Coverage**: Print support is available for 10 out of 28 elements. Print components are being added incrementally as elements are developed.

Each element package can include a print export:

```
packages/elements-react/multiple-choice/
├── src/
│   ├── delivery/           # Interactive component
│   ├── author/             # Configuration UI
│   ├── controller/         # Business logic
│   └── print/              # Print component
│       └── index.tsx       # Print custom element
└── package.json
```

### Print Component Structure

Print components are **self-contained** and handle their own transformations:

```typescript
// packages/elements-react/multiple-choice/src/print/index.tsx

const preparePrintModel = (model, opts) => {
  const instr = opts.role === 'instructor';

  return {
    ...model,
    disabled: true,              // Disable all interactions
    lockChoiceOrder: true,       // Lock randomization
    alwaysShowCorrect: instr,    // Show answers for instructors
    animationsDisabled: true,    // No animations
    // ... other print-specific transformations
  };
};

export default class MultipleChoicePrint extends HTMLElement {
  set model(m) {
    const printModel = preparePrintModel(m, this._options);
    // Render with delivery component
    this._root.render(<Main model={printModel} session={{}} />);
  }

  set options(o) {
    this._options = o;
  }
}
```

**Key Points:**
- Each print component exports a custom element class
- `preparePrintModel()` handles print-specific transformations
- Renders using the existing delivery component
- Respects `options.role` for answer visibility
- No external orchestration needed for single elements

## How the Print Bundle Is Built

Print is bundled by **Vite**, per element package, from the single
`src/print/index.tsx` entry. Three artifacts are produced:

| Artifact | Built by | Purpose |
| --- | --- | --- |
| `dist/print/index.js` | the package's `vite.config.ts` | Node / bundler ESM. Keeps **bare imports** (`@pie-element/*`, `@pie-lib/*`, …). Loads in a browser **only when the host resolves them** — via a full import map or a bundler. Not self-contained. |
| `dist/browser/print/index.js` | `tools/vite/element-browser.config.ts` | Browser ESM. **This is what the item-level `@pie-players/pie-print-player` loads.** Self-contained except for React (only `react` / `react-dom` stay external, resolved via an import map the player injects). |
| `module/print.js` | `tools/vite/element-legacy-print.config.ts` (React) / `tools/vite/svelte-element-legacy-print.config.ts` (Svelte) | Browser ESM. **This is what the legacy `@pie-framework/pie-print` client loader requests** (`https://cdn.jsdelivr.net/npm/<pkg>/module/print.js`, loaded with a bare `import(url)` and **no import map at all**). Fully self-contained — React included, zero bare specifiers. See [`docs/prds/legacy-print-compatibility/PRD.md`](./prds/legacy-print-compatibility/PRD.md). |

Only packages that already have `src/print/index.ts(x)` produce the `module/print.js` artifact; the build config is a no-op (exit 0, nothing emitted) for every other package, so the same build invocation runs safely across all packages without per-package special-casing.

### Self-contained except for React

The browser build externalizes **only** React, per
`tools/vite/browser-esm-policy.json`:

```json
{
  "allowedBareImports": [
    "react", "react/jsx-runtime", "react/jsx-dev-runtime",
    "react-dom", "react-dom/client"
  ],
  "sharedDependencyVersions": { "react": "18.2.0", "react-dom": "18.2.0" }
}
```

Everything else the print module needs — `@pie-lib/*` (render-ui,
correct-answer-toggle, icons, translator), math rendering (including MathJax),
lodash, MUI, Emotion, and any private child elements (e.g. EBSR's internal
multiple-choice) — is **inlined** into the bundle's own chunks.

React stays external because it must be a single shared instance on the page.
The item-level player supplies it at load time through an injected **import
map** that resolves `react` / `react-dom` to one pinned singleton
(React 18.2.0).

### Classic `pie-elements` vs `pie-elements-ng`

|  | classic `pie-elements` | `pie-elements-ng` (`dist/browser/print`) | `pie-elements-ng` (`module/print.js`) |
| --- | --- | --- | --- |
| Bundler | `pslb` | Vite | Vite |
| Print artifact | `module/print.js` | `dist/browser/print/index.js` | `module/print.js` |
| Shared at runtime | React **and** a broad set of libs (MUI, render-ui, correct-answer-toggle, math-rendering) via shared DLL modules (`@pie-lib/shared-module`, `@pie-lib/math-rendering-module`) | **Only React** (`react` / `react-dom` / JSX runtimes) | **Nothing** |
| Everything else | provided by the shared modules at runtime | inlined into the element's own print bundle | inlined, including React |
| React provided by | shared DLL modules | an import map injected by the player | inlined into the bundle |
| Loaded by | `@pie-framework/pie-print` (bare `import()`, no import map) | `@pie-players/pie-print-player` (injects a React import map) | `@pie-framework/pie-print` (bare `import()`, no import map) |

`module/print.js` exists specifically so the **unmodified, currently-deployed** `@pie-framework/pie-print` client loader — which never injects an import map — can load `pie-elements-ng` print bundles at the same CDN path convention it already uses for classic elements. It ships **alongside**, not instead of, `dist/browser/print/index.js`.

## When to Use Which Approach

### Use Interactive Player (No Print Player Needed)
✅ Single element rendering
✅ Have direct component access
✅ Simple use cases
✅ Can pass print-appropriate props directly

Example:
```html
<pie-element-player
  view="delivery"
  element-name="multiple-choice"
  model={{ ...model, disabled: true }}
  session={{}}
></pie-element-player>
```

### Use Element-Level Print Player
✅ Explicit print intent in code
✅ Cleaner API (role vs complex env)
✅ Element development/testing
✅ Print-focused demos

Example:
```html
<pie-element-player
  view="print"
  element-name="multiple-choice"
  role="student"
  model={model}
></pie-element-player>
```

### Use Item-Level Print Player (Required For)
✅ **Multi-element items** (passage + questions + rubrics)
✅ **Markup strings** from CMS/database
✅ **Production applications** (pieoneer pattern)
✅ **Floater elements** (not in markup)
✅ **Dynamic CDN loading**

Example:
```html
<pie-print config={itemConfig}></pie-print>
```

## API Comparison

| Feature | Element-Level | Item-Level |
|---------|---------------|------------|
| **Package** | `@pie-element/element-player` | `@pie-players/pie-print-player` |
| **Tag** | `<pie-element-player view="print">` | `<pie-print>` |
| **Input** | Element name + model | Full item config |
| **Markup** | Not used | HTML string with elements |
| **Elements** | Single | Multiple |
| **Loading** | Import maps | Dynamic CDN imports |
| **Registration** | Fixed tag names | Hash-based unique names |
| **Use Case** | Development | Production |

## Demo Integration

The element-demo app uses the element-level player:

```svelte
<!-- apps/element-demo/src/lib/element-player/components/PrintView.svelte -->
<pie-element-player
  view="print"
  element-name={elementName}
  role={role}
  model={model}
></pie-element-player>
```

This provides:
- Consistent API with interactive demos
- Easy role switching (student/instructor)
- Automatic math rendering
- Clean, focused testing environment

## Migration Notes

### From @pie-framework/pie-print

The new item-level player (`@pie-players/pie-print-player`) is a drop-in replacement:

```diff
- <script src="https://cdn.jsdelivr.net/npm/@pie-framework/pie-print@2.7.0/lib/pie-print.js"></script>
+ <script src="https://cdn.jsdelivr.net/npm/@pie-players/pie-print-player/dist/print-player.js"></script>
```

The `<pie-print>` API is the same; the URL resolution differs. `pie-elements-ng`
packages are loaded from the **browser** print artifact (`dist/browser/print`),
not the bundler-facing `dist/print`. The default resolver already does this, so
no `resolve` override is needed for standard packages. To load from a custom
host:

```javascript
player.resolve = (tagName, pkg) => {
  const [_, name, version] = pkg.match(/@pie-element\/(.*?)@(.*)/);
  return Promise.resolve({
    tagName,
    pkg,
    // Browser ESM artifact (self-contained except React)
    url: `https://cdn.jsdelivr.net/npm/@pie-element/${name}@${version}/dist/browser/print/index.js`,
    module: true,
    loader: 'browser-esm',
  });
};
```

> Note: `dist/print/index.js` also exists and *can* be loaded in a browser, but
> it is **not self-contained** — its bare `@pie-element/*` / `@pie-lib/*` imports
> must be resolved by a full import map or a bundler, and loading the `@pie-lib`
> graph at runtime exposes it to transitive version mismatches. The player uses
> `dist/browser/print/index.js`, which only needs a React import map.

### Print player options

- Custom elements use the same `model` / `options` pattern and `preparePrintModel(model, opts)`.
- Use `opts.role` (`'student'` | `'instructor'`) for answer visibility and similar behavior.

## Development Workflow

### Testing Print Views Locally

1. **Start the demo server:**
   ```bash
   bun cli dev:demo multiple-choice
   ```

2. **Navigate to print route:**
   ```
   http://localhost:5173/multiple-choice/print
   ```

3. **Toggle between student/instructor roles**
   - Student: Shows questions only
   - Instructor: Shows answers and rationales

4. **The demo uses `<pie-element-player view="print">` automatically**

### Building Print Components

Print components are built as part of the main element build:

```bash
# Build specific element
bun run turbo build --filter @pie-element/multiple-choice

# Build all elements
bun run turbo build --filter "@pie-element/*"
```

The build outputs `dist/print/index.js` (bundler ESM) and `dist/print/index.d.ts`,
plus `dist/browser/print/index.js` (the browser artifact the item-level player
loads). See [How the Print Bundle Is Built](#how-the-print-bundle-is-built).

## Further Reading

- [Element-Level Print Player README](../packages/element-player/README_PRINT_PLAYER.md)
- Item-Level Print Player README: `packages/print-player/README.md` in the `pie-players` repository
- Item-Level Print Player Usage Examples: `packages/print-player/USAGE_EXAMPLE.md` in the `pie-players` repository
- [PieElementPlayer Source](../packages/element-player/src/players/PieElementPlayer.svelte)

## Summary

**Print elements are self-contained** - they handle their own transformations and rendering.

**Print players are orchestrators:**
- **Element-level:** For development - loads single elements with import maps
- **Item-level:** For production - coordinates multiple elements from markup

Both use the same underlying print components, just at different scales and for different purposes.
