# PIE Elements NG - Applications

Demo and test apps for the elements in this workspace. Run the commands from the repository root.

| App | Start | Port | Purpose |
| --- | --- | --- | --- |
| `element-demo/` | `bun run dev:demo` or `bun run dev:element-demo` | 5222 | Deliver, author, print, docs and source views for every element |
| `element-a11y-demo/` | `bun run dev:a11y` | 5223 | Accessibility scenario demos |
| `esm-player-test/` | `bun run --cwd apps/esm-player-test dev` | 5300 | Published ESM elements in the ESM player |

`dev:element-demo` and `dev:a11y` read a port override from `PORT`; `esm-player-test` fixes its port in `vite.config.js`.

## Element Demo

`bun run dev:demo` runs the CLI wrapper, which regenerates the element import map and starts Vite. `--port` changes the port, `--build` builds all elements first, and `--open` opens the browser. The element and view come from the URL, for example <http://localhost:5222/multiple-choice/deliver>. React and Svelte elements both load.

The ESM views resolve workspace packages to their `src/` files, so element edits show up without a package build. `?player=iife` switches to the IIFE player, which goes through the local bundler ([DEV_BUNDLER.md](element-demo/DEV_BUNDLER.md)). How the app finds elements and their demo data is in [DEMO_SYSTEM.md](../docs/DEMO_SYSTEM.md).

## Tests

- `bun run test:e2e` runs the element-demo Playwright suite, including `smoke-matrix.spec.ts`, which loads every element's deliver, author and print views. `bun run test:iife:e2e` runs the matrix against both the ESM and IIFE players.
- `bun run --cwd apps/element-a11y-demo test:a11y` runs the accessibility scenarios.
- `apps/esm-player-test/README.md` describes that app. Its player loader points at `pie-esm-player`, which is in neither pie-players nor npm, so it does not load a player today.
