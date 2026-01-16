# Testing Guide: ESM Player Test App

Complete guide for testing the ESM player integration with PIE elements.

## Prerequisites

Ensure both workspaces are ready:

1. **pie-players workspace**: pie-esm-player should be built
2. **pie-elements-ng workspace**: element packages should be built

## Step 1: Build the PIE ESM Player

```bash
# Navigate to pie-players workspace
cd /Users/eelco.hillenius/dev/prj/pie/pie-players/packages/pie-esm-player

# Build the player
bun run build

# Verify dist exists
ls -la dist/pie-esm-player.js
```

**Expected**: You should see `pie-esm-player.js` (~2.5MB) in the dist folder.

## Step 2: Build the Multiple Choice Element

```bash
# Navigate to pie-elements-ng workspace
cd /Users/eelco.hillenius/dev/prj/pie/pie-elements-ng/packages/elements-react/multiple-choice

# Build the element package
bun run build

# Verify dist exists
ls -la dist/index.js
```

**Expected**: You should see `index.js` in the dist folder.

## Step 3: Install Test App Dependencies

```bash
# Navigate to test app
cd /Users/eelco.hillenius/dev/prj/pie/pie-elements-ng/apps/esm-player-test

# Install dependencies
bun install

# Install Playwright browsers
bunx playwright install chromium
```

**Expected**: Dependencies install successfully, Playwright chromium browser downloads.

## Step 4: Manual Testing - Start Dev Server

```bash
# From apps/esm-player-test directory
bun run dev
```

**Expected**:
- Dev server starts at http://localhost:5173 (or next available port)
- Browser opens automatically

### Manual Test Checklist

In the browser, verify:

- [ ] **Page loads successfully**
  - Title: "ESM Player Test"
  - Sidebar visible with sections

- [ ] **Player initialization**
  - Status log shows: "PIE ESM player loaded from local workspace"
  - Status log shows: "Ready to load and render items"
  - Load button is enabled

- [ ] **Sample items list**
  - 6 sample items visible:
    - Multiple Choice - Simple
    - Multiple Choice - Checkbox
    - Hotspot - Basic
    - Number Line - Plot Points
    - Multi-Element - Math Problem
    - Multi-Element - Mixed Types

- [ ] **Item selection**
  - Click "Multiple Choice - Simple"
  - Item highlights as active
  - Status shows: "Selected item: Multiple Choice - Simple"
  - Element Versions section shows "multiple-choice" with two radio options:
    - NPM Latest (selected by default)
    - Local Build

- [ ] **Version switching**
  - Click "Local Build" radio
  - Click "NPM Latest" radio
  - Both should work without errors

- [ ] **Multi-element item**
  - Click "Multi-Element - Math Problem"
  - Element Versions section shows TWO elements:
    - multiple-choice
    - number-line
  - Each has its own version controls

- [ ] **URL persistence**
  - Select an item
  - Check URL bar contains `?item=multiple-choice-simple`
  - Change element version to "Local Build"
  - Check URL updates to include `elements={"multiple-choice":"local"}`

- [ ] **Copy shareable URL**
  - Click "Copy Shareable URL" button
  - Status shows: "URL copied to clipboard!"
  - Paste URL in new tab
  - Item and settings restore correctly

## Step 5: Load and Render Item

This is the critical test - loading the player with a real element:

1. **Select an item**: Click "Multiple Choice - Simple"
2. **Choose version**: Leave "NPM Latest" selected (or choose "Local Build" to test local)
3. **Click "Load Player" button**

### Expected Behavior

**If elements are published to npm:**
- Status shows: "Loading elements..."
- Status shows: "Loaded 1 element(s)"
- Status shows: "Rendering player..."
- Player web component appears in main area
- Multiple choice question renders inside player
- Status shows: "Item loaded and rendered successfully"

**If elements are NOT yet published (expected initially):**
- Status shows: "Loading elements..."
- Status shows error: "Failed to load element multiple-choice from https://cdn.jsdelivr.net/npm/@pie-element/multiple-choice..."
- Error message appears in main area
- This is EXPECTED until @pie-element packages are published to npm

**If using "Local Build" (and local build exists):**
- Should attempt to load from the local `elements-react` build via Vite `/@fs/` path
- Requires `packages/elements-react/<element>/dist/index.js` to exist

## Step 6: Automated Tests - Run Playwright Evals

```bash
# From apps/esm-player-test directory

# Run all tests in headless mode
bun run test:evals

# OR run with Playwright UI (recommended for first run)
bun run test:evals:ui

# OR run with visible browser
bun run test:evals:headed
```

### Expected Test Results

