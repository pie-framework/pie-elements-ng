# ESM Player Test App

A standalone test application for validating published ESM PIE elements with the ESM player. This app simulates how external clients would consume and use published packages.

## Purpose

- **Validate ESM Publishing**: Ensure published packages work correctly when loaded as ESM modules
- **Test Player Integration**: Verify that the PIE player can load and render published elements
- **Version Testing**: Test different versions of the player and elements
- **Multi-Element Support**: Validate items with multiple elements of different types
- **Hybrid Loading**: Test both npm packages (via CDN) and local builds

## Features

### Version Selection

- **Player Version**: Choose between npm published versions or local builds
- **Per-Element Versions**: Configure different versions for each element type in an item
- **NPM Registry Integration**: Automatically fetches available versions from npm
- **Local Build Support**: Override with local builds from the monorepo

### Shareable URLs

- All configuration is encoded in URL parameters
- Copy shareable URLs for specific test scenarios
- URL parameters include player version, element versions, and selected item

### Persistent Settings

- Settings are saved to localStorage
- Automatically restored on page reload
- URL parameters take precedence over saved settings

### Sample Items Library

Includes sample items covering:
- Single element items (multiple choice, hotspot, number line)
- Multi-element items with mixed types
- Different element configurations and question types

## Usage

### Development

```bash
# From the monorepo root
cd apps/esm-player-test
bun install
bun run dev
```

The app will open at [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
bun run build
```

Output will be in `dist/` directory, ready for static hosting.

### Testing with Local Builds

1. Build the element packages you want to test:
   ```bash
   cd packages/elements-react/multiple-choice
   bun run build
   ```

2. Local builds are loaded via Vite `/@fs/` paths, so ensure the `dist/` files exist.

## Architecture

### Core Modules

- **[url-state.js](src/js/url-state.js)**: URL parameter and localStorage management
- **[player-loader.js](src/js/player-loader.js)**: Dynamic ESM module loading from npm/CDN or local builds
- **[sample-items.js](src/js/sample-items.js)**: Sample item configurations
- **[main.js](src/js/main.js)**: Main application orchestration

### Loading Strategy

**NPM Packages (Default):**
- Loaded via jsDelivr CDN: `https://cdn.jsdelivr.net/npm/@pie-element/multiple-choice@latest/dist/index.js`
- Supports version selection from npm registry
- No build step required

**Local Builds:**
- Loaded from local `elements-react` or `elements-svelte` `dist/` files via Vite `/@fs/`
- Used for testing unreleased changes

### State Management

**URL Parameters:**
- `?player=latest` - Player version
- `?item=multiple-choice-simple` - Selected item ID
- `?elements={"multiple-choice":"1.0.0"}` - Element version overrides

**LocalStorage:**
- Saves last used configuration
- Restored on page load
- URL params override saved settings

## URL Examples

**Test latest published versions:**
```
http://localhost:5173/
```

**Test specific player version:**
```
http://localhost:5173/?player=1.2.3
```

**Test with local player build:**
```
http://localhost:5173/?player=local
```

**Test specific item with element version:**
```
http://localhost:5173/?item=multi-element-math&elements={"multiple-choice":"1.0.0","number-line":"local"}
```

## Adding Sample Items

Edit [src/js/sample-items.js](src/js/sample-items.js) and add new items to the `SAMPLE_ITEMS` array:

```javascript
{
  id: 'my-item',
  title: 'My Test Item',
  description: 'Description for the item list',
  elements: [
    { element: 'multiple-choice', id: 'q1' }
  ],
  models: [
    { id: 'q1', element: 'multiple-choice', /* ... config */ }
  ],
  sessions: [
    { id: 'q1', element: 'multiple-choice', value: [] }
  ]
}
```

## Integration with Player

Currently, the app loads the player and elements but shows a placeholder for rendering. Once the PIE player ESM API is finalized, this will be integrated to actually render and interact with items.

The player integration will call:
```javascript
const player = await loadPlayer(config);
player.render(container, item, sessions);
```

## Future Enhancements

- [ ] Add specific version selector UI (dropdown for each element)
- [ ] Support loading player from local builds
- [ ] Add response validation UI
- [ ] Add scoring/feedback mode testing
- [ ] Add accessibility testing tools
- [ ] Add performance monitoring
- [ ] Add error boundary and detailed error reporting
- [ ] Add item JSON import/export
- [ ] Add network request logging
