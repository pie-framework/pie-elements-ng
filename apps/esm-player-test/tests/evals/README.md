# ESM Player Test App - Evaluation Tests

Playwright-based evaluation tests for the ESM player test application.

## Test Suites

### 1. Player Initialization Tests (`player-initialization.eval.ts`)

Tests the core initialization flow:
- ✅ Page loads and player initializes from local workspace
- ✅ Sample items list renders correctly
- ✅ Error handling when player fails to load

### 2. Item Selection Tests (`item-selection.eval.ts`)

Tests item selection and configuration:
- ✅ Selecting items updates UI and shows element version controls
- ✅ Multi-element items display multiple version controls
- ✅ Selected item persists in URL parameters
- ✅ Item selection restored from URL on page load
- ✅ Switching between NPM and local element versions

### 3. Player Rendering Tests (`player-rendering.eval.ts`)

Tests the full player rendering flow:
- ✅ Loading and rendering single-element items
- ✅ Loading and rendering multi-element items
- ✅ Error handling for failed element loading
- ✅ Using local element builds when configured
- ✅ Session-changed event emission
- ✅ Copy shareable URL functionality

## Running Tests

```bash
# Run all tests (headless)
bun run test:evals

# Run with Playwright UI (interactive)
bun run test:evals:ui

# Run with browser visible (headed mode)
bun run test:evals:headed
```

## Test Requirements

These tests validate that:

1. **Player Integration**: The local pie-esm-player from the adjacent pie-players workspace loads correctly
2. **Element Loading**: PIE elements can be loaded dynamically from npm CDN or local builds
3. **Configuration**: Version selection and URL state management work correctly
4. **Rendering**: Items render successfully through the player web component
5. **Error Handling**: Failed loads are handled gracefully with appropriate error messages

## Current Limitations

Some tests are marked as TODO because they depend on:
- Elements actually rendering inside the player (requires published @pie-element packages)
- Player API finalization for session management
- Local build serving infrastructure

## Future Enhancements

- Add visual regression tests
- Add accessibility tests with @axe-core/playwright
- Add performance benchmarks
- Test with multiple published element versions
- Test scoring functionality via player.provideScore()
