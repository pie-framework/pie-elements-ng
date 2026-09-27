# @pie-element/print-player

Superseded by [`@pie-players/pie-print-player`](https://github.com/pie-framework/pie-players/tree/develop/packages/print-player). Use that package for new and existing hosts.

This package loads each element's `dist/print/index.js`. Those modules keep bare imports such as `react`, which a browser resolves only through an import map, and this player installs none. `@pie-players/pie-print-player` loads `dist/browser/print/index.js` through the shared PIE loader, which resolves React and React DOM through the same import-map policy as the other browser ESM players.

The replacement keeps the `<pie-print>` element and its `config` property. `options.mode` becomes `options.role`.

[PRINT_SUPPORT.md](https://github.com/pie-framework/pie-elements-ng/blob/develop/docs/PRINT_SUPPORT.md) describes the print entries element packages publish.
