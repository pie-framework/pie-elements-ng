# Upstream Commands

This directory contains commands for managing the synchronization between the upstream PIE repositories and this project.

## Overview

The PIE Elements NG project syncs code from two upstream repositories:

- **pie-elements** - Contains element controllers and React components
- **pie-lib** - Contains shared library packages

These commands help manage that synchronization process, analyze ESM compatibility, and track what's been synced.

At a high level, the update workflow does more than copy files. It:

- Filters upstream packages via ESM compatibility analysis
- Syncs controllers, React UI, and pie-lib sources into local packages
- Converts source files to TypeScript (`.js`→`.ts`, `.jsx`→`.tsx`)
- Rewrites package metadata (exports, entrypoints, sideEffects)
- Generates element-specific Vite config and demo metadata
- Cleans workspace deps and installs updated dependencies

## Commands

### `update` (Recommended)

**The main command you should use!** Combines ESM analysis and syncing in one step.

**Usage:**

```bash
# Update everything (analyze + sync)
bun cli upstream:update

# Dry run to see what would change
bun cli upstream:update --dry-run

# Update specific element
bun cli upstream:update --element=multiple-choice

# Verbose output
bun cli upstream:update --verbose
```

**What it does:**

1. **Analyzes** ESM compatibility of all upstream packages
2. **Syncs** all compatible packages automatically
3. **Builds** touched packages (unless --skip-build)

This is the recommended workflow as it ensures the analysis is always fresh before syncing.

---

### `analyze-esm`

Analyzes ESM compatibility of upstream packages to determine what can be safely synced.

**When to use:** When you only want to check compatibility without syncing, or for debugging.

**Usage:**

```bash
# Analyze all packages
bun cli upstream:analyze-esm

# Verbose output with dependency details
bun cli upstream:analyze-esm --verbose

# Include dev dependencies in analysis
bun cli upstream:analyze-esm --include-dev-deps

# Validate with runtime checks
bun cli upstream:analyze-esm --validate
```

**What it does:**

1. Scans all upstream packages for ESM blockers (CommonJS-only dependencies)
2. Checks element-to-element dependencies for transitive compatibility
3. Tracks @pie-lib dependencies used by elements
4. Generates compatibility report at `.compatibility/report.json`
5. Optional: Runtime validation by actually loading packages

**Output:**

- Lists ESM-compatible elements
- Lists blocked elements with reasons
- Shows @pie-lib package compatibility
- Provides recommendations for fixing issues

**Why run this first?**
The sync command uses this report to automatically filter out incompatible packages, ensuring you only sync elements that will work as ESM modules.

### `sync`

Synchronizes ESM-compatible code from upstream repositories to this project.

**When to use:** When you've already run `analyze-esm` and want to sync without re-analyzing, or for advanced workflows.

**Usage:**

```bash
# Sync everything (automatically filters to ESM-compatible packages)
bun cli upstream:sync

# Dry run to see what would change
bun cli upstream:sync --dry-run

# Sync specific element
bun cli upstream:sync --element=multiple-choice

# Verbose output
bun cli upstream:sync --verbose
```

**What it does:**

1. **Reads compatibility report** from `analyze-esm` to filter packages
2. **Controllers**: Syncs from `pie-elements/packages/{element}/controller/src/` to `packages/elements-react/{element}/src/controller/`
3. **React Components**: Syncs from `pie-elements/packages/{element}/src/` to `packages/elements-react/{element}/src/`
4. **Pie-Lib**: Syncs from `pie-lib/packages/{package}/src/` to `packages/lib-react/{package}/src/`
5. **Conversions**: Automatically converts `.js` → `.ts` and `.jsx` → `.tsx`
6. **Package.json**: Generates ESM-compatible package.json with proper exports
7. **Build**: Automatically builds touched packages after sync

**Strategy Pattern:**
The sync command uses the strategy pattern for clean separation:

- `ControllersStrategy` - Handles controller syncing
- `ReactComponentsStrategy` - Handles React component syncing
- `PieLibStrategy` - Handles pie-lib package syncing

Each strategy is self-contained and independently testable.

