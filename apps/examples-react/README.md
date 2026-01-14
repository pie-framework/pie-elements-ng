# PIE React Elements - Examples

Interactive showcase for PIE assessment elements built with React.

## Features

- **Clean React Setup** - Proper Vite + React configuration
- **React Router** - Multi-page navigation
- **Tailwind CSS** - Modern utility-first styling
- **Live Demos** - Interactive element demonstrations

## Development

```bash
# From repository root
bun run react-examples

# Or directly
cd apps/examples-react
bun install
bun run dev
```

Visit http://localhost:5174

## Available Elements

- **Hotspot** - Interactive image hotspot selection
- **Number Line** - Points, lines, and rays on a number line

## Building

```bash
bun run build
```

## Project Structure

```
src/
├── pages/          # Route components
│   ├── Home.tsx
│   ├── HotspotDemo.tsx
│   └── NumberLineDemo.tsx
├── main.tsx        # App entry point
└── index.css       # Global styles
```
