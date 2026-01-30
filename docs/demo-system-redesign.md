# PIE Elements Demo System - Current Implementation

> **Status:** The demo system uses a shared `apps/element-demo` SvelteKit app that can display any PIE element. The CLI command `bun run dev:demo <element-name>` starts the demo with environment variables to specify which element to load.

## Current Architecture

### Overview

We use a **single shared demo app** (`apps/element-demo`) that:
- Runs as a standard SvelteKit application
- Loads element configuration via CLI-provided environment variables
- Uses workspace dependencies for all PIE packages
- Dynamically imports elements at runtime

### How It Works

1. **CLI Command**: `bun run dev:demo multiple-choice`
   - Sets environment variables for element name, path, and type
   - Starts Vite dev server on configured port (default: 5222)

2. **SvelteKit Routes**:
   - `/` - Landing page with element info and launch button
   - `/player/deliver` - Delivery view with interactive element
   - `/player/author` - Authoring view (configure component)
   - `/player/print` - Print-friendly view
   - `/player/source` - Raw JSON model editor

3. **Layout System**:
   - `DeliveryPlayerLayout` - Full layout with mode/role/session/model control panels
   - `PlayerLayout` - Simplified layout for other views (no control panels)
   - Split-pane interface with resizable divider

4. **State Management**:
   - Svelte stores (`demo-state.ts`) manage shared state across routes
   - Store initialization happens in player layout when data loads
   - Model and session updates propagate across all tabs

## Current Challenges

### 1. Dynamic Import Resolution

**Problem**: Vite cannot resolve workspace package imports dynamically at runtime.

```typescript
// This doesn't work:
const packageName = '@pie-element/multiple-choice';
const module = await import(packageName);
// Error: Failed to resolve module specifier
```

**Why It Fails**:
- Vite performs static analysis at build time to create the dependency graph
- Dynamic imports of workspace packages aren't recognized without explicit configuration
- The package is symlinked but Vite's runtime module resolution can't find it

**What We've Tried**:

1. ✅ **Added element as workspace dependency** - Symlink created successfully
2. ❌ **Vite resolve aliases** - Tried mapping `@pie-element/*` to workspace packages
   - Regex-based aliases didn't work correctly
   - Too complex to maintain for all packages
3. ❌ **Import maps** - Not implemented yet
4. 🔄 **Currently**: Element package is installed but still fails to load dynamically

### 2. Package Organization

**Recently Completed**: Renamed all shared packages to use `shared-` prefix.

**Structure**:
```
packages/
├── element-player/              # @pie-element/element-player (moved from shared/)
├── elements-react/
│   ├── multiple-choice/         # @pie-element/multiple-choice
│   └── .../
├── lib-react/                   # @pie-lib/* packages
├── lib-svelte/                  # @pie-lib/* packages (Svelte)
└── shared/
    ├── math-rendering/          # @pie-element/shared-math-rendering
    ├── types/                   # @pie-element/shared-types
    ├── utils/                   # @pie-element/shared-utils
    └── .../                     # Other shared packages
```

**Key Points**:
- Directory names: `packages/shared/math-rendering/` (no prefix)
- Package names: `@pie-element/shared-math-rendering` (with prefix)
- All non-upstream packages set to version `0.1.0`

See [PACKAGE_NAMING.md](./PACKAGE_NAMING.md) for full details.

## What's Working

✅ **Package reorganization complete**
- All shared packages renamed with `shared-` prefix in package.json
- Element-player moved to `packages/` root
- 75+ packages updated with new import names
- All package versions standardized to `0.1.0`

✅ **Demo app layout rendering**
- Landing page displays element information
- Player layout with control panels (mode, role, session, model)
- Split-pane interface with resizable divider
- Tab navigation between delivery/author/print/source views

✅ **Store initialization fixed**
- Stores initialize immediately when layout loads (not in onMount)
- `$elementName` and other store values available to child routes
- State propagates correctly across route changes

✅ **Component structure**
- `DeliveryPlayerLayout` - Full layout with all control panels
- `PlayerLayout` - Simplified layout for non-delivery views
- Clean separation of concerns

## Current Solution (Implemented)

✅ **Static Import Registry + Built Packages**

The demo system now works using a hybrid approach:

1. **Static Import Registry** (`apps/element-demo/src/lib/element-imports.ts`)
   - Pre-registers all element imports that Vite can resolve
   - Bypasses dynamic import limitations
   - Each element must be explicitly registered

2. **Built Element Packages**
   - Elements must be built before use: `bun run build` in element directory
   - Uses dist files (default export condition) not source files
   - Avoids infinite HMR loops

3. **Demo-Specific Loaders**
   - `demo-element-loader.ts` - Uses static imports for local dev
   - `DemoElementPlayer.svelte` - Demo-specific player component
   - Falls back to CDN mode for production

### Critical: Why Development Condition Causes Loops

**DO NOT USE** `resolve.conditions: ['development']` in Vite config. Even with `watch.ignored`, it causes infinite HMR loops:

1. Vite resolves imports to source files in workspace packages
2. Demo app changes trigger HMR
3. HMR reads workspace source files during module graph rebuild
4. File system events cascade between packages
5. Loop continues indefinitely (1000+ reloads)

**Attempted fixes that didn't work:**
- ❌ Adding `watch.ignored` patterns - loops still occur
- ❌ Using `optimizeDeps.exclude` - doesn't prevent HMR loops
- ❌ Configuring `server.watch.ignored` - not sufficient

**Why it loops even with watch.ignored:**
- HMR module graph traversal reads files regardless of watch config
- Vite's dependency tracking follows import chains
- Source file references create bidirectional dependencies
- This creates a feedback loop that watch.ignored can't break

