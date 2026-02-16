# PIE Element Bundler Service

A self-contained, open-source bundler service for creating IIFE bundles of PIE elements.

## Overview

This bundler service creates IIFE (Immediately Invoked Function Expression) bundles compatible with [pie-player-components](https://github.com/pie-framework/pie-player-components). It's a simplified version of the pie-api-aws bundler, with all the core bundling logic but none of the Lambda/Temporal complexity.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  pie-elements-ng                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  @pie-element/bundler-shared                     │  │
│  │  (Framework-agnostic bundler)                    │  │
│  │                                                   │  │
│  │  • Webpack 5 configuration                       │  │
│  │  • Package installer (Bun)                       │  │
│  │  • Entry generator                               │  │
│  │  • Version resolver                              │  │
│  │  • Dependency hasher                             │  │
│  └──────────────────────────────────────────────────┘  │
│                           │                             │
│                           ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  SvelteKit API Endpoint                          │  │
│  │  /api/bundle (POST/GET)                          │  │
│  │                                                   │  │
│  │  • Request validation                            │  │
│  │  • Bundler orchestration                         │  │
│  │  • Response formatting                           │  │
│  └──────────────────────────────────────────────────┘  │
│                           │                             │
│                           ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Test UI                                         │  │
│  │  /bundler                                        │  │
│  │                                                   │  │
│  │  • Input form                                    │  │
│  │  • Build trigger                                 │  │
│  │  • Results display                               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Created Files

### Core Bundler Package
- `packages/shared/bundler-shared/package.json` - Package configuration
- `packages/shared/bundler-shared/src/index.ts` - Main Bundler class
- `packages/shared/bundler-shared/src/types.ts` - TypeScript types
- `packages/shared/bundler-shared/src/installer.ts` - Package installer
- `packages/shared/bundler-shared/src/entry-generator.ts` - Entry file generator
- `packages/shared/bundler-shared/src/webpack-config.ts` - Webpack configuration
- `packages/shared/bundler-shared/src/dependency-resolver.ts` - Version resolution
- `packages/shared/bundler-shared/src/dependency-hash.ts` - Hash generator
- `packages/shared/bundler-shared/README.md` - Documentation

### SvelteKit Integration
- `apps/element-demo/src/routes/api/bundle/+server.ts` - API endpoint
- `apps/element-demo/src/routes/bundler/+page.svelte` - Test UI

## Usage

### 1. Start the Dev Server

```bash
bun run dev
```

### 2. Navigate to the Bundler UI

Open http://localhost:5173/bundler

### 3. Build a Bundle

Enter an element name and version:
- Element: `@pie-element/multiple-choice`
- Version: `0.1.0`

Click "Build Bundle" and wait for the build to complete (~30-60 seconds).

### 4. Use the Bundle

The bundles will be available at:
- Player: `/bundles/{hash}/player.js`
- Client Player: `/bundles/{hash}/client-player.js`
- Editor: `/bundles/{hash}/editor.js`

Load them in your HTML:

```html
<script src="/bundles/{hash}/player.js"></script>
<script>
  // Access the element
  const MultipleChoice = window.pie.default['@pie-element/multiple-choice'].Element;
</script>
```

## API Reference

### POST /api/bundle

Build a bundle from dependencies.

**Request:**
```json
{
  "dependencies": [
    {
      "name": "@pie-element/multiple-choice",
      "version": "0.1.0"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "hash": "1234567890",
  "bundles": {
    "player": "/bundles/1234567890/player.js",
    "clientPlayer": "/bundles/1234567890/client-player.js",
    "editor": "/bundles/1234567890/editor.js"
  },
  "duration": 45000,
  "cached": false
}
```

### GET /api/bundle?hash={hash}

Check if a bundle exists.

**Response:**
```json
{
  "exists": true,
  "bundles": {
    "player": "/bundles/1234567890/player.js",
    "clientPlayer": "/bundles/1234567890/client-player.js",
    "editor": "/bundles/1234567890/editor.js"
  }
}
```

## How It Works

1. **Hash Generation** - Creates a deterministic hash from the list of dependencies
2. **Cache Check** - Returns existing bundle if hash matches (instant)
3. **Package Download** - Downloads packages from NPM using pacote
4. **Workspace Setup** - Creates a Bun workspace with all dependencies
5. **Install Dependencies** - Runs `bun install` to resolve all deps
6. **Entry Generation** - Creates player.js, client-player.js, editor.js entry files
7. **Webpack Build** - Bundles with proper version resolution for @pie-lib packages
8. **Output** - Writes IIFE bundles to static/bundles/{hash}/

## Version Resolution

The bundler handles different versions of `@pie-lib` packages per element:

```
Element A uses @pie-lib/math-rendering@4.0.0
Element B uses @pie-lib/math-rendering@4.1.0
```

The `NormalModuleReplacementPlugin` detects which element is importing and resolves to the correct version automatically.

## Benefits

### vs pie-api-aws Bundler
- ✅ **Self-contained** - No Lambda, Temporal, SNS, or CloudWatch
- ✅ **Open source** - Fully available in this repo
- ✅ **Testable** - Easy to test locally
- ✅ **Simpler** - ~600 lines vs ~5000 lines
- ✅ **Framework agnostic** - Can be used in any Node.js environment

### vs Pre-publishing IIFE Bundles
- ✅ **On-demand** - Build only what's needed
- ✅ **Flexible** - Combine any elements and versions
- ✅ **Space efficient** - Don't store all combinations

## Reusability

The `@pie-element/bundler-shared` package is framework-agnostic and can be used in:

- ✅ SvelteKit (current implementation)
- ✅ Express/Fastify/Hono
- ✅ AWS Lambda
- ✅ CLI tools
- ✅ Any Node.js environment

Example with Express:

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

## Future Enhancements

Potential additions:

- [ ] S3 storage adapter (for production deployments)
- [ ] Build queue (prevent concurrent builds)
- [ ] Build status webhooks
- [ ] Bundle expiration/cleanup
- [ ] Metrics and monitoring
- [ ] CDN integration

## Comparison with Upstream

| Feature | pie-api-aws | bundler-shared |
|---------|-------------|----------------|
| **Bundler** | Webpack 5 | Webpack 5 ✓ |
| **Version resolution** | NormalModuleReplacementPlugin | Same ✓ |
| **Entry generation** | code-generator.ts | Simplified ✓ |
| **Dependency hash** | string-hash | Same ✓ |
| **Package manager** | Yarn Classic | Bun (3-4x faster) |
| **Orchestration** | Temporal workflows | Simple async |
| **Storage** | S3 | Local FS (S3 optional) |
| **Deployment** | Lambda | Any Node.js |
| **Complexity** | ~5000 lines | ~600 lines |
| **Open source** | No (private repo) | Yes ✓ |

## License

MIT
