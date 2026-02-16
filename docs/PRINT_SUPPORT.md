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
**Component:** `<pie-esm-print-player>`
**Purpose:** Testing and developing individual element print views

```html
<pie-esm-print-player
  element-name="multiple-choice"
  role="student"
  model={model}
/>
```

**Use Cases:**
- Element development and testing
- Element documentation
- Single element demos
- Quick print preview during development

**Location:** [packages/element-player/src/players/EsmPrintPlayer.svelte](../packages/element-player/src/players/EsmPrintPlayer.svelte)

### 2. Item-Level Print Player (Production)

**Package:** `@pie-player/print` (pie-players repository)
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

**Location:** Moved to [pie-players/packages/print-player](../../pie-players/packages/print-player)

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

## When to Use Which Approach

### Use Interactive Player (No Print Player Needed)
✅ Single element rendering
✅ Have direct component access
✅ Simple use cases
✅ Can pass print-appropriate props directly

Example:
```html
<pie-esm-element-player
  element-name="multiple-choice"
  model={{ ...model, disabled: true }}
  session={{}}
/>
```

### Use Element-Level Print Player
✅ Explicit print intent in code
✅ Cleaner API (role vs complex env)
✅ Element development/testing
✅ Print-focused demos

Example:
```html
<pie-esm-print-player
  element-name="multiple-choice"
  role="student"
  model={model}
/>
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
| **Package** | `@pie-element/element-player` | `@pie-player/print` |
| **Tag** | `<pie-esm-print-player>` | `<pie-print>` |
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
<pie-esm-print-player
  element-name={elementName}
  role={role}
  model={model}
/>
```

This provides:
- Consistent API with interactive demos
- Easy role switching (student/instructor)
- Automatic math rendering
- Clean, focused testing environment

## Migration Notes

### From @pie-framework/pie-print

The new item-level player (`@pie-player/print`) is a drop-in replacement:

```diff
- <script src="https://cdn.jsdelivr.net/npm/@pie-framework/pie-print@2.7.0/lib/pie-print.js"></script>
+ <script src="https://cdn.jsdelivr.net/npm/@pie-player/print@1.0.0/dist/print-player.js"></script>
```

The API remains identical - only the URL resolution changes for newer packages:

```javascript
player.resolve = (tagName, pkg) => {
  const [_, name, version] = pkg.match(/@pie-element\/(.*?)@(.*)/);
  return Promise.resolve({
    tagName,
    pkg,
    // Updated path for pie-elements-ng packages
    url: `https://cdn.jsdelivr.net/npm/@pie-element/${name}@${version}/dist/print/index.js`,
    module: true
  });
};
```

### Backwards Compatibility

✅ **Print exports are backwards compatible**
- Same custom element pattern
- Same `model` and `options` API
- Same `preparePrintModel()` pattern
- Works with both old and new print players

✅ **No changes needed in elements**
- Print components sync from upstream pie-elements
- Existing print logic preserved
- Only path changes from `module/print.js` to `dist/print/index.js`

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

4. **The demo uses `<pie-esm-print-player>` automatically**

### Building Print Components

Print components are built as part of the main element build:

```bash
# Build specific element
bun run turbo build --filter @pie-element/multiple-choice

# Build all elements
bun run turbo build --filter "@pie-element/*"
```

The build outputs to `dist/print/index.js` and `dist/print/index.d.ts`.

## Further Reading

- [Element-Level Print Player README](../packages/element-player/README_PRINT_PLAYER.md)
- [Item-Level Print Player README](../../pie-players/packages/print-player/README.md)
- [Item-Level Print Player Usage Examples](../../pie-players/packages/print-player/USAGE_EXAMPLE.md)
- [EsmElementPlayer Documentation](../packages/element-player/src/players/EsmElementPlayer.svelte)

## Summary

**Print elements are self-contained** - they handle their own transformations and rendering.

**Print players are orchestrators:**
- **Element-level:** For development - loads single elements with import maps
- **Item-level:** For production - coordinates multiple elements from markup

Both use the same underlying print components, just at different scales and for different purposes.