## How to Use the Demo System

### For a New Element

1. **Build the element package:**
   ```bash
   cd packages/elements-react/your-element
   bun run build
   ```

2. **Register it in `apps/element-demo/src/lib/element-imports.ts`:**
   ```typescript
   registerElement('your-element', () => import('@pie-element/your-element'));
   registerController('your-element', () => import('@pie-element/your-element/controller'));
   ```

3. **Create sample config (optional):**
   - Add `apps/element-demo/src/lib/data/sample-configs/react/your-element.json`
   - Add `apps/element-demo/src/lib/data/sample-configs/react/your-element-session.json`

4. **Run the demo:**
   ```bash
   bun run dev:demo your-element
   ```

### Development Workflow

**Important:** Elements use **built dist files**, not source files. This means:

- ✅ No infinite HMR loops
- ✅ All dependencies properly resolved
- ❌ No HMR for element source changes
- ❌ Must rebuild element after changes

**To update an element:**
```bash
# 1. Make changes to element source
# 2. Rebuild the element
cd packages/elements-react/your-element
bun run build

# 3. The demo will pick up changes on next reload
```

## Explored Solutions (For Reference)

### Option 1: Use a Local CDN Server
Run a separate ESM server (like `esm.sh` locally) that serves built element packages.

**Pros**:
- Clean separation between demo app and elements
- Works with any element without configuration
- Matches production CDN approach

**Cons**:
- Requires running another server
- More complex setup for development
- No HMR for element source changes

### Option 2: Import Maps
Use browser import maps to resolve workspace packages.

**Pros**:
- Native browser feature
- Clean declarative configuration

**Cons**:
- Limited browser support (needs polyfill)
- Requires generating import map at build time
- May not work well with Vite's dev server

### Option 3: Pre-bundle Elements
Build elements before starting demo, load from dist/.

**Pros**:
- Guaranteed to work (standard module loading)
- Simpler module resolution

**Cons**:
- No HMR for element changes
- Slower development workflow
- Need to rebuild after every change

### Option 4: Explicit Import in Demo App
Import elements directly in the demo app code.

**Pros**:
- Simple, no dynamic imports
- Works immediately with Vite

**Cons**:
- Demo app needs to know about all elements
- Breaks the "single command for any element" goal
- Not scalable to 30+ elements

### Option 5: Vite Plugin for Workspace Resolution
Create a custom Vite plugin that intercepts imports and resolves workspace packages.

**Pros**:
- Most maintainable long-term
- Automatic discovery of packages
- Enables HMR for development

**Cons**:
- More complex implementation
- Requires understanding Vite's plugin API
- Need to handle subpath exports correctly

## Historical Context

This document previously contained extensive exploration of template-based generation and `.demo-cache/` approach. That design has been superseded by the current shared app approach, which is simpler and avoids file duplication.

Key differences:
- **Old**: Generate element-specific demo apps in `.demo-cache/`
- **New**: Single shared demo app with environment-based configuration
- **Old**: Template system with token replacement
- **New**: SvelteKit dynamic routing with stores

The current approach is more maintainable but requires solving the dynamic import challenge.

## Next Steps

1. **Evaluate solution options** - Decide which approach best balances:
   - Developer experience (HMR, fast feedback)
   - Implementation complexity
   - Maintainability
   - Alignment with production architecture

2. **Implement chosen solution** - Likely candidates:
   - Vite plugin for workspace resolution (most flexible)
   - Local CDN server (simplest, matches production)

3. **Test with multiple elements** - Ensure solution works for:
   - React elements (`elements-react/`)
   - Future Svelte elements (`elements-svelte/`)
   - Elements with different dependency trees

4. **Document the approach** - Update this doc and DEMO_SYSTEM.md with:
   - How the final solution works
   - How to add new elements
   - How to troubleshoot issues

## Files and Structure

### Key Files
- `apps/element-demo/` - Shared demo SvelteKit app
- `apps/element-demo/src/routes/+page.svelte` - Landing page
- `apps/element-demo/src/routes/player/+layout.svelte` - Player layout with nav
- `apps/element-demo/src/routes/player/deliver/+page.svelte` - Delivery view
- `apps/element-demo/src/lib/element-player/components/DeliveryPlayerLayout.svelte` - Layout with controls
- `apps/element-demo/src/lib/stores/demo-state.ts` - Shared state management

### Configuration
- `apps/element-demo/package.json` - Demo app dependencies
- `apps/element-demo/vite.config.ts` - Vite configuration
- `tools/cli/src/commands/dev/demo/` - CLI command implementation

## Lessons Learned

1. **Svelte 5 runes mode** - Store initialization timing is critical
   - Use immediate execution, not `onMount()`, for data that child routes need
   - Use `$derived` instead of `$:` reactive statements
   - One task should be `in_progress` at a time in todo lists

2. **Workspace packages** - Simple in theory, complex in practice
   - Symlinks work for static imports
   - Dynamic imports need additional configuration
   - Vite's module resolution is sophisticated but opaque

3. **Package naming** - Directory names vs package names
   - Keep directory names simple (context from folder structure)
   - Add prefixes to package names for clarity in imports
   - Maintain separation between structure and naming

4. **Component architecture** - Separate concerns early
   - Layout components should be composable
   - Control panels are view-specific, not universal
   - Split-pane layouts need proper state management

## References

- [DEMO_SYSTEM.md](./DEMO_SYSTEM.md) - Quick start guide for using the demo system
- [PACKAGE_NAMING.md](./PACKAGE_NAMING.md) - Package naming conventions
- [Vite Documentation](https://vite.dev/) - Module resolution and plugins
- [SvelteKit Documentation](https://svelte.dev/docs/kit) - Routing and layouts