### `track`

Tracks synced packages and their upstream status.

**Usage:**

```bash
# Show sync status for all packages
bun cli upstream:track

# Check specific element
bun cli upstream:track --element=multiple-choice
```

**What it does:**

1. Shows which packages have been synced
2. Displays upstream commit hash for each package
3. Identifies packages that may need updates

## Workflow

### Initial Setup

1. Clone the upstream repositories as siblings to this repo:

   ```bash
   cd /path/to/projects
   git clone https://github.com/PieLabs/pie-elements.git
   git clone https://github.com/PieLabs/pie-lib.git
   git clone https://github.com/your-org/pie-element.git
   ```

2. Run initial analysis to see what's available:

   ```bash
   cd pie-element
   bun cli upstream:analyze-esm --verbose
   ```

### Regular Update Workflow (Simple)

The simplest workflow using the combined `update` command:

1. **Pull upstream changes:**

   ```bash
   cd ../pie-elements && git pull
   cd ../pie-lib && git pull
   cd ../pie-element
   ```

2. **Check what would change** (dry run):

   ```bash
   bun cli upstream:update --dry-run --verbose
   ```

3. **Update everything:**

   ```bash
   bun cli upstream:update
   ```

4. **Review, test, and commit:**

   ```bash
   git diff
   bun test
   git add .
   git commit -m "sync: update from upstream"
   git push
   ```

### Incremental Update Workflow (Safer)

For testing changes to individual elements first:

1. **Pull upstream changes:**

   ```bash
   cd ../pie-elements && git pull
   cd ../pie-lib && git pull
   cd ../pie-element
   ```

2. **Update specific element** (with dry run first):

   ```bash
   bun cli upstream:update --element=multiple-choice --dry-run
   bun cli upstream:update --element=multiple-choice
   ```

3. **Test the element:**

   ```bash
   bun test packages/elements-react/multiple-choice
   ```

4. **If good, update all:**

   ```bash
   bun cli upstream:update
   ```

5. **Commit and push:**

   ```bash
   git add .
   git commit -m "sync: update from upstream"
   git push
   ```

### Working with Blocked Elements

If an element is blocked from ESM compatibility:

1. **Check why it's blocked:**

   ```bash
   bun cli upstream:analyze-esm --verbose | grep element-name
   ```

2. **Common blockers:**
   - `lodash` → Replace with native JS or `lodash-es`
   - `react-dnd` → Upgrade to v16+ (ESM compatible)
   - Sibling dependencies → Fix the dependency first

3. **Fix in upstream** (preferred):
   - Create PR in pie-elements to fix the blocker
   - Wait for merge
   - Re-analyze and sync

4. **Fix locally** (if urgent):
   - Sync the element
   - Manually fix the blocker in the local copy
   - Document the change
   - Create upstream PR later

## Advanced Features

### Always-Include Pie-Lib Packages

Some @pie-lib packages (like `controller-utils`) are imported directly in controller code but not declared in element package.json files. To ensure these are always synced, they're defined in the `ALWAYS_INCLUDE_PIE_LIB` constant in [analyze-esm.ts](./analyze-esm.ts):

```typescript
// PIE lib packages that should always be included if compatible
// These are packages that may be imported directly in code (e.g., controllers)
// but not declared in package.json dependencies
const ALWAYS_INCLUDE_PIE_LIB = [
  "controller-utils", // Used in controller code via direct imports
];
```

**When to add a package here:**

- Package is imported in controller/component code
- Package is NOT in element package.json dependencies
- Package should be available for all elements that need it

### Element-Specific Build Configuration

Some elements require special vite configuration (e.g., bundling specific dependencies instead of externalizing them). This is handled automatically by [sync-react-strategy.ts](./sync-react-strategy.ts).

#### Konva Bundling Example

Elements using konva/react-konva (like hotspot, drawing-response) bundle these libraries instead of externalizing them to avoid runtime resolution issues with transitive dependencies:

```typescript
// In sync-react-strategy.ts
const konvaElements = ["hotspot", "drawing-response"];
const shouldBundleKonva = konvaElements.includes(elementName);
```

