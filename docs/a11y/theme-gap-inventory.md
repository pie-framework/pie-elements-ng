# Theme gap inventory

Every colour, border, focus ring, shadow and surface in `pie-elements-ng` and `pie-players` that the `--pie-*` theme does not control, with the token each should take ([PIE-1195](https://illuminate.atlassian.net/browse/PIE-1195)). 474 entries: 437 across 61 pie-elements-ng packages and 37 across 36 pie-players packages.

Audited read-only at pie-elements-ng `f059cd93` and pie-players [`1bfe4103`](https://github.com/pie-framework/pie-players/tree/1bfe4103) (`develop`, 2026-10-03), and re-verified at pie-elements-ng `c70c18fb` and pie-players [`d38b00fc`](https://github.com/pie-framework/pie-players/tree/d38b00fc) (`develop`, 2026-11-23). Line numbers refer to the re-verified commits. The re-verification dropped 43 entries that were fixed or went with their package, merged the five audio-autoplay overlay entries into one for the shared prompt-audio toast, and swept the packages added since; of those, only `lib-react/math-input-mathlive` has gaps, its answer-block frames. The audit's total of 576 counted one `literal-border` entry too many. The fixes merged on 2026-11-23, through pie-elements-ng `23f2c388` and pie-players [`cb11d0f9`](https://github.com/pie-framework/pie-players/tree/cb11d0f9), closed a further 56 entries, 33 and 23; line numbers in the remaining entries stay those of the re-verified commits. Paths prefixed `pie-players:` are in pie-players; the rest are in this repository.

## Scope

A gap is a colour-bearing property that renders the same under every colour scheme where it should follow the scheme: a literal, an MUI palette value, an absolute `--pie-white`/`--pie-black`, an unregistered `--pie-*` name or private hook that ends in a literal, or a component left on its library or user-agent default. A registered token with a literal fallback, `transparent`/`inherit`/`currentColor`, and `color-mix` over a registered token are not gaps, except on a surface that ignores the scheme: the themed marks on the fixed white graph plane are listed, because a scheme moves them and leaves the plane. Tests, stories, demo apps, docs and build output are excluded.

`intentional` rows hold colours a comment or ticket fixes on purpose, with the reason quoted. `authored` rows hold colours the item author picks. Neither gets a token.

## Terms

- **View:** `delivery`, `author`, `print`, `shared` (delivery and author), or `debug` (pie-players developer panels).
- **THEMING.md focus chain:** `var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border, …)))`, per [`docs/THEMING.md`](../THEMING.md).
- **Layout theme:** the MUI theme `createTheme` builds in `packages/lib-react/render-ui/src/ui-layout.tsx` (UiLayout, PreviewLayout) and `packages/lib-react/config-ui/src/layout/config-layout.tsx` (ConfigLayout). It sets no palette, so MUI's defaults apply: primary `#1976d2`, paper `#fff`, text `rgba(0,0,0,.87)`, error `#d32f2f`. Both override the contained Button to `#000` on `#e0e0e0`, hover `#bdbdbd` ("ConfigLayout contained", "ui-layout contained").
- **MUI halo:** the hover fill MUI paints on Radio, Checkbox and IconButton: `alpha(palette.primary.main, 0.04)`, or `alpha(palette.action.active, 0.04)` for `color="default"`.
- **MUI grey tooltip:** the default `rgba(97,97,97,.92)` Tooltip with white text.
- **Input and frame edges:** outlines, underlines and response-area frames take `--pie-border-dark`. `--pie-border` falls under the 3:1 non-text minimum: its fallback `#9A9A9A` is 2.81:1 on white under no theme, and pie-players base light's `#8f8f8f` is 2.76:1 on that theme's `--pie-surface` and `--pie-background-dark` (`#ecedf1`).
- **Error text:** `color: theme.palette.error.main` on a validation message. It takes `--pie-incorrect-icon`, the ink variant. The light preset's `--pie-incorrect` (`#E53935`) is 4.23:1 on white, under the 4.5:1 text minimum; `--pie-incorrect-icon` (`#C62828`) is 5.62:1. Delivery error text takes `--pie-missing` instead: pie-players light-gray-on-dark-gray sets `--pie-incorrect-icon` to `#ff0000` on a `#333333` page, 3.16:1, and `--pie-missing` passes every scheme.

## Findings that span the inventory

**`--pie-white` and `--pie-black` mean different things in the two repositories.** pie-players inverts them in all 10 schemes and its base dark theme, and prescribes `--pie-white` for page-coloured fills (`pie-players:packages/theme/src/components.css:28-32`). The pie-elements-ng dark preset (`packages/shared/theming/src/pie-themes.ts:181-182`) and the DaisyUI mapping (`packages/element-theme-daisyui/src/convert.ts:74-75`) keep them absolute. A `--pie-white` surface is therefore right under pie-players and white under `pie-element-theme` dark: the PIE-1187 class. This repository follows both conventions: `config-ui/src/layout/settings-box.tsx` relies on the inversion, while `video-stimulus` moved off `--pie-white`, delivery for PIE-1187 and the author view in [#740](https://github.com/pie-framework/pie-elements-ng/pull/740). Inverting in the two elements-ng presets settles most of the 27 `absolute-white-black` rows at once.

**The layout themes leave MUI's palette at its defaults.** The 204 `mui-palette` rows, covering every React author view and some delivery views, trace to the palette-less `createTheme` calls or to direct `theme.palette.*` and `@mui/material/colors` reads.

**The elements-ng presets leave 14 required tokens unset.** They emit 57 variables (`packages/shared/theming/src/constants.ts:81-393`) and none of the eight `--pie-button-*`, so readers under `pie-element-theme` render their literal fallbacks (`#3B82F6` focus outline, `rgba(0,0,0,.23)` border). The fourteenth, `--pie-focus-keyboard-outline`, was registered after the audit. The presets also emit 14 private hooks as fixed values that no pie-players scheme sets, and the unregistered `--pie-primary-text`.

**No shadow token exists.** The 32 `shadow` rows and every MUI elevation under `mui-palette` use literal black alphas. `pie-players:packages/tool-tts-inline` already reads an unregistered `--pie-shadow`.

**Accessibility failures found in the sweep.** The `@pie-lib/plot` root paints the graph and chart plane MUI `common.white` in every context (`packages/lib-react/plot/src/root.tsx:51-58`, since `08f827fb`), so the marks that keep `color.defaults` literals hold: graphing's `color.defaults.BLACK` strokes are 21:1. `23637af1` records the plane as transparent and those strokes at 1.00:1 under white-on-black; both are wrong. Graphing's at-rest curves, 1.00:1 under base dark and white-on-black at the audit, take `color.defaults.BLACK` since `b56f2c75` (PIE-1138). The failures that remain are the themed correctness marks, badges and labels in graphing, graphing-solution-set and charting, which fall as low as 1.05:1 once a scheme lightens `--pie-correct`, `--pie-incorrect`, `--pie-missing`, their `-icon` variants, `--pie-tertiary`, `--pie-primary-dark` or `--pie-disabled-text`.

**Theme gaps from the sweep that fail no student-facing context:**

- The config-ui settings labels are `rgba(0,0,0,.89)` (`settings/panel.tsx:56`, `settings/toggle.tsx:17,36`, `settings/settings-radio-label.tsx:12`) on the `--pie-white` settings panel. The panel is author-only, so white-on-black and the other delivery schemes never reach it. The labels disappear wherever the panel inverts: under pie-players base dark, and under the elements-ng dark preset once follow-up 1 lands.
- Charting's axis overrides target `.vx-axis-*`, but visx 4 emits `visx-axis-*`, so axes render visx's default `#222` in every scheme: 15.91:1 on the fixed white plane.

## Follow-ups

One per cluster, in the recommended order. Follow-ups 1 and 2 are preset changes that the later ones build on. The tickets cover the React, shared and pie-players entries; the entries in the pie-elements-ng Svelte packages have none.

| # | Follow-up | Clusters (entries) | Repositories | Tickets | Scope |
| --- | --- | --- | --- | --- | --- |
| 1 | Invert `--pie-white`/`--pie-black` in the elements-ng dark preset and DaisyUI mapping | `absolute-white-black` (27) | both | [PIE-1570](https://illuminate.atlassian.net/browse/PIE-1570) | Adopt the pie-players convention in `pie-themes.ts` and `convert.ts`. Then fix what stays wrong: the section-player scroll-hint fade, which is wrong under every scheme; the config-ui settings labels the inverted panel hides (`literal-text` rows, so land them together); and ink on primary fills, which keeps `--pie-white` or takes a new `--pie-on-primary`. |
| 2 | Emit every required token from the elements-ng presets and chain private hooks to `--pie-*` | `private-hook-literal` (10), `preset-coverage` (2) | both | [PIE-1571](https://illuminate.atlassian.net/browse/PIE-1571) | Emit the 14 unset required tokens and derive the 14 preset-emitted hooks from their `--pie-*` roles. Replace the 18 Tiptap template variables editable-html-tip-tap writes onto `:root` on every editor mount. Bridge the NDS icon button palette inside the component (pie-players). Remove number-line's legacy white-on-black hooks. |
| 3 | Tie the layout themes' MUI palette to `--pie-*` | `mui-palette` (204) | pie-elements-ng | [PIE-1568](https://illuminate.atlassian.net/browse/PIE-1568), [PIE-1569](https://illuminate.atlassian.net/browse/PIE-1569) | Map primary, secondary, error, text, background, divider and action in `ui-layout.tsx` and `config-layout.tsx`, then move the direct `theme.palette.*` and `@mui/material/colors` reads. MUI's colour helpers reject `var()` values, so the ticket picks between MUI's CSS-variables theme mode and per-component overrides. Includes the dead `Mui-checked` selectors in `config-ui/src/settings/toggle.tsx` and `text-select/src/tokenizer/controls.tsx`. |
| 4 | Put focus indicators on the THEMING.md focus chain | `focus-ring` (3) | pie-elements-ng | [PIE-1564](https://illuminate.atlassian.net/browse/PIE-1564) | Math-toolbar's field and preview focus borders and the matrix number input. The Svelte editor and settings panel took the chain in [#739](https://github.com/pie-framework/pie-elements-ng/pull/739), and the pie-players rows in [#1045](https://github.com/pie-framework/pie-players/pull/1045) (PIE-1561). |
| 5 | Replace literal fills, borders and text colours with registered tokens | `literal-surface` (31), `literal-border` (21), `literal-text` (19) | pie-elements-ng | [PIE-1573](https://illuminate.atlassian.net/browse/PIE-1573) | The biggest are the React editable-html editor, the config-ui settings and field chrome, the shared prompt-audio autoplay toast, the MathJax context menu and the MathLive answer-block frames. |
| 6 | Register `--pie-shadow` and route elevation shadows through it | `shadow` (32) | both | [PIE-1572](https://illuminate.atlassian.net/browse/PIE-1572) | Registry and schemes in pie-players first. Then literal box-shadows, MUI elevations (with follow-up 3) and the shadows baked into the `@pie-lib/icons` SVGs. |
| 7 | Decide the graph-plane palette and theme chart, graph and icon marks | `svg-marks` (56) | pie-elements-ng | [PIE-1575](https://illuminate.atlassian.net/browse/PIE-1575) | The `@pie-lib/plot` root fixes the plane white (`plot/src/root.tsx:51-58`). Keep it and lock every mark on it to `color.defaults` literals (`BLACK`, `BORDER_GRAY`, `DISABLED_TEXT`, `PRIMARY_DARK`, `TERTIARY`, the `*_WITH_ICON` set), or theme the plane and every mark together; the plane-mark Should-takes below are the second option. Fixes since the audit take the first: graphing's curves (PIE-1138) and charting's labels and Actions menu text are pinned to `color.defaults`, the menu with a comment that theming does not apply in charting (PIE-1250). No decision is recorded. The themed correctness marks, badges and labels still fail. Fix charting's dead `.vx-axis-*` selectors and the `AXIS_TICK_COLOR` that `visualElementsColors` lacks, and replace `visualElementsColors` itself. Theme the correct-answer toggle icon; its three Svelte copies are themed since PIE-1203. |
| 8 | Use the status tokens for correctness and error colours | `status-colours` (27) | pie-elements-ng | [PIE-1574](https://illuminate.atlassian.net/browse/PIE-1574) | Hotspot evaluation outlines and PNG icons, the `@pie-lib/icons` feedback set, the charting and graphing badges and legend swatches (graphing's swatches drift from the marks they label), math-toolbar, the text-select tokenizer and element-player. Unless follow-up 7 themes the plane, the badges on it take the `*_WITH_ICON` literals and the legend panels take the plane palette. |
| 9 | Replace unregistered `--pie-*` reads with registered chains | `unregistered-token` (1) | pie-elements-ng | [PIE-1571](https://illuminate.atlassian.net/browse/PIE-1571) | Replace `--pie-keypad-empty-placeholder`. The `--pie-annotation-*-highlight` names are registered since [#1044](https://github.com/pie-framework/pie-players/pull/1044) (PIE-1577). |
| 10 | Resolve theme tokens for the hotspot Konva marks | `canvas` (5) | pie-elements-ng | [PIE-1566](https://illuminate.atlassian.net/browse/PIE-1566) | Konva draws on a canvas and cannot read CSS variables, so the tooltip, polygon handles, Transformers and delete icon need values resolved from computed style. |
| 11 | Map the active scheme onto MathLive, Desmos and GeoGebra | `embed-defaults` (0) | pie-players | [PIE-1576](https://illuminate.atlassian.net/browse/PIE-1576) | Done: pie-players [#1040](https://github.com/pie-framework/pie-players/pull/1040) maps the scheme onto MathLive's custom properties, Desmos `invertedColors` and `colors`, and GeoGebra `borderColor` and `setGraphicsOptions`. |
| 12 | Theme pie-players controls left on user-agent and DaisyUI defaults | `ua-default` (0), `native-control-default` (0), `daisyui-classes` (0) | pie-players | [PIE-1578](https://illuminate.atlassian.net/browse/PIE-1578) | Done: pie-players [#1042](https://github.com/pie-framework/pie-players/pull/1042) puts the assessment-player navigation buttons and the debug panel toggles on the button tokens and the tool-graph range input on `--pie-primary`, and inlines the ruler and protractor SVGs. |
| 13 | Retire the assessment-toolkit `ThemeProvider` | `legacy-theme-writer` (0) | pie-players | | Done: pie-players [`d7c46ac9`](https://github.com/pie-framework/pie-players/commit/d7c46ac9b) removed it. |

`intentional` (31) and `authored` (5) take no follow-up.

## Student-facing tickets

Tickets are filed only for gaps that fail a student-facing context in an element with live content on production, kc, ar or star: text under 4.5:1 (3:1 for large text), an essential control or graphic under 3:1, or no visible focus indicator, under no theme, the pie-players base theme or one of its 10 colour schemes. Live installs still pin the legacy element builds, so these land with the pie-elements-ng rollout. Minor gaps, author views, pie-players and the elements without live content wait for a later scan, which the follow-ups above organise.

| Ticket | Scope |
| --- | --- |
| [PIE-1199](https://illuminate.atlassian.net/browse/PIE-1199) | Feedback and correctness colours: render-ui `Feedback`, the `color.ts` `CORRECT`/`INCORRECT` fallbacks, multiple-choice error text, number-line feedback panels |
| [PIE-1200](https://illuminate.atlassian.net/browse/PIE-1200) | Focus indicators: multiple-choice choices, the inline-dropdown combobox, the math keypad and math field, the MathJax explorer highlight |
| [PIE-1201](https://illuminate.atlassian.net/browse/PIE-1201) | Marks on the fixed white plot plane in graphing, graphing-solution-set and charting; the graphing-solution-set controls bar; histogram hues; number-line and fraction-model marks |
| [PIE-1202](https://illuminate.atlassian.net/browse/PIE-1202) | Fixed delivery panels, borders and inputs in drawing-response, fraction-model, image-cloze-association, extended-text-entry, passage, math-inline and drag-in-the-blank |
| [PIE-1203](https://illuminate.atlassian.net/browse/PIE-1203) | mc-populated-blank's listen button, shipped with the simple-cloze and venn-classification delivery rows in [#341](https://github.com/pie-framework/pie-elements-ng/pull/341) |
| [PIE-1204](https://illuminate.atlassian.net/browse/PIE-1204) | Keyboard operation of the custom audio play button and the charting Actions trigger, found in passing by the audit |

## New tokens

| Token | Role | Readers |
| --- | --- | --- |
| `--pie-shadow` | elevation shadow colour | the `shadow` rows and MUI elevations; already read, unregistered, by `pie-players:packages/tool-tts-inline` |
| `--pie-on-primary` | ink on a `--pie-primary` fill | pie-players calculator-cortex, tool-calculator-shared, tool-periodic-table, tool-ruler; not needed if follow-up 1 keeps `--pie-white` as that ink |
| `--pie-chart-series-1` … `-12` | histogram bar fill and hover | charting bars; pie-players registers `--pie-calculator-series-1` … `-6` for the same role |
| `--pie-tertiary-dark` | hovered chart mark | charting bars |
| `--pie-highlight` | marked-text fill | text-select tokenizer |
| `--pie-primary-text` | none of its own | emitted, unregistered, by the elements-ng presets; its only reader chains to `--pie-text`; register it or drop the mapping |

## Counts

| Cluster | pie-elements-ng | pie-players | Total |
| --- | --- | --- | --- |
| `mui-palette` | 204 | 0 | 204 |
| `svg-marks` | 56 | 0 | 56 |
| `shadow` | 23 | 9 | 32 |
| `intentional` | 22 | 9 | 31 |
| `literal-surface` | 31 | 0 | 31 |
| `absolute-white-black` | 9 | 18 | 27 |
| `status-colours` | 27 | 0 | 27 |
| `literal-border` | 21 | 0 | 21 |
| `literal-text` | 19 | 0 | 19 |
| `private-hook-literal` | 9 | 1 | 10 |
| `authored` | 5 | 0 | 5 |
| `canvas` | 5 | 0 | 5 |
| `focus-ring` | 3 | 0 | 3 |
| `preset-coverage` | 2 | 0 | 2 |
| `unregistered-token` | 1 | 0 | 1 |
| **Total** | **437** | **37** | **474** |

## pie-elements-ng inventory

### `packages/elements-react/categorize`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| choice card (MUI Card) | delivery | `packages/elements-react/categorize/src/delivery/categorize/choice.tsx:40-47` | box-shadow | Card default elevation (bg and text are themed) | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| validation error text | author | `packages/elements-react/categorize/src/author/design/index.tsx:65` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| validation error text | author | `packages/elements-react/categorize/src/author/design/categories/index.tsx:39` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| validation error text | author | `packages/elements-react/categorize/src/author/design/categories/category.tsx:37` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| validation error text | author | `packages/elements-react/categorize/src/author/design/choices/choice.tsx:51` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| validation error text | author | `packages/elements-react/categorize/src/author/design/choices/index.tsx:26` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| duplicated-category border | author | `packages/elements-react/categorize/src/author/design/categories/category.tsx:20` | border | `'1px solid red'` | `--pie-incorrect-icon` | status-colours |
| category Card | author | `packages/elements-react/categorize/src/author/design/categories/category.tsx:13-22` | background, box-shadow | MUI Paper `#fff` + default elevation | `--pie-background`; shadow `--pie-shadow` (new) | mui-palette |
| choice Card | author | `packages/elements-react/categorize/src/author/design/choices/choice.tsx:31-35,126` | background, box-shadow | MUI Paper `#fff` + default elevation | `--pie-background`; shadow `--pie-shadow` (new) | mui-palette |
| Add category/choice button (contained, `color="primary"`) | author | `packages/elements-react/categorize/src/author/design/buttons.tsx:26-34` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| Delete button (text, `color="primary"`) | author | `packages/elements-react/categorize/src/author/design/buttons.tsx:47` | color, ripple | `palette.primary.main` | `--pie-primary` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/categorize/src/author/design/categories/index.tsx:179-186` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |
| header info tooltip | author | `packages/elements-react/categorize/src/author/design/header.tsx:52-60` | tooltip bg/text | MUI grey tooltip | `--pie-text` bg, `--pie-background` text | mui-palette |
| drag handle icon | author | `packages/elements-react/categorize/src/author/design/choices/choice.tsx:129` | fill | `color="primary"` / `"disabled"` | `--pie-primary` / `--pie-disabled` | mui-palette |
| choice label TextField (outlined) | author | `packages/elements-react/categorize/src/author/design/choices/config.tsx:35-44` | outline, focus outline, label | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-text` | mui-palette |

The drop-placeholder helper text (`author/design/categories/droppable-placeholder.tsx:18`) builds `` `rgba(${theme.palette.common.black}, 0.4)` ``, which is invalid CSS, so the text inherits its parent's colour and carries no gap of its own.

### `packages/elements-react/charting`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| validation error text | author | `packages/elements-react/charting/src/author/configure.tsx:32` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| correct-response chart error border | author | `packages/elements-react/charting/src/author/correct-response.tsx:40` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| correct-response error text | author | `packages/elements-react/charting/src/author/correct-response.tsx:45` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/complex-rubric`

No gaps.

### `packages/elements-react/drag-in-the-blank`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| choice chip | author | `packages/elements-react/drag-in-the-blank/src/author/choice.tsx:29` | background | `theme.palette.common.white` | `--pie-background` | mui-palette |
| choice chip error border | author | `packages/elements-react/drag-in-the-blank/src/author/choice.tsx:36` | border | `#f44336` | `--pie-incorrect-icon` | status-colours |
| choice delete icon hover | author | `packages/elements-react/drag-in-the-blank/src/author/choice.tsx:57` | color | `theme.palette.common.black` | `--pie-text` | mui-palette |
| Add Choice button (contained, `color="primary"`) | author | `packages/elements-react/drag-in-the-blank/src/author/choices.tsx:248-255` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| choices error text | author | `packages/elements-react/drag-in-the-blank/src/author/choices.tsx:38` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| validation error text | author | `packages/elements-react/drag-in-the-blank/src/author/main.tsx:144` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/drag-in-the-blank/src/author/main.tsx:436-443` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |

### `packages/elements-react/drawing-response`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| drawing frame (the drawing area's only edge) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:23` | border | `#E0E1E6` | `--pie-border-dark` (`--pie-border-light` is 1.53:1 under no theme and base light) | literal-border |
| drawing frame | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:26` | background | `#ECEDF1` | `--pie-background-dark` | literal-surface |
| tool toolbar | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:37` | border-bottom | `#E0E1E6` | `--pie-border-light` | literal-border |
| drawing canvas (also the eraser at `drawable-eraser.tsx:64-68` and Konva Transformer defaults) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:29-34` | background | `#fff` | — ("canvas stays white in every scheme… a scorer reviews the drawing on the same white") | intentional |
| drawing palette (paint/fill/outline swatches; black-swatch label `palette.background.paper` at `drawable-palette.tsx:59-61` pairs with the fixed swatch) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:48-51,75-86`, `drawable-palette.tsx:58-60,104,119` | swatch colours | ROYGBIV, lightblue/lightyellow, defaults white/black/red | — | authored |
| fill/outline Select + Menu (standard, in render-ui `InputContainer`) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/drawable-palette.tsx:91-126` | value text, label, underline, arrow, focus underline, menu paper, menu shadow | MUI defaults: text `rgba(0,0,0,.87)`, `InputContainer` label `text.secondary`, underline `rgba(0,0,0,.42)`, arrow `action.active` | text and label `--pie-text`; underline and arrow `--pie-border-dark`; focus `--pie-primary`; menu `--pie-background`; shadow `--pie-shadow` (new) | mui-palette |
| tool, undo and clear buttons (contained) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/button.tsx:22-30` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| tool icon | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/icon.tsx:68` | fill | `#2B3963` | `--pie-button-color` | svg-marks |
| background-image box | author | `packages/elements-react/drawing-response/src/author/image-container.tsx:21` | border | `#0032C2` (active) / `#E0E1E6` | `--pie-primary` / `--pie-border-light` | literal-border |
| image resize handle | author | `packages/elements-react/drawing-response/src/author/image-container.tsx:48-49` | border | `#727272` | `--pie-border-dark` | literal-border |
| upload toolbar | author | `packages/elements-react/drawing-response/src/author/image-container.tsx:63` | background | `#ECEDF1` | `--pie-background-dark` | literal-surface |
| upload toolbar | author | `packages/elements-react/drawing-response/src/author/image-container.tsx:64` | border-bottom | `#E0E1E6` | `--pie-border-light` | literal-border |
| upload button (contained) | author | `packages/elements-react/drawing-response/src/author/button.tsx:12-19` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| validation error text | author | `packages/elements-react/drawing-response/src/author/root.tsx:44` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/ebsr`

No gaps.

### `packages/elements-react/explicit-constructed-response`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| alternate editor error border | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:38` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| alternate error text | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:78` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| max-length TextField underline | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:62-74` | border (rest / hover / focus) | `palette.divider` (1.32:1) / `palette.text.primary` / `palette.primary.main` | rest: drop the override (MUI's `rgba(0,0,0,.42)` is 3.04:1) or `--pie-border-dark` / `--pie-text` / `--pie-primary` | mui-palette |
| response Select + Menu (standard) | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:291-311` | underline, focus underline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |
| Add alternate button (contained, `color="primary"`) | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:335` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| response-area editor | author | `packages/elements-react/explicit-constructed-response/src/author/ecr-toolbar.tsx:14` | background | `theme.palette.common.white` | `--pie-background` | mui-palette |
| validation error text | author | `packages/elements-react/explicit-constructed-response/src/author/main.tsx:89` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/explicit-constructed-response/src/author/main.tsx:461-463` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |

### `packages/elements-react/extended-text-entry`

Print renders the delivery `Main`, so the delivery rows cover print.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| annotated response box | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:27` | background | `rgba(0, 0, 0, 0.06)` | `--pie-background-dark` | literal-surface |
| annotated response box | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:28` | border | `#ccc` | `--pie-border-light` | literal-border |
| inline annotation label chip (its type text at `:416-419`, `:219-221`, `:254-256` must move with it) | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:426` | background | `rgb(242, 242, 242)` | `--pie-background-dark` | literal-surface |
| side-annotation label text | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:382-419` | color | unset, inherits `--pie-text`, so light text on fixed `rgb(153,255,153)` / `rgb(255,204,238)` under dark | fixed dark text paired with the fixed fill, as `annotation-menu.tsx:75` does | literal-text |
| side-annotation label | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:398` | border | `#ffffff` | `--pie-background` | literal-border |
| annotation menu popover | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-menu.tsx:111-116` | box-shadow | `elevation={5}` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| freeform editor popover | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/freeform-editor.tsx:188-190` | box-shadow | `elevation={2}` | `--pie-shadow` (new) | shadow |
| freeform comment TextField (no `variant`, so outlined) | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/freeform-editor.tsx:206-219` | outline, focus outline | MUI outlined defaults `rgba(0,0,0,.23)` / `primary.main`; `InputProps.disableUnderline` is a no-op on the outlined input | `--pie-border-dark` / `--pie-primary`, or `variant="standard"`, which `disableUnderline` assumes | mui-palette |
| annotation highlight fills, side-label fills and pointer, type label colours | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:74,205-264,363-366,405-418,441-444` | background, border-color, color | `rgb(153,255,153)`, `rgb(255,204,238)`, `rgb(0,128,0)`, `rgb(204,0,136)` | — ("annotation fills stay light in every scheme", `annotation-menu.tsx:57`, `freeform-editor.tsx:79`) | intentional |
| highlighted response text | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:205-248,363-366` | color | unset, inherits `--pie-text`, so light text over the fixed `rgb(51,255,51,.5/.7)` and `rgba(255,102,204,.4/.55)` highlights under dark (down to 1.81:1) | fixed dark text paired with the fixed fill, as `annotation-menu.tsx:75` does | literal-text |
| annotation menu positive/negative cells | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-menu.tsx:74-87` | background, color | fixed pos/neg fills with `palette.text.primary` | — ("annotation fills stay light in every scheme") | intentional |
| freeform editor type band, rings and pointer | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/freeform-editor.tsx:27-36,54-71,93-118`, `annotation-utils.ts:235` | background, border, stroke | fixed pos/neg fills; `ANNOTATION_STROKE #757575` | — ("stays fixed until the annotation colours themselves follow the theme") | intentional |
| validation error text | author | `packages/elements-react/extended-text-entry/src/author/main.tsx:51` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/fraction-model`

The chart is `shared`: the author imports `FractionModelChart` for its correct-answer model.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| model part fill | shared | `packages/elements-react/fraction-model/src/delivery/fraction-model-chart.tsx:81-97,237` | fill (rest / hover / selected) | `#FFFFFF` / `rgb(0 0 0 / .25)` / `rgb(60 73 150 / .6)` | `--pie-background` / `--pie-faded-primary` / a selected fill that keeps 3:1 to both the rest fill and the stroke, or a pattern: `--pie-primary` puts the stroke against a selected part at 1.07–2.32:1, and no `color-mix` share over `--pie-primary` holds in every scheme | svg-marks |
| model part stroke | shared | `packages/elements-react/fraction-model/src/delivery/fraction-model-chart.tsx:125,238` | stroke | `#000000` | `--pie-text` | svg-marks |
| part number labels | shared | `packages/elements-react/fraction-model/src/delivery/fraction-model-chart.tsx:111,197` | fill | `#000000` | `--pie-text` | svg-marks |
| student config TextFields (outlined) | delivery | `packages/elements-react/fraction-model/src/delivery/answer-fraction.tsx:97-121` | outline, focus outline, input text, disabled | MUI defaults; input text `rgba(0,0,0,.87)` stays near-black under dark | `--pie-border-dark` / `--pie-primary` / `--pie-text` / `--pie-disabled-text` | mui-palette |
| validation error text | author | `packages/elements-react/fraction-model/src/author/main.tsx:30` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| correct-answer error border | author | `packages/elements-react/fraction-model/src/author/main.tsx:36` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/fraction-model/src/author/main.tsx:204-211` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |
| model-type Select + Menu (outlined) | author | `packages/elements-react/fraction-model/src/author/model-options.tsx:106-118` | outline, focus outline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |

### `packages/elements-react/graphing`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| tool error text | author | `packages/elements-react/graphing/src/author/correct-response.tsx:185` | color | `'red'` | `--pie-incorrect-icon` | status-colours |
| correct-answer graph error border | author | `packages/elements-react/graphing/src/author/correct-response.tsx:488` | border | `'2px solid red'` | `--pie-incorrect-icon` | status-colours |
| validation error text | author | `packages/elements-react/graphing/src/author/correct-response.tsx:129` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/graphing/src/author/correct-response.tsx:471-478` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |
| default-tool Select menu (`disableUnderline`, text overridden) | author | `packages/elements-react/graphing/src/author/correct-response.tsx:160-172` | menu paper, menu shadow, selected item | MUI defaults | `--pie-background` / `--pie-shadow` (new) / `--pie-dropdown-background` | mui-palette |
| validation error text | author | `packages/elements-react/graphing/src/author/configure.tsx:51` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| grid-config Select + Menu (OutlinedInput) | author | `packages/elements-react/graphing/src/author/graphing-config.tsx:246-257` | outline, focus outline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |

### `packages/elements-react/graphing-solution-set`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| number-of-lines Radio | author | `packages/elements-react/graphing-solution-set/src/author/correct-response.tsx:25-27` | color | `'#000000 !important'` | `--pie-text` | literal-text |
| validation error text | author | `packages/elements-react/graphing-solution-set/src/author/correct-response.tsx:31` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| correct-answer graph error border | author | `packages/elements-react/graphing-solution-set/src/author/correct-response.tsx:359` | border | `'2px solid red'` | `--pie-incorrect-icon` | status-colours |
| grid-config Select + Menu | author | `packages/elements-react/graphing-solution-set/src/author/graphing-config.tsx:237-249` | outline, focus outline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |

### `packages/elements-react/hotspot`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| image frame | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/container.tsx:41-42` | background, border | `theme.palette.common.white` | `--pie-background` | mui-palette |
| evaluated circle outline | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/circle.tsx:84-85` | stroke | `'green'` / `'red'` | `--pie-correct` / `--pie-incorrect` | status-colours |
| evaluated polygon outline | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/polygon.tsx:103-104` | stroke | `'green'` / `'red'` | `--pie-correct` / `--pie-incorrect` | status-colours |
| evaluated rectangle outline | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/rectangle.tsx:83-84` | stroke | `'green'` / `'red'` | `--pie-correct` / `--pie-incorrect` | status-colours |
| evaluation icons (`faCorrect` / `faWrong`) | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/icons.ts` | image | PNG data URIs, fixed green check / red X | `--pie-correct-icon` / `--pie-incorrect-icon` (needs vector glyphs) | status-colours |
| evaluation tooltip (Konva Label) | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/image-konva-tooltip.tsx:106-107` | fill | Tag `'white'`; Text default black | `--pie-background` / `--pie-text`, resolved for Konva | canvas |
| hotspot fill, outline and hover outline; palette swatches | shared | `packages/elements-react/hotspot/src/controller/defaults.ts:5-10`, `author/defaults.ts:7-12`, `controller/index.ts:72`, `author/root.tsx:287`, `author/hotspot-palette.tsx:62,80` | fill, stroke | `hotspotColor rgba(137,183,244,.25)`, `outlineColor blue`, hover outline default black | — | authored |
| circle tool button | author | `packages/elements-react/hotspot/src/author/buttons/circle.tsx:12,14` | fill; glyph stroke | `#D3D4D9` active / `#ECEDF1` rest; glyph `black` | `--pie-dropdown-background` / `--pie-background-dark`; glyph `--pie-text` | svg-marks |
| polygon tool button | author | `packages/elements-react/hotspot/src/author/buttons/polygon.tsx:17,28` | fill; glyph fill | `#D3D4D9` active / `#ECEDF1` rest; glyph `black` | `--pie-dropdown-background` / `--pie-background-dark`; glyph `--pie-text` | svg-marks |
| rectangle tool button | author | `packages/elements-react/hotspot/src/author/buttons/rectangle.tsx:17,28` | fill; glyph fill | `#D3D4D9` active / `#ECEDF1` rest; glyph `black` | `--pie-dropdown-background` / `--pie-background-dark`; glyph `--pie-text` | svg-marks |
| image box | author | `packages/elements-react/hotspot/src/author/hotspot-container.tsx:23,26` | border | `#E0E1E6` / `#0032C2` (active) | `--pie-border-light` / `--pie-primary` | literal-border |
| image box error border | author | `packages/elements-react/hotspot/src/author/hotspot-container.tsx:29` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| upload toolbar | author | `packages/elements-react/hotspot/src/author/hotspot-container.tsx:54` | background | `#FFF` | `--pie-background` | literal-surface |
| upload toolbar | author | `packages/elements-react/hotspot/src/author/hotspot-container.tsx:55` | border-bottom | `#E0E1E6` | `--pie-border-light` | literal-border |
| image resize handle | author | `packages/elements-react/hotspot/src/author/hotspot-drawable.tsx:53-54` | border | `#727272` | `--pie-border-dark` | literal-border |
| polygon editing handles | author | `packages/elements-react/hotspot/src/author/hotspot-polygon.tsx:32,229,269-270` | stroke, fill | `HOVERED_COLOR #00BFFF`; first point `blue`, others `white` | `--pie-primary` / `--pie-background`, resolved for Konva | canvas |
| rectangle Konva Transformer | author | `packages/elements-react/hotspot/src/author/hotspot-rectangle.tsx:155` | anchor fill/stroke, border | Konva defaults `rgb(0,161,255)` / white anchors | `--pie-primary` / `--pie-background`, resolved for Konva | canvas |
| circle Konva Transformer (border is authored) | author | `packages/elements-react/hotspot/src/author/hotspot-circle.tsx:154` | anchor fill/stroke | Konva defaults | `--pie-primary` / `--pie-background`, resolved for Konva | canvas |
| delete widget icon (`faDelete`) | author | `packages/elements-react/hotspot/src/author/icons.ts`, used at `author/DeleteWidget.tsx:52` | image | fixed-colour PNG data URI on the Konva canvas | `--pie-text` (needs a vector glyph resolved for Konva) | canvas |
| contained buttons | author | `packages/elements-react/hotspot/src/author/button.tsx:12-20` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| fill/outline Selects + Menus (standard) | author | `packages/elements-react/hotspot/src/author/hotspot-palette.tsx:55-85` | underline, focus underline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |
| validation error text | author | `packages/elements-react/hotspot/src/author/root.tsx:84` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/hotspot/src/author/root.tsx:265-267` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |

### `packages/elements-react/image-cloze-association`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| drop zone while dragging | delivery | `packages/elements-react/image-cloze-association/src/delivery/image-drop-target.tsx:22` | background | `rgba(230, 242, 252, .8)` | `--pie-faded-primary` | literal-surface |
| drop zone hover | delivery | `packages/elements-react/image-cloze-association/src/delivery/image-drop-target.tsx:28` | border | `rgb(158, 158, 158)` | `--pie-border` | literal-border |
| drop zone hover | delivery | `packages/elements-react/image-cloze-association/src/delivery/image-drop-target.tsx:29` | background | `rgb(224, 224, 224)` | `--pie-dropdown-background` | literal-surface |
| response area fill | delivery | `packages/elements-react/image-cloze-association/src/delivery/image-drop-target.tsx:96` | background | `responseAreaFill` from the model | — | authored |
| max-choices warning banner | delivery | `packages/elements-react/image-cloze-association/src/delivery/root.tsx:605` | background | `#dddddd` under inherited `--pie-text` | `--pie-background-dark`, landing with the `:642` icon row: MUI's secondary `#9c27b0` on `--pie-background-dark` drops to 1.50–2.94:1 in six schemes | literal-surface |
| max-choices warning icon | delivery | `packages/elements-react/image-cloze-association/src/delivery/root.tsx:630` | fill | `color="secondary"` (MUI default purple) | `--pie-secondary` | mui-palette |
| validation error text | author | `packages/elements-react/image-cloze-association/src/author/root.tsx:41` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/inline-dropdown`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| response-area choice menu item | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:23` | background | `color.white()` (`--pie-white`, absolute under dark; its comment points at annotation-menu, which uses `--pie-background`) | `--pie-background` | absolute-white-black |
| correct-choice check badge | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:34,39` | color, background | `theme.palette.common.white` on `color.correct()` (1.37:1 under base dark) | glyph `--pie-white` on `--pie-correct-icon` | mui-palette |
| choice edit/remove IconButtons | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:67` | color | `theme.palette.common.black` | `--pie-text` | mui-palette |
| response toolbar | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:142` | box-shadow | `theme.shadows[2]` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| choice editor | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:149` | background | `theme.palette.common.white` | `--pie-background` | mui-palette |
| add/done ToolbarButton | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:155-163` | color | `theme.palette.common.black` | `--pie-text` | mui-palette |
| validation error text | author | `packages/elements-react/inline-dropdown/src/author/main.tsx:121` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| response-area error text | author | `packages/elements-react/inline-dropdown/src/author/response-area.tsx:15` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/inline-dropdown/src/author/main.tsx:111-117,548-550` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |
| choice-rationale Accordion | author | `packages/elements-react/inline-dropdown/src/author/main.tsx:411-442` | paper background, shadow, expand icon | MUI Paper `#fff` + elevation, `action.active` | `--pie-background` / `--pie-shadow` (new) / `--pie-text` | mui-palette |
| editor text-colour classes (`extraCSSRules` `.red` / `.blue`) | author | `packages/elements-react/inline-dropdown/src/author/main.tsx:474-483,561-570` | color | authored CSS rules | — | authored |

### `packages/elements-react/likert`

Delivery and author only; there is no print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| radio, disabled | delivery | `packages/elements-react/likert/src/delivery/choice-input.tsx:19` | color | `var(--choice-input-disabled-color, grey)` (`color.defaults.DISABLED`) | `--pie-disabled` | private-hook-literal |
| radio hover halo | delivery | `packages/elements-react/likert/src/delivery/choice-input.tsx:13-21` | background (:hover) | MUI halo, primary | `color-mix` over `--pie-primary` | mui-palette |
| error text | author | `packages/elements-react/likert/src/author/main.tsx:99,128` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| CustomColorRadio hover halo | author | `packages/elements-react/likert/src/author/main.tsx:132-134` | background (:hover) | MUI halo, primary, under a tertiary `!important` check | `color-mix` over `--pie-tertiary` | mui-palette |

### `packages/elements-react/match`

Delivery and author; there is no print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| answer-grid Radio/Checkbox hover halo | delivery | `packages/elements-react/match/src/delivery/answer-grid.tsx:183-205` | background (:hover) | MUI halo, primary (`&&:hover` sets only `color`) | `color-mix` over `--pie-primary-light` | mui-palette |
| correct-answer radio (error state) and ErrorText | author | `packages/elements-react/match/src/author/row.tsx:45,80` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| RadioButtonStyled hover halo | author | `packages/elements-react/match/src/author/row.tsx:40-47` | background (:hover) | MUI halo, primary | `color-mix` over `--pie-primary` | mui-palette |
| row drag handle | author | `packages/elements-react/match/src/author/row.tsx:191` | color | `color="primary"` | `--pie-primary` | mui-palette |
| delete IconButton | author | `packages/elements-react/match/src/author/row.tsx:236` | color, background (:hover) | `palette.action.active`, MUI halo, default | `--pie-text`, `--pie-button-hover-bg` | mui-palette |
| row drop target | author | `packages/elements-react/match/src/author/row.tsx:289` | background | `rgba(0, 0, 0, 0.1)` | `--pie-dropdown-background` | literal-surface |
| Info icon | author | `packages/elements-react/match/src/author/general-config-block.tsx:92` | color | `color="primary"` | `--pie-primary` | mui-palette |
| Tooltip | author | `packages/elements-react/match/src/author/general-config-block.tsx:47-53,91` | background, color | `alpha(grey[700], 0.92)`, `common.white` | `--pie-text` bg, `--pie-background` text | mui-palette |
| Select and menu | author | `packages/elements-react/match/src/author/general-config-block.tsx:119-128` | text, underline, focus, menu paper, item hover/selected | MUI defaults (`text.primary`, `rgba(0,0,0,0.42)`, `primary.main`, `background.paper`, `action.hover/selected`) | `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |
| add-row Button (text) | author | `packages/elements-react/match/src/author/add-row.tsx:28` | color, background (:hover) | default primary | `--pie-primary` | mui-palette |
| error text | author | `packages/elements-react/match/src/author/answer-config-block.tsx:62,69` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| error text | author | `packages/elements-react/match/src/author/configure.tsx:58` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/match-list`

Delivery only; there is no author or print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| response area, drag/selected/hover | delivery | `packages/elements-react/match-list/src/delivery/answer.tsx:356` | background (inline style) | `rgba(0,0,0,0.05)` | `--pie-dropdown-background` | literal-surface |
| choices pool, drag-over | delivery | `packages/elements-react/match-list/src/delivery/droppable-placeholder.tsx:40` | background | `rgba(0,0,0,0.05)` | `--pie-dropdown-background` | literal-surface |

### `packages/elements-react/math-inline`

Print renders `../delivery/main.js`, so the delivery rows also apply to print.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| response block "R" label | delivery | `packages/elements-react/math-inline/src/delivery/main.tsx:911-913` | color | `grey` | `--pie-text` | literal-text |
| error text | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:78` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Info icon | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:286` | color | `color="primary"` | `--pie-primary` | mui-palette |
| Tooltip | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:69-74,285` | background, color | MUI defaults | `--pie-text` bg, `--pie-background` text | mui-palette |
| Select and menu (outlined: no `variant` inside the render-ui `InputContainer` FormControl) | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:322-341,369-388` | text, outline, focus outline, menu paper, item hover/selected | MUI defaults, outline `rgba(0,0,0,.23)` | `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |
| template title InputLabel | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:24,344` | color | `palette.text.secondary` | `--pie-text` | mui-palette |
| response Card | author | `packages/elements-react/math-inline/src/author/response.tsx:24-40,288` | box-shadow | elevation-1 shadow; the background follows the scheme | new token needed: `--pie-shadow`, for elevation shadows | shadow |
| CustomColorCheckbox hover halo | author | `packages/elements-react/math-inline/src/author/response.tsx:103-105` | background (:hover) | MUI halo, primary | `color-mix` over the checkbox's `--pie-*` colour | mui-palette |
| add/remove alternate buttons | author | `packages/elements-react/math-inline/src/author/response.tsx:107-119` | background (:hover) | `alpha(primary.main, 0.04)` | `--pie-button-hover-bg` | mui-palette |
| Select and menu (outlined, as above) | author | `packages/elements-react/math-inline/src/author/response.tsx:34-40,295-304` | focus outline, menu paper, item hover/selected | MUI defaults; text, icon and resting outline follow the scheme | `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |
| error text | author | `packages/elements-react/math-inline/src/author/configure.tsx:43` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |

The remove-alternate button text (`author/response.tsx:112-118`) reads `color.disabled()`, a registered token, so it has no row. `--pie-disabled` is `grey` in base light and as fallback, 3.95:1 on the response Card, white in base light and with no theme, on an enabled button; it takes `--pie-disabled-text`.

### `packages/elements-react/math-templated`

Print renders `../delivery/main.js`, so the delivery rows also apply to print.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| response block "R" label | delivery | `packages/elements-react/math-templated/src/delivery/main.tsx:151-153` | color | `grey` | `--pie-text` | literal-text |
| ErrorText, ResponseAreaError | author | `packages/elements-react/math-templated/src/author/design.tsx:71,77` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Info icon | author | `packages/elements-react/math-templated/src/author/design.tsx:442` | color | `color="primary"` | `--pie-primary` | mui-palette |
| Tooltip | author | `packages/elements-react/math-templated/src/author/design.tsx:112-118,441` | background, color | MUI defaults | `--pie-text` bg, `--pie-background` text | mui-palette |
| StyledSelect and menu | author | `packages/elements-react/math-templated/src/author/design.tsx:97-99,475-494` | text, outline, focus, menu paper, item hover/selected | MUI defaults, outline `rgba(0,0,0,.23)` | `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |
| response Card | author | `packages/elements-react/math-templated/src/author/response.tsx:22-39,306` | box-shadow | elevation shadow; the background follows the scheme | new token needed: `--pie-shadow` | shadow |
| CustomColorCheckbox hover halo | author | `packages/elements-react/math-templated/src/author/response.tsx:106-108` | background (:hover) | MUI halo, primary | `color-mix` over the checkbox's `--pie-*` colour | mui-palette |
| AlternateButton | author | `packages/elements-react/math-templated/src/author/response.tsx:72-75` | background (:hover) | `alpha(primary.main, 0.04)` | `--pie-button-hover-bg` | mui-palette |
| RemoveAlternateButton IconButton | author | `packages/elements-react/math-templated/src/author/response.tsx:77-79,385-389` | color, background (:hover) | `action.active`, MUI halo, default | `--pie-text`, `--pie-button-hover-bg` | mui-palette |
| Select and menu (outlined) | author | `packages/elements-react/math-templated/src/author/response.tsx:32-39,313-318` | focus outline, menu paper, item hover/selected | MUI defaults; text, icon and resting outline follow the scheme | `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |

### `packages/elements-react/matrix`

Delivery and author; there is no print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| radio, disabled | delivery | `packages/elements-react/matrix/src/delivery/ChoiceInput.tsx:18` | color | `var(--choice-input-disabled-color, grey)` | `--pie-disabled` | private-hook-literal |
| radio hover halo | delivery | `packages/elements-react/matrix/src/delivery/ChoiceInput.tsx:10-20` | background (:hover) | MUI halo, primary | `color-mix` over `--pie-primary` | mui-palette |
| label chip | author | `packages/elements-react/matrix/src/author/MatrixLabelEditableButton.tsx:45,47` | background, color | `#04b26e`, `white` | `--pie-button-bg`, `--pie-button-color` | literal-surface |
| label chip hover, action divider, edit input | author | `packages/elements-react/matrix/src/author/MatrixLabelEditableButton.tsx:74,86,88,105,108` | background, border-left, color | `#00985d`, `white` | `--pie-button-hover-bg`, `--pie-button-hover-color` | literal-surface |
| label menu items | author | `packages/elements-react/matrix/src/author/MatrixLabelEditableButton.tsx:219-243` | background (:hover) | `palette.action.hover` | `--pie-dropdown-background` | mui-palette |
| column header text | author | `packages/elements-react/matrix/src/author/HeaderCommon.ts:13` | color | `#c3c3c3` | `--pie-text` | literal-text |
| value grid separators | author | `packages/elements-react/matrix/src/author/MatrixValues.tsx:66,72` | background | `gray` | `--pie-border` | literal-border |
| number input outline | author | `packages/elements-react/matrix/src/author/NumberInput.tsx:28,43` | border-color (hover, rest) | `gray`, `#d6d6d6` | `--pie-border`, `--pie-border-light` | literal-border |
| number input focus | author | `packages/elements-react/matrix/src/author/NumberInput.tsx:31` | border-color (:focus) | `green` | `--pie-button-focus-outline` | focus-ring |
| number input text | author | `packages/elements-react/matrix/src/author/NumberInput.tsx:21-45` | color | TextField default `text.primary` | `--pie-text` | mui-palette |
| header type radio and label | author | `packages/elements-react/matrix/src/author/MatrixLabelTypeHeaderInput.tsx:19-23` | background (:hover), label color (disabled) | MUI halo, primary; `text.disabled` | `color-mix` over `--pie-primary`, `--pie-disabled-text` | mui-palette |
| error text | author | `packages/elements-react/matrix/src/author/Main.tsx:62` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/multi-trait-rubric`

Delivery and author; there is no print view. `src/delivery/trait.tsx:16` paints NoDescription text with `color.secondaryBackground()`. The token is registered, so this is not a gap, but a surface token as text sits near 1.1:1. It should read `--pie-disabled-text`.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| show/hide Link (`component="button"`) | delivery | `packages/elements-react/multi-trait-rubric/src/delivery/main.tsx:98-106` | color, text-decoration-color | `palette.primary.main` | `--pie-primary` | mui-palette |
| scale scroll-arrow fade | delivery | `packages/elements-react/multi-trait-rubric/src/delivery/scale.tsx:175,277` | background | `linear-gradient(…, white, var(--pie-background))` | `--pie-background` at both stops | literal-surface |
| input and box borders | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:38,49,76,94,105,194,294` | border-color | `grey[400]` from `@mui/material/colors` | `--pie-border-dark` | mui-palette |
| editable level fields | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:83,88` | background | `palette.common.white` | `--pie-background` | mui-palette |
| ScorePointBox | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:190` | background | `white` | `--pie-background` | literal-surface |
| max-points Select and menu | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:283-326` | background (:285), text, border, focus, menu paper, items | `palette.common.white`, border `grey[400]`, MUI defaults | `--pie-background`, `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-dropdown-background` | mui-palette |
| scroll-arrow gradient | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:465,476` | background | `palette.common.white` | `--pie-background` | mui-palette |
| scroll-arrow inline gradient | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:491` | background (inline style) | `white` | `--pie-background` | literal-surface |
| Dialog | author | `packages/elements-react/multi-trait-rubric/src/author/modals.tsx:32-36,76` | paper background, box-shadow, backdrop | `background.paper`, elevation-24, `rgba(0,0,0,0.5)` | `--pie-background`; new token needed: `--pie-shadow` | mui-palette |
| confirm StyledButton | author | `packages/elements-react/multi-trait-rubric/src/author/modals.tsx:59-67` | color, background (:hover) | `palette.common.white` on `color.primary()`; hover `alpha(primary.main, 0.04)` drops the fill | `--pie-background` text, `--pie-primary-dark` hover | mui-palette |
| CancelButton | author | `packages/elements-react/multi-trait-rubric/src/author/modals.tsx:69-72` | background (:hover) | `alpha(primary.main, 0.04)` over `color.secondaryBackground()`, inherited from StyledButton | `--pie-button-hover-bg` | mui-palette |
| error text | author | `packages/elements-react/multi-trait-rubric/src/author/traitsHeader.tsx:85` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| MoreVert IconButton | author | `packages/elements-react/multi-trait-rubric/src/author/traitsHeader.tsx:186-193` | color, background (:hover) | `action.active`, MUI halo, default | `--pie-text`, `--pie-button-hover-bg` | mui-palette |
| header menu items | author | `packages/elements-react/multi-trait-rubric/src/author/traitsHeader.tsx:203` | background (:hover) | `palette.action.hover` | `--pie-dropdown-background` | mui-palette |
| error text | author | `packages/elements-react/multi-trait-rubric/src/author/trait.tsx:52` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| options IconButton | author | `packages/elements-react/multi-trait-rubric/src/author/trait.tsx:41-43,158` | color, background (:hover) | `action.active`, MUI halo, default | `--pie-text`, `--pie-button-hover-bg` | mui-palette |
| trait menu items | author | `packages/elements-react/multi-trait-rubric/src/author/trait.tsx:176` | background (:hover) | `palette.action.hover` | `--pie-dropdown-background` | mui-palette |

### `packages/elements-react/multiple-choice`

Print renders `../delivery/main.js`, so the delivery rows also apply to print. The delivery inputs set `disableRipple`, so they have no hover halo.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| selected/hover answer stroke and fill | delivery | `packages/elements-react/multiple-choice/src/delivery/choice.tsx:107-191` | border-color, background | model fields `selectedAnswerStrokeColor` and related (default `initial`) | — | authored |
| error text | author | `packages/elements-react/multiple-choice/src/author/main.tsx:123` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Info icon | author | `packages/elements-react/multiple-choice/src/author/main.tsx:315` | color | `color="primary"` | `--pie-primary` | mui-palette |
| Tooltips | author | `packages/elements-react/multiple-choice/src/author/main.tsx:107-113,309,378` | background, color | MUI defaults | `--pie-text` bg, `--pie-background` text | mui-palette |
| AddButton (contained, primary) | author | `packages/elements-react/multiple-choice/src/author/main.tsx:80-94,380-395` | background, color, hover, shadow, disabled color | ConfigLayout contained; `action.disabled` | `--pie-button-bg`, `--pie-button-color`, `--pie-button-hover-bg`, `--pie-disabled` | mui-palette |

### `packages/elements-react/number-line`

Delivery and author; there is no print view. The author preview renders the delivery component, so the delivery rows show in author too.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| legacy `colorContrast` mode background (from `env.accessibility.colorContrast`) | delivery | `packages/elements-react/number-line/src/delivery/number-line/index.tsx:53-57,71-75` | background-color | `mistyrose` (black_on_rose), `black` (white_on_black) | `--pie-background`; retire the branch for player schemes | literal-surface |
| legacy white_on_black hooks | delivery | `packages/elements-react/number-line/src/delivery/number-line/index.tsx:58-63,76-81` | `--correct-answer-toggle-label-color`, `--tick-color`, `--line-stroke`, `--arrow-color`, `--point-stroke`, `--point-fill` | `white`; `black` for point fill. Only `--correct-answer-toggle-label-color` has a reader | `--pie-text`, `--pie-background` | private-hook-literal |
| empty point | delivery | `packages/elements-react/number-line/src/delivery/number-line/graph/elements/point.tsx:47-49` | fill | `white` | `--pie-background` | svg-marks |
| point-chooser delete icon | delivery | `packages/elements-react/number-line/src/delivery/number-line/point-chooser/index.tsx:15,26` | fill | `black`, `#000000` | `--pie-text` | svg-marks |
| point-type icon sprite | shared | `packages/elements-react/number-line/src/delivery/number-line/point-chooser/index.tsx:57` (asset in `img.ts`; also used by `src/author/point-config.tsx`) | background-image | raster PNG data URI with baked colours | SVG icons painted with `--pie-text`, `--pie-primary` | svg-marks |
| point-chooser Button (contained) | delivery | `packages/elements-react/number-line/src/delivery/number-line/point-chooser/button.tsx:8-30` | background, color, hover, shadow, disabled | ui-layout contained; `action.disabled` | `--pie-button-bg`, `--pie-button-color`, `--pie-button-hover-bg`, `--pie-disabled` | mui-palette |
| min/max label | author | `packages/elements-react/number-line/src/author/size.tsx:21` | color | `gray` | `--pie-disabled-text` | literal-text |
| point-config outlined Buttons | author | `packages/elements-react/number-line/src/author/point-config.tsx:71,74` | color, border, background (:hover) | default primary | `--pie-primary`, `--pie-button-hover-bg` | mui-palette |
| card-bar Tooltip and help IconButton | author | `packages/elements-react/number-line/src/author/card-bar.tsx:36-49` | background, color, hover | MUI defaults | `--pie-text` bg, `--pie-background` text, `--pie-button-hover-bg` | mui-palette |
| error text | author | `packages/elements-react/number-line/src/author/main.tsx:124` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Info icon in Tooltip | author | `packages/elements-react/number-line/src/author/main.tsx:629-645` | color; tooltip background and text | `color="primary"`, MUI defaults | `--pie-primary`; `--pie-text` bg, `--pie-background` text | mui-palette |
| CustomColorRadio hover halo | author | `packages/elements-react/number-line/src/author/ticks.tsx:46-48` | background (:hover) | MUI halo, primary | `color-mix` over the radio's `--pie-*` colour | mui-palette |

### `packages/elements-react/passage`

Print renders `../delivery/stimulus-tabs.js`, so the delivery rows also apply to print.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| blockquote | delivery | `packages/elements-react/passage/src/delivery/stimulus-tabs.tsx:96-98` | background, border-left | `#f9f9f9`, `5px solid #ccc` | `--pie-background-dark`, `--pie-border-light` | literal-surface |
| Tabs indicator | delivery | `packages/elements-react/passage/src/delivery/stimulus-tabs.tsx:466` | background | `color.white()` | `--pie-background` | absolute-white-black |
| add/remove passage Button | author | `packages/elements-react/passage/src/author/common.tsx:17-35` | color, background (:hover), icon color | `color="primary"`. The PassageButton override never applies because RemoveAddButton drops `className` | `--pie-primary`, `--pie-button-hover-bg` | mui-palette |
| ConfirmationDialog | author | `packages/elements-react/passage/src/author/common.tsx:37-58` | paper background, shadow, backdrop, content text, button colour | `background.paper`, elevation-24, `text.secondary`, `color="primary"` | `--pie-background`, `--pie-text`, `--pie-primary`; new token needed: `--pie-shadow` | mui-palette |
| error text | author | `packages/elements-react/passage/src/author/passage.tsx:17` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/placement-ordering`

Delivery and author; there is no print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| tile hover and drop-over border | delivery | `packages/elements-react/placement-ordering/src/delivery/tile.tsx:61,72` | border-color | `theme.palette.primary.main` | `--pie-primary` | mui-palette |
| tile drag/selected shadow | delivery | `packages/elements-react/placement-ordering/src/delivery/tile.tsx:83` | box-shadow | `0 8px 16px rgba(0,0,0,0.2)` | new token needed: `--pie-shadow`, for elevation shadows | shadow |
| choice tile | author | `packages/elements-react/placement-ordering/src/author/choice-tile.tsx:20` | background | `palette.background.paper` | `--pie-background` | mui-palette |
| drag handle | author | `packages/elements-react/placement-ordering/src/author/choice-tile.tsx:40-42` | color | `palette.error[400]`, undefined in MUI 7, so it inherits | `--pie-text` | mui-palette |
| remove IconButton | author | `packages/elements-react/placement-ordering/src/author/choice-tile.tsx:51-57` | icon fill, color, background (:hover) | `palette.error[500]` (undefined); `color="tertiary"`; MUI halo, `action.active` | `--pie-tertiary`, `--pie-button-hover-bg` | mui-palette |
| error text | author | `packages/elements-react/placement-ordering/src/author/choice-tile.tsx:46` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| shuffle/add StyledAddButton (contained) | author | `packages/elements-react/placement-ordering/src/author/choice-editor.tsx:104-115,293-299` | background, color, hover, shadow | ConfigLayout contained | `--pie-button-bg`, `--pie-button-color`, `--pie-button-hover-bg` | mui-palette |
| error text | author | `packages/elements-react/placement-ordering/src/author/choice-editor.tsx:130` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| error text | author | `packages/elements-react/placement-ordering/src/author/design.tsx:84` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Tooltip and Info icon | author | `packages/elements-react/placement-ordering/src/author/design.tsx:355-371` | background, color | MUI defaults, `color="primary"` | `--pie-text` bg, `--pie-background` text, `--pie-primary` | mui-palette |

### `packages/elements-react/rubric`

No gaps. Delivery uses `color.*` helpers. Print renders `../delivery/main.js`. Author wraps `@pie-lib/rubric` Authoring in ConfigLayout and defines no colours of its own.

### `packages/elements-react/select-text`

Print renders `../delivery/main.js`. Delivery has no gaps.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| ErrorText | author | `packages/elements-react/select-text/src/author/design.tsx:50-54` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| tokenizer underline | author | `packages/elements-react/select-text/src/author/design.tsx:60-74` | background-color (`:after`) | `palette.primary.main` | `--pie-primary` | mui-palette |
| Info icon | author | `packages/elements-react/select-text/src/author/design.tsx:396` | color | `color="primary"` | `--pie-primary` | mui-palette |
| StyledTooltip | author | `packages/elements-react/select-text/src/author/design.tsx:76-82,395` | background, color | MUI defaults | `--pie-text` bg, `--pie-background` text | mui-palette |
| summary Chips | author | `packages/elements-react/select-text/src/author/design.tsx:88-91,406-411` | background, color | `palette.action.selected`, `text.primary` | `--pie-dropdown-background`, `--pie-text` | mui-palette |
| text TextField (standard) | author | `packages/elements-react/select-text/src/author/design.tsx:56-58,383-389` | text, underline, focus underline | `text.primary`, `rgba(0,0,0,0.42)`, `primary.main` | `--pie-text`, `--pie-border-dark`, `--pie-primary` | mui-palette |

### `packages/elements-svelte/mc-populated-blank`

Print renders `McPopulatedBlank.svelte`, so the delivery rows also apply to print. The `--mpb-choice-*` and `--mpb-focus-ring` hooks resolve to registered tokens in `ChoiceRow.svelte` and `McPopulatedBlank.svelte:502-507`. The CQT variant sheets set them to literals; those rows are marked intentional.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| listen button hover | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/AudioPlayer.svelte:239` | background-color | `#e2f1fe` | — ("Fixed light plates, at rest and on hover: the artwork's outlines and baked \"Listen\" label are dark literals an <img> cannot theme") | intentional |
| sel-vic blank answer | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sel-vic.css:83-84` | color, background-color | `#cc3333` on `#fff` | — ("red holds AA only on the CQT's white page") | intentional |
| sel-vic choice selected/hover | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sel-vic.css:120-121,132-133,138-139` | background-color, color | `#fcfcd3`, `#f2f2f2`, `#000` | — (CQT `vic.scss` parity) | intentional |
| sr-vic blank answer | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sr-vic.css:41-42` | color, background-color | `#cc3333` on `#fff` | — ("red holds AA only on the CQT's white page") | intentional |
| sr-vic choice selected/hover | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sr-vic.css:48-49,85-86,99-100` | background-color, color | `#fcfcd3`, `#f2f2f2`, `#000` | — (CQT `vic.scss` parity) | intentional |
| sel-r1-s3 choice tile hover/selected | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sel-r1-s3.css:96-97,104-105` | background, color | `#e2e2e2`, `#fcfcd3`, `#000` | — (CQT parity; the sibling sheets carry the comment, this one has none) | intentional |
| sel-r1-plusggg choice hooks | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sel-r1-plusggg.css:11-14` | `--mpb-choice-hover-*`, `--mpb-choice-selected-*` | `#f2f2f2`, `#fcfcd3`, `#000` | — ("A fixed light surface takes fixed dark text") | intentional |
| sel-r1-gplusggg choice hooks | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sel-r1-gplusggg.css:11-14` | `--mpb-choice-hover-*`, `--mpb-choice-selected-*` | `#f2f2f2`, `#fcfcd3`, `#000` | — ("A fixed light surface takes fixed dark text") | intentional |
| sel-r1-g-stem choice hooks | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sel-r1-g-stem.css:10-13` | `--mpb-choice-hover-*`, `--mpb-choice-selected-*` | `#f2f2f2`, `#fcfcd3`, `#000` | — ("A fixed light surface takes fixed dark text") | intentional |
| sel-r1-gg-plus choice hooks | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sel-r1-gg-plus.css:10-13` | `--mpb-choice-hover-*`, `--mpb-choice-selected-*` | `#f2f2f2`, `#fcfcd3`, `#000` | — ("A fixed light surface takes fixed dark text") | intentional |
| sel-r1-ggplus choice hooks | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/cqt-css/sel-r1-ggplus.css:10-13` | `--mpb-choice-hover-*`, `--mpb-choice-selected-*` | `#f2f2f2`, `#fcfcd3`, `#000` | — ("A fixed light surface takes fixed dark text") | intentional |

### `packages/elements-svelte/simple-cloze`

The author view and `print/Print.svelte` have no gaps; both read only registered tokens with literal fallbacks.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |

### `packages/elements-svelte/venn-classification`

Delivery and author; there is no print view. The author preview renders the delivery component. Delivery reads registered tokens with literal fallbacks everywhere except the tile shadows; the author view (`Author.svelte`, `RegionPicker.svelte`) does the same since [#737](https://github.com/pie-framework/pie-elements-ng/pull/737). The SVG mask fills (`black`/`white`, `VennClassification.svelte:615-630`) are luminance masks and are skipped.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| tile shadows | delivery | `packages/elements-svelte/venn-classification/src/delivery/Tile.svelte:122,138,148` | box-shadow | `rgba(15, 23, 42, 0.06/0.18/0.22)` | new token needed: `--pie-shadow`, for elevation shadows | shadow |

### `packages/elements-svelte/video-stimulus`

No gaps. Delivery's `:353` comment moves the retry button off `--pie-white`, and [#740](https://github.com/pie-framework/pie-elements-ng/pull/740) moved the author view off it.

### `packages/lib-react/categorize`

No gaps. Scoring and category-state helpers only; it renders nothing (consumer: categorize).

### `packages/lib-react/charting`

Consumer: the charting element. `Chart` renders in delivery (`delivery/main.tsx`) and author (`correct-response.tsx`, `charting-config.tsx`), so its marks are `shared`; `KeyLegend` is delivery; `ChartType` is author. The chart and its actions trigger sit inside the `@pie-lib/plot` root (`chart.tsx:331,377`), which paints the plane `common.white` in every context. The marks' token Should-takes hold only together with the plane row under `packages/lib-react/plot`; while the plane stays white, marks keep or take `color.defaults` literals. A `--pie-background` Should-take that replaces `color.defaults.WHITE` needs the opaque form `pieVar('background', color.defaults.WHITE)`: `color.background()` falls back to transparent.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| chart axis line and tick marks (charting) | shared | `packages/lib-react/charting/src/axes.tsx:62-77` | stroke | visx 4 default `#222` (15.91:1 on the white plane): the `.vx-axis-line`/`.vx-axis-tick` overrides match nothing because visx 4 emits `visx-axis-*`; `AXIS_TICK_COLOR` (:61, :63) is undefined in `visualElementsColors` | `--pie-border-dark` | svg-marks |
| chart left-axis tick labels (charting) | shared | `packages/lib-react/charting/src/axes.tsx:434-467,718` | color | MathJax labels in a `foreignObject` pinned to `color.defaults.TEXT` (`black`) | `--pie-text` with a themed plane | svg-marks |
| chart axis error text (charting) | author | `packages/lib-react/charting/src/axes.tsx:53-56` | fill | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| chart category labels drawn as SVG text (charting) | author | `packages/lib-react/charting/src/axes.tsx:307-344` | fill | unset (SVG default black) | `--pie-text` | svg-marks |
| chart gridlines (charting) | shared | `packages/lib-react/charting/src/grid.tsx:12,72,76` | stroke | rows `GRIDLINES_COLOR` `#8E88EA` (:72); `GridColumns` gets no stroke and renders visx default `#eaf0f6` (:76), since visx's presentation attribute beats the group stroke at :12 | `--pie-border-light` | svg-marks |
| chart key legend panel (charting) | delivery | `packages/lib-react/charting/src/key-legend.tsx:17` | box-shadow | `inset 0px 1px 5px 0px #9297A6` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| chart key legend correctness glyphs (charting) | delivery | `packages/lib-react/charting/src/key-legend.tsx:37-48` | color, background | `color.defaults.WHITE` glyphs on `color.correct()` / `color.incorrectWithIcon()` discs, on the themed legend panel (`:13-14`) | glyphs stay `color.defaults.WHITE`; fills `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` (5.25:1, 6.42:1); the legend panel takes the plane palette | status-colours |
| histogram bar fills (charting) | shared | `packages/lib-react/charting/src/bars/common/bars.tsx:19-46` | fill | 12 literal hues plus 12 hover hues; nine rest hues are under 3:1 on the white plane, `#F0E442` 1.32:1 to `#54A77B` 2.92:1 | darken those nine to 3:1 on white while the plane stays white; `new token needed: --pie-chart-series-1..12 — histogram bar fill and hover` with a themed plane | svg-marks |
| hovered bar (charting) | shared | `packages/lib-react/charting/src/bars/common/bars.tsx:53` | fill | `ROLLOVER_FILL_BAR_COLOR` `#050F2D` | `new token needed: --pie-tertiary-dark — hovered chart mark` | svg-marks |
| bar fill (charting) | shared | `packages/lib-react/charting/src/bars/common/bars.tsx:58-60` | fill | `color.defaults.TERTIARY` | `--pie-tertiary` | svg-marks |
| correct-answer dashed bar indicator (charting) | shared | `packages/lib-react/charting/src/bars/common/bars.tsx:229,239` | stroke | `color.borderGray()` above the bar, also its check-icon ring (2.32:1 on the plane under base dark, white-on-black and light-gray-on-dark-gray, 2.49:1 under yellow-on-navy); `color.defaults.WHITE` over the bar | `color.defaults.BORDER_GRAY` above the bar (3.74:1); `WHITE` over the bar stays | svg-marks |
| correct-answer check badge (charting) | delivery | `packages/lib-react/charting/src/bars/common/correct-check-icon.tsx:12,19,23` | fill, stroke | circle `white` with dash fallback `#7E8494`; check `#0EA449`; glyph `white` | `--pie-background`; `--pie-border-gray`; `--pie-correct-tertiary` | status-colours |
| drag icon disc (charting) | shared | `packages/lib-react/charting/src/common/drag-icon.tsx:19` | fill | `white` | `--pie-background` | svg-marks |
| drag-handle correctness badge (charting) | delivery | `packages/lib-react/charting/src/common/drag-handle.tsx:23-45` | color, border, background | `color.defaults.WHITE` glyph and 4px ring on `color.correct()` / `color.incorrectWithIcon()` fills | glyph and ring stay `color.defaults.WHITE`; fills `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` | status-colours |
| drag-handle icon (charting) | shared | `packages/lib-react/charting/src/common/drag-handle.tsx:69` | color | `color.defaults.BORDER_GRAY` | `--pie-border-gray` | svg-marks |
| correctness indicators (charting) | delivery | `packages/lib-react/charting/src/common/correctness-indicators.tsx:12,17,20,31,36,39` | color, border, background | `color.defaults.WHITE` glyph and ring on themed correct / incorrect fills | as the drag-handle badge | status-colours |
| dot plot marks (charting) | shared | `packages/lib-react/charting/src/plot/dot.tsx:15,35` | fill, stroke | `PLOT_FILL_COLOR` `#1463B3`; overline `color.defaults.BORDER_GRAY` | `--pie-tertiary`; `--pie-border-gray` | svg-marks |
| line plot marks (charting) | shared | `packages/lib-react/charting/src/plot/line.tsx:16,36` | fill, stroke | `PLOT_FILL_COLOR`; overline `color.defaults.BORDER_GRAY` | `--pie-tertiary`; `--pie-border-gray` | svg-marks |
| plot marks and hover target (charting) | shared | `packages/lib-react/charting/src/plot/common/plot.tsx:196,326,331,336` | fill, stroke | hover rect `color.defaults.BORDER_GRAY`; marks `PLOT_FILL_COLOR` | `--pie-border-gray`; `--pie-tertiary` | svg-marks |
| plot correctness badge (charting) | delivery | `packages/lib-react/charting/src/plot/common/plot.tsx:340-353` | color, border, background | `color.defaults.WHITE` glyph and ring (:300, :305) on `color.correct()` / `color.incorrectWithIcon()` fills (:292-297) | as the drag-handle badge | status-colours |
| line chart line (charting) | shared | `packages/lib-react/charting/src/line/common/line.tsx:31,173` | stroke | `color.defaults.TERTIARY` | `--pie-tertiary` | svg-marks |
| line chart drag handle (charting) | shared | `packages/lib-react/charting/src/line/common/drag-handle.tsx:13` | color | `black`; the rules at :24, :29-30, :40, :45 (`TEXT`, `BLACK`, `WHITE`) target `.handle`/`.line`/`.disabledPoint`, and the `.correctIcon`/`.incorrectIcon` rules at :32-37 target classes only `plot/common/plot.tsx` uses, in its own sheet; no line-chart element carries any of them | `--pie-text` | svg-marks |
| line chart point and hover target (charting) | shared | `packages/lib-react/charting/src/line/line-dot.tsx:15-17,50-57,80` | fill, stroke | point fill unset (SVG default black); hover rect `color.defaults.BORDER_GRAY` (:69) | `--pie-tertiary`; `--pie-border-gray` | svg-marks |
| line-cross marks and hover target (charting) | shared | `packages/lib-react/charting/src/line/line-cross.tsx:17,28,32-33,103` | stroke | `color.defaults.TEXT`; `color.defaults.BLACK` once correctness is set; hover rect `BORDER_GRAY` (:81) | `--pie-text`; `--pie-border-gray` | svg-marks |
| category label input under correctness (charting) | shared | `packages/lib-react/charting/src/mark-label.tsx:61-64,70-75` | color | math labels take `color.correct()` / `color.incorrect()` text under correctness, as low as 1.37:1 on the white plane (correct, base dark); disabled, math and editable labels are pinned to `color.defaults` | on the white plane `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON`; the `-icon` states with a themed plane | status-colours |
| math category label error border (charting) | author | `packages/lib-react/charting/src/mark-label.tsx:67-69` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| category actions menu (charting) | shared | `packages/lib-react/charting/src/actions-button.tsx:39-43,131-167` | background, box-shadow, hover | MUI `Menu` paper `background.paper` `#fff` with elevation shadow; MenuItem hover from MUI defaults; item text pinned to `color.defaults.TEXT` | `pieVar('background', color.defaults.WHITE)`, as the mask-markup menu does, with `--pie-text` items; `new token needed: --pie-shadow — elevation shadow colour`; `--pie-button-hover-bg` | mui-palette |
| dot-plot and line-plot correctness marks (charting) | shared | `packages/lib-react/charting/src/common/styles.ts:11-21`, read by `plot/common/plot.tsx`, `plot/dot.tsx`, `plot/line.tsx` | fill, stroke, border | `color.correct()` / `color.incorrect()` on the white plane: correct 1.37:1 under base dark and white-on-black, incorrect 1.57:1 under yellow-on-navy | `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` | svg-marks |
| chart type select (charting) | author | `packages/lib-react/charting/src/chart-type.tsx:29-46` | color, border, focus | MUI outlined Select defaults: `text.primary`, outline `rgba(0,0,0,.23)`, focus `primary.main` `#1976d2`, menu paper `#fff` | `--pie-text`; `--pie-border-dark`; `--pie-primary`; `--pie-dropdown-background` | mui-palette |

Dead literals, no element matches: `axes.tsx:79-96` `correctnessIconStyles` (`color.defaults.WHITE`) is passed as `classes` and ignored. Chart-setup fields are config-ui `NumberTextFieldCustom`, recorded under config-ui.

### `packages/lib-react/config-ui`

Author view, except `AlertDialog`, which also renders in delivery for categorize, charting, fraction-model and graphing-solution-set inside the render-ui UiLayout theme. Every MUI default below traces to the first row's theme, or for those delivery dialogs to UiLayout's, which also sets no palette.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| author layout MUI theme (every element's author view) | author | `packages/lib-react/config-ui/src/layout/config-layout.tsx:11-28` | palette | `createTheme` with no palette: primary `#1976d2`, paper `#fff`, text `rgba(0,0,0,.87)`/`.6`, `action.active` `rgba(0,0,0,.54)`, error `#d32f2f`, divider `rgba(0,0,0,.12)` | primary `--pie-primary`, paper `--pie-background`, text `--pie-text`, error `--pie-incorrect-icon`, divider `--pie-border-light` | mui-palette |
| contained buttons (every author view) | author | `packages/lib-react/config-ui/src/layout/config-layout.tsx:18-23` | background, color | `#e0e0e0`; `#000000`; hover `#bdbdbd` | `--pie-button-bg`; `--pie-button-color`; `--pie-button-hover-bg` | literal-surface |
| settings panel (nearly every element) | author | `packages/lib-react/config-ui/src/layout/settings-box.tsx:16` | background | `color.white()`; the comment at :9-15 relies on `--pie-white` inverting, which holds in pie-players schemes; the ng dark preset keeps it `#ffffff` | `--pie-background` | absolute-white-black |
| author tabs (every element, tabbed layout at width ≤1135px) | author | `packages/lib-react/config-ui/src/tabs/index.tsx:35` | indicator, color | `indicatorColor="primary"` (also passed from `layout/layout-contents.tsx:101`); tab text `text.secondary`, selected `primary.main` | `--pie-primary`; `--pie-text` | mui-palette |
| confirm dialog (categorize, charting, drag-in-the-blank, fraction-model, graphing, graphing-solution-set, inline-dropdown, match, multiple-choice, number-line, placement-ordering) | shared | `packages/lib-react/config-ui/src/alert-dialog.tsx:28-53` | background, color, box-shadow | Dialog paper `#fff`, title and content text on MUI text palette, elevation-24 shadow; Buttons `color="primary"` (:43, :48) | `--pie-background`; `--pie-text`; `--pie-primary` | mui-palette |
| help button and dialog (no element consumer) | author | `packages/lib-react/config-ui/src/help.tsx:17-24,37-47` | color, background | IconButton rest `action.active` (hover is themed); Dialog paper and text; Button `color="primary"` (:43) | `--pie-text`; `--pie-background`; `--pie-primary` | mui-palette |
| checkbox label (categorize, fraction-model, match, settings panel) | author | `packages/lib-react/config-ui/src/checkbox.tsx:18,21` | color | `rgba(0,0,0,1.0)`; mini label `grey[700]` | `--pie-text` | literal-text |
| checkbox error (categorize, fraction-model, match, settings panel) | author | `packages/lib-react/config-ui/src/checkbox.tsx:36` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| input checkbox and radio error (number-line, multiple-choice via ChoiceConfiguration) | author | `packages/lib-react/config-ui/src/inputs.tsx:68,86` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| InputSwitch (no element consumer) | author | `packages/lib-react/config-ui/src/inputs.tsx:49-57` | thumb, track | MUI Switch defaults: thumb `common.white`/`primary.main`, track black at .38 | `--pie-primary`; `--pie-background`; `--pie-border-dark` | mui-palette |
| settings radio-group header (nearly every element) | author | `packages/lib-react/config-ui/src/settings/panel.tsx:56` | color | `rgba(0, 0, 0, 0.89)`; on the `--pie-white` panel this is dark on black under pie-players base dark | `--pie-text` | literal-text |
| settings dropdown and number field outline | author | `packages/lib-react/config-ui/src/settings/panel.tsx:90,137` | border | `2px solid lightgrey` | `--pie-border-light` | literal-border |
| settings group header | author | `packages/lib-react/config-ui/src/settings/panel.tsx:192` | color | `#495B8F` | `--pie-blue-grey-900` | literal-text |
| settings dropdown menu | author | `packages/lib-react/config-ui/src/settings/panel.tsx:88-115` | color, border, background | Select, Input and MenuItem on MUI defaults: `text.primary`, underline `rgba(0,0,0,.42)`, focus `primary.main`, menu paper `#fff` | `--pie-text`; `--pie-border-dark`; `--pie-primary`; `--pie-dropdown-background` | mui-palette |
| settings toggle label (graphing, graphing-solution-set, settings panel) | author | `packages/lib-react/config-ui/src/settings/toggle.tsx:17` | color | `rgba(0, 0, 0, 0.89)` | `--pie-text` | literal-text |
| settings toggle switch (graphing, graphing-solution-set, settings panel) | author | `packages/lib-react/config-ui/src/settings/toggle.tsx:22-32` | thumb, track | `&.Mui-checked .MuiSwitch-thumb` (:23) and `&.Mui-checked .MuiSwitch-track` (:26) never match because MUI sets `Mui-checked` on the switchBase, so the checked thumb renders MUI primary `#1976d2`; unchecked thumb `common.white`, unchecked track black at .38 (the checked track is themed through :29-31) | thumb `--pie-tertiary`; unchecked thumb `--pie-background`; unchecked track `--pie-border-dark` | mui-palette |
| settings radio label (nearly every element) | author | `packages/lib-react/config-ui/src/settings/settings-radio-label.tsx:12` | color | `rgba(0, 0, 0, 0.89)` | `--pie-text` | literal-text |
| number field (fraction-model, hotspot, likert, match, number-line, select-text, settings panel) | author | `packages/lib-react/config-ui/src/number-text-field.tsx:13-35,180-181` | color, border, focus, background | MUI TextField defaults: input `text.primary`, label `text.secondary`, underline `rgba(0,0,0,.42)` (outline `rgba(0,0,0,.23)` where number-line passes `variant="outlined"`, `number-line/src/author/number-text-field.tsx:16`), focus `primary.main`, filled background `rgba(0,0,0,.06)`, error `error.main` | `--pie-text`; `--pie-border-dark`; `--pie-primary`; `--pie-secondary-background`; `--pie-incorrect-icon` | mui-palette |
| stepper number field (charting chart setup, graphing and graphing-solution-set grid setup, number-line) | author | `packages/lib-react/config-ui/src/number-text-field-custom.tsx:14-30,271-321` | color, border, focus | MUI TextField defaults (standard and outlined) as above; step IconButtons `action.active` | `--pie-text`; `--pie-border-dark`; `--pie-primary` | mui-palette |
| feedback accordion (categorize, match, math-inline, placement-ordering, select-text) | author | `packages/lib-react/config-ui/src/feedback-config/index.tsx:76-107` | background, color, icon, box-shadow | Accordion paper `#fff`, text, divider, ExpandMore `action.active`, elevation shadow | `--pie-background`; `--pie-text`; `--pie-border-light`; `new token needed: --pie-shadow — elevation shadow colour` | mui-palette |
| choice error text (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/index.tsx:199` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| default-feedback text field (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/index.tsx:105-108,122-127` | color, border, focus | MUI TextField defaults | `--pie-text`; `--pie-border-dark`; `--pie-primary` | mui-palette |
| choice delete button (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/index.tsx:387-389` | color | IconButton `action.active` | `--pie-text` | mui-palette |
| feedback menu trigger icon (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/feedback-menu.tsx:106,111` | color | `color="primary"` or `"disabled"`: `#1976d2` or `action.disabled` | `--pie-primary`; `--pie-disabled` | mui-palette |
| feedback menu (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/feedback-menu.tsx:74-86` | background, color, box-shadow | Menu paper `#fff`, MenuItem `text.primary`, elevation-8 shadow | `--pie-dropdown-background`; `--pie-text` | mui-palette |
| MuiBox (no element consumer) | author | `packages/lib-react/config-ui/src/mui-box/index.tsx:12,44` | border, background | `rgba(0, 0, 0, 0.42)`/`rgba(255, 255, 255, 0.7)` picked by `palette.mode`; `theme.palette.primary[mode]` | `--pie-border-dark`; `--pie-primary` | mui-palette |
| tags input chips (no element consumer) | author | `packages/lib-react/config-ui/src/tags-input/index.tsx:12-17` | background, color | MUI Chip defaults: fill `rgba(0,0,0,.08)`, `text.primary` | `--pie-secondary-background`; `--pie-text` | mui-palette |
| language select (no element consumer) | author | `packages/lib-react/config-ui/src/langs.tsx:64-70` | color, border, background | Select, Input and MenuItem on MUI defaults | `--pie-text`; `--pie-border-dark`; `--pie-dropdown-background` | mui-palette |

### `packages/lib-react/correct-answer-toggle`

No gaps. The label reads `var(--correct-answer-toggle-label-color, var(--pie-text, black))` (`index.tsx:79`); the toggle's icon is recorded under icons.

### `packages/lib-react/drag`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| draggable choice tile (categorize author choice preview) | author | `packages/lib-react/drag/src/draggable-choice.tsx:12-13` | background, border | `theme.palette.background.paper` `#fff`; `solid 1px grey[400]` | `--pie-background`; `--pie-border` | mui-palette |

`placeholder.tsx` is themed (`var(--pie-background, #ffffff)`).

### `packages/lib-react/editable-html-tip-tap`

Consumers: delivery in extended-text-entry (`delivery/main.tsx`, annotation editor) and explicit-constructed-response (through mask-markup `constructed-response.tsx`, `languageCharacters` plugin); author views of categorize, charting, drag-in-the-blank, drawing-response, explicit-constructed-response, extended-text-entry, fraction-model, graphing, graphing-solution-set, hotspot, image-cloze-association, inline-dropdown, likert, match, math-inline, math-templated, matrix, multi-trait-rubric, multiple-choice, number-line, passage, placement-ordering, select-text; and config-ui, graphing, graphing-solution-set, plot and rubric labels. "All hosts" below means every one of these.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| editor error state (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:104-106` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| highlighted editor (extended-text-entry delivery; explicit-constructed-response, inline-dropdown, math-templated authoring) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:116` | background | `theme.palette.action.selected` `rgba(0,0,0,.08)` | `--pie-dropdown-background` | mui-palette |
| inline code (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:59-65` | background, color | `var(--purple-light)`; `var(--black)` (literals set in `EditableHtml.tsx:96,106`) | `--pie-secondary-background`; `--pie-text` | private-hook-literal |
| code block (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:66-78` | background, color | `var(--black)` `#2e2b29`; `var(--white)` `#fff` | `--pie-background-dark`; `--pie-text` | private-hook-literal |
| blockquote (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:80-85` | background, border | `#f9f9f9`; `5px solid #ccc` | `--pie-secondary-background`; `--pie-border` | literal-surface |
| Tiptap template palette (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/EditableHtml.tsx:99-120,595-599` | custom properties | 18 literals (`--white`, `--black`, `--gray-1..5`, `--purple*`, `--yellow*`, `--red*`, `--green`, `--shadow`) written onto `document.documentElement` on every editor mount | point each reader at a `--pie-*` token and drop the block | private-hook-literal |
| empty-editor placeholder (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/EditableHtml.tsx:692` | color | `#9CA3AF` | `--pie-disabled-text` | literal-text |
| paragraph mark ¶ (authors with `showParagraphs`) | author | `packages/lib-react/editable-html-tip-tap/src/components/EditableHtml.tsx:702` | color | `#146EB3` | `--pie-tertiary` | literal-text |
| toolbar rest icons (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/MenuBar.tsx:750` | color | `grey` | `--pie-text` | literal-text |
| toolbar elevation (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/MenuBar.tsx:805-806` | box-shadow | MUI elevation-1 `rgba(0,0,0,.2)`, `.14`, `.12` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| table toolbar icons (authors with the table plugin) | author | `packages/lib-react/editable-html-tip-tap/src/components/icons/TableIcons.tsx:6-11` | fill | `grey`; hover `black`, ignoring the button's themed `color` | `currentColor` (the button reads `--pie-text`/`--pie-disabled`) | svg-marks |
| toolbar disclosure panel (text alignment and the other toolbar disclosures) | author | `packages/lib-react/editable-html-tip-tap/src/components/MenuBar.tsx:870` | box-shadow | `0px 1px 5px 0px rgba(0, 0, 0, 0.2)`; the fill takes `TOOLBAR_BACKGROUND` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| special-character preview popper (same hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/characters/custom-popper.tsx:9` | background | `#fff`, portalled to `document.body` | `--pie-background` | literal-surface |
| image alt-text dialog (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/components/image/AltDialog.tsx:41-66` | background, color, focus, box-shadow | MUI Dialog paper `#fff`, `text.primary`, TextField underline and focus `primary.main`, Button primary text, elevation-24 shadow | `--pie-background`; `--pie-text`; `--pie-primary` | mui-palette |
| image toolbar divider (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/components/image/ImageToolbar.tsx:27` | border-left | `1px solid grey` | `--pie-border` | literal-border |
| selected image outline and resize handle (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/image-component.tsx:59,63` | border, background | `theme.palette.primary.main` `#1976d2` | `--pie-primary` | mui-palette |
| image upload progress (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/image-component.tsx:19-30,279` | background | MUI LinearProgress primary bar and tinted track | `--pie-primary`; `--pie-primary-light` | mui-palette |
| image toolbar elevation (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/image-component.tsx:304-305` | box-shadow | MUI elevation-1 `rgba(0,0,0,…)` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| response-area and image toolbar elevation (drag-in-the-blank, explicit-constructed-response, inline-dropdown authoring; images) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/custom-toolbar-wrapper.tsx:21-22` | box-shadow | MUI elevation-1 `rgba(0,0,0,…)` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| toolbar delete button (same) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/custom-toolbar-wrapper.tsx:41-46,70-72` | color | MUI IconButton default `action.active` `rgba(0,0,0,.54)` | `--pie-text` | mui-palette |
| math toolbar elevation (hosts with the math plugin) | shared | `packages/lib-react/editable-html-tip-tap/src/extensions/math.tsx:730-731` | box-shadow | MUI elevation-1 `rgba(0,0,0,…)` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| CSS class picker (authors with the css plugin) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/css.tsx:98` | background | `white` | `--pie-background` | literal-surface |
| media insert dialog (authors with video or audio) | author | `packages/lib-react/editable-html-tip-tap/src/components/media/MediaDialog.tsx:87-91,108-111,461,586-589` | background, color, indicator | Dialog paper `#fff` and text; Tabs `indicatorColor="primary"` and tab text; TextFields; Buttons `color="primary"`; error text `theme.palette.error.main` (:110) | `--pie-background`; `--pie-text`; `--pie-primary`; `--pie-incorrect-icon` | mui-palette |
| media toolbar (authors with video or audio) | author | `packages/lib-react/editable-html-tip-tap/src/components/media/MediaToolbar.tsx:12,15,21` | background, box-shadow, border | `theme.palette.common.white`; `0px 4px 4px rgba(0, 0, 0, 0.25)`; divider `theme.palette.common.black` | `--pie-background`; `new token needed: --pie-shadow — elevation shadow colour`; `--pie-border-dark` | mui-palette |
| response box (explicit-constructed-response authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/ExplicitConstructedResponse.tsx:85-86` | background, error border | `#FFF`; error `red`; text inherits the scheme ink, so light on white under dark | `--pie-background`; `--pie-incorrect-icon` | literal-surface |
| response toolbar holder (explicit-constructed-response authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/ExplicitConstructedResponse.tsx:102` | background, box-shadow | Tailwind `bg-white shadow-lg`, effective only where the host page ships Tailwind utilities | `--pie-background` | literal-surface |
| response box (inline-dropdown authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/InlineDropdown.tsx:168-169` | background | `#FFF` | `--pie-background` | literal-surface |
| blank tile (drag-in-the-blank authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/DragInTheBlank/choice.tsx:64-66,76` | background, border | fill `color.defaults.WHITE`, preview `color.defaults.BORDER_LIGHT`; border `color.defaults.BORDER_DARK`/`BORDER_LIGHT` | `--pie-background`/`--pie-secondary-background`; `--pie-border-dark`/`--pie-border-light` | literal-surface |
| blank grip icon (drag-in-the-blank authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/DragInTheBlank/choice.tsx:97` | color | `#9B9B9B` | `--pie-border-gray` | svg-marks |

Dead literals, no element matches: `MenuBar.tsx:789-792` `.isActive` (`var(--purple)`, `var(--white)`) and `MenuBar.tsx:849-851` `.label` (`var(--editable-html-toolbar-check, #00bb00)`) are never applied; `DragInTheBlank/choice.tsx:14` is a 0px border. Themed and fine: toolbar fill (`constants.ts:8`), focus rings (`MenuBar.tsx:776`, `toolbar-buttons.tsx:28`), Done check (`done-button.tsx:19`), tables (`extended-table.tsx`), math-templated box.

### `packages/lib-react/graphing`

Consumer: the graphing element; `GraphContainer` renders in delivery (`delivery/main.tsx`) and author (`correct-response.tsx`, `graphing-config.tsx`), so plane marks are `shared`; `KeyLegend` is delivery; `GridSetup` is author. The graph sits inside the `@pie-lib/plot` root (`graph.tsx:278`), which paints the plane `common.white` in every context, so the `color.defaults.BLACK` marks, at-rest curves included, hold at 21:1. Commit 23637af1 (PIE-877/PIE-994) locked disabled and background marks to `color.defaults`, so those are intentional. Its record of the active strokes at 1.00:1 under white-on-black, on a transparent plane, is wrong: every active stroke is `color.defaults.BLACK` on the white plane. The active marks stay rows because follow-up 7 decides whether the plane follows the scheme; their token Should-takes hold only together with the plane row under `packages/lib-react/plot`, and while the plane stays white they keep `color.defaults`. A `--pie-background` Should-take that replaces a white glyph needs the opaque form `pieVar('background', color.defaults.WHITE)`: `color.background()` falls back to transparent.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| graph gridlines (graphing) | shared | `packages/lib-react/graphing/src/grid.tsx:98,108,118,125` | stroke | minor `#E1E6EC`; labelled `#9FA8DA`/`#7985CB` | `--pie-border-light`; `--pie-border` | svg-marks |
| graph axes, ticks, tick labels and arrows (graphing) | shared | `packages/lib-react/graphing/src/axis/axes.tsx:54-56,74-83` | stroke, fill | `color.defaults.PRIMARY` (indigo[500]); this class shadows the `--arrow-color` hook in `axis/arrow.tsx:10` (fallback `theme.palette.common.black`) | `--pie-primary` | svg-marks |
| line, ray, segment and vector marks (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/line/index.tsx:18,23,487,492,496` | stroke, fill | `color.defaults.BLACK` at rest; hover `PRIMARY_DARK`; arrow fill `BLACK` | `--pie-text`; `--pie-primary-dark` | svg-marks |
| curve marks at rest: parabola, sine, exponential, absolute (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/line/line-path.tsx:19` | stroke | `color.defaults.BLACK` | `--pie-text` | svg-marks |
| curve marks on hover and drag (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/line/line-path.tsx:11-14` | stroke | `color.defaults.BLACK` | `--pie-text` | svg-marks |
| polygon marks (graphing) | shared | `packages/lib-react/graphing/src/tools/polygon/polygon.tsx:13,15,26,28` | fill, stroke | `alpha(SHAPES_FILL_COLOR #7986cb, 0.2)` through `tools/shared/styles.ts:5`; stroke `color.defaults.BLACK` | fill `color-mix` over `--pie-tertiary-light` at 20%; stroke `--pie-text` | svg-marks |
| polygon edge hover (graphing) | shared | `packages/lib-react/graphing/src/tools/polygon/line.tsx:18` | stroke | `color.defaults.BLACK` | `--pie-text` | svg-marks |
| arrowheads (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/arrow-head.tsx:9,26` | fill | `color.defaults.BLACK` | `--pie-text` | svg-marks |
| circle marks (graphing) | shared | `packages/lib-react/graphing/src/tools/circle/component.tsx:278,282,286` | stroke | `color.defaults.BLACK`; hover `PRIMARY_DARK` | `--pie-text`; `--pie-primary-dark` | svg-marks |
| circle outline while building (graphing) | shared | `packages/lib-react/graphing/src/tools/circle/bg-circle.tsx:53,58` | stroke | `color.defaults.BLACK`; hover `PRIMARY_DARK` | `--pie-text`; `--pie-primary-dark` | svg-marks |
| correct point glyph (graphing) | delivery | `packages/lib-react/graphing/src/tools/shared/icons/CorrectSVG.tsx:12,20` | stroke, fill | `#ffffff`; `white`, on the point's `--pie-correct-icon` disc | glyph stays white; it passes (5.25:1) once the disc takes `CORRECT_WITH_ICON` (correctness-marks row below). A `--pie-background` glyph leaves the disc failing against the plane | status-colours |
| incorrect point glyph (graphing) | delivery | `packages/lib-react/graphing/src/tools/shared/icons/IncorrectSVG.tsx:12` | stroke | `#ffffff`, on a `--pie-incorrect-icon` disc | as the correct glyph, with `INCORRECT_WITH_ICON` (6.42:1) | status-colours |
| missing point glyph (graphing) | delivery | `packages/lib-react/graphing/src/tools/shared/icons/MissingSVG.tsx:19` | fill | `white`, on a `--pie-missing-icon` disc | as the correct glyph, with `MISSING_WITH_ICON` (4.36:1) | status-colours |
| coordinates hover label (graphing) | shared | `packages/lib-react/graphing/src/coordinates-label.tsx:15-16` | background, color | `theme.palette.common.white`; `color.defaults.PRIMARY_DARK`, the mark-label palette with no comment extending its fixed status to this label | `--pie-background`; `--pie-primary-dark` | mui-palette |
| key legend panel (graphing) | delivery | `packages/lib-react/graphing/src/key-legend.tsx:17` | box-shadow | `0px 1px 5px 0px #9297A6` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| key legend mark swatches (graphing) | delivery | `packages/lib-react/graphing/src/key-legend.tsx:68,71,73,92,95,97,120,121,124` | fill, stroke | `#6A78A1`, `#BF0D00`, `#0B7D38` with `white` glyphs, on the themed legend panel (`:12-18`), where they fall to 1.23–2.90:1 under light-gray-on-dark-gray, black-on-violet, yellow-on-blue and yellow-on-navy; the marks they describe read `--pie-missing-icon`/`--pie-incorrect-icon`/`--pie-correct-icon`, and `#0B7D38` also differs from `CORRECT_WITH_ICON` `#087D38` | the `*_WITH_ICON` literals the plane marks take, with the legend panel on the plane palette; `--pie-missing-icon`, `--pie-incorrect-icon`, `--pie-correct-icon` and `--pie-background` glyphs only with a themed plane | status-colours |
| key legend label swatches (graphing) | delivery | `packages/lib-react/graphing/src/key-legend.tsx:53,80-81,104-105,132-133` | fill, stroke | `white` boxes with `#BF0D00`, `#6A78A1`, `#0B7D38` | — (match the mark labels' "fixed light palette in both schemes" (:11-12)) | intentional |
| mark labels (graphing) | shared | `packages/lib-react/graphing/src/mark-label.tsx:26-81` | background, color, border | `color.defaults.WHITE`, `*_WITH_ICON`, `PRIMARY_DARK`, `SECONDARY` | — ("fixed light palette in both schemes" (`key-legend.tsx:11-12`)) | intentional |
| mark-label status icons (graphing) | shared | `packages/lib-react/graphing/src/label-svg-icon.tsx:12,20,28` | fill | `#0B7D38`; `#BF0D00` | — (part of the mark-label fixed light palette) | intentional |
| disabled and background marks (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/styles.ts:12-20` | fill, stroke | `color.defaults.DISABLED_SECONDARY` | — ("Locked to the palette default" so contrast against the plane does not depend on the scheme (:7-11)) | intentional |
| disabled arrowheads (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/arrow-head.tsx:11,28` | fill | `color.defaults.DISABLED_SECONDARY` | — (same lock as `tools/shared/styles.ts:7-11`) | intentional |
| disabled points (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/point/index.tsx:35` | fill | `color.defaults.DISABLED_SECONDARY` | — (same lock as `tools/shared/styles.ts:7-11`) | intentional |
| correctness marks: lines, curves, circles, polygons, points, arrowheads (graphing) | delivery | `packages/lib-react/graphing/src/tools/shared/styles.ts:22-35`, `tools/shared/arrow-head.tsx:14-37` | fill, stroke | `color.correctWithIcon()` / `incorrectWithIcon()` / `missingWithIcon()` on the white plane: correct 1.33–1.37:1 under base dark, white-on-black, yellow-on-blue, light-gray-on-dark-gray and yellow-on-navy; incorrect 1.70:1 under yellow-on-navy; missing 1.23:1 under yellow-on-blue and 1.74:1 under yellow-on-navy | `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` / `MISSING_WITH_ICON`, the lock 23637af1 applied to the disabled marks | svg-marks |
| disabled tool buttons (graphing) | shared | `packages/lib-react/graphing/src/toggle-bar.tsx:33-38,56` | color, border | MUI outlined disabled: text `action.disabled` `rgba(0,0,0,.26)`, border `action.disabledBackground` `rgba(0,0,0,.12)`; the `& span` override (:35-37) matches nothing because MUI 7 Button renders no label span | `--pie-disabled-text`; `--pie-border-light` | mui-palette |
| collapsible toolbar accordion (graphing; `collapsibleToolbar` is set only in the author `graphing-config.tsx:290`) | author | `packages/lib-react/graphing/src/graph-with-controls.tsx:35-38,71-82` | color, icon | Accordion text `text.primary`, ExpandMore `action.active`; the fill is themed and `elevation={0}` draws no shadow | `--pie-text` | mui-palette |
| grid setup accordion (graphing) | author | `packages/lib-react/graphing/src/grid-setup.tsx:391-443` | background, color, icon, box-shadow | MUI Accordion paper `#fff`, `text.primary`, ExpandMore `action.active`, elevation shadow; its fields are config-ui `NumberTextFieldCustom` and `Toggle` | `--pie-background`; `--pie-text`; `new token needed: --pie-shadow — elevation shadow colour` | mui-palette |

Themed and fine: toggle-bar enabled state, undo/redo, legend container. Points take `currentColor` (`base-point.tsx:19`) from the plot root's `color.defaults.TEXT`; `graph-with-controls.tsx:29` does not reach them, because the graph is a sibling of the controls. `graph.tsx:305` and `bg.tsx:91` are a mask and an invisible hit area.

### `packages/lib-react/graphing-solution-set`

Consumer: the graphing-solution-set element; `GraphContainer` renders in delivery and author (`shared`), grid setup is author. As in graphing, the graph sits inside the `@pie-lib/plot` root (`graph.tsx:299`) on a plane fixed `common.white`: the marks' token Should-takes hold only together with the plane row under `packages/lib-react/plot`, and while the plane stays white the marks keep or take `color.defaults` literals.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| graph gridlines (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/grid.tsx:98,108,118,125` | stroke | minor `#D3D3D3`; labelled `#9FA8DA`/`#7985CB` | `--pie-border-light`; `--pie-border` | svg-marks |
| graph axes, ticks, tick labels and arrows (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/axis/axes.tsx:56-62,82` | stroke, fill | axis line and ticks `#8a92c0`; tick labels `color.defaults.BLACK`; arrows `#8a92c0`, which shadows the `--arrow-color` hook in `axis/arrow.tsx:10` (fallback `theme.palette.common.black`) | `--pie-border-dark`; `--pie-text` | svg-marks |
| line marks, solid and dashed (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/line/index.tsx:443,448,453,458,463` | stroke, fill | `color.defaults.BLACK` at rest and hover; arrow fill `color.defaults.SECONDARY` | `--pie-text`; `--pie-secondary` | svg-marks |
| line arrow markers (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/arrow-head.tsx:26` | fill | inline `color.defaults.BLACK` | `--pie-text` | svg-marks |
| points (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/point/base-point.tsx:102` | fill | inline `color.defaults.BLACK`; the inline style beats the class fills, so the correct, incorrect, missing and disabled fills (:16-30, `point/index.tsx:36-40`) never reach the circle | drop the inline fill so the state fills apply; rest `color.defaults.BLACK` on the white plane, `--pie-text` with a themed plane; states as the correctness-marks row below | svg-marks |
| arrow points (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/point/index.tsx:36` | fill | `color.defaults.SECONDARY` | `--pie-secondary` | svg-marks |
| solution-set polygon (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/polygon/polygon.tsx:13,16,25,28` | fill | `rgb(60, 73, 150, 0.6)`; hover `rgb(0, 0, 0, 0.25)` | `color-mix` over `--pie-primary` at 60%; hover `color-mix` over `--pie-text` at 25% | svg-marks |
| disabled marks (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/styles.ts:10-13` | fill, stroke | `color.defaults.DISABLED` | — (locked to the palette default "matching @pie-lib/graphing" (:5-9)) | intentional |
| correctness polygon and line strokes (graphing-solution-set) | delivery | `packages/lib-react/graphing-solution-set/src/tools/shared/styles.ts:15-26` | fill, stroke | `color.correct()` / `incorrect()` / `missing()` on the white plane: correct 1.37:1 and missing 2.86:1 under base dark and white-on-black; incorrect 1.57:1 under yellow-on-navy | `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` / `MISSING_WITH_ICON` | svg-marks |
| mark label input (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/mark-label.tsx:21-24` | border, color, background | border `color.defaults.PRIMARY_DARK`/`SECONDARY`; text `PRIMARY_DARK`; background `theme.palette.background.paper` when disabled and `transparent` otherwise, so the label sits on the white plane, where `PRIMARY_DARK` is 10.39:1 | `--pie-primary-dark`; `--pie-secondary`; `--pie-background`, with a themed plane | literal-text |
| coordinates hover label (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/coordinates-label.tsx:15-16` | background, color | `theme.palette.common.white`; `color.defaults.BLACK` | `--pie-background`; `--pie-text` | mui-palette |
| controls bar (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/graph-with-controls.tsx:46` | background | `#9FA8DA` under `--pie-text` ink (:45): 2.31:1 under base dark and white-on-black, 1.75:1 under light-gray-on-dark-gray | `--pie-background-dark`; `--pie-primary-light` under `--pie-text` falls to 1.03–1.22:1 under the dark schemes | literal-surface |
| collapsible toolbar accordion (graphing-solution-set; `collapsibleToolbar` is set only in the author `graphing-config.tsx:278`) | author | `packages/lib-react/graphing-solution-set/src/graph-with-controls.tsx:54-58,82-87` | color, icon | Accordion text `text.primary`, ExpandMore `action.active`; fill (`--pie-primary-light`) and shadow are overridden | `--pie-text` | mui-palette |
| line select radios (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tool-menu.tsx:134-136` | color | `#000000 !important` for rest and checked | `--pie-text`; checked `--pie-primary` | literal-text |
| line type toggle buttons (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tool-menu.tsx:46-58,137-174` | background, color, border, box-shadow | selected fill `#3E4EB1` with `#FFFFFF` text; unselected fill `#FFFFFF` with `#3E4EB1` text; border `#3E4EB1`; MUI contained elevation shadow (`color="primary"` at :60, :79, :118, :137 is overridden) | `--pie-primary` (selected fill, unselected text, border); `--pie-background` (unselected fill, selected text) | literal-surface |
| grid setup accordion (graphing-solution-set) | author | `packages/lib-react/graphing-solution-set/src/grid-setup.tsx:391-443` | background, color, icon, box-shadow | MUI Accordion paper `#fff`, `text.primary`, ExpandMore `action.active`, elevation shadow; its fields are config-ui `NumberTextFieldCustom` and `Toggle` | `--pie-background`; `--pie-text`; `new token needed: --pie-shadow — elevation shadow colour` | mui-palette |

Dead literal, no element matches: `labels.tsx:76-78` `.Label-label` fill `color.defaults.SECONDARY`.

### `packages/lib-react/graphing-utils`

No gaps. Geometry and point helpers only; it renders nothing (consumers: graphing element, lib graphing).

### `packages/lib-react/icons`

Consumers: `CorrectResponse` renders inside correct-answer-toggle for categorize, charting, drag-in-the-blank, explicit-constructed-response, fraction-model, graphing, graphing-solution-set, hotspot, image-cloze-association, inline-dropdown, match, match-list, math-inline, math-templated, multiple-choice, number-line, placement-ordering and select-text. `Correct`, `Incorrect`, `NothingSubmitted`, `PartiallyCorrect` and `ShowRationale` render in number-line delivery feedback (`elements-react/number-line/src/delivery/number-line/feedback.tsx`, defaults); render-ui `response-indicators.tsx` also imports them but has no element consumer. `LearnMore` and `Instructions` have no consumer.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| correct-answer toggle icon (18 elements via correct-answer-toggle) | delivery | `packages/lib-react/icons/src/correct-response-icon.tsx:86-90` | fill | open: bg `#bce2ff`, fg `#1a9cff`; closed: bg `white`, fg `#1a9cff`, ring `#bce2ff` | fg `--pie-tertiary`; bg and ring `--pie-tertiary-light`; closed bg `--pie-background` | svg-marks |
| correct-answer toggle icon shadow (same) | delivery | `packages/lib-react/icons/src/correct-response-icon.tsx:44-45,54-55` | fill, stroke | `#D0CAC5`/`#E6E3E0`; `#B3ABA4`/`#CDC7C2` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| feedback icon base defaults (number-line feedback) | delivery | `packages/lib-react/icons/src/icon-base.tsx:25-26` | fill | fg `#4aaf46`; bg `#f8ffe2` | `--pie-correct-icon`; `--pie-correct-secondary` | status-colours |
| correct feedback icon (number-line feedback) | delivery | `packages/lib-react/icons/src/correct-icon.tsx:51-52` | fill | fg `#4aaf46`; bg `#f8ffe2` | `--pie-correct-icon`; `--pie-correct-secondary` | status-colours |
| incorrect feedback icon (number-line feedback) | delivery | `packages/lib-react/icons/src/incorrect-icon.tsx:64-65` | fill | fg `#fcb733`; bg `#fbf2e3` | `--pie-incorrect-icon`; `--pie-incorrect-secondary` | status-colours |
| partially-correct feedback icon (number-line feedback) | delivery | `packages/lib-react/icons/src/partially-correct-icon.tsx:53-54` | fill | fg `#4aaf46`; bg `#c1e1ac` | `--pie-correct-icon`; `--pie-correct-secondary` | status-colours |
| nothing-submitted feedback icon (number-line feedback) | delivery | `packages/lib-react/icons/src/nothing-submitted-icon.tsx:43,134-135` | fill | fg `#464146`; bg `white` | `--pie-missing-icon`; `--pie-background` | status-colours |
| show-rationale icon (number-line feedback) | delivery | `packages/lib-react/icons/src/show-rationale-icon.tsx:32,84,106,108,113,141-143` | fill | `#FFFFFF` disc and ring; fg `#1a9cff`, bg `#bce2ff`, ring `#bbe3fd` | `--pie-background`; `--pie-tertiary`; `--pie-tertiary-light` | svg-marks |
| show-rationale icon shadow (number-line feedback) | delivery | `packages/lib-react/icons/src/show-rationale-icon.tsx:36-37,45-46` | fill, stroke | `#D0CAC5`/`#E6E3E0`; `#B3ABA4`/`#CDC7C2` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| learn-more icon (no element consumer) | delivery | `packages/lib-react/icons/src/learn-more-icon.tsx:32,36,39,73,77,80` | fill | `#BCE2FF`; `#1A9CFF`; `'1A9CFF'` at :80 lacks the `#`, so that glint renders black | `--pie-tertiary-light`; `--pie-tertiary` | svg-marks |
| learn-more icon shadow (no element consumer) | delivery | `packages/lib-react/icons/src/learn-more-icon.tsx:48-49,54-55,60-61,67-68` | fill, stroke | `#D0CAC5`/`#E6E3E0`; `#B3ABA4`/`#CDC7C2` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| instructions icon (no element consumer) | delivery | `packages/lib-react/icons/src/instructions-icon.tsx:9,90,92,152,154` | stroke, fill | `#BCE2FF`; `#7FABC6`; `#1A9CFF` | `--pie-tertiary-light`; `--pie-tertiary` | svg-marks |
| instructions icon shadow (no element consumer) | delivery | `packages/lib-react/icons/src/instructions-icon.tsx:43-44,54-55,67-68,80-81,106-107,117-118,130-131,142-143` | fill, stroke | `#D0CAC5`/`#E6E3E0`; `#B3ABA4`/`#CDC7C2` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |

### `packages/lib-react/mask-markup`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| blank chip while a choice is dragged over it: drag-in-the-blank | delivery | `packages/lib-react/mask-markup/src/components/blank.tsx:61-63` | border, background | `grey[500]`, `grey[300]` (`@mui/material/colors`), under `color.text()` | `--pie-border-dark`, `--pie-background-dark` | mui-palette |
| response input border: explicit-constructed-response | delivery | `packages/lib-react/mask-markup/src/constructed-response.tsx:21` | border | `color.black()`, absolute `#000000` on the dark preset background | `--pie-border-dark` | absolute-white-black |
| dropdown correctness glyph on the correct/incorrect fill: inline-dropdown | delivery | `packages/lib-react/mask-markup/src/components/dropdown.tsx:171,188` | color | `color.white()` | `--pie-background` in the opaque form `pieVar('background', color.defaults.WHITE)`: `color.background()` falls back to transparent | absolute-white-black |
| open dropdown listbox elevation: inline-dropdown | delivery | `packages/lib-react/mask-markup/src/components/dropdown.tsx:95-109` | box-shadow | MUI Menu paper elevation-8 `rgba(0,0,0,0.2/0.14/0.12)` (only the background is overridden) | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/lib-react/math-input-mathlive`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| disabled keypad keys (for example `noDecimal`): math-inline, math-templated, editable-html-tip-tap math | shared | `packages/lib-react/math-input-mathlive/src/keypad/index.tsx:248-285,420,440,455,475` | color | MUI `.Mui-disabled` `palette.action.disabled` beats `color.text()` | `--pie-disabled-text` | mui-palette |

The empty-slot placeholder (:91) is recorded under render-ui `keypadEmptyPlaceholder`. The key labels (:253) and LaTeX labels (:74) take `color.keypadInk()` on the `overBackground` key fill, both themed, so they have no row. `keypadInk` scales `--pie-text` towards black by up to 40% when its channels sum under 450: plain `--pie-text` fell under 4.5:1 at 19.6px normal weight under purple-on-light-green (3.92:1, operator keys 3.55:1) and on grey-on-light-grey operator keys (4.16:1), and the scaled inks hold 5.72:1 and 6.52:1 at their lowest. Raising the key-fill share cannot fix the purple operator keys, which reach only 4.24:1 at full share.
| answer block frame (math-inline and math-templated delivery) | delivery | `packages/lib-react/math-input-mathlive/src/latex-bridge.ts:261` | border | MathLive `\boxed` frame, `framecolor` black; correctness tokens replace it only while correctness shows | `--pie-border-dark` | literal-border |
| response area frame (math-inline authoring, `\answerBlock` macro) | author | `packages/lib-react/math-input-mathlive/src/mathlive-instance.ts:150-155` | border | MathLive `\boxed` frame, `framecolor` black | `--pie-border-dark` | literal-border |

### `packages/lib-react/math-rendering`

No gaps. It re-exports `@pie-element/shared-math-rendering-mathjax`.

### `packages/lib-react/math-toolbar`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| math answer field: math-inline (delivery and author), math-templated author, editable-html-tip-tap math | shared | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:28-29` | border | `solid 1px lightgrey`, in a dead rule: `& > .mq-math-mode` matches nothing, because the field is a MathLive `<math-field>`, which draws its own border | fix the selector; `--pie-border-dark` | literal-border |
| focused math answer field: same elements | shared | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:31-36` | border (focus indicator) | `dotted 1px theme.palette.primary.main` (`#1976d2`), in a dead rule: `& > .mq-focused` matches nothing, for the same reason; the focused field shows MathLive's own focus styling | fix the selector; THEMING.md focus chain | focus-ring |
| math answer field with an error: same elements | shared | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:188` | border | `2px solid red` | `--pie-incorrect-icon` | status-colours |
| add answer block button: math-inline and math-templated authoring | author | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:202-207,496-503` | border; disabled color | `1px solid lightgrey`; MUI `action.disabled` | `--pie-border-light`; `--pie-disabled-text` | literal-border |
| rule under the editor: same elements as the field | shared | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:209-215,505` | border-bottom | `theme.palette.primary.main` | `--pie-primary` | mui-palette |
| equation editor Select (controlledKeypadMode): math-inline and math-templated authoring | author | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:449-472` | underline, label, menu paper, selected item | MUI defaults: underline `rgba(0,0,0,0.42)`, focused underline `primary.main`, label `text.secondary`, paper `#fff` with elevation shadow, selected `primary` at 0.08 | `--pie-border-dark`, `--pie-primary`, `--pie-text`, `--pie-dropdown-background`, `--pie-faded-primary`; shadow `--pie-shadow` | mui-palette |
| math node preview: editable-html-tip-tap in every element's authoring and in delivery editors that take math | shared | `packages/lib-react/math-toolbar/src/math-preview.tsx:24-27` | border | `solid 1px lightgrey`, on the MathLive markup's `.ML__latex` root | `--pie-border-light` | literal-border |
| focused math node preview: same | shared | `packages/lib-react/math-toolbar/src/math-preview.tsx:28-33` | border (focus indicator) | `solid 1px black`, in a dead rule: `& > .mq-focused` matches nothing, because the preview renders MathLive markup | THEMING.md focus chain, on a selector that matches | focus-ring |
| selected math node preview: same | shared | `packages/lib-react/math-toolbar/src/math-preview.tsx:123-125` | border | `theme.palette.primary.main`, never applied: `MathPreview` never receives `isSelected`, because tip-tap `math.tsx:647` passes only `latex` | `--pie-primary` | mui-palette |

### `packages/lib-react/plot`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| graph and chart root container (the plane): charting, graphing, graphing-solution-set | shared | `packages/lib-react/plot/src/root.tsx:54-55` | color, background | `color.defaults.TEXT` (`black`), `theme.palette.common.white`, in every context since `08f827fb` | `--pie-text`, `--pie-background`, only together with every plane mark's token: alone they leave every literal `BLACK` mark invisible under the dark schemes. Keeping the plane white and locking the marks is the alternative (follow-up 7) | mui-palette |
| graph title and chart title: same elements | shared | `packages/lib-react/plot/src/root.tsx:83,100` | color | `color.defaults.TEXT` (`black`) | `--pie-text` | literal-text |
| axis label editor box: same elements | author | `packages/lib-react/plot/src/label.tsx:61` | box-shadow | `0px 5px 8px rgba(0,0,0,0.15)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/lib-react/render-ui`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| UiLayout MUI theme palette, wherever an MUI component inside UiLayout/PreviewLayout reads it: categorize, charting, drag-in-the-blank, drawing-response, explicit-constructed-response, extended-text-entry, fraction-model, graphing, graphing-solution-set, hotspot, image-cloze-association, inline-dropdown, likert, match, math-inline, math-templated, matrix, multiple-choice, multi-trait-rubric, number-line, passage, placement-ordering, rubric, select-text | shared | `packages/lib-react/render-ui/src/ui-layout.tsx:8-35` | palette, shadows | `createTheme` defaults: primary `#1976d2`, secondary `#9c27b0`, error `#d32f2f`, warning `#ed6c02`, info `#0288d1`, success `#2e7d32`, text `rgba(0,0,0,0.87/0.6/0.38)`, background.paper/default `#fff`, divider `rgba(0,0,0,0.12)`, action.active/hover/selected/focus `rgba(0,0,0,…)`, grey, common, 25 elevation shadows | primary `--pie-primary`, secondary `--pie-secondary`, error `--pie-incorrect-icon`, warning `--pie-missing`, success `--pie-correct`, info `--pie-tertiary`, text `--pie-text`/`--pie-disabled-text`, paper `--pie-dropdown-background`, default `--pie-background`, divider `--pie-border-light`, action `--pie-background-dark`/`--pie-focus-checked`; shadows: new token needed: `--pie-shadow` — elevation shadow colour | mui-palette |
| disabled MUI controls inside UiLayout (math keypad keys, rubric point-menu icon and others) | shared | `packages/lib-react/render-ui/src/ui-layout.tsx:14` | palette.action.disabled | `'rgba(0, 0, 0, 0.54);'` | `--pie-disabled-text` | mui-palette |
| contained MUI Button inside UiLayout (elements as in the palette row) | shared | `packages/lib-react/render-ui/src/ui-layout.tsx:23-32` | background, color, hover background | `#e0e0e0`, `#000000`, `#bdbdbd` | `--pie-button-bg`, `--pie-button-color`, `--pie-button-hover-bg` | literal-surface |
| math keypad empty-slot placeholder on keys: math-inline, math-templated, editable-html-tip-tap math | shared | `packages/lib-react/render-ui/src/color.ts:66,176`; used at `packages/lib-react/math-input-mathlive/src/keypad/index.tsx:91` | background | `--pie-keypad-empty-placeholder` (unregistered) → `rgba(245, 0, 87, 0.4)` | `overBackground(KEYPAD_EMPTY_PLACEHOLDER, …)` color-mix over `--pie-background`, as its keypad siblings do; that themes the slot and leaves it at about 1.75:1 in every context | unregistered-token |
| chart and graph marks (`visualElementsColors`): charting axes, grid, dot, line, plot, bars; graphing shape tools (`lib-react/graphing/src/tools/shared/styles.ts:5`) | shared | `packages/lib-react/render-ui/src/color.ts:191-197` | SVG stroke, fill | `AXIS_LINE_COLOR #5A53C9`, `ROLLOVER_FILL_BAR_COLOR #050F2D`, `GRIDLINES_COLOR #8E88EA`, `PLOT_FILL_COLOR #1463B3`, `SHAPES_FILL_COLOR #7986cb` | axis `--pie-tertiary`, gridlines `--pie-tertiary-light`, rollover bar `--pie-text`, plot fill `--pie-tertiary`, shapes fill `--pie-tertiary-light` | svg-marks |
| prompt custom audio play button: categorize, drag-in-the-blank, hotspot, image-cloze-association, multiple-choice | delivery | `packages/lib-react/render-ui/src/preview-prompt.tsx:193,257,264` | border (`element.style`) | `1px solid #326295` idle and paused, `1px solid #ccc` playing | `--pie-primary`; `--pie-border-light` | literal-border |
| undo/reset icon (withUndoReset: no element consumer in src) | shared | `packages/lib-react/render-ui/src/withUndoReset.tsx:24` | color | `gray` | `--pie-disabled-text` | literal-text |
| undo/reset buttons (no element consumer in src) | shared | `packages/lib-react/render-ui/src/withUndoReset.tsx:94,100` | Button colour | `color="primary"` (`palette.primary.main`) | `--pie-primary` | mui-palette |
| InlineMenu paper: matrix and multi-trait-rubric authoring, config-ui feedback menu, rubric point menu; mask-markup dropdown overrides only the background | shared | `packages/lib-react/render-ui/src/inline-menu.tsx:34-57` | background, color, box-shadow | MUI Menu paper defaults: `background.paper #fff`, `text.primary`, elevation-8 shadow | `--pie-dropdown-background`, `--pie-text`; shadow: new token needed: `--pie-shadow` — elevation shadow colour | mui-palette |
| InputContainer label: authoring panels of nearly every React element, plus config-ui, graphing grid setup, math-toolbar, rubric | author | `packages/lib-react/render-ui/src/input-container.tsx:16-34` | color | MUI InputLabel defaults: `text.secondary`, focused `primary.main`, error `error.main` | `--pie-text`; focused `--pie-primary`; error `--pie-incorrect-icon` | mui-palette |

**color.ts check** (`packages/lib-react/render-ui/src/color.ts`):
- Unregistered name, literal fallback: `keypadEmptyPlaceholder` (:176), a row above.
- Unregistered name chained to a registered token, so themed: `primaryText` (:106) and `secondaryText` (:113) → `--pie-text`. `tableGrid` (:128) → `--pie-text`. `tableGridLight` (:129) → `--pie-border-light`. `tableStripe` (:130) → `--pie-background-dark`. `keypadButton`, `keypadButtonOperator`, `keypadButtonHover`, `keypadButtonOperatorHover` (:173-179) → color-mix over `--pie-background`. `editorToolbar` (:187) has no name of its own and is a color-mix over `--pie-background`. `keyBoardFocusIndicator` (:149) is a deprecated alias of `focusOutline`, the THEMING.md focus chain. `keypadInk` has no name of its own and scales `--pie-text` towards black.
- Pure literal: `visualElementsColors` (:191-197), which is a row above. `transparent()` (:134) returns `transparent` and is no gap. The exported `defaults` object (:5-76) is a literal wherever it is read directly; those reads are recorded per package, for example `plot/src/root.tsx:54,83,100`.
- Registered, but the elements-ng presets never emit it, so the literal fallback renders under element-theme light and dark: `buttonFocusOutline` (:140) → `#3B82F6`, `buttonBorder` (:188) → `rgba(0, 0, 0, 0.23)`, `buttonHoverBg` (:189) → `rgba(0, 0, 0, 0.08)`. Recorded under shared/theming.
- `white()` and `black()` (:132-133) read registered names, which are absolute under the elements-ng dark preset and the DaisyUI mapping. Their use sites are recorded per package.
- Registered, with a fallback that meets contrast, so no row: `defaults.CORRECT` `#208537` and `defaults.INCORRECT` `#a65f00`, the no-theme values of `correct()` and `incorrect()`, are 4.70:1 and 4.93:1 on white ([PIE-1199](https://illuminate.atlassian.net/browse/PIE-1199)). They reach the mask-markup blank, response-box and dropdown borders and the dropdown badge.
- `background()` falls back to `rgba(255,255,255,0)`, so a `--pie-background` Should-take that replaces an opaque white uses `pieVar('background', defaults.WHITE)`, as mask-markup `dropdown.tsx:100` does.

**createTheme check:** `ui-layout.tsx:8` themes `typography.fontFamily`, `action.disabled` (a literal) and `MuiButton.contained` (literals). Every other palette and shadow entry is left at the MUI default: first row above. The other `createTheme` is `config-ui/src/layout/config-layout.tsx`, under `packages/lib-react/config-ui`.

### `packages/lib-react/rubric`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| point description editor background: rubric, complex-rubric | author | `packages/lib-react/rubric/src/authoring.tsx:75` | background | `theme.palette.common.white` | `--pie-background` | mui-palette |
| drag handle and points label: rubric, complex-rubric | author | `packages/lib-react/rubric/src/authoring.tsx:77,80` | color | `grey[500]` | `--pie-disabled-text` | mui-palette |
| validation error text: rubric, complex-rubric | author | `packages/lib-react/rubric/src/authoring.tsx:89` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| point row container: rubric, complex-rubric | author | `packages/lib-react/rubric/src/authoring.tsx:140,143` | background, border | `grey[200]`, `grey[300]` | `--pie-secondary-background`, `--pie-border-light` | mui-palette |
| max points outlined Select: rubric, complex-rubric | author | `packages/lib-react/rubric/src/authoring.tsx:49-64` | outline, label, menu paper | MUI defaults: outline `rgba(0,0,0,0.23)`, focused `primary.main`, label `text.secondary`, paper `#fff` | `--pie-border-dark`, THEMING.md focus chain, `--pie-text`, `--pie-dropdown-background` | mui-palette |
| exclude-zero Checkbox: rubric, complex-rubric | author | `packages/lib-react/rubric/src/authoring.tsx:307` | checked and unchecked colour | MUI default: `primary.main`, unchecked `action.active` | `--pie-primary`, `--pie-border-dark` | mui-palette |
| point menu trigger: rubric, complex-rubric | author | `packages/lib-react/rubric/src/point-menu.tsx:66,72-74` | icon colour, hover | icon `color="disabled"` (`palette.action.disabled`), IconButton hover `action.hover` | `--pie-disabled-text`, `--pie-background-dark` | mui-palette |

The point menu paper is recorded under render-ui InlineMenu.

### `packages/lib-react/style-utils`

No gaps. It holds only the `noSelect` rule.

### `packages/lib-react/text-select`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| correctness glyph on the token's correct/incorrect fill: select-text | delivery | `packages/lib-react/text-select/src/token-select/token.tsx:109` | color | `color.white()` | `--pie-background`, as `pieVar('background', color.defaults.WHITE)`: `color.background()` falls back to transparent | absolute-white-black |
| legend correctness glyph: select-text | delivery | `packages/lib-react/text-select/src/legend.tsx:51` | color | `color.white()` | `--pie-background`, in the same opaque form | absolute-white-black |
| tokenizer predefined token: select-text | author | `packages/lib-react/text-select/src/tokenizer/token-text.tsx:19,24` | background | `yellow[100]` (the `yellow[700]` borders at :20,25 are 0px wide) | new token needed: `--pie-highlight` — marked-text highlight fill | mui-palette |
| tokenizer correct token: select-text | author | `packages/lib-react/text-select/src/tokenizer/token-text.tsx:29,31` | background | `green[500]` | `--pie-correct-secondary` (text stays `--pie-text`) | status-colours |
| tokenizer mode buttons: select-text | author | `packages/lib-react/text-select/src/tokenizer/controls.tsx:52,55,58,61` | Button colour | `color="primary"`, `color="secondary"` | `--pie-primary`, `--pie-secondary` | mui-palette |
| set-correct Switch: select-text | author | `packages/lib-react/text-select/src/tokenizer/controls.tsx:21-32,66` | thumb, track | The overrides target `.MuiSwitch-thumb.Mui-checked` and `.MuiSwitch-track.Mui-checked`. Neither matches, because `Mui-checked` sits on `.MuiSwitch-switchBase`. The result is MUI defaults: checked `primary.main`, thumb `common.white`, track `common.black` at 0.38 | `--pie-tertiary` and `--pie-tertiary-light` (the intended overrides, at the right selectors); unchecked thumb `--pie-background`, track `--pie-border-dark` | mui-palette |

### `packages/lib-react/tools`

No element imports `@pie-lib/tools` in src. graphing-solution-set declares the dependency but never imports it.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| ruler and protractor marks and body: no src consumer | delivery | `packages/lib-react/tools/src/style-utils.ts:7,9`; used at `ruler/unit.tsx:10,46,53`, `ruler/graphic.tsx:12,14`, `ruler/unit-type.tsx:10`, `protractor/graphic.tsx:10,26,36,48,53,58` | SVG stroke, fill | `var(--ruler-stroke, palette.primary.main)`, `var(--ruler-bg, palette.primary.contrastText)` | `--pie-primary`, `--pie-background` | private-hook-literal |
| rotate anchor: no src consumer | delivery | `packages/lib-react/tools/src/anchor.tsx:12,14,16` | background, border, hover background | `var(--ruler-bg, palette.primary.contrastText)`, `var(--ruler-stroke, palette.primary.dark)`, `var(--ruler-bg-hover, palette.primary.light)` | `--pie-background`, `--pie-primary-dark`, `--pie-primary-light` | private-hook-literal |
| ruler body: no src consumer | delivery | `packages/lib-react/tools/src/ruler/index.tsx:13` | background | `theme.palette.secondary.light` | `--pie-secondary-light` | mui-palette |
| rotation debug anchor (only with `showAnchor`): no src consumer | delivery | `packages/lib-react/tools/src/rotatable.tsx:19-20` | SVG stroke, fill | `green`, `white` | `--pie-primary`, `--pie-background` | svg-marks |

### `packages/lib-svelte/config-ui-svelte`

No gaps.

### `packages/lib-svelte/delivery-events`

No gaps. It holds event helpers only and renders no UI.

### `packages/lib-svelte/editable-html-tiptap-svelte`

The row renders in the simple-cloze and venn-classification authoring editors. Every other rule reads a registered token since [#739](https://github.com/pie-framework/pie-elements-ng/pull/739).

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| toolbar and align-menu elevation: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:657-660,784-787` | box-shadow | `rgba(0, 0, 0, 0.2/0.14/0.12)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/lib-svelte/media-svelte`

No gaps. Transcript.svelte reads only registered tokens. Its focus chain (:100-101) ends at `--pie-focus-checked-border` with no literal.

### `packages/shared/math-rendering-mathjax`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| MathJax context menu (right-click or menu key on rendered math): every element that renders math (nearly all React elements, simple-cloze, venn-classification, element-player) | shared | `packages/shared/math-rendering-mathjax/src/adapter.ts:278`; `src/engine/bundled/mathjax.ts:30,111,270` | background, color, border, box-shadow, hover | The bundled mj-context-menu stylesheet: `white` background, `black` text, `#CCCCCC` border, `0px 10px 20px #808080` shadow, hover `#606872` with `white` text. It switches only on `prefers-color-scheme: dark` | `--pie-dropdown-background`, `--pie-text`, `--pie-border-light`, hover `--pie-primary`/`--pie-background`; shadow `--pie-shadow` (a stylesheet override; the adapter passes no menu styling) | literal-surface |
| MathJax speech, braille, magnifier and tooltip region shadows (after a student turns one on from the menu): same elements | shared | `@mathjax/src` 4.1.3 `mjs/a11y/explorer/Region.js:121,169,188,209,498,509` | box-shadow | `#888`; `#000` under `prefers-color-scheme: dark`. The explorer stylesheet (`src/explorer-styles.ts`) themes the highlight, selection outline and region colours and leaves the shadows | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/shared/theming`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| every `--pie-white`/`--pie-black` and `color.white()`/`black()` surface under `pie-element-theme` dark (every pie-elements-ng `absolute-white-black` row) | shared | `packages/shared/theming/src/pie-themes.ts:181-182` | `--pie-black`, `--pie-white` | `'#000000'`, `'#ffffff'` | invert as pie-players does: `--pie-white` = base-100 `#1a202c`, `--pie-black` = base-content `#e2e8f0` | absolute-white-black |
| registered button tokens under element-theme light and dark: categorize, image-cloze-association and match-list focus borders (`buttonFocusOutline` → `#3B82F6`); graphing toggle-bar and undo-redo (`buttonBorder`/`buttonHoverBg` → `rgba(0, 0, 0, 0.23)`/`rgba(0, 0, 0, 0.08)`) | shared | `packages/shared/theming/src/constants.ts:81-393` | `--pie-button-*` | not in `DEFAULT_CSS_MAPPINGS`, so the readers' literal fallbacks render | emit all eight from the presets: `button-focus-outline` = `focus-checked-border`, `button-border` = `border`, `button-hover-bg` = `background-dark`, and so on | preset-coverage |
| private colour hooks emitted as fixed preset values: likert and matrix choice inputs (`--choice-input-*`), the render-ui Feedback panel (`--feedback-*-bg-color`; the multiple-choice tick and match-list answer outline take `--pie-correct`/`--pie-incorrect`), number-line, graphing and graphing-solution-set (`--arrow-color`, `--tick-color`, `--line-stroke`, `--point-fill`, `--point-stroke`), correct-answer-toggle (`--correct-answer-toggle-label-color`), extended-text-entry (`--before-border-color`) | shared | `packages/shared/theming/src/pie-themes.ts:93-104,185-196`; `src/constants.ts:306-382` | 12 non-`--pie-*` colour variables | a literal per preset. No pie-players scheme sets them, so element fallbacks render there | derive each from its `--pie-*` role, for example `--feedback-correct-bg-color` = `--pie-correct-secondary`, `--choice-input-color` = `--pie-text`, `--point-stroke` = `--pie-background`; or retire the hook for the token | private-hook-literal |

**Emitted vs registry check.** `generateCssVariables` (css-variables.ts:19) emits every entry of `DEFAULT_CSS_MAPPINGS` (constants.ts:81-393, 57 variables). An absent theme key falls back to `PIE_COLOR_DEFAULTS`. So the light preset, the dark preset and the DaisyUI mapping all emit the same 57 names.
- Emitted, unregistered: `--pie-primary-text` (constants.ts:389). Its readers, render-ui `primaryText()` and likert `delivery/likert.tsx:58`, both chain to `--pie-text`. Register it, or drop the mapping.
- Emitted, not `--pie-*`: the 12 private colour hooks in the last row, plus the non-colour `--before-right`, `--before-top` and `--before-border-width`.
- Registered required, not emitted (14): `--pie-button-active-bg`, `--pie-button-bg`, `--pie-button-border`, `--pie-button-color`, `--pie-button-focus-outline`, `--pie-button-hover-bg`, `--pie-button-hover-border`, `--pie-button-hover-color`, `--pie-content-emphasis`, `--pie-fixed-hue-collapse`, `--pie-annotation-underline`, `--pie-annotation-underline-dark`, `--pie-tool-annotation-toolbar-border`, `--pie-focus-keyboard-outline`. In elements-ng src `button-focus-outline`, `button-border` and `button-hover-bg` have readers (row above), as do `fixed-hue-collapse` (multiple-choice `delivery/choice.tsx:41,43`, fallback `0%`) and `focus-keyboard-outline` (render-ui `keyboardFocusOutline()`, which falls back through the focus chain to the emitted `--pie-focus-checked-border`). The other nine have none.
- Registered optional, not emitted (18), all pie-players component tokens: `--pie-answer-eliminator-strike-color`, `--pie-calculator-series-1`…`6`, `--pie-passage-header-background`, `--pie-section-player-card-border`, `--pie-section-player-card-header-background(-dark)`, `--pie-section-player-tab-{active-background,active-color,background,color}`, `--pie-tool-trigger-active-{background,border-color,color}`.
- Emitted and `excluded` or `planned`: none. `--pie-focus-outline` is not emitted, which matches the registry.

### `packages/shared/utils`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| audio-autoplay overlay (categorize, drag-in-the-blank, hotspot, image-cloze-association, multiple-choice) | delivery | `packages/shared/utils/src/prompt-audio.ts:302` | background | `'white'` | `--pie-background` | literal-surface |

### `packages/element-player`

The player's consumers are `apps/element-demo` and `apps/element-a11y-demo`. `src/index.ts:13` loads Tailwind and DaisyUI 5 (`app.css`) for the demo chrome.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| player IIFE-build warning: same | shared | `packages/element-player/src/players/PieElementPlayer.svelte:707` | color | `#9a6700` | `--pie-missing` | status-colours |

### `packages/element-theme`

No gaps of its own. `theme-elements.ts:138-152` applies `generateCssVariables(getPieTheme(...))` plus overrides to itself or the document. What it emits is the shared/theming preset set above.

### `packages/element-theme-daisyui`

`pie-element-theme-daisyui` only overrides `resolveDataTheme` (`theme-element-daisyui.ts:4`), so it emits the elements-ng light/dark presets. `daisyUiToPieTheme` is exported (`index.ts:13`) with no caller in the repo. The rows apply wherever it is called.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| every `--pie-white`/`--pie-black` surface under a DaisyUI-mapped theme | shared | `packages/element-theme-daisyui/src/convert.ts:74-75` | `black`, `white` | `'#000000'`, `'#ffffff'` | `white` = `base-100`, `black` = `base-content` | absolute-white-black |
| surface and readable-disabled text under a dark DaisyUI theme | shared | `packages/element-theme-daisyui/src/convert.ts:5-94` | `surface`, `disabled-text` | never derived, so `generateCssVariables` emits the light defaults `#E0E1E6` and `#545454` | derive from `base-200`/`base-300` and `base-content` | preset-coverage |
| graph point stroke and tick colour: number-line | shared | `packages/element-theme-daisyui/src/convert.ts:83,85,113-121` | `point-stroke`, `tick-color` | `'#ffffff'` whenever `isDarkTheme` is false. `isDarkTheme` parses only `rgb()`, and DaisyUI 5 themes are `oklch`, so every theme counts as light | `--pie-background` (base-100); dark detection that parses oklch and hex | svg-marks |

## pie-players inventory

In pie-players, `--pie-white` is the page colour in both base themes and all 10 schemes, so most `absolute-white-black` rows below are correct under pie-players' own themes and turn white under a theme that keeps `--pie-white` absolute, such as the elements-ng dark preset. The section-player scroll-hint fade is wrong under every scheme. No scheme sets the optional `--pie-tool-trigger-active-*` or `--pie-calculator-series-*` tokens, so their fallbacks render in every scheme.

### `packages/assessment-player`

No gaps.

### `packages/assessment-toolkit`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| active toolbar button ink, on `--pie-primary` | delivery | `pie-players:packages/assessment-toolkit/src/components/ItemToolBar.svelte:2825,2834,2844` | color | `var(--pie-tool-trigger-active-color, var(--pie-white, #fff))`; no scheme sets the optional token | `--pie-background` (page colour on primary, the pairing the active tab pill uses) | absolute-white-black |
| tool shell header ink (non-NDS chrome), on `--pie-primary-dark` | delivery | `pie-players:packages/assessment-toolkit/src/components/ItemToolBar.svelte:2054` | `style.color` | `var(--pie-white, #fff)` | `--pie-background` | absolute-white-black |
| tool shell header control and close-button fills | delivery | `pie-players:packages/assessment-toolkit/src/components/ItemToolBar.svelte:1541-1542,2178-2181` | `style.background` | `color-mix(in srgb, var(--pie-white, #fff) 10% / 8% / 18%, transparent)` | `color-mix` over `--pie-background` | absolute-white-black |
| student annotation marks (print) | print | `pie-players:packages/assessment-toolkit/src/services/HighlightCoordinator.ts:256-275` | border-bottom-color, text-decoration-color | `#ffeb3b`, `#a6e1c5`, `#a7e0f6`, `#ff9fae`, `#ffa500`; underline `#000` | — ("becomes an underline that keeps its colour coding", 543-544) | intentional |

### `packages/item-player`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| item error banner | delivery | `pie-players:packages/item-player/src/PieItemPlayer.svelte:2386-2409` | border, background, color | `color-mix(var(--pie-incorrect…) var(--pie-fixed-hue-collapse, 0%), #d32f2f)`; `#ffebee`; `#c62828` | — ("Fixed red encoding, folded into the palette once a scheme asks for one") | intentional |
| session debugger panel | delivery | `pie-players:packages/item-player/src/ItemSessionDebugger.svelte:670` | box-shadow | `0 25px 50px -12px rgba(0, 0, 0, 0.25)` | `color-mix` over `--pie-black`, as the toolbar button shadow does (`ItemToolBar.svelte:2898`) | shadow |

### `packages/print-player`

No gaps.

### `packages/item-list`

No gaps.

### `packages/section-player`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| section split divider grip line, on `--pie-blue-grey-600` handle | delivery | `pie-players:packages/section-player/src/components/shared/SectionSplitDivider.svelte:166` | background | `var(--pie-white, white)` | `--pie-background` | absolute-white-black |
| scroll-hint fade, over the `--pie-background-dark` pane backdrop | delivery | `pie-players:packages/section-player/src/components/shared/SectionItemsPane.svelte:844` | background (gradient end) | `var(--pie-white, #fff)`, which fades to page colour over the backdrop under every scheme | `--pie-background-dark` | absolute-white-black |
| scroll-hint fallback button (non-NDS) | delivery | `pie-players:packages/section-player/src/components/shared/SectionItemsPane.svelte:886` | background | `var(--pie-white, #fff)` | `--pie-button-bg` | absolute-white-black |
| active section tab pill | delivery | `pie-players:packages/section-player/src/components/shared/SectionPlayerTabbedContent.svelte:226-250` | background, color | `color-mix(var(--pie-primary…) var(--pie-fixed-hue-collapse, 0%), #1D7375)`; ink the same with `#ffffff` | — ("fixed brand hue … folded into that palette when one is") | intentional |

### `packages/players-shared`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| item error banner | delivery | `pie-players:packages/players-shared/src/components/PieItemPlayer.svelte:1502-1532` | border, background, color | the fixed-hue-collapse mix over `#d32f2f`, `#ffebee`, `#c62828` | — ("fixed red encoding … folded into the palette") | intentional |
| loading spinner scrim | delivery | `pie-players:packages/players-shared/src/components/PieSpinner.svelte:16` | background-color | `var(--pie-white, #fff)` | `--pie-background` | absolute-white-black |
| vendored NDS icon button (glyph, fill, hover ring, focus ring) | shared | `pie-players:packages/players-shared/src/components/vendor/nds/nds-icon-button.js:795-886,927` | color, background, border, box-shadow, outline | `--color-interactive-blue` → `#146eb3`, `--color-new-gray` → `#f3f5f7`, `--color-primary-white` → `#ffffff`, `--color-primary-black` → `#000000`, `--color-focus-blue` → `#2b87ff`. Latent: every consumer bridges these to `--pie-*` (`ItemToolBar.svelte:2056-2066,2847-2858`, `SectionItemsPane.svelte:848-853`, tool-tts-inline), enforced by `scripts/check-theme-tokens.mjs`. | bridge the hooks inside the component to `--pie-button-color`, `--pie-background-dark`, `--pie-white`, `--pie-text`, `--pie-button-focus-outline`, so an unbridged consumer stays themed | private-hook-literal |

### `packages/theme`

All 55 `required` registry tokens are defined in each of the 10 schemes in `color-schemes.css`; no scheme sets an `optional` token. Both base blocks in `tokens.css` define the same 55 plus `--pie-font-scale`, so nothing there bypasses the schemes. The remaining gaps are in `components.css`:

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| content loading scrim (`.pie-loading`) | delivery | `pie-players:packages/theme/src/components.css:44` | background-color | `var(--pie-white, #fff)` | `--pie-background` | absolute-white-black |
| legacy content table cell (`.kds-verdana2t`, `.Verdana2t`) | delivery | `pie-players:packages/theme/src/components.css:564,575` | border | `1px solid var(--pie-white, white)` | `--pie-background` | absolute-white-black |
| answer-eliminator toggle (active), on `--pie-primary` | delivery | `pie-players:packages/theme/src/components.css:911` | color | `var(--pie-tool-trigger-active-color, var(--pie-white, #fff))`; no scheme sets the optional token | `--pie-background` | absolute-white-black |
| answer-eliminator image strike casing | delivery | `pie-players:packages/theme/src/components.css:1036-1039` | stroke | unregistered `--pie-answer-eliminator-image-strike-casing-color` → `light-dark(rgba(255, 255, 255, 0.85), rgba(0, 0, 0, 0.85))` | — ("light on a light page, for dark imagery, and dark on a dark page, where every image sits on the white backing below") | intentional |

`daisyui-mapping.ts:175-176` maps `--pie-white` to `base-100` but `--pie-black` to `neutral-content`, which is light in DaisyUI light themes. Under DaisyUI, the shadows mixed from `--pie-black` (`ItemToolBar.svelte:2811`, `OverlayPlacementControls.svelte:94`) therefore render light.

### `packages/default-tool-loaders`

No gaps. It renders only an unstyled audio-transcript region, and its toolbar icons are named glyphs; the tool UIs are under the `tool-*` packages below.

### `packages/tool-annotation-toolbar`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| toolbar and swatch-hover elevation | delivery | `pie-players:packages/tool-annotation-toolbar/tool-annotation-toolbar.svelte:1084,1104` | box-shadow | `rgb(0 0 0 / 0.3)`, `rgb(0 0 0 / 0.15)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/tool-answer-eliminator`

No gaps. The strike reads the registered `--pie-answer-eliminator-strike-color`, then `--pie-incorrect`, through `--pie-answer-eliminator-strike-paint` (`pie-players:packages/theme/src/components.css:979-985`). The toggle and strike styles live in `pie-players:packages/theme/src/components.css:832-1177` (under `packages/theme` above): toggle surface `var(--pie-button-background-color, var(--pie-button-bg, var(--pie-white, #fff)))` (~856-859), active ink `var(--pie-tool-trigger-active-color, var(--pie-white, #fff))` on `--pie-primary` (~911), and the unregistered `--pie-answer-eliminator-image-strike-casing-color` with fallback `light-dark(rgba(255, 255, 255, 0.85), rgba(0, 0, 0, 0.85))` (~1036-1039).

### `packages/tool-calculator-shared`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| calculator shell, container and loading scrim | delivery | `pie-players:packages/tool-calculator-shared/CalculatorTool.svelte:317,333,371` | background | `var(--pie-white, white)`; `color-mix(in srgb, var(--pie-white, #fff) 90%, transparent)` | `--pie-background` (comment at 288-294 relies on the token inverting "by design") | absolute-white-black |
| inline trigger hover elevation | delivery | `pie-players:packages/tool-calculator-shared/CalculatorInlineTool.svelte:249` | box-shadow | `rgb(0 0 0 / 10%)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| inline trigger active ink | delivery | `pie-players:packages/tool-calculator-shared/CalculatorInlineTool.svelte:262,275` | color | `var(--pie-tool-trigger-active-color, var(--pie-white, #fff))`; no scheme sets the optional token | new token needed: `--pie-on-primary` — ink on a `--pie-primary` fill | absolute-white-black |

### `packages/tool-calculator-desmos`

No gaps. A style-free wrapper over tool-calculator-shared.

### `packages/tool-calculator-inline-desmos`

No gaps. A style-free wrapper over tool-calculator-shared's CalculatorInlineTool.

### `packages/calculator`

No gaps. Type and provider interfaces only.

### `packages/calculator-cortex`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| angle-mode segment and layer tab, active ink | delivery | `pie-players:packages/calculator-cortex/src/CalculatorView.svelte:615,841` | color | `var(--pie-white, var(--cortex-on-primary))` on `--pie-primary` | new token needed: `--pie-on-primary` — ink on a `--pie-primary` fill | absolute-white-black |
| commit key ink | delivery | `pie-players:packages/calculator-cortex/src/Keypad.svelte:300` | color | `var(--pie-white, var(--cortex-on-primary))` on `--pie-primary` (comment at 296-299: "inverts by design") | new token needed: `--pie-on-primary` | absolute-white-black |
| graph layer tab, active ink | delivery | `pie-players:packages/calculator-cortex/src/GraphView.svelte:925` | color | `var(--pie-white, var(--cortex-on-primary))` on `--pie-primary` | new token needed: `--pie-on-primary` | absolute-white-black |

### `packages/calculator-desmos`

No gaps.

### `packages/calculator-geogebra`

No gaps.

### `packages/tool-theme`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| scheme dropdown elevation | delivery | `pie-players:packages/tool-theme/tool-color-scheme.svelte:518` | box-shadow | `rgba(0, 0, 0, 0.15)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| scheme preview swatches | delivery | `pie-players:packages/tool-theme/tool-color-scheme.svelte:337-340,385-388,555-592` | inline background, color, border | each scheme's own bg, text and primary from scheme data | — ("previews each scheme's own colours" (inline from scheme data; no comment)) | intentional |

### `packages/tool-dictionary`

No gaps. The lookup submit button reads `--pie-secondary-background` (`tool-dictionary.svelte:298-307`).

### `packages/tool-picture-dictionary`

No gaps. The lookup submit button reads `--pie-secondary-background` (`tool-picture-dictionary.svelte:305-314`).

### `packages/tool-graph`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| toolbar tool-button ink, transparency label and hover/active washes | delivery | `pie-players:packages/tool-graph/tool-graph.svelte:650,670,674,680,706` | color, background | `var(--pie-white)`; `color-mix(--pie-white 20%/30%)` on a `--pie-primary-light` bar (~2.2:1 in base light) | `--pie-text`, with the bar on `--pie-surface` | absolute-white-black |

### `packages/tool-line-reader`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| masking frame | delivery | `pie-players:packages/tool-line-reader/tool-line-reader.svelte:737` | border-color | `var(--pie-tool-line-reader-frame-color, #000)` (excluded) | — ("stays a dark scrim in every colour scheme") | intentional |
| control glyphs on the frame | delivery | `pie-players:packages/tool-line-reader/tool-line-reader.svelte:783` | color | `var(--pie-tool-line-reader-control-color, #fff)` (excluded) | — ("stay white in every scheme" (paired with the scrim)) | intentional |

### `packages/tool-magnifier`

No gaps.

### `packages/tool-periodic-table`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| active category badge ink | delivery | `pie-players:packages/tool-periodic-table/tool-periodic-table.svelte:395` | color | `var(--pie-white)` on `--pie-primary-dark` | new token needed: `--pie-on-primary` — ink on a primary fill | absolute-white-black |
| element category fills and ink | delivery | `pie-players:packages/tool-periodic-table/tool-periodic-table.svelte:612-760` | background, color | fixed category hues, collapsed to scheme tokens by `--pie-fixed-hue-collapse` | — ("fixed data encoding") | intentional |

### `packages/tool-protractor`

No gaps.

### `packages/tool-ruler`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| active unit button ink | delivery | `pie-players:packages/tool-ruler/tool-ruler.svelte:340` | color | `var(--pie-white, #fff)` on `--pie-primary` | new token needed: `--pie-on-primary` — ink on a primary fill | absolute-white-black |

### `packages/tool-sign-language`

No gaps. The video frame reads `--pie-blue-grey-900`; the caption's unregistered `--pie-text-light` chains to `--pie-text`.

### `packages/tool-tts-inline`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| trigger and speed-menu elevation | delivery | `pie-players:packages/tool-tts-inline/tool-tts-inline.svelte:1304,1482` | box-shadow | `color-mix(… var(--pie-shadow, #000) 14% …)`; `var(--pie-tts-menu-shadow, 0 1px 5px 0 rgba(0, 0, 0, 0.3))`; both tokens unregistered | register `--pie-shadow` — elevation shadow colour | shadow |

### `packages/tts`

No gaps. Client interfaces only; renders nothing.

### `packages/section-player-tools-shared`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| floating debug panel elevation | debug | `pie-players:packages/section-player-tools-shared/SharedFloatingPanel.svelte:279` | box-shadow | `rgba(0, 0, 0, 0.25)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/section-player-tools-session-debugger`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| session panel elevation | debug | `pie-players:packages/section-player-tools-session-debugger/SectionSessionPanel.svelte:323` | box-shadow | `rgba(0, 0, 0, 0.25)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/section-player-tools-pnp-debugger`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| PNP panel elevation | debug | `pie-players:packages/section-player-tools-pnp-debugger/PnpPanel.svelte:397` | box-shadow | `rgba(0, 0, 0, 0.25)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/section-player-tools-event-debugger`

No gaps.

### `packages/section-player-tools-instrumentation-debugger`

No gaps.

### `packages/section-player-tools-tts-settings`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| dialog elevation | debug | `pie-players:packages/section-player-tools-tts-settings/TtsSettingsPanel.svelte:1972` | box-shadow | `rgba(0, 0, 0, 0.22)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

## Defects found in passing

Not colour gaps, or not only colour gaps. They were found by reading the code and have not been observed in production. The custom audio play button and the charting Actions trigger, listed here at the audit, became keyboard operable in `aa5e7338` (PIE-1204).

- `packages/lib-react/render-ui/src/feedback.tsx:15-17`: `FeedbackContainer` never gets the `.incorrect` class (`:73`), so its `#946202` rule is dead.
- `packages/lib-react/render-ui/src/color.ts:191-197`: `visualElementsColors` has no `AXIS_TICK_COLOR`, which `packages/lib-react/charting/src/axes.tsx:68,70` reads, so those declarations are dropped.
- `packages/lib-react/render-ui/src/ui-layout.tsx:14`: the `action.disabled` value carries a trailing `;` inside the string.
- `packages/shared/theming/src/pie-themes.ts:23-106`: the light preset has no `blue-grey-600`, so it emits the `PIE_COLOR_DEFAULTS` value `#7E8494`.
- `packages/shared/theming/src/constants.ts:67-71`: the `PIE_COLOR_DEFAULTS` hook fallbacks `TICK_COLOR`, `LINE_STROKE`, `POINT_STROKE` and `CORRECT_ANSWER_TOGGLE_LABEL_COLOR` are `#ffffff`, so a custom theme without those keys draws white ticks, lines and labels on a white page.
- `packages/elements-react/multi-trait-rubric/src/delivery/trait.tsx:16`: the NoDescription text is painted with `color.secondaryBackground()`, a surface token, near 1.1:1. It should read `--pie-disabled-text`.
- `packages/lib-react/graphing-solution-set/src/tools/shared/point/base-point.tsx:102`: the circle's inline `fill: color.defaults.BLACK` beats the group's correctness fills at `:18-31`, so points never show correctness; only the polygon stroke does.
- `packages/lib-react/charting/src/line/common/drag-handle.tsx:32-37`: no element under `charting/src/line` carries `.correctIcon` or `.incorrectIcon`, so both rules are dead.
- `pie-players:packages/theme/src/daisyui-mapping.ts:175-176`: `--pie-white` maps to `base-100` but `--pie-black` to `neutral-content`, which is light in DaisyUI light themes, so shadows mixed from `--pie-black` render light under DaisyUI.

## Packages skipped

They render no themeable UI.

- pie-elements-ng: `packages/lib-react/test-utils` (test helpers); `packages/shared/{bundler-shared, configure-events, controller-utils, editor-runtime, feedback, i18n, lodash, math-validation, player-events, test-utils, types}` (logic, types, i18n strings or build configuration).
- pie-players: `packages/pie-context` (context protocol); `packages/{pie-i18n-generated, pie-language-tags}` (i18n catalogs and language tags); `packages/{tts-server-core, tts-server-google, tts-server-polly, tts-server-sc, tts-client-server}` (server-side TTS and its HTTP client).
