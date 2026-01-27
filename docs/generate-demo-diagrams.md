# Generate Demo System Diagrams

This document describes the diagrams that should be generated for [DEMO_SYSTEM.md](DEMO_SYSTEM.md).

After restarting Claude Code (to load the imagen MCP), run the prompts below to generate hand-drawn style diagrams.

## Setup

The imagen MCP has been configured in `.mcp.json` and dependencies are installed. You need to:

1. Restart Claude Code to load the imagen MCP server
2. Ensure `GOOGLE_API_KEY` environment variable is set
3. Use the prompts below with the imagen MCP

## Diagrams to Generate

### 1. Two-Server Architecture (`docs/img/two-server-architecture.png`)

**Prompt:**
```
Create a hand-drawn, Excalidraw-style technical architecture diagram showing a two-server demo system. The style should look like sketchy whiteboard drawings with rough edges and hand-drawn aesthetic.

The diagram should show:

1. At the top center: A rounded rectangle labeled "Browser" with a small browser window icon
2. Below that, two server boxes side by side:
   - LEFT: "Package Server" box with subtitle "(Bun)" and "Port 4874", containing bullet points:
     • Serves dist/ files
     • Import maps
     • Fast iteration
   - RIGHT: "Verdaccio" box with subtitle "(Docker)" and "Port 4873", containing bullet points:
     • npm publish
     • Validates packages
     • Production test
3. At the bottom center: A rounded rectangle labeled "Workspace Packages" with subtitle "dist/ files"
4. Arrows:
   - From Browser down splitting to both servers
   - From both servers down to Workspace Packages
   - Label left arrow: "Direct file serving"
   - Label right arrow: "npm publish"
5. A small annotation callout box with text: "Two servers = Production validation + Fast development"

Use colors: light blue for Package Server box, light orange for Verdaccio box, light green for Browser, light gray for Workspace. Use sketchy, hand-drawn lines, rough rectangles with slightly wobbly edges, and hand-drawn arrow style. The overall aesthetic should be casual and whiteboard-like, similar to Excalidraw or tldraw style diagrams.
```

**Save to:** `docs/img/two-server-architecture.png`

### 2. Element Loading Flow (`docs/img/element-loading-flow.png`)

**Prompt:**
```
Create a hand-drawn, Excalidraw-style sequence diagram showing the element loading flow in a web application. The style should be sketchy with rough edges like whiteboard drawings.

Show a vertical timeline/sequence with these steps from top to bottom:

1. Box labeled "Browser loads page"
2. Arrow down to: "Import <pie-element-player>" (in code font style)
3. Arrow down to: Rounded box "Player web component registers"
4. Arrow down to: "Set player.model & player.session" (in code font style)
5. Arrow down to: Rounded box "Player calls loadElement()"
6. Arrow down to: Box "Browser resolves via import map" with small note "→ localhost:4874"
7. Arrow down to: Rounded box "Package server serves dist/index.js"
8. Arrow down to: Box "Element class loads"
9. Arrow down to: Rounded box "customElements.define()"
10. Arrow down to: Box "<element> created in DOM" (in code font style)
11. Arrow down to: Final rounded box "Element renders with props"

Use a vertical flowchart style with hand-drawn arrows connecting each step. Add small dotted lines or brackets on the side grouping related steps with labels like "Load Phase", "Register Phase", "Render Phase". Use light colors: blue for browser actions, green for player actions, orange for server actions. Keep the sketchy, casual whiteboard aesthetic with wobbly lines and imperfect shapes.
```

**Save to:** `docs/img/element-loading-flow.png`

### 3. Import Resolution Flow (`docs/img/import-resolution-flow.png`)

**Prompt:**
```
Create a hand-drawn, Excalidraw-style diagram showing how browser import maps resolve module imports. The style should be sketchy and whiteboard-like with rough edges.

Show this flow from left to right:

1. LEFT SIDE: A code snippet box showing:
   ```
   import { renderMath }
   from "@pie-lib/math"
   ```
   (Make it look like a code editor with monospace font suggestion)

2. Arrow pointing right labeled "Browser checks import map"

3. MIDDLE: A rounded box labeled "Import Map" containing:
   {
     "@pie-lib/": "http://localhost:4874/@pie-lib/"
   }
   (JSON-style formatting)

4. Arrow pointing right labeled "Resolves to"

5. RIGHT SIDE: A rounded box showing:
   http://localhost:4874/
   @pie-lib/math-rendering/
   dist/index.js
   (Show as a URL breakdown)

6. Arrow down from right box to: Server icon or box labeled "Package Server" with subtitle "Serves file from workspace"

7. Arrow back left to a small box showing "Module loaded & executed"

Add a small annotation callout: "Native browser feature - no bundler needed!"

Use colors: light purple for the import map box, light blue for code boxes, light green for the server, light yellow for the annotation. Keep rough, sketchy lines and hand-drawn arrow style throughout. Make it look casual and whiteboard-like similar to Excalidraw aesthetic.
```

**Save to:** `docs/img/import-resolution-flow.png`

## Quick Generation Script

After restarting Claude Code, you can ask Claude to generate all three diagrams at once:

```
Generate the three hand-drawn style diagrams for DEMO_SYSTEM.md as specified in docs/generate-demo-diagrams.md. Save them to docs/img/ with the specified filenames.
```

## Alternative: Manual Generation

If you prefer to generate the diagrams manually using an Excalidraw-style tool:

1. Use [Excalidraw](https://excalidraw.com/) to create the diagrams following the descriptions above
2. Export as PNG
3. Save to the appropriate paths in `docs/img/`

## Verification

After generating the diagrams, verify they appear correctly in the documentation:

```bash
# Open the documentation in a markdown previewer
open docs/DEMO_SYSTEM.md
```

The images should be visible at:
- Line 38: Two-Server Architecture
- Line 195: Element Loading Flow
- Line 197: Import Resolution Flow