This generates a special vite.config.ts that:

- Bundles konva, react-konva, scheduler, and react-reconciler (not externalized)
- Uses `preserveModules: true` to maintain proper import statements for other externals
- Avoids CDN import map issues with complex dependency chains while preserving lodash imports

**When to add an element to konvaElements:**

- Element imports konva or react-konva
- Seeing "schedulerExports is not defined" or similar runtime errors
- Dependencies have complex transitive chains not suitable for CDN loading

**Why bundle instead of externalize?**

- Element-specific libraries (only 2-3 elements use konva)
- Complex transitive dependencies (scheduler, react-reconciler)
- CDN (esm.sh) import paths don't match local import maps
- Better reliability and performance for specialized packages

### Demo Mode Configuration

Elements with a `docs/demo` directory automatically get demo mode support in their vite.config.ts:

```typescript
export default defineConfig(({ mode, command }) => ({
  plugins: [react()],
  // Only change root for demo mode when serving (not building)
  root:
    mode === "demo" && command === "serve"
      ? resolve(__dirname, "docs/demo")
      : __dirname,
  // ... rest of config
}));
```

This allows running `bun run demo` in the element package to serve the demo application.

## File Organization

```
tools/cli/src/commands/upstream/
├── README.md                        # This file
├── update.ts                        # Combined update command (recommended)
├── analyze-esm.ts                   # ESM compatibility analyzer
├── sync.ts                          # Sync command (orchestration)
├── track.ts                         # Package tracking command
├── sync-strategy.ts                 # Strategy interface
├── sync-controllers-strategy.ts     # Controller sync strategy
├── sync-react-strategy.ts           # React component sync strategy
├── sync-pielib-strategy.ts          # Pie-lib sync strategy
├── sync-filesystem.ts               # File system utilities
├── sync-package-json.ts             # Package.json utilities
├── sync-vite-config.ts              # Vite config generation
├── sync-demo.ts                     # Demo generation utilities
└── sync-imports.ts                  # Import fixing utilities
```

## Best Practices

### Do's ✅

- **Always dry-run first** to see what will change
- **Sync one element at a time** when testing
- **Review diffs carefully** before committing
- **Test after syncing** to ensure functionality
- **Keep upstream siblings up to date** (git pull regularly)
- **Use ESM-compatible dependencies** to unblock packages
- **Document breaking changes** in commit messages

### Don'ts ❌

- **Don't modify synced files directly** - changes will be overwritten on next sync
- **Don't skip the build** - it catches issues early
- **Don't force-sync incompatible elements** - they won't work as ESM
- **Don't commit without testing** - broken elements affect everyone
- **Don't sync without upstream being clean** - use stable commits

## Troubleshooting

### Sync fails with "file not found"

Check that upstream repositories are at the expected locations:

```bash
ls -la ../pie-elements ../pie-lib
```

### Build fails after sync

1. Check if dependencies changed in upstream package.json
2. Run `bun install` to update dependencies
3. Check for TypeScript errors in synced files

### Element marked as incompatible

Run detailed analysis:

```bash
bun cli upstream:analyze-esm --verbose --element=element-name
```

Fix the blockers (see "Working with Blocked Elements" above).

### Import errors after sync

The sync automatically fixes default exports, but some edge cases may require manual fixes:

```typescript
// If you see errors like "X is not exported from Y"
// Check if the import needs to be a named import
import { something } from "./file"; // Instead of default import
```

## Contributing

When adding new functionality to the sync process:

1. **Utilities** → Add to appropriate utility file (sync-\*.ts)
2. **New sync type** → Create a new strategy file
3. **Strategy changes** → Modify the specific strategy file
4. **Orchestration** → Update sync.ts (main command)

Keep the strategy pattern clean - each strategy should be self-contained.

## Related Documentation

- [REFACTORING.md](../../REFACTORING.md) - Details on the refactoring work
- [Main CLI README](../../../README.md) - General CLI usage
- [UPSTREAM_SYNC_GUIDE.md](../../../../../docs/migration/UPSTREAM_SYNC_GUIDE.md) - Detailed sync guide
