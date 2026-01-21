# CDN Demo Command

## Overview

The `bun cli dev:cdn-demo` command demonstrates that PIE element players work in production with zero local dependencies by loading elements directly from npm CDNs (unpkg or jsdelivr).

## Prerequisites

**Important**:
- The element-player must be built locally: `bun run turbo build --filter @pie-elements-ng/element-player`
- The target PIE element must be published to npm with IIFE builds at `dist/index.iife.js`

**Note**: The original `@pie-element/*` packages from pie-elements do NOT include IIFE builds. They publish:
- `lib/index.js` - CommonJS web component (main entry)
- `src/index.js` - ESM source (module entry)

This command is designed to test elements built by THIS project (pie-elements-ng) which DO include IIFE builds. Once pie-elements-ng packages are published, you can test them with:
```bash
bun cli dev:cdn-demo multiple-choice  # Will work once @pie-elements-ng/multiple-choice is published
```

For testing with the original pie-elements packages, use the ESM demo instead (not yet implemented)

The command serves the element-player from your local build while loading PIE elements from CDN. This validates that your locally-built player can consume published elements from production CDNs.

## Purpose

- **Validate player compatibility**: Proves that your locally-built element player can load published elements from CDN
- **Test published packages**: Quickly test published element versions without building them locally
- **Production validation**: Simulates the production scenario where elements load from CDN
- **Hybrid architecture**: Local player serves as the orchestrator, elements come from CDN

## Usage

### Basic Usage

```bash
# Load multiple-choice from unpkg (default)
bun cli dev:cdn-demo multiple-choice
```

This will:
1. Start an HTTP server on port 3000
2. Serve the element-player from your local build
3. Configure the player to load elements from unpkg:
   - Element base-url: `https://unpkg.com/@pie-element`
   - Element IIFE bundle: `https://unpkg.com/@pie-element/multiple-choice@latest/dist/index.iife.js`
4. Display the URL to open in your browser

### Advanced Usage

```bash
# Use jsdelivr instead of unpkg
bun cli dev:cdn-demo multiple-choice --cdn jsdelivr

# Test a specific version
bun cli dev:cdn-demo multiple-choice --version 11.4.3

# Custom port with auto-open browser
bun cli dev:cdn-demo hotspot --port 3001 --open

# Test specific element-player version
bun cli dev:cdn-demo multiple-choice --player-version 1.0.0
```

## Command Options

| Flag | Description | Default |
|------|-------------|---------|
| `--port`, `-p` | HTTP server port | 3000 |
| `--cdn` | CDN provider: unpkg, jsdelivr, or custom URL | unpkg |
| `--open`, `-o` | Open browser automatically | false |
| `--version`, `-v` | Element version to load | latest |
| `--player-version` | Element player version to load | latest |

## How It Works

### 1. HTML Generation

The command generates a standalone HTML page that includes:
- Inline styles for a clean demo interface
- `<pie-iife-element-player>` web component with `base-url` pointing to CDN
- Element player loaded via `<script type="module">` from local server
- Model and session data initialized inline

### 2. CDN URL Construction

**unpkg URLs:**
- Player: Served locally from `packages/shared/element-player/dist/pie-element-player.js`
- Element base: `https://unpkg.com/@pie-element`
- Element IIFE bundle loaded by player: `https://unpkg.com/@pie-element/{element-name}@{version}/dist/index.iife.js`

**jsdelivr URLs:**
- Player: Served locally from `packages/shared/element-player/dist/pie-element-player.js`
- Element base: `https://cdn.jsdelivr.net/npm/@pie-element`
- Element IIFE bundle loaded by player: `https://cdn.jsdelivr.net/npm/@pie-element/{element-name}@{version}/dist/index.iife.js`

### 3. Model Data

The command attempts to load model data from `../pie-elements/packages/{element}/docs/demo/generate.js` if available. If not found or loading fails, it uses a hardcoded fallback model for multiple-choice.

### 4. HTTP Server

A simple Node.js HTTP server serves the generated HTML on the specified port. The server:
- Serves the same HTML for all requests
- Sets `Cache-Control: no-cache` headers
- Handles graceful shutdown on SIGINT/SIGTERM

## Architecture Benefits

This command validates the key architectural decision to make element players **standalone web components**:

1. **Player Compatibility**: Validates that your local player build can consume published elements from CDN
2. **Hybrid Testing**: Local player orchestration + CDN element loading
3. **Version Control**: Can test specific element versions easily
4. **Production Validation**: Simulates the production scenario where elements come from CDN

## Example Output

```bash
$ bun cli dev:cdn-demo multiple-choice

🌐 Starting CDN demo server...
📦 Element: multiple-choice
🔗 CDN: unpkg
📍 Version: latest
🌐 URL: http://localhost:3000

✅ CDN demo server running at http://localhost:3000
📦 Element player: Local build
🔗 Element CDN: unpkg
🔗 Element base URL: https://unpkg.com/@pie-element

Press Ctrl+C to stop the server
```

## Implementation

**File**: `tools/cli/src/commands/dev/cdn-demo.ts`

The command follows the oclif pattern used by other dev commands like `dev:demo` and includes:
- Argument parsing for element name
- Flag parsing for configuration
- CDN URL construction based on provider
- HTML template generation with proper substitution
- Simple HTTP server using Node's built-in `http` module
- Browser auto-opening with error handling
- Graceful shutdown handling

## Testing Different Scenarios

### Test Published Elements

```bash
# Test if multiple-choice is working on unpkg
bun cli dev:cdn-demo multiple-choice

# Test a specific version
bun cli dev:cdn-demo multiple-choice --version 11.4.2
```

### Compare CDN Providers

```bash
# Test with unpkg
bun cli dev:cdn-demo multiple-choice --port 3000

# Test with jsdelivr (in another terminal)
bun cli dev:cdn-demo multiple-choice --port 3001 --cdn jsdelivr
```

### Test Custom CDN

```bash
# Use your own CDN URL
bun cli dev:cdn-demo multiple-choice --cdn https://my-cdn.example.com/packages
```

## Future Enhancements

Potential improvements (not currently implemented):
- Support for ESM mode (import maps)
- Multiple elements on the same page
- Theme/styling options
- Save/load session state
- Element catalog browser UI
- Live reload on template changes

## Related Documentation

- [Element Player README](../packages/shared/element-player/README.md)
- [IIFE Build Configuration](../packages/shared/element-player/README.md#build-requirements)
- [Demo System Documentation](./DEMO_SYSTEM.md)
