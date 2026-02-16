# @pie-element/bundler-shared

Shared bundler for PIE elements - creates IIFE bundles compatible with pie-player-components.

## Features

- ✅ **Webpack 5 based** - Uses proven bundling technology from pie-api-aws
- ✅ **Version resolution** - Handles different @pie-lib versions per element
- ✅ **TypeScript support** - Works with .ts/.tsx files via esbuild-loader
- ✅ **Framework agnostic** - Use in SvelteKit, Express, Lambda, CLI, etc.
- ✅ **Simple API** - Just call `bundler.build(request)` and get URLs back
- ✅ **Caching** - Reuses existing bundles when dependencies haven't changed

## Usage

### Basic Example

```typescript
import { Bundler } from '@pie-element/bundler-shared';

const bundler = new Bundler('./bundles');

const result = await bundler.build({
  dependencies: [
    { name: '@pie-element/multiple-choice', version: '0.1.0' }
  ]
});

console.log(result);
// {
//   success: true,
//   hash: '1234567890',
//   bundles: {
//     player: '/bundles/1234567890/player.js',
//     clientPlayer: '/bundles/1234567890/client-player.js',
//     editor: '/bundles/1234567890/editor.js'
//   },
//   duration: 45000
// }
```

### With SvelteKit

```typescript
// src/routes/api/bundle/+server.ts
import { json } from '@sveltejs/kit';
import { Bundler } from '@pie-element/bundler-shared';

const bundler = new Bundler('./static/bundles');

export const POST = async ({ request }) => {
  const buildRequest = await request.json();
  const result = await bundler.build(buildRequest);
  return json(result);
};
```

### With Express

```typescript
import express from 'express';
import { Bundler } from '@pie-element/bundler-shared';

const app = express();
const bundler = new Bundler('./public/bundles');

app.post('/api/bundle', async (req, res) => {
  const result = await bundler.build(req.body);
  res.json(result);
});
```

### With AWS Lambda

```typescript
import { Bundler } from '@pie-element/bundler-shared';

const bundler = new Bundler('/tmp/bundles');

export const handler = async (event) => {
  const result = await bundler.build(JSON.parse(event.body));
  return {
    statusCode: result.success ? 200 : 500,
    body: JSON.stringify(result)
  };
};
```

## API

### Constructor

```typescript
new Bundler(outputDir?: string, cacheDir?: string, registry?: string, controllersDir?: string)
```

- `outputDir` - Where to write bundle files (default: `./bundles`)
- `cacheDir` - Where to cache downloaded packages (default: `/tmp/pie-bundler`)
- `registry` - Optional npm registry URL
- `controllersDir` - Where to write standalone controller artifacts (default: `./controllers`)

### Methods

#### `build(request: BuildRequest): Promise<BuildResult>`

Build an IIFE bundle from the specified dependencies.

**Request:**
```typescript
{
  dependencies: Array<{
    name: string;     // @pie-element/multiple-choice
    version: string;  // 0.1.0
  }>,
  options?: {
    requestedBundles?: Array<'player' | 'client-player' | 'editor'>;
    includeControllers?: boolean; // emit /controllers/<dep>_at_<version>/controller.js artifacts
  }
}
```

### Build with standalone controller artifacts

```typescript
import { Bundler } from '@pie-element/bundler-shared';

const bundler = new Bundler('./bundles', './cache', undefined, './controllers');

const result = await bundler.build({
  dependencies: [{ name: '@pie-element/multiple-choice', version: '1.2.3' }],
  options: {
    includeControllers: true,
  },
});

console.log(result.controllers);
// {
//   "@pie-element/multiple-choice@1.2.3":
//   "/controllers/@pie-element/multiple-choice_at_1.2.3/controller.js"
// }
```

When `includeControllers` is enabled, the bundler emits:

- `controllers/<dep>_at_<version>/controller.js`
- `controllers/<dep>_at_<version>/stats.json`

**Response:**
```typescript
{
  success: boolean;
  hash: string;           // Deterministic hash of dependencies
  bundles?: {
    player: string;       // URL to player.js
    clientPlayer: string; // URL to client-player.js
    editor: string;       // URL to editor.js
  };
  controllers?: Record<string, string>; // {"@pie-element/foo@1.2.3":"/controllers/@pie-element/foo_at_1.2.3/controller.js"}
  errors?: string[];
  warnings?: string[];
  duration: number;       // Build time in milliseconds
  cached?: boolean;       // true if loaded from cache
}
```

#### `exists(hash: string): boolean`

Check if a bundle exists for the given hash.

#### `getBundleUrls(hash: string): object`

Get bundle URLs for a hash.

## How It Works

1. **Hash Generation** - Creates deterministic hash from dependencies
2. **Cache Check** - Returns existing bundle if hash matches
3. **Package Installation** - Downloads packages from NPM using pacote
4. **Workspace Setup** - Creates Bun workspace with all dependencies
5. **Entry Generation** - Generates player.js, client-player.js, editor.js entries
6. **Webpack Build** - Bundles with version resolution for @pie-lib packages
7. **(Optional) Standalone Controllers** - When `options.includeControllers=true`, emits controller artifacts compatible with `pie-api-aws` controller layout
8. **Output** - Writes IIFE bundles to output directory

## Output Format

Bundles are IIFE (Immediately Invoked Function Expression) format that attach to `window.pie`:

```javascript
// Generated bundle structure
var pie = (function() {
  // ... bundled code ...
  return {
    '@pie-element/multiple-choice': {
      Element: MultipleChoice,
      controller: { ... },
      Configure: { ... }
    }
  };
})();
window.pie = pie;
```

This is compatible with [pie-player-components](https://github.com/pie-framework/pie-player-components).

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage
```

### Running Tests

The bundler includes comprehensive integration tests that verify:

- ✅ Bundle creation for single and multiple elements
- ✅ Caching behavior (instant retrieval of cached bundles)
- ✅ Deterministic hash generation
- ✅ Version resolution for different @pie-lib versions
- ✅ IIFE bundle format validation
- ✅ Error handling for invalid packages/versions
- ✅ Performance benchmarks

**Note**: Integration tests require network access to download packages from NPM. First-time runs may take 2-3 minutes per test as packages are downloaded. Subsequent runs with cached packages are much faster.

Run tests:

```bash
cd packages/shared/bundler-shared
bun test
```

## License

MIT
