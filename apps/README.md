# PIE Elements NG - Applications

This directory contains user-facing applications for demonstrating PIE assessment elements.

## Directory Structure

```
apps/
├── examples-react/     # React elements showcase (port 5174)
└── demos-sveltekit/    # SvelteKit demo host (per-element routes)
```

## Local ESM CDN (dev-only)

If you want to emulate CDN-style ESM loading (importing modules by URL) **without publishing**, run:

```bash
# From repository root
bun run build
bun run local-esm-cdn
```

See `apps/local-esm-cdn/README.md`.

## Quick Start

### React Examples

```bash
# From repository root
bun run react-examples

# Or directly
cd apps/examples-react
bun install
bun run dev
```

Visit http://localhost:5174

**Features:**
- Clean React + Vite setup
- React Router navigation
- Tailwind CSS styling
- Direct component imports (no framework mixing)

**Available elements:**
- Hotspot - Interactive image hotspot selection
- Number Line - Points, lines, and rays

### Svelte Demos (SvelteKit host)

The Svelte demo experience is now hosted in `apps/demos-sveltekit` with per-element routes.

## Architecture Decision

We maintain separate example apps for each framework to:

1. **Avoid cross-framework complexity** - No hacky workarounds needed
2. **Use proper tooling** - Each app uses its native dev tools
3. **Better performance** - No mixed runtime overhead
4. **Clearer boundaries** - Easy to understand and maintain
5. **Independent deployment** - Deploy to different URLs if needed

## Running Both Apps

```bash
# Run both concurrently with Turbo
bun run examples
```

## Building

```bash
# Build React examples
cd apps/examples-react && bun run build

# Build Svelte demos host
cd apps/demos-sveltekit && bun run build
```

## Testing

### React Examples
Currently no tests (TBD)

### Svelte Demos
```bash
cd apps/demos-sveltekit
bun run test:e2e        # Run E2E tests
bun run test:e2e:ui     # Run with Playwright UI
bun run test:a11y       # Run accessibility tests
```
