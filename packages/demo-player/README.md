# @pie-elements-ng/demo-player

Modern ESM-based demo player component for PIE elements.

## Features

- **ESM-Native**: Works with local-esm-cdn and import maps
- **Framework Agnostic**: Works with both React and Svelte elements
- **TipTap Editor**: JSON/XML editing with syntax highlighting
- **Mode Switching**: gather/view/evaluate/configure modes
- **Accessibility**: Built-in Axe testing integration

## Installation

```bash
bun add @pie-elements-ng/demo-player
```

## Usage

### In Demo HTML Files

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PIE Demo</title>
</head>
<body>
  <pie-demo-player></pie-demo-player>

  <script type="module">
    import '@pie-elements-ng/demo-player';
    import Element from './dist/index.js';
    import Configure from './dist/configure/index.js';
    import * as controller from './dist/controller/index.js';

    const player = document.querySelector('pie-demo-player');
    player.element = { Element, Configure, controller };
    player.model = {
      // Your model here
    };
    player.session = {
      // Your session here
    };
  </script>
</body>
</html>
```

## Properties

- `element: { Element, Configure, controller }` - Element definition object
- `model: any` - PIE model
- `session: any` - PIE session
- `mode: 'gather' | 'view' | 'evaluate' | 'configure'` - Current mode

## Architecture

Based on patterns from pie-qti:
- Lit Web Components for maximum compatibility
- TipTap with Lowlight for syntax-highlighted editing
- Filter-based theme system (works with all DaisyUI themes)
- Resizable panels
- State persistence

## Development

```bash
# Build
bun run build

# Watch mode
bun run dev
```

## License

MIT
