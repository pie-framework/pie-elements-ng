# Lodash-ES for ESM Migration

## Summary

The upstream sync process **automatically transforms** all `lodash` imports to `lodash-es` for ESM compatibility.

- **lodash** = CommonJS (blocks ESM) ❌
- **lodash-es** = Pure ESM module ✅
- Same API (both 4.17.x), zero behavior changes

## What Happens During Sync

All lodash imports are automatically rewritten:

```javascript
// FROM (upstream pie-elements/pie-lib)
import isEmpty from 'lodash/isEmpty';
import { cloneDeep, isEqual } from 'lodash';
import _ from 'lodash';

// TO (synced to pie-elements-ng)
import { isEmpty } from 'lodash-es';
import { cloneDeep, isEqual } from 'lodash-es';
import _ from 'lodash-es';
```

Package.json dependencies are also updated:

```json
// FROM
{ "lodash": "^4.17.21" }

// TO
{ "lodash-es": "^4.17.22" }
```

## Implementation

The transformation is implemented in:

- [tools/cli/src/commands/upstream/sync-imports.ts](../tools/cli/src/commands/upstream/sync-imports.ts) - Transform functions
- [tools/cli/src/commands/upstream/sync-controllers-strategy.ts](../tools/cli/src/commands/upstream/sync-controllers-strategy.ts) - Controller sync
- [tools/cli/src/commands/upstream/sync-react-strategy.ts](../tools/cli/src/commands/upstream/sync-react-strategy.ts) - React component sync
- [tools/cli/src/commands/upstream/sync-vite-config.ts](../tools/cli/src/commands/upstream/sync-vite-config.ts) - Vite config generation
- [tools/cli/src/commands/upstream/sync-demo.ts](../tools/cli/src/commands/upstream/sync-demo.ts) - Demo HTML generation

## Why lodash-es?

**lodash-es** is the official ES modules version of lodash:

- Published and maintained by the same team
- Identical API and functionality
- Pure ESM package (can be imported without compatibility shims)
- Version 4.17.22 (kept in sync with lodash 4.17.21)

## Future Optimization (Optional)

While lodash-es works perfectly for ESM compatibility, you could optionally:

1. **Replace simple functions with native equivalents:**
   - `isArray` → `Array.isArray()`
   - `isUndefined` → `value === undefined`
   - `map`, `find`, `reduce` → Native array methods

2. **Create custom utilities for frequently-used functions:**
   - `isEmpty` (54 uses) - Simple implementation
   - `cloneDeep` (46 uses) - Use native `structuredClone()`
   - `isEqual` (43 uses) - Deep comparison utility
   - `debounce` (17 uses) - Timing wrapper

See [lodash-inventory.md](./lodash-inventory.md) for complete usage analysis.

**Note:** This optimization is **not required** for ESM compatibility - lodash-es achieves that goal. Custom utilities would primarily reduce bundle size (~25KB → ~4KB).