**Test Suite: Player Initialization (3 tests)**
- ✅ should load the page and initialize the player
- ✅ should display sample items list
- ✅ should handle player initialization failure gracefully

**Test Suite: Item Selection and Configuration (5 tests)**
- ✅ should select an item and show element version controls
- ✅ should handle multi-element items
- ✅ should persist selected item in URL
- ✅ should restore item selection from URL
- ✅ should switch between version sources

**Test Suite: Player Rendering (6 tests)**
- ⚠️ should load and render a simple multiple choice item - **MAY FAIL** if elements not published
- ⚠️ should render multi-element items - **MAY FAIL** if elements not published
- ✅ should handle element loading errors
- ⚠️ should use local element builds when configured - **MAY FAIL** without local build serving
- ⚠️ should emit session-changed events - **MAY FAIL** if elements not published
- ✅ should support copy shareable URL

**Total: 14 tests**
- Expected passes: 8-10 tests (infrastructure tests)
- Expected failures: 4-6 tests (depend on published elements or full player integration)

## Step 7: Console Inspection

Open browser DevTools (F12) and check Console tab for:

### Expected Console Logs (Success Path)

```
PIE ESM player initialized (local workspace)
Loading element multiple-choice from: https://cdn.jsdelivr.net/npm/@pie-element/multiple-choice/dist/index.js
Session changed: {...}
```

### Expected Console Errors (If Elements Not Published)

```
Failed to load element multiple-choice: Failed to fetch
```

This is normal until packages are published to npm.

## Step 8: Network Inspection

Open DevTools → Network tab and verify:

1. **Player loads from local workspace**
   - Should see request to local file: `pie-esm-player.js`
   - Status: 200 OK
   - Type: JavaScript module

2. **Element loading attempts**
   - Should see request to: `https://cdn.jsdelivr.net/npm/@pie-element/multiple-choice/dist/index.js`
   - Status: 404 (if not published) or 200 (if published)

## Troubleshooting

### Issue: Player doesn't initialize

**Check:**
```bash
ls -la /Users/eelco.hillenius/dev/prj/pie/pie-players/packages/pie-esm-player/dist/pie-esm-player.js
```

**Fix:** Build the player in pie-players workspace

### Issue: Dev server won't start

**Check:** Port 5173 might be in use

**Fix:** Kill existing process or Vite will auto-increment port

### Issue: Vite alias not resolving

**Check:** Console shows module resolution errors

**Fix:** Verify paths in `vite.config.js` are correct relative to project structure

### Issue: Element loading fails with 404

**Expected behavior** - elements not yet published to npm

**Options:**
1. Wait for npm publishing pipeline
2. Configure local element serving (requires additional Vite config)
3. Test with published element versions once available

### Issue: "Duplicate package path" error in bun.lock

**Known issue** - bun lockfile corruption

**Fix:** Bun automatically ignores and regenerates lockfile (safe to ignore warnings)

## Success Criteria

### Minimum Success (Infrastructure Working)

- ✅ App loads without errors
- ✅ Player initializes from local workspace
- ✅ Sample items display
- ✅ Item selection works
- ✅ URL persistence works
- ✅ Version controls render
- ✅ 8-10 Playwright tests pass

### Full Success (End-to-End Working)

All minimum criteria PLUS:
- ✅ Elements load successfully (from npm or local)
- ✅ Player renders questions
- ✅ User can interact with elements
- ✅ Session changes are captured
- ✅ All 14 Playwright tests pass

## Next Steps After Testing

Based on test results:

1. **If player initialization works**: ✅ pie-esm-player integration successful
2. **If item selection works**: ✅ UI and state management working
3. **If element loading fails (404)**: Expected - need to publish @pie-element packages to npm
4. **If element loading succeeds but rendering fails**: Need to debug player config format
5. **If everything works end-to-end**: 🎉 Ready for production use!

## Reporting Issues

When reporting test failures, include:

1. **Console output**: Full error messages
2. **Network tab**: Failed requests with status codes
3. **Playwright report**: Which tests failed and why
4. **Environment**: Bun version, OS, browser version
5. **Steps to reproduce**: What you clicked/did before error

## Testing Local Element Builds

To test with local builds instead of npm packages:

```bash
# Build the element
cd packages/elements-react/multiple-choice
bun run build

# Note the output path
# Should be: packages/elements-react/multiple-choice/dist/index.js
```

Then in the app:
1. Select an item with multiple-choice
2. Choose "Local Build" radio
3. Click "Load Player"

**Note:** This may require additional Vite configuration to properly serve local builds via the `@local-elements` alias. If it fails, that's a TODO item for future work.
