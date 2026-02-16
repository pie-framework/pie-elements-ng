# Upstream Fix Required

## Issue: Missing dnd-kit dependencies

The `mask-markup` package imports from `@dnd-kit/core` and `@dnd-kit/utilities` but doesn't declare them as dependencies in package.json.

## Details

**Location:**

- File: `packages/lib-react/mask-markup/src/components/blank.tsx:6`
- Import: `import { CSS } from "@dnd-kit/utilities";`
- Also uses: `import { useDraggable, useDroppable } from "@dnd-kit/core";`

**Current Workaround:**

Added `@dnd-kit/core` and `@dnd-kit/utilities` as direct dependencies in this package's package.json.

## Proper Fix

This should be fixed in the upstream `pie-lib` repository:

- Repository: https://github.com/pie-framework/pie-lib
- Package: `packages/mask-markup/package.json`

Add dependencies:

```json
"@dnd-kit/core": "6.3.1",
"@dnd-kit/utilities": "3.2.2"
```

## When Syncing from Upstream

After the upstream fix is merged, this workaround can be removed by running:

```bash
bun cli upstream:update
```

The sync process will overwrite package.json with the corrected upstream version.
