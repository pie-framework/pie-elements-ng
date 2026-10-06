# Theme gap inventory

Every colour, border, focus ring, shadow and surface in `pie-elements-ng` and `pie-players` that the `--pie-*` theme does not control, with the token each should take ([PIE-1195](https://illuminate.atlassian.net/browse/PIE-1195)). 579 entries: 506 across 60 pie-elements-ng packages and 73 across 39 pie-players packages.

Audited read-only at pie-elements-ng `f059cd93` and pie-players [`1bfe4103`](https://github.com/pie-framework/pie-players/tree/1bfe4103) (`develop`, 2026-10-03). Line numbers refer to those commits. Paths prefixed `pie-players:` are in pie-players; the rest are in this repository.

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

**`--pie-white` and `--pie-black` mean different things in the two repositories.** pie-players inverts them in all 10 schemes and its base dark theme, and prescribes `--pie-white` for page-coloured fills (`pie-players:packages/theme/src/components.css:9-19`). The pie-elements-ng dark preset (`packages/shared/theming/src/pie-themes.ts:181-182`) and the DaisyUI mapping (`packages/element-theme-daisyui/src/convert.ts:74-75`) keep them absolute. A `--pie-white` surface is therefore right under pie-players and white under `pie-element-theme` dark: the PIE-1187 class. This repository follows both conventions: `config-ui/src/layout/settings-box.tsx` relies on the inversion, while `video-stimulus` moved off `--pie-white` for PIE-1187. Inverting in the two elements-ng presets settles most of the 39 `absolute-white-black` rows at once.

**The layout themes leave MUI's palette at its defaults.** The 211 `mui-palette` rows, covering every React author view and some delivery views, trace to the palette-less `createTheme` calls or to direct `theme.palette.*` and `@mui/material/colors` reads.

**The elements-ng presets leave 13 required tokens unset.** They emit 57 variables (`packages/shared/theming/src/constants.ts:81-393`) and none of the eight `--pie-button-*`, so readers under `pie-element-theme` render their literal fallbacks (`#3B82F6` focus outline, `rgba(0,0,0,.23)` border). They also emit 14 private hooks as fixed values that no pie-players scheme sets, and the unregistered `--pie-primary-text`.

**No shadow token exists.** The 30 `shadow` rows and every MUI elevation under `mui-palette` use literal black alphas. `pie-players:packages/tool-tts-inline` already reads an unregistered `--pie-shadow`.

**Accessibility failures found in the sweep:**

- render-ui `Feedback` text is `var(--feedback-color, white)` (`packages/lib-react/render-ui/src/feedback.tsx:27`), and nothing sets `--feedback-color`. White on the light preset's `#E8F5E9`/`#FFEBEE` fills is 1.12:1, on `--pie-correct` under pie-players white-on-black 1.37:1, and on the `color.correct()` fallback `#4caf50` under no theme 2.78:1. It renders in categorize, extended-text-entry, match-list, match, math-inline, multiple-choice, placement-ordering and select-text.
- The editable-html-tiptap-svelte toolbar buttons have no focus indicator: `outline: none !important` (`EditableHtml.svelte:700`) beats the `:focus` outline (`:719`). Affects simple-cloze and venn-classification authoring.
- The `@pie-lib/plot` root paints the graph and chart plane MUI `common.white` in every context (`packages/lib-react/plot/src/root.tsx:51-58`, since `08f827fb`), so the marks that keep `color.defaults` literals hold: graphing's `color.defaults.BLACK` strokes are 21:1. `23637af1` records the plane as transparent and those strokes at 1.00:1 under white-on-black; both are wrong. The failures are the marks that read a token on that fixed plane: graphing's at-rest curves (`line-path.tsx:19`, `color.black()`, 1.00:1 under base dark and white-on-black, because pie-players inverts `--pie-black`), and the themed correctness marks, badges and labels in graphing, graphing-solution-set and charting, which fall as low as 1.05:1 once a scheme lightens `--pie-correct`, `--pie-incorrect`, `--pie-missing`, their `-icon` variants, `--pie-tertiary`, `--pie-primary-dark` or `--pie-disabled-text`.

**Theme gaps from the sweep that fail no student-facing context:**

- The config-ui settings labels are `rgba(0,0,0,.89)` (`settings/panel.tsx:55`, `settings/toggle.tsx:17`, `settings/settings-radio-label.tsx:12`) on the `--pie-white` settings panel. The panel is author-only, so white-on-black and the other delivery schemes never reach it. The labels disappear wherever the panel inverts: under pie-players base dark, and under the elements-ng dark preset once follow-up 1 lands.
- Charting's axis overrides target `.vx-axis-*`, but visx 4 emits `visx-axis-*`, so axes render visx's default `#222` in every scheme: 15.91:1 on the fixed white plane.

## Follow-ups

One per cluster, in the recommended order. Follow-ups 1 and 2 are preset changes that the later ones build on.

| # | Follow-up | Clusters (entries) | Repositories | Scope |
| --- | --- | --- | --- | --- |
| 1 | Invert `--pie-white`/`--pie-black` in the elements-ng dark preset and DaisyUI mapping | `absolute-white-black` (39) | both | Adopt the pie-players convention in `pie-themes.ts` and `convert.ts`. Then fix what stays wrong: the section-player scroll-hint fade, which is wrong under every scheme; the config-ui settings labels the inverted panel hides (`literal-text` rows, so land them together); and ink on primary fills, which keeps `--pie-white` or takes a new `--pie-on-primary`. |
| 2 | Emit every required token from the elements-ng presets and chain private hooks to `--pie-*` | `private-hook-literal` (13), `preset-coverage` (2) | both | Fix the render-ui `Feedback` text first. Emit the 13 unset required tokens and derive the 14 preset-emitted hooks from their `--pie-*` roles. Replace the 18 Tiptap template variables editable-html-tip-tap writes onto `:root` on every editor mount. Bridge the NDS icon button palette inside the component (pie-players). Remove number-line's legacy white-on-black hooks. |
| 3 | Tie the layout themes' MUI palette to `--pie-*` | `mui-palette` (211) | pie-elements-ng | Map primary, secondary, error, text, background, divider and action in `ui-layout.tsx` and `config-layout.tsx`, then move the direct `theme.palette.*` and `@mui/material/colors` reads. MUI's colour helpers reject `var()` values, so the ticket picks between MUI's CSS-variables theme mode and per-component overrides. Includes the dead `Mui-checked` selectors in `config-ui/src/settings/toggle.tsx` and `text-select/src/tokenizer/controls.tsx`. |
| 4 | Put focus indicators on the THEMING.md focus chain | `focus-ring` (14) | both | Start with the editable-html-tiptap-svelte toolbar, which draws no outline at all. Then section-player's chain through the unregistered `--pie-section-player-focus-outline`, math-toolbar's field and preview focus borders, config-ui-svelte and the matrix number input. |
| 5 | Replace literal fills, borders and text colours with registered tokens | `literal-surface` (57), `literal-border` (31), `literal-text` (26) | both | The biggest are venn-classification (Tailwind slate literals throughout), both editable-html editors, the config-ui settings and field chrome, the audio-autoplay overlay `white` in five elements, and the MathJax context menu. |
| 6 | Register `--pie-shadow` and route elevation shadows through it | `shadow` (30) | both | Registry and schemes in pie-players first. Then literal box-shadows, MUI elevations (with follow-up 3) and the shadows baked into the `@pie-lib/icons` SVGs. |
| 7 | Decide the graph-plane palette and theme chart, graph and icon marks | `svg-marks` (68) | both | The `@pie-lib/plot` root fixes the plane white (`plot/src/root.tsx:51-58`). Keep it and lock every mark on it to `color.defaults` literals (`BLACK`, `BORDER_GRAY`, `DISABLED_TEXT`, `PRIMARY_DARK`, `TERTIARY`, the `*_WITH_ICON` set), or theme the plane and every mark together; the plane-mark Should-takes below are the second option. Today the `color.defaults.BLACK` strokes hold at 21:1; graphing's `color.black()` curves and the themed correctness marks, badges and labels fail. Fix charting's dead `.vx-axis-*` selectors and the `AXIS_TICK_COLOR` that `visualElementsColors` lacks, and replace `visualElementsColors` itself. Theme the correct-answer toggle icon and its three Svelte copies. Inline or mask the pie-players ruler and protractor SVGs, which load through `<img>`. |
| 8 | Use the status tokens for correctness and error colours | `status-colours` (31) | pie-elements-ng | Hotspot evaluation outlines and PNG icons, venn-classification, the `@pie-lib/icons` feedback set, the charting and graphing badges and legend swatches (graphing's swatches drift from the marks they label), math-toolbar, the text-select tokenizer and element-player. Unless follow-up 7 themes the plane, the badges on it take the `*_WITH_ICON` literals and the legend panels take the plane palette. |
| 9 | Replace unregistered `--pie-*` reads with registered chains | `unregistered-token` (4) | both | Replace `--pie-keypad-empty-placeholder` and the dictionary buttons' excluded `--pie-background-light`. Register the five `--pie-annotation-*-highlight` names, and pick their dark set from the scheme rather than the OS preference. |
| 10 | Resolve theme tokens for the hotspot Konva marks | `canvas` (5) | pie-elements-ng | Konva draws on a canvas and cannot read CSS variables, so the tooltip, polygon handles, Transformers and delete icon need values resolved from computed style. |
| 11 | Map the active scheme onto MathLive, Desmos and GeoGebra | `embed-defaults` (3) | pie-players | MathLive custom properties in calculator-cortex, Desmos `invertedColors` and `colors`, and GeoGebra `borderColor` and `setGraphicsOptions`. |
| 12 | Theme pie-players controls left on user-agent and DaisyUI defaults | `ua-default` (1), `native-control-default` (2), `daisyui-classes` (5) | pie-players | The assessment-player navigation buttons, `accent-color` on the tool range inputs, and the DaisyUI classes in the section-player debug panels, which no scheme reaches. |
| 13 | Retire the assessment-toolkit `ThemeProvider` | `legacy-theme-writer` (1) | pie-players | It writes 22 literal `--pie-*` values inline on `<html>`, overriding any scheme, and maps orange to `--pie-incorrect` and red to `--pie-missing`. It has no caller but is a public export. |

`intentional` (31) and `authored` (5) take no follow-up.

## Student-facing tickets

Tickets are filed only for gaps that fail a student-facing context in an element with live content on production, kc, ar or star: text under 4.5:1 (3:1 for large text), an essential control or graphic under 3:1, or no visible focus indicator, under no theme, the pie-players base theme or one of its 10 colour schemes. Live installs still pin the legacy element builds, so these land with the pie-elements-ng rollout. Minor gaps, author views, pie-players and the elements without live content wait for a later scan, which the follow-ups above organise.

| Ticket | Scope |
| --- | --- |
| [PIE-1199](https://illuminate.atlassian.net/browse/PIE-1199) | Feedback and correctness colours: render-ui `Feedback`, the `color.ts` `CORRECT`/`INCORRECT` fallbacks, multiple-choice error text, number-line feedback panels |
| [PIE-1200](https://illuminate.atlassian.net/browse/PIE-1200) | Focus indicators: multiple-choice choices, the inline-dropdown combobox, the math-input keypad and MathQuill field, the MathJax explorer highlight |
| [PIE-1201](https://illuminate.atlassian.net/browse/PIE-1201) | Marks on the fixed white plot plane in graphing, graphing-solution-set and charting; the graphing-solution-set controls bar; histogram hues; number-line and fraction-model marks |
| [PIE-1202](https://illuminate.atlassian.net/browse/PIE-1202) | Fixed delivery panels, borders and inputs in drawing-response, fraction-model, image-cloze-association, extended-text-entry, passage, math-inline and drag-in-the-blank |
| [PIE-1203](https://illuminate.atlassian.net/browse/PIE-1203) | mc-populated-blank's listen button, shipped with the simple-cloze and venn-classification delivery rows in [#341](https://github.com/pie-framework/pie-elements-ng/pull/341) |
| [PIE-1204](https://illuminate.atlassian.net/browse/PIE-1204) | Keyboard operation of the custom audio play button and the charting Actions trigger, from Defects found in passing |

## New tokens

| Token | Role | Readers |
| --- | --- | --- |
| `--pie-shadow` | elevation shadow colour | the `shadow` rows and MUI elevations; already read, unregistered, by `pie-players:packages/tool-tts-inline` |
| `--pie-on-primary` | ink on a `--pie-primary` fill | pie-players calculator-cortex, tool-calculator-shared, tool-periodic-table, tool-ruler, tool-text-to-speech, tool-tts-inline; not needed if follow-up 1 keeps `--pie-white` as that ink |
| `--pie-annotation-{yellow,green,blue,pink,orange}-highlight` | student highlight swatch | already read, unregistered, by `pie-players:packages/assessment-toolkit/src/services/HighlightCoordinator.ts`; the tool-annotation-toolbar swatches |
| `--pie-chart-series-1` … `-12` | histogram bar fill and hover | charting bars; pie-players registers `--pie-calculator-series-1` … `-6` for the same role |
| `--pie-tertiary-dark` | hovered chart mark | charting bars |
| `--pie-scrim` | modal backdrop | section-player-tools-tts-settings |
| `--pie-highlight` | marked-text fill | text-select tokenizer |
| `--pie-calculator-surface` | opaque calculator surface | read, unregistered, by calculator-cortex; register it or use `--pie-background` |
| `--pie-section-player-focus-outline` | section-player focus hook | read, unregistered, by section-player; register it or chain straight to the focus tokens |
| `--pie-primary-text` | none of its own | emitted, unregistered, by the elements-ng presets; its only reader chains to `--pie-text`; register it or drop the mapping |

## Counts

| Cluster | pie-elements-ng | pie-players | Total |
| --- | --- | --- | --- |
| `mui-palette` | 211 | 0 | 211 |
| `svg-marks` | 65 | 3 | 68 |
| `literal-surface` | 54 | 3 | 57 |
| `absolute-white-black` | 18 | 21 | 39 |
| `intentional` | 22 | 9 | 31 |
| `literal-border` | 30 | 1 | 31 |
| `status-colours` | 31 | 0 | 31 |
| `shadow` | 20 | 10 | 30 |
| `literal-text` | 25 | 1 | 26 |
| `focus-ring` | 5 | 9 | 14 |
| `private-hook-literal` | 12 | 1 | 13 |
| `authored` | 5 | 0 | 5 |
| `canvas` | 5 | 0 | 5 |
| `daisyui-classes` | 0 | 5 | 5 |
| `unregistered-token` | 1 | 3 | 4 |
| `embed-defaults` | 0 | 3 | 3 |
| `native-control-default` | 0 | 2 | 2 |
| `preset-coverage` | 2 | 0 | 2 |
| `legacy-theme-writer` | 0 | 1 | 1 |
| `ua-default` | 0 | 1 | 1 |
| **Total** | **506** | **73** | **579** |

## pie-elements-ng inventory

### `packages/elements-react/categorize`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| audio-autoplay overlay | delivery | `packages/elements-react/categorize/src/delivery/index.ts:245` | background | `'white'` | `--pie-background` | literal-surface |
| choice card (MUI Card) | delivery | `packages/elements-react/categorize/src/delivery/categorize/choice.tsx:38-45` | box-shadow | Card default elevation (bg and text are themed) | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| validation error text | author | `packages/elements-react/categorize/src/author/design/index.tsx:66` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
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
| validation error text | author | `packages/elements-react/charting/src/author/configure.tsx:31` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| correct-response chart error border | author | `packages/elements-react/charting/src/author/correct-response.tsx:22` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| correct-response error text | author | `packages/elements-react/charting/src/author/correct-response.tsx:27` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/complex-rubric`

No gaps.

### `packages/elements-react/drag-in-the-blank`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| audio-autoplay overlay | delivery | `packages/elements-react/drag-in-the-blank/src/delivery/index.ts:142` | background | `'white'` | `--pie-background` | literal-surface |
| choice chip | author | `packages/elements-react/drag-in-the-blank/src/author/choice.tsx:29` | background | `theme.palette.common.white` | `--pie-background` | mui-palette |
| choice chip error border | author | `packages/elements-react/drag-in-the-blank/src/author/choice.tsx:36` | border | `#f44336` | `--pie-incorrect-icon` | status-colours |
| choice delete icon hover | author | `packages/elements-react/drag-in-the-blank/src/author/choice.tsx:57` | color | `theme.palette.common.black` | `--pie-text` | mui-palette |
| Add Choice button (contained, `color="primary"`) | author | `packages/elements-react/drag-in-the-blank/src/author/choices.tsx:246-253` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| choices error text | author | `packages/elements-react/drag-in-the-blank/src/author/choices.tsx:38` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| validation error text | author | `packages/elements-react/drag-in-the-blank/src/author/main.tsx:107` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/drag-in-the-blank/src/author/main.tsx:406-413` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |

### `packages/elements-react/drawing-response`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| drawing frame (the drawing area's only edge) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:23` | border | `#E0E1E6` | `--pie-border-dark` (`--pie-border-light` is 1.53:1 under no theme and base light) | literal-border |
| drawing frame | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:26` | background | `#ECEDF1` | `--pie-background-dark` | literal-surface |
| tool toolbar | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:37` | border-bottom | `#E0E1E6` | `--pie-border-light` | literal-border |
| drawing canvas (also the eraser at `drawable-eraser.tsx:64-68` and Konva Transformer defaults) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:29-34` | background | `#fff` | — ("canvas stays white in every scheme… a scorer reviews the drawing on the same white") | intentional |
| drawing palette (paint/fill/outline swatches; black-swatch label `palette.background.paper` at `drawable-palette.tsx:59-61` pairs with the fixed swatch) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/container.tsx:48-85`, `drawable-palette.tsx:99-123` | swatch colours | ROYGBIV, lightblue/lightyellow, defaults white/black/red | — | authored |
| fill/outline Select + Menu (standard, in render-ui `InputContainer`) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/drawable-palette.tsx:92-125` | value text, label, underline, arrow, focus underline, menu paper, menu shadow | MUI defaults: text `rgba(0,0,0,.87)`, `InputContainer` label `text.secondary`, underline `rgba(0,0,0,.42)`, arrow `action.active` | text and label `--pie-text`; underline and arrow `--pie-border-dark`; focus `--pie-primary`; menu `--pie-background`; shadow `--pie-shadow` (new) | mui-palette |
| tool, undo and clear buttons (contained) | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/button.tsx:22-30` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| tool icon | delivery | `packages/elements-react/drawing-response/src/delivery/drawing-response/icon.tsx:68` | fill | `#2B3963` | `--pie-button-color` | svg-marks |
| background-image box | author | `packages/elements-react/drawing-response/src/author/image-container.tsx:19` | border | `#0032C2` (active) / `#E0E1E6` | `--pie-primary` / `--pie-border-light` | literal-border |
| image resize handle | author | `packages/elements-react/drawing-response/src/author/image-container.tsx:46-47` | border | `#727272` | `--pie-border-dark` | literal-border |
| upload toolbar | author | `packages/elements-react/drawing-response/src/author/image-container.tsx:61` | background | `#ECEDF1` | `--pie-background-dark` | literal-surface |
| upload toolbar | author | `packages/elements-react/drawing-response/src/author/image-container.tsx:62` | border-bottom | `#E0E1E6` | `--pie-border-light` | literal-border |
| upload button (contained) | author | `packages/elements-react/drawing-response/src/author/button.tsx:13-19` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| validation error text | author | `packages/elements-react/drawing-response/src/author/root.tsx:24` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/ebsr`

No gaps.

### `packages/elements-react/explicit-constructed-response`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| alternate editor error border | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:37` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| alternate error text | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:77` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| max-length TextField underline | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:61-73` | border (rest / hover / focus) | `palette.divider` (1.32:1) / `palette.text.primary` / `palette.primary.main` | rest: drop the override (MUI's `rgba(0,0,0,.42)` is 3.04:1) or `--pie-border-dark` / `--pie-text` / `--pie-primary` | mui-palette |
| response Select + Menu (standard) | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:275-293` | underline, focus underline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |
| Add alternate button (contained, `color="primary"`) | author | `packages/elements-react/explicit-constructed-response/src/author/alternateSection.tsx:310` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| response-area editor | author | `packages/elements-react/explicit-constructed-response/src/author/ecr-toolbar.tsx:14` | background | `theme.palette.common.white` | `--pie-background` | mui-palette |
| validation error text | author | `packages/elements-react/explicit-constructed-response/src/author/main.tsx:50` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/explicit-constructed-response/src/author/main.tsx:396-397` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |

### `packages/elements-react/extended-text-entry`

Print renders the delivery `Main`, so the delivery rows cover print.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| annotated response box | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:27` | background | `rgba(0, 0, 0, 0.06)` | `--pie-background-dark` | literal-surface |
| annotated response box | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:28` | border | `#ccc` | `--pie-border-light` | literal-border |
| inline annotation label chip (its type text at `:416-419`, `:219-221`, `:254-256` must move with it) | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:400` | background | `rgb(242, 242, 242)` | `--pie-background-dark` | literal-surface |
| side-annotation label text | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:356-393` | color | unset, inherits `--pie-text`, so light text on fixed `rgb(153,255,153)` / `rgb(255,204,238)` under dark | fixed dark text paired with the fixed fill, as `annotation-menu.tsx:75` does | literal-text |
| side-annotation label | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:372` | border | `#ffffff` | `--pie-background` | literal-border |
| annotation menu popover | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-menu.tsx:107-111` | box-shadow | `elevation={5}` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| freeform editor popover | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/freeform-editor.tsx:184-186` | box-shadow | `elevation={2}` | `--pie-shadow` (new) | shadow |
| freeform comment TextField (no `variant`, so outlined) | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/freeform-editor.tsx:202-215` | outline, focus outline | MUI outlined defaults `rgba(0,0,0,.23)` / `primary.main`; `InputProps.disableUnderline` is a no-op on the outlined input | `--pie-border-dark` / `--pie-primary`, or `variant="standard"`, which `disableUnderline` assumes | mui-palette |
| annotation highlight fills, side-label fills and pointer, type label colours | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:74,201-256,338-341,380-392,416-419` | background, border-color, color | `rgb(153,255,153)`, `rgb(255,204,238)`, `rgb(0,128,0)`, `rgb(204,0,136)` | — ("annotation fills stay light in every scheme", `annotation-menu.tsx:57`, `freeform-editor.tsx:79`) | intentional |
| highlighted response text | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-editor.tsx:201-256,338-341` | color | unset, inherits `--pie-text`, so light text over the fixed `rgb(51,255,51,.5/.7)` and `rgba(255,102,204,.4/.55)` highlights under dark (down to 1.81:1) | fixed dark text paired with the fixed fill, as `annotation-menu.tsx:75` does | literal-text |
| annotation menu positive/negative cells | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/annotation-menu.tsx:73-86` | background, color | fixed pos/neg fills with `palette.text.primary` | — ("annotation fills stay light in every scheme") | intentional |
| freeform editor type band, rings and pointer | delivery | `packages/elements-react/extended-text-entry/src/delivery/annotation/freeform-editor.tsx:27-36,54-70,92-117`, `annotation-utils.ts:235` | background, border, stroke | fixed pos/neg fills; `ANNOTATION_STROKE #757575` | — ("stays fixed until the annotation colours themselves follow the theme") | intentional |
| validation error text | author | `packages/elements-react/extended-text-entry/src/author/main.tsx:30` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/fraction-model`

The chart is `shared`: the author imports `FractionModelChart` for its correct-answer model.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| model part fill | shared | `packages/elements-react/fraction-model/src/delivery/fraction-model-chart.tsx:84-99,240` | fill (rest / hover / selected) | `#FFFFFF` / `rgb(0 0 0 / .25)` / `rgb(60 73 150 / .6)` | `--pie-background` / `--pie-faded-primary` / a selected fill that keeps 3:1 to both the rest fill and the stroke, or a pattern: `--pie-primary` puts the stroke against a selected part at 1.07–2.32:1, and no `color-mix` share over `--pie-primary` holds in every scheme | svg-marks |
| model part stroke | shared | `packages/elements-react/fraction-model/src/delivery/fraction-model-chart.tsx:127,241` | stroke | `#000000` | `--pie-text` | svg-marks |
| part number labels | shared | `packages/elements-react/fraction-model/src/delivery/fraction-model-chart.tsx:113,200` | fill | `#000000` | `--pie-text` | svg-marks |
| student config TextFields (outlined) | delivery | `packages/elements-react/fraction-model/src/delivery/answer-fraction.tsx:75-99` | outline, focus outline, input text, disabled | MUI defaults; input text `rgba(0,0,0,.87)` stays near-black under dark | `--pie-border-dark` / `--pie-primary` / `--pie-text` / `--pie-disabled-text` | mui-palette |
| validation error text | author | `packages/elements-react/fraction-model/src/author/main.tsx:29` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| correct-answer error border | author | `packages/elements-react/fraction-model/src/author/main.tsx:35` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/fraction-model/src/author/main.tsx:177-185` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |
| model-type Select + Menu (outlined) | author | `packages/elements-react/fraction-model/src/author/model-options.tsx:107-118` | outline, focus outline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |

### `packages/elements-react/graphing`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| tool error text | author | `packages/elements-react/graphing/src/author/correct-response.tsx:177` | color | `'red'` | `--pie-incorrect-icon` | status-colours |
| correct-answer graph error border | author | `packages/elements-react/graphing/src/author/correct-response.tsx:446` | border | `'2px solid red'` | `--pie-incorrect-icon` | status-colours |
| validation error text | author | `packages/elements-react/graphing/src/author/correct-response.tsx:123` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/graphing/src/author/correct-response.tsx:429-436` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |
| default-tool Select menu (`disableUnderline`, text overridden) | author | `packages/elements-react/graphing/src/author/correct-response.tsx:151-164` | menu paper, menu shadow, selected item | MUI defaults | `--pie-background` / `--pie-shadow` (new) / `--pie-dropdown-background` | mui-palette |
| validation error text | author | `packages/elements-react/graphing/src/author/configure.tsx:31` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| grid-config Select + Menu (OutlinedInput) | author | `packages/elements-react/graphing/src/author/graphing-config.tsx:244-256` | outline, focus outline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |

### `packages/elements-react/graphing-solution-set`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| number-of-lines Radio | author | `packages/elements-react/graphing-solution-set/src/author/correct-response.tsx:25-27` | color | `'#000000 !important'` | `--pie-text` | literal-text |
| validation error text | author | `packages/elements-react/graphing-solution-set/src/author/correct-response.tsx:31` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| correct-answer graph error border | author | `packages/elements-react/graphing-solution-set/src/author/correct-response.tsx:360` | border | `'2px solid red'` | `--pie-incorrect-icon` | status-colours |
| grid-config Select + Menu | author | `packages/elements-react/graphing-solution-set/src/author/graphing-config.tsx:236-248` | outline, focus outline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |

### `packages/elements-react/hotspot`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| audio-autoplay overlay | delivery | `packages/elements-react/hotspot/src/delivery/index.ts:122` | background | `'white'` | `--pie-background` | literal-surface |
| image frame | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/container.tsx:42-43` | background, border | `theme.palette.common.white` | `--pie-background` | mui-palette |
| evaluated circle outline | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/circle.tsx:84-85` | stroke | `'green'` / `'red'` | `--pie-correct` / `--pie-incorrect` | status-colours |
| evaluated polygon outline | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/polygon.tsx:103-104` | stroke | `'green'` / `'red'` | `--pie-correct` / `--pie-incorrect` | status-colours |
| evaluated rectangle outline | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/rectangle.tsx:83-84` | stroke | `'green'` / `'red'` | `--pie-correct` / `--pie-incorrect` | status-colours |
| evaluation icons (`faCorrect` / `faWrong`) | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/icons.ts` | image | PNG data URIs, fixed green check / red X | `--pie-correct-icon` / `--pie-incorrect-icon` (needs vector glyphs) | status-colours |
| evaluation tooltip (Konva Label) | delivery | `packages/elements-react/hotspot/src/delivery/hotspot/image-konva-tooltip.tsx:91-92` | fill | Tag `'white'`; Text default black | `--pie-background` / `--pie-text`, resolved for Konva | canvas |
| hotspot fill, outline and hover outline; palette swatches | shared | `packages/elements-react/hotspot/src/controller/defaults.ts:5-10`, `author/defaults.ts:6-11`, `controller/index.ts:51`, `author/root.tsx:256`, `author/hotspot-palette.tsx:53,71` | fill, stroke | `hotspotColor rgba(137,183,244,.25)`, `outlineColor blue`, hover outline default black | — | authored |
| circle tool button | author | `packages/elements-react/hotspot/src/author/buttons/circle.tsx:12,14` | fill; glyph fill | `#D3D4D9` active / `#ECEDF1` rest; glyph `black` | `--pie-dropdown-background` / `--pie-background-dark`; glyph `--pie-text` | svg-marks |
| polygon tool button | author | `packages/elements-react/hotspot/src/author/buttons/polygon.tsx:17,28` | fill; glyph fill | `#D3D4D9` active / `#ECEDF1` rest; glyph `black` | `--pie-dropdown-background` / `--pie-background-dark`; glyph `--pie-text` | svg-marks |
| rectangle tool button | author | `packages/elements-react/hotspot/src/author/buttons/rectangle.tsx:17,28` | fill; glyph fill | `#D3D4D9` active / `#ECEDF1` rest; glyph `black` | `--pie-dropdown-background` / `--pie-background-dark`; glyph `--pie-text` | svg-marks |
| image box | author | `packages/elements-react/hotspot/src/author/hotspot-container.tsx:21,24` | border | `#E0E1E6` / `#0032C2` (active) | `--pie-border-light` / `--pie-primary` | literal-border |
| image box error border | author | `packages/elements-react/hotspot/src/author/hotspot-container.tsx:27` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| upload toolbar | author | `packages/elements-react/hotspot/src/author/hotspot-container.tsx:52` | background | `#FFF` | `--pie-background` | literal-surface |
| upload toolbar | author | `packages/elements-react/hotspot/src/author/hotspot-container.tsx:53` | border-bottom | `#E0E1E6` | `--pie-border-light` | literal-border |
| image resize handle | author | `packages/elements-react/hotspot/src/author/hotspot-drawable.tsx:53-54` | border | `#727272` | `--pie-border-dark` | literal-border |
| polygon editing handles | author | `packages/elements-react/hotspot/src/author/hotspot-polygon.tsx:32,229,269-270` | stroke, fill | `HOVERED_COLOR #00BFFF`; first point `blue`, others `white` | `--pie-primary` / `--pie-background`, resolved for Konva | canvas |
| rectangle Konva Transformer | author | `packages/elements-react/hotspot/src/author/hotspot-rectangle.tsx:155` | anchor fill/stroke, border | Konva defaults `rgb(0,161,255)` / white anchors | `--pie-primary` / `--pie-background`, resolved for Konva | canvas |
| circle Konva Transformer (border is authored) | author | `packages/elements-react/hotspot/src/author/hotspot-circle.tsx:154` | anchor fill/stroke | Konva defaults | `--pie-primary` / `--pie-background`, resolved for Konva | canvas |
| delete widget icon (`faDelete`) | author | `packages/elements-react/hotspot/src/author/icons.ts`, used at `author/DeleteWidget.tsx:52` | image | fixed-colour PNG data URI on the Konva canvas | `--pie-text` (needs a vector glyph resolved for Konva) | canvas |
| contained buttons | author | `packages/elements-react/hotspot/src/author/button.tsx:13-19` | background, color, hover | layout theme | `--pie-button-bg` / `--pie-button-color` / `--pie-button-hover-bg` | mui-palette |
| fill/outline Selects + Menus (standard) | author | `packages/elements-react/hotspot/src/author/hotspot-palette.tsx:46-75` | underline, focus underline, menu paper | MUI defaults | `--pie-border-dark` / `--pie-primary` / `--pie-background` | mui-palette |
| validation error text | author | `packages/elements-react/hotspot/src/author/root.tsx:55` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/hotspot/src/author/root.tsx:229-236` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |

### `packages/elements-react/image-cloze-association`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| audio-autoplay overlay | delivery | `packages/elements-react/image-cloze-association/src/delivery/index.ts:154` | background | `'white'` | `--pie-background` | literal-surface |
| drop zone while dragging | delivery | `packages/elements-react/image-cloze-association/src/delivery/image-drop-target.tsx:22` | background | `rgba(230, 242, 252, .8)` | `--pie-faded-primary` | literal-surface |
| drop zone hover | delivery | `packages/elements-react/image-cloze-association/src/delivery/image-drop-target.tsx:28` | border | `rgb(158, 158, 158)` | `--pie-border` | literal-border |
| drop zone hover | delivery | `packages/elements-react/image-cloze-association/src/delivery/image-drop-target.tsx:29` | background | `rgb(224, 224, 224)` | `--pie-dropdown-background` | literal-surface |
| response area fill | delivery | `packages/elements-react/image-cloze-association/src/delivery/image-drop-target.tsx:96` | background | `responseAreaFill` from the model | — | authored |
| max-choices warning banner | delivery | `packages/elements-react/image-cloze-association/src/delivery/root.tsx:617` | background | `#dddddd` under inherited `--pie-text` | `--pie-background-dark`, landing with the `:642` icon row: MUI's secondary `#9c27b0` on `--pie-background-dark` drops to 1.50–2.94:1 in six schemes | literal-surface |
| max-choices warning icon | delivery | `packages/elements-react/image-cloze-association/src/delivery/root.tsx:642` | fill | `color="secondary"` (MUI default purple) | `--pie-secondary` | mui-palette |
| validation error text | author | `packages/elements-react/image-cloze-association/src/author/root.tsx:19` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/inline-dropdown`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| response-area choice menu item | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:24` | background | `color.white()` (`--pie-white`, absolute under dark; its comment points at annotation-menu, which uses `--pie-background`) | `--pie-background` | absolute-white-black |
| correct-choice check badge | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:35,40` | color, background | `theme.palette.common.white` on `color.correct()` (2.78:1 under no theme, 1.37:1 under base dark) | glyph `--pie-white` on `--pie-correct-icon` | mui-palette |
| choice edit/remove IconButtons | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:65-69` | color | `theme.palette.common.black` | `--pie-text` | mui-palette |
| response toolbar | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:143` | box-shadow | `theme.shadows[2]` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| choice editor | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:150` | background | `theme.palette.common.white` | `--pie-background` | mui-palette |
| add/done ToolbarButton | author | `packages/elements-react/inline-dropdown/src/author/inline-dropdown-toolbar.tsx:156-160` | color | `theme.palette.common.black` | `--pie-text` | mui-palette |
| validation error text | author | `packages/elements-react/inline-dropdown/src/author/main.tsx:79` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| response-area error text | author | `packages/elements-react/inline-dropdown/src/author/response-area.tsx:16` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| info icon + tooltip | author | `packages/elements-react/inline-dropdown/src/author/main.tsx:504-506` | fill; tooltip bg/text | `palette.primary`; MUI grey tooltip | `--pie-primary`; tooltip `--pie-text` bg, `--pie-background` text | mui-palette |
| choice-rationale Accordion | author | `packages/elements-react/inline-dropdown/src/author/main.tsx:372-401` | paper background, shadow, expand icon | MUI Paper `#fff` + elevation, `action.active` | `--pie-background` / `--pie-shadow` (new) / `--pie-text` | mui-palette |
| editor text-colour classes (`extraCSSRules` `.red` / `.blue`) | author | `packages/elements-react/inline-dropdown/src/author/main.tsx:432-445,516` | color | authored CSS rules | — | authored |

### `packages/elements-react/likert`

Delivery and author only; there is no print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| radio, disabled | delivery | `packages/elements-react/likert/src/delivery/choice-input.tsx:18` | color | `var(--choice-input-disabled-color, grey)` (`color.defaults.DISABLED`) | `--pie-disabled` | private-hook-literal |
| radio hover halo | delivery | `packages/elements-react/likert/src/delivery/choice-input.tsx:12-20` | background (:hover) | MUI halo, primary | `color-mix` over `--pie-primary` | mui-palette |
| error text | author | `packages/elements-react/likert/src/author/main.tsx:59,88` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| CustomColorRadio hover halo | author | `packages/elements-react/likert/src/author/main.tsx:92-94` | background (:hover) | MUI halo, primary, under a tertiary `!important` check | `color-mix` over `--pie-tertiary` | mui-palette |

### `packages/elements-react/match`

Delivery and author; there is no print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| answer-grid Radio/Checkbox hover halo | delivery | `packages/elements-react/match/src/delivery/answer-grid.tsx:174-198` | background (:hover) | MUI halo, primary (`&&:hover` sets only `color`) | `color-mix` over `--pie-primary-light` | mui-palette |
| correct-answer radio (error state) and ErrorText | author | `packages/elements-react/match/src/author/row.tsx:45,80` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| RadioButtonStyled hover halo | author | `packages/elements-react/match/src/author/row.tsx:40-47` | background (:hover) | MUI halo, primary | `color-mix` over `--pie-primary` | mui-palette |
| row drag handle | author | `packages/elements-react/match/src/author/row.tsx:191` | color | `color="primary"` | `--pie-primary` | mui-palette |
| delete IconButton | author | `packages/elements-react/match/src/author/row.tsx:233` | color, background (:hover) | `palette.action.active`, MUI halo, default | `--pie-text`, `--pie-button-hover-bg` | mui-palette |
| row drop target | author | `packages/elements-react/match/src/author/row.tsx:286` | background | `rgba(0, 0, 0, 0.1)` | `--pie-dropdown-background` | literal-surface |
| Info icon | author | `packages/elements-react/match/src/author/general-config-block.tsx:92` | color | `color="primary"` | `--pie-primary` | mui-palette |
| Tooltip | author | `packages/elements-react/match/src/author/general-config-block.tsx:47-53,91` | background, color | `alpha(grey[700], 0.92)`, `common.white` | `--pie-text` bg, `--pie-background` text | mui-palette |
| Select and menu | author | `packages/elements-react/match/src/author/general-config-block.tsx:118-126` | text, underline, focus, menu paper, item hover/selected | MUI defaults (`text.primary`, `rgba(0,0,0,0.42)`, `primary.main`, `background.paper`, `action.hover/selected`) | `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |
| add-row Button (text) | author | `packages/elements-react/match/src/author/add-row.tsx:28` | color, background (:hover) | default primary | `--pie-primary` | mui-palette |
| error text | author | `packages/elements-react/match/src/author/answer-config-block.tsx:62,69` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| error text | author | `packages/elements-react/match/src/author/configure.tsx:30` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/match-list`

Delivery only; there is no author or print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| response area, drag/selected/hover | delivery | `packages/elements-react/match-list/src/delivery/answer.tsx:343-349` | background (inline style) | `rgba(0,0,0,0.05)` | `--pie-dropdown-background` | literal-surface |
| choices pool, drag-over | delivery | `packages/elements-react/match-list/src/delivery/droppable-placeholder.tsx:40` | background | `rgba(0,0,0,0.05)` | `--pie-dropdown-background` | literal-surface |

### `packages/elements-react/math-inline`

Print renders `../delivery/main.js`, so the delivery rows also apply to print.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| response block frame (answerBlock embed) | delivery | `packages/elements-react/math-inline/src/delivery/main.tsx:971,981` | border, border-right | `2px solid grey`, `#bdbdbd` | `--pie-border-dark` | literal-border |
| response block "R" label | delivery | `packages/elements-react/math-inline/src/delivery/main.tsx:974-975` | color, background | `grey`, `#f5f5f5` (3.62:1 in every context) | `--pie-text`, `--pie-background-dark` (`--pie-disabled-text` on it fails five schemes at 4.28–4.45:1) | literal-surface |
| ResponseTemplate frame | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:70,89` | border | `2px solid grey` | `--pie-border-dark` | literal-border |
| ResponseTemplate label | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:82-83` | color, background | `grey`, `#f5f5f5` (3.62:1) | `--pie-text`, `--pie-background-dark` | literal-surface |
| error text | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:121` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Info icon | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:366` | color | `color="primary"` | `--pie-primary` | mui-palette |
| Tooltip | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:112-117,365` | background, color | MUI defaults | `--pie-text` bg, `--pie-background` text | mui-palette |
| Select and menu (outlined: no `variant` inside the render-ui `InputContainer` FormControl) | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:402-419,449` | text, outline, focus outline, menu paper, item hover/selected | MUI defaults, outline `rgba(0,0,0,.23)` | `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |
| template title InputLabel | author | `packages/elements-react/math-inline/src/author/general-config-block.tsx:39,423` | color | `palette.text.secondary` | `--pie-text` | mui-palette |
| response Card | author | `packages/elements-react/math-inline/src/author/response.tsx:22-46` | background, box-shadow | `background.paper`, elevation-1 shadow | `--pie-background`; new token needed: `--pie-shadow`, for elevation shadows | mui-palette |
| error text | author | `packages/elements-react/math-inline/src/author/response.tsx:87` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| CustomColorCheckbox hover halo | author | `packages/elements-react/math-inline/src/author/response.tsx:91-93` | background (:hover) | MUI halo, primary | `color-mix` over the checkbox's `--pie-*` colour | mui-palette |
| add/remove alternate buttons | author | `packages/elements-react/math-inline/src/author/response.tsx:95-107` | background (:hover) | `alpha(primary.main, 0.04)` | `--pie-button-hover-bg` | mui-palette |
| InputLabel | author | `packages/elements-react/math-inline/src/author/response.tsx:320,339` | color | `palette.text.secondary` | `--pie-text` | mui-palette |
| Select and menu (outlined, as above) | author | `packages/elements-react/math-inline/src/author/response.tsx:283-290` | text, outline, focus outline, menu paper, item hover/selected | MUI defaults, outline `rgba(0,0,0,.23)` | `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |
| error text | author | `packages/elements-react/math-inline/src/author/configure.tsx:23` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |

The remove-alternate button text (`author/response.tsx:100-106`) reads `color.disabled()`, a registered token, so it has no row. `--pie-disabled` is `grey` in base light and as fallback, 3.95:1 on the white response Card, on an enabled button; it takes `--pie-disabled-text`.

### `packages/elements-react/math-templated`

Print renders `../delivery/main.js`, so the delivery rows also apply to print.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| response block frame | delivery | `packages/elements-react/math-templated/src/delivery/main.tsx:196,207` | border, border-right | `2px solid grey`, `#bdbdbd` | `--pie-border-dark` | literal-border |
| response block label | delivery | `packages/elements-react/math-templated/src/delivery/main.tsx:200-201` | color, background | `grey`, `rgba(0, 0, 0, 0.04)` | `--pie-text`, `--pie-background-dark` (`--pie-disabled-text` on it fails five schemes) | literal-surface |
| ErrorText, ResponseAreaError | author | `packages/elements-react/math-templated/src/author/design.tsx:33,39` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Info icon | author | `packages/elements-react/math-templated/src/author/design.tsx:413` | color | `color="primary"` | `--pie-primary` | mui-palette |
| Tooltip | author | `packages/elements-react/math-templated/src/author/design.tsx:74,412` | background, color | MUI defaults | `--pie-text` bg, `--pie-background` text | mui-palette |
| StyledSelect and menu | author | `packages/elements-react/math-templated/src/author/design.tsx:59,446-461` | text, underline, focus, menu paper, item hover/selected | MUI defaults | `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |
| response Card | author | `packages/elements-react/math-templated/src/author/response.tsx:21-29` | background, box-shadow | `background.paper`, elevation shadow | `--pie-background`; new token needed: `--pie-shadow` | mui-palette |
| error text | author | `packages/elements-react/math-templated/src/author/response.tsx:73` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| CustomColorCheckbox hover halo | author | `packages/elements-react/math-templated/src/author/response.tsx:95-97` | background (:hover) | MUI halo, primary | `color-mix` over the checkbox's `--pie-*` colour | mui-palette |
| AlternateButton | author | `packages/elements-react/math-templated/src/author/response.tsx:62-65` | background (:hover) | `alpha(primary.main, 0.04)` | `--pie-button-hover-bg` | mui-palette |
| RemoveAlternateButton IconButton | author | `packages/elements-react/math-templated/src/author/response.tsx:67-69,373` | color, background (:hover) | `action.active`, MUI halo, default | `--pie-text`, `--pie-button-hover-bg` | mui-palette |
| InputLabel | author | `packages/elements-react/math-templated/src/author/response.tsx:339,357` | color | `palette.text.secondary` | `--pie-text` | mui-palette |
| Select and menu | author | `packages/elements-react/math-templated/src/author/response.tsx:303-305` | text, underline, focus, menu paper, item hover/selected | MUI defaults | `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-background`, `--pie-dropdown-background` | mui-palette |

### `packages/elements-react/matrix`

Delivery and author; there is no print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| radio, disabled | delivery | `packages/elements-react/matrix/src/delivery/ChoiceInput.tsx:18` | color | `var(--choice-input-disabled-color, grey)` | `--pie-disabled` | private-hook-literal |
| radio hover halo | delivery | `packages/elements-react/matrix/src/delivery/ChoiceInput.tsx:10-20` | background (:hover) | MUI halo, primary | `color-mix` over `--pie-primary` | mui-palette |
| label chip | author | `packages/elements-react/matrix/src/author/MatrixLabelEditableButton.tsx:45,47` | background, color | `#04b26e`, `white` | `--pie-button-bg`, `--pie-button-color` | literal-surface |
| label chip hover, action divider, edit input | author | `packages/elements-react/matrix/src/author/MatrixLabelEditableButton.tsx:74,86,88,105,108` | background, border-left, color | `#00985d`, `white` | `--pie-button-hover-bg`, `--pie-button-hover-color` | literal-surface |
| label menu items | author | `packages/elements-react/matrix/src/author/MatrixLabelEditableButton.tsx:218-243` | background (:hover) | `palette.action.hover` | `--pie-dropdown-background` | mui-palette |
| column header text | author | `packages/elements-react/matrix/src/author/HeaderCommon.ts:13` | color | `#c3c3c3` | `--pie-text` | literal-text |
| value grid separators | author | `packages/elements-react/matrix/src/author/MatrixValues.tsx:66,72` | background | `gray` | `--pie-border` | literal-border |
| number input outline | author | `packages/elements-react/matrix/src/author/NumberInput.tsx:28,43` | border-color (hover, rest) | `gray`, `#d6d6d6` | `--pie-border`, `--pie-border-light` | literal-border |
| number input focus | author | `packages/elements-react/matrix/src/author/NumberInput.tsx:31` | border-color (:focus) | `green` | `--pie-button-focus-outline` | focus-ring |
| number input text | author | `packages/elements-react/matrix/src/author/NumberInput.tsx:21,56` | color | TextField default `text.primary` | `--pie-text` | mui-palette |
| header type radio and label | author | `packages/elements-react/matrix/src/author/MatrixLabelTypeHeaderInput.tsx:19-23` | background (:hover), label color (disabled) | MUI halo, primary; `text.disabled` | `color-mix` over `--pie-primary`, `--pie-disabled-text` | mui-palette |
| error text | author | `packages/elements-react/matrix/src/author/Main.tsx:32` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/multi-trait-rubric`

Delivery and author; there is no print view. `src/delivery/trait.tsx:14` paints NoDescription text with `color.secondaryBackground()`. The token is registered, so this is not a gap, but a surface token as text sits near 1.1:1. It should read `--pie-disabled-text`.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| show/hide Link (`component="button"`) | delivery | `packages/elements-react/multi-trait-rubric/src/delivery/main.tsx:94-102` | color, text-decoration-color | `palette.primary.main` | `--pie-primary` | mui-palette |
| scale scroll-arrow fade | delivery | `packages/elements-react/multi-trait-rubric/src/delivery/scale.tsx:172,273` | background | `linear-gradient(…, white, var(--pie-background))` | `--pie-background` at both stops | literal-surface |
| input and box borders | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:38,48,66,84,95,184,258` | border-color | `grey[400]` from `@mui/material/colors` | `--pie-border-dark` | mui-palette |
| editable level fields | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:73,78` | background | `palette.common.white` | `--pie-background` | mui-palette |
| ScorePointBox | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:180` | background | `white` | `--pie-background` | literal-surface |
| max-points Select and menu | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:247-289` | background (:249), text, underline, focus, menu paper, items | `palette.common.white`, MUI defaults | `--pie-background`, `--pie-text`, `--pie-border-dark`, `--pie-primary`, `--pie-dropdown-background` | mui-palette |
| scroll-arrow gradient | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:420,431` | background | `palette.common.white` | `--pie-background` | mui-palette |
| scroll-arrow inline gradient | author | `packages/elements-react/multi-trait-rubric/src/author/common.tsx:446` | background (inline style) | `white` | `--pie-background` | literal-surface |
| Dialog | author | `packages/elements-react/multi-trait-rubric/src/author/modals.tsx:32-36,76` | paper background, box-shadow, backdrop | `background.paper`, elevation-24, `rgba(0,0,0,0.5)` | `--pie-background`; new token needed: `--pie-shadow` | mui-palette |
| confirm StyledButton | author | `packages/elements-react/multi-trait-rubric/src/author/modals.tsx:59-67` | color, background (:hover) | `palette.common.white` on `color.primary()`; hover `alpha(primary.main, 0.04)` drops the fill | `--pie-background` text, `--pie-primary-dark` hover | mui-palette |
| CancelButton | author | `packages/elements-react/multi-trait-rubric/src/author/modals.tsx:69-72` | background (:hover) | `alpha(primary.main, 0.04)` over `color.secondaryBackground()`, inherited from StyledButton | `--pie-button-hover-bg` | mui-palette |
| error text | author | `packages/elements-react/multi-trait-rubric/src/author/traitsHeader.tsx:85` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| MoreVert IconButton | author | `packages/elements-react/multi-trait-rubric/src/author/traitsHeader.tsx:185` | color, background (:hover) | `action.active`, MUI halo, default | `--pie-text`, `--pie-button-hover-bg` | mui-palette |
| header menu items | author | `packages/elements-react/multi-trait-rubric/src/author/traitsHeader.tsx:202` | background (:hover) | `palette.action.hover` | `--pie-dropdown-background` | mui-palette |
| error text | author | `packages/elements-react/multi-trait-rubric/src/author/trait.tsx:52` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| options IconButton | author | `packages/elements-react/multi-trait-rubric/src/author/trait.tsx:42,165` | color, background (:hover) | `action.active`, MUI halo, default | `--pie-text`, `--pie-button-hover-bg` | mui-palette |
| trait menu items | author | `packages/elements-react/multi-trait-rubric/src/author/trait.tsx:176` | background (:hover) | `palette.action.hover` | `--pie-dropdown-background` | mui-palette |

### `packages/elements-react/multiple-choice`

Print renders `../delivery/main.js`, so the delivery rows also apply to print. The delivery inputs set `disableRipple`, so they have no hover halo.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| min-selection ErrorText | delivery | `packages/elements-react/multiple-choice/src/delivery/multiple-choice.tsx:97-100,443-451` | color | `palette.error.main` | `--pie-missing` (delivery error text) | mui-palette |
| audio-autoplay overlay | delivery | `packages/elements-react/multiple-choice/src/delivery/index.ts:304-315` | `info.style.background` | `white` | `--pie-background` | literal-surface |
| selected/hover answer stroke and fill | delivery | `packages/elements-react/multiple-choice/src/delivery/choice.tsx:120-160` | border-color, background | model fields `selectedAnswerStrokeColor` and related (default `initial`) | — | authored |
| error text | author | `packages/elements-react/multiple-choice/src/author/main.tsx:86` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Info icon | author | `packages/elements-react/multiple-choice/src/author/main.tsx:276` | color | `color="primary"` | `--pie-primary` | mui-palette |
| Tooltips | author | `packages/elements-react/multiple-choice/src/author/main.tsx:76-82,270,336` | background, color | MUI defaults | `--pie-text` bg, `--pie-background` text | mui-palette |
| AddButton (contained, primary) | author | `packages/elements-react/multiple-choice/src/author/main.tsx:337-352` | background, color, hover, shadow, disabled color | ConfigLayout contained; `action.disabled` | `--pie-button-bg`, `--pie-button-color`, `--pie-button-hover-bg`, `--pie-disabled` | mui-palette |

### `packages/elements-react/number-line`

Delivery and author; there is no print view. The author preview renders the delivery component, so the delivery rows show in author too.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| legacy `colorContrast` mode background (from `env.accessibility.colorContrast`) | delivery | `packages/elements-react/number-line/src/delivery/number-line/index.tsx:53-57,71-75` | background-color | `mistyrose` (black_on_rose), `black` (white_on_black) | `--pie-background`; retire the branch for player schemes | literal-surface |
| legacy white_on_black hooks | delivery | `packages/elements-react/number-line/src/delivery/number-line/index.tsx:58-63,76-81` | `--correct-answer-toggle-label-color`, `--tick-color`, `--line-stroke`, `--arrow-color`, `--point-stroke`, `--point-fill` | `white`; `black` for point fill. Only `--correct-answer-toggle-label-color` has a reader | `--pie-text`, `--pie-background` | private-hook-literal |
| empty point | delivery | `packages/elements-react/number-line/src/delivery/number-line/graph/elements/point.tsx:45-47` | fill | `white` | `--pie-background` | svg-marks |
| point-chooser delete icon | delivery | `packages/elements-react/number-line/src/delivery/number-line/point-chooser/index.tsx:17,28` | fill | `black`, `#000000` | `--pie-text` | svg-marks |
| point-type icon sprite | shared | `packages/elements-react/number-line/src/delivery/number-line/point-chooser/index.tsx:59` (asset in `img.ts`; also used by `src/author/point-config.tsx`) | background-image | raster PNG data URI with baked colours | SVG icons painted with `--pie-text`, `--pie-primary` | svg-marks |
| point-chooser Button (contained) | delivery | `packages/elements-react/number-line/src/delivery/number-line/point-chooser/button.tsx:8-29` | background, color, hover, shadow, disabled | ui-layout contained; `action.disabled` | `--pie-button-bg`, `--pie-button-color`, `--pie-button-hover-bg`, `--pie-disabled` | mui-palette |
| default/partial feedback panel | delivery | `packages/elements-react/number-line/src/delivery/number-line/feedback.tsx:30` | background | `#dddddd` | `--pie-background-dark` | literal-surface |
| min/max label | author | `packages/elements-react/number-line/src/author/size.tsx:21` | color | `gray` | `--pie-disabled-text` | literal-text |
| point-config outlined Buttons | author | `packages/elements-react/number-line/src/author/point-config.tsx:71,74` | color, border, background (:hover) | default primary | `--pie-primary`, `--pie-button-hover-bg` | mui-palette |
| card-bar Tooltip and help IconButton | author | `packages/elements-react/number-line/src/author/card-bar.tsx:36-49` | background, color, hover | MUI defaults | `--pie-text` bg, `--pie-background` text, `--pie-button-hover-bg` | mui-palette |
| error text | author | `packages/elements-react/number-line/src/author/main.tsx:72` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Info icon in Tooltip | author | `packages/elements-react/number-line/src/author/main.tsx:576-594` | color; tooltip background and text | `color="primary"`, MUI defaults | `--pie-primary`; `--pie-text` bg, `--pie-background` text | mui-palette |
| CustomColorRadio hover halo | author | `packages/elements-react/number-line/src/author/ticks.tsx:46-48` | background (:hover) | MUI halo, primary | `color-mix` over the radio's `--pie-*` colour | mui-palette |

The correct and incorrect feedback panels (`delivery/number-line/feedback.tsx:35,38`) fill with `--pie-correct` and `--pie-incorrect`, registered tokens, so they have no row. The text on them inherits `--pie-text`, and each pair fails 12 of 13 contexts (correct: base light 4.47:1, purple-on-light-green 1.04:1; incorrect: base light 4.26:1, grey-on-light-grey 1.03:1); only no theme passes. The fills take `--pie-correct-secondary` and `--pie-incorrect-secondary`.

### `packages/elements-react/passage`

Print renders `../delivery/stimulus-tabs.js`, so the delivery rows also apply to print.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| blockquote | delivery | `packages/elements-react/passage/src/delivery/stimulus-tabs.tsx:96-98` | background, border-left | `#f9f9f9`, `5px solid #ccc` | `--pie-background-dark`, `--pie-border-light` | literal-surface |
| Tabs indicator | delivery | `packages/elements-react/passage/src/delivery/stimulus-tabs.tsx:466` | background | `color.white()` | `--pie-background` | absolute-white-black |
| add/remove passage Button | author | `packages/elements-react/passage/src/author/common.tsx:18-19,25-33` | color, background (:hover), icon color | `color="primary"`. The PassageButton override never applies because RemoveAddButton drops `className` | `--pie-primary`, `--pie-button-hover-bg` | mui-palette |
| ConfirmationDialog | author | `packages/elements-react/passage/src/author/common.tsx:36-55` | paper background, shadow, backdrop, content text, button colour | `background.paper`, elevation-24, `text.secondary`, `color="primary"` | `--pie-background`, `--pie-text`, `--pie-primary`; new token needed: `--pie-shadow` | mui-palette |
| error text | author | `packages/elements-react/passage/src/author/passage.tsx:17` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |

### `packages/elements-react/placement-ordering`

Delivery and author; there is no print view.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| tile hover and drop-over border | delivery | `packages/elements-react/placement-ordering/src/delivery/tile.tsx:56,67` | border-color | `theme.palette.primary.main` | `--pie-primary` | mui-palette |
| tile drag/selected shadow | delivery | `packages/elements-react/placement-ordering/src/delivery/tile.tsx:78` | box-shadow | `0 8px 16px rgba(0,0,0,0.2)` | new token needed: `--pie-shadow`, for elevation shadows | shadow |
| choice tile | author | `packages/elements-react/placement-ordering/src/author/choice-tile.tsx:20` | background | `palette.background.paper` | `--pie-background` | mui-palette |
| drag handle | author | `packages/elements-react/placement-ordering/src/author/choice-tile.tsx:40-42` | color | `palette.error[400]`, undefined in MUI 7, so it inherits | `--pie-text` | mui-palette |
| remove IconButton | author | `packages/elements-react/placement-ordering/src/author/choice-tile.tsx:51-57` | icon fill, color, background (:hover) | `palette.error[500]` (undefined); `color="tertiary"`; MUI halo, `action.active` | `--pie-tertiary`, `--pie-button-hover-bg` | mui-palette |
| error text | author | `packages/elements-react/placement-ordering/src/author/choice-tile.tsx:46` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| shuffle/add StyledAddButton (contained) | author | `packages/elements-react/placement-ordering/src/author/choice-editor.tsx:61-69,250-256` | background, color, hover, shadow | ConfigLayout contained | `--pie-button-bg`, `--pie-button-color`, `--pie-button-hover-bg` | mui-palette |
| error text | author | `packages/elements-react/placement-ordering/src/author/choice-editor.tsx:87` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| error text | author | `packages/elements-react/placement-ordering/src/author/design.tsx:59` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| Tooltip and Info icon | author | `packages/elements-react/placement-ordering/src/author/design.tsx:320-335` | background, color | MUI defaults, `color="primary"` | `--pie-text` bg, `--pie-background` text, `--pie-primary` | mui-palette |

### `packages/elements-react/rubric`

No gaps. Delivery uses `color.*` helpers. Print renders `../delivery/main.js`. Author wraps `@pie-lib/rubric` Authoring in ConfigLayout and defines no colours of its own.

### `packages/elements-react/select-text`

Print renders `../delivery/main.js`. Delivery has no gaps.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| ErrorText | author | `packages/elements-react/select-text/src/author/design.tsx:31,308,328,353,354,392` | color | `palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| tokenizer underline | author | `packages/elements-react/select-text/src/author/design.tsx:39-52` | background-color (`:after`) | `palette.primary.main` | `--pie-primary` | mui-palette |
| Info icon | author | `packages/elements-react/select-text/src/author/design.tsx:347` | color | `color="primary"` | `--pie-primary` | mui-palette |
| StyledTooltip | author | `packages/elements-react/select-text/src/author/design.tsx:55-61,346` | background, color | MUI defaults | `--pie-text` bg, `--pie-background` text | mui-palette |
| summary Chips | author | `packages/elements-react/select-text/src/author/design.tsx:67-70,357-362` | background, color | `palette.action.selected`, `text.primary` | `--pie-dropdown-background`, `--pie-text` | mui-palette |
| text TextField (standard) | author | `packages/elements-react/select-text/src/author/design.tsx:35-37,334-340` | text, underline, focus underline | `text.primary`, `rgba(0,0,0,0.42)`, `primary.main` | `--pie-text`, `--pie-border-dark`, `--pie-primary` | mui-palette |

### `packages/elements-svelte/mc-populated-blank`

Print renders `McPopulatedBlank.svelte`, so the delivery rows also apply to print. The `--mpb-choice-*` and `--mpb-focus-ring` hooks resolve to registered tokens in `ChoiceRow.svelte` and `McPopulatedBlank.svelte:477-482`. The CQT variant sheets set them to literals; those rows are marked intentional.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| author placeholder panel | author | `packages/elements-svelte/mc-populated-blank/src/author/Author.svelte:26,28,29` | border, background, color | `#cbd5e1`, `#f8fafc`, `#334155` | `--pie-border-light`, `--pie-background`, `--pie-text` | literal-surface |
| feedback badge glyph | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/ChoiceRow.svelte:220` | color | `var(--pie-white, #ffffff)` on `--pie-correct-icon`/`--pie-incorrect-icon`; white on dark-preset `#66BB6A` is about 2.4:1 | `--pie-background` | absolute-white-black |
| listen button hover | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/AudioPlayer.svelte:218` | background-color | `#e2f1fe` | no token: it stays `#e2f1fe`, the hover plate under the baked artwork. `--pie-tertiary-light` drops the baked "Listen" label to 2.88:1 under rose-on-green | literal-surface |
| show-correct-answer icon, off state | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/McPopulatedBlank.svelte:349-357` | fill, stroke | `#D0CAC5`, `#E6E3E0`, `#B3ABA4`, `#CDC7C2`, `white` | `--pie-border-light` rings, `--pie-background` disc | svg-marks |
| listen-button illustrations | delivery | `packages/elements-svelte/mc-populated-blank/src/delivery/assets/listen-{silent,playing}-{default,es}.svg` | fill (16 colours, `#282828` outline), rendered as `<img>` data URI | baked artwork | no token: an `<img>` cannot read vars. A fixed light plate behind it, white at rest and `#e2f1fe` on hover, or a dark-scheme asset | svg-marks |
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
| show-correct-answer icon, both states | delivery | `packages/elements-svelte/simple-cloze/src/delivery/SimpleCloze.svelte:119-129` | fill, stroke | `#bce2ff`, `#1a9cff`, `#D0CAC5`, `#E6E3E0`, `#B3ABA4`, `#CDC7C2`, `white` | `--pie-tertiary-light`, `--pie-tertiary`, `--pie-border-light`, `--pie-background` (as mc-populated-blank does for the on state) | svg-marks |
| correctness badge glyph | delivery | `packages/elements-svelte/simple-cloze/src/delivery/SimpleCloze.svelte:281` | color | `var(--pie-white, #ffffff)` on `--pie-correct-tertiary`/`--pie-incorrect-icon` | `--pie-background` | absolute-white-black |

### `packages/elements-svelte/venn-classification`

Delivery and author; there is no print view. The author preview renders the delivery component. Only the focus ring (`--vc-focus-ring`, which chains to `--pie-button-focus-outline`) and TeacherInstructions are themed; every other colour is a Tailwind slate/blue literal. The SVG mask fills (`black`/`white`, `VennClassification.svelte:583-598`) are luminance masks and are skipped.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| root text | delivery | `packages/elements-svelte/venn-classification/src/delivery/VennClassification.svelte:792` | color | `#0f172a` | `--pie-text` | literal-text |
| show-correct-answer icon, both states | delivery | `packages/elements-svelte/venn-classification/src/delivery/VennClassification.svelte:526-548` | fill, stroke | `#bce2ff`, `#1a9cff`, `#D0CAC5`, `#E6E3E0`, `#B3ABA4`, `#CDC7C2`, `white` | `--pie-tertiary-light`, `--pie-tertiary`, `--pie-border-light`, `--pie-background` | svg-marks |
| universe frame and outside divider | delivery | `packages/elements-svelte/venn-classification/src/delivery/VennClassification.svelte:615-616,679` | fill, stroke | `#ffffff`, `#cbd5e1` | `--pie-background`, `--pie-border-light` | svg-marks |
| circle fills | delivery | `packages/elements-svelte/venn-classification/src/delivery/VennClassification.svelte:623` | fill | `rgba(14, 165, 233, 0.12)` | `color-mix` over `--pie-primary`, 12% | svg-marks |
| drop-target region highlight | delivery | `packages/elements-svelte/venn-classification/src/delivery/VennClassification.svelte:501,627-640` | fill | `rgba(37, 99, 235, 0.18)` | `color-mix` over `--pie-primary`, 18% | svg-marks |
| circle outlines | delivery | `packages/elements-svelte/venn-classification/src/delivery/VennClassification.svelte:647` | stroke | `#1e293b` | `--pie-text` | svg-marks |
| circle labels | delivery | `packages/elements-svelte/venn-classification/src/delivery/VennClassification.svelte:660` | fill | `#0f172a` | `--pie-text` | svg-marks |
| unsupported-circles error | delivery | `packages/elements-svelte/venn-classification/src/delivery/VennClassification.svelte:874-877` | border, background, color | `#bf0d00`, `#fef2f2`, `#7f1d1d` | `--pie-incorrect-icon`, `--pie-incorrect-secondary`, `--pie-text` | status-colours |
| tray, rest and drop-target | delivery | `packages/elements-svelte/venn-classification/src/delivery/Tray.svelte:37,40,45-46` | border, background | `#94a3b8`, `#f8fafc`; drop `#e0f2fe`, `#0ea5e9` | `--pie-border-dark`, `--pie-surface`; drop `--pie-faded-primary`, `--pie-tertiary`. `--pie-border` is 2.76:1 on base light's surface, and a `--pie-tertiary-light` drop fill puts the tray label at 1.16:1 under base dark and white-on-black | literal-surface |
| tray label | delivery | `packages/elements-svelte/venn-classification/src/delivery/Tray.svelte:55` | color | `#475569` | `--pie-text` | literal-text |
| tile (rest, hover, held, ghost) | delivery | `packages/elements-svelte/venn-classification/src/delivery/Tile.svelte:115,117-118,133,139,149` | border, background, color | `#334155`, `#ffffff`, `#0f172a`, `#f8fafc`, `#eef2ff` | `--pie-border-dark`, `--pie-background`, `--pie-text`, `--pie-background-dark`, `--pie-faded-primary` | literal-surface |
| tile shadows | delivery | `packages/elements-svelte/venn-classification/src/delivery/Tile.svelte:121,137,147` | box-shadow | `rgba(15, 23, 42, 0.06/0.18/0.22)` | new token needed: `--pie-shadow`, for elevation shadows | shadow |
| tile correct/incorrect border | delivery | `packages/elements-svelte/venn-classification/src/delivery/Tile.svelte:153,156` | border-color | `#0ea449`, `#bf0d00` | `--pie-correct-tertiary`, `--pie-incorrect-icon` | status-colours |
| tile feedback badge | delivery | `packages/elements-svelte/venn-classification/src/delivery/Tile.svelte:224,227,230` | color, background | `#ffffff`, `#0ea449`, `#bf0d00` | `--pie-background`, `--pie-correct-tertiary`, `--pie-incorrect-icon` | status-colours |
| root, heading, label, hint and preview text | author | `packages/elements-svelte/venn-classification/src/author/Author.svelte:488,567,657,672,686,690,713,726,732,766,769` | color | `#0f172a`, `#475569`, `#64748b`, `#334155`, `#94a3b8` | `--pie-text`; `--pie-disabled-text` for hints and notes | literal-text |
| split gutter | author | `packages/elements-svelte/venn-classification/src/author/Author.svelte:519-520,523,528` | border, background, focus background | `#cbd5e1`, `#e2e8f0`, `#cbd5e1` | `--pie-border-light`, `--pie-background-dark`, `--pie-border` | literal-surface |
| field-group and preview-column panels | author | `packages/elements-svelte/venn-classification/src/author/Author.svelte:554,557,697,700` | border, background | `#e2e8f0`, `#ffffff` | `--pie-border-light`, `--pie-background` | literal-surface |
| add button | author | `packages/elements-svelte/venn-classification/src/author/Author.svelte:573-574,582` | background, color, hover | `#2563eb`, `#ffffff`, `#1d4ed8` | `--pie-primary`, `--pie-background`, `--pie-primary-dark` | literal-surface |
| ghost button | author | `packages/elements-svelte/venn-classification/src/author/Author.svelte:586,593` | border, background (:hover) | `#cbd5e1`, `#f1f5f9` | `--pie-button-border`, `--pie-button-hover-bg` | literal-border |
| danger ghost button | author | `packages/elements-svelte/venn-classification/src/author/Author.svelte:600` | color | `#bf0d00` | `--pie-incorrect-icon` | status-colours |
| override-row input | author | `packages/elements-svelte/venn-classification/src/author/Author.svelte:621` | border | `#cbd5e1` | `--pie-border-dark` | literal-border |
| tile rows | author | `packages/elements-svelte/venn-classification/src/author/Author.svelte:636,639` | border, background | `#e2e8f0`, `#f8fafc` | `--pie-border-light`, `--pie-secondary-background` | literal-surface |
| preview tile chip | author | `packages/elements-svelte/venn-classification/src/author/Author.svelte:753-754,757` | background, border, color | `#eff6ff`, `#bfdbfe`, `#1d4ed8` | `--pie-tertiary-light`, `--pie-tertiary` | literal-surface |
| region cell (rest, hover, selected) | author | `packages/elements-svelte/venn-classification/src/author/RegionPicker.svelte:65,67,73,76-77` | border, background | `#cbd5e1`, `#ffffff`, `#f1f5f9`; selected `#2563eb`, `#eff6ff` | `--pie-border-light`, `--pie-background`, `--pie-background-dark`; selected `--pie-primary`, `--pie-faded-primary` | literal-surface |
| region cell key and label | author | `packages/elements-svelte/venn-classification/src/author/RegionPicker.svelte:82,86` | color | `#64748b`, `#0f172a` | `--pie-disabled-text`, `--pie-text` | literal-text |

### `packages/elements-svelte/video-stimulus`

Delivery and author; there is no print view. Delivery has no gaps; its `:331` comment already moves the transcript surface off `--pie-white`.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| header, review summary, preview panel, form sections, preview surface | author | `packages/elements-svelte/video-stimulus/src/author/Author.svelte:700,779,814,826,999` | background | `var(--pie-white)` | `--pie-background` | absolute-white-black |
| buttons, text fields | author | `packages/elements-svelte/video-stimulus/src/author/Author.svelte:742,891` | background | `var(--pie-white)` | `--pie-background` | absolute-white-black |

### `packages/lib-react/categorize`

No gaps. Scoring and category-state helpers only; it renders nothing (consumer: categorize).

### `packages/lib-react/charting`

Consumer: the charting element. `Chart` renders in delivery (`delivery/main.tsx`) and author (`correct-response.tsx`, `charting-config.tsx`), so its marks are `shared`; `KeyLegend` is delivery; `ChartType` is author. The chart and its actions trigger sit inside the `@pie-lib/plot` root (`chart.tsx:317,361`), which paints the plane `common.white` in every context. The marks' token Should-takes hold only together with the plane row under `packages/lib-react/plot`; while the plane stays white, marks keep or take `color.defaults` literals. A `--pie-background` Should-take that replaces `color.defaults.WHITE` needs the opaque form `pieVar('background', color.defaults.WHITE)`: `color.background()` falls back to transparent.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| chart axis line and tick marks (charting) | shared | `packages/lib-react/charting/src/axes.tsx:55-70` | stroke | visx 4 default `#222` (15.91:1 on the white plane): the `.vx-axis-line`/`.vx-axis-tick` overrides match nothing because visx 4 emits `visx-axis-*`; `AXIS_TICK_COLOR` (:61, :63) is undefined in `visualElementsColors` | `--pie-border-dark` | svg-marks |
| chart left-axis tick labels (charting) | shared | `packages/lib-react/charting/src/axes.tsx:60-68,585-588` | fill | unset: the function `tickLabelProps` drops visx's fill and the `.vx-axis-tick` fill is dead, so SVG default black | `--pie-text` | svg-marks |
| chart axis error text (charting) | author | `packages/lib-react/charting/src/axes.tsx:46-49` | fill | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| chart category labels drawn as SVG text (charting) | author | `packages/lib-react/charting/src/axes.tsx:295-311,316-332` | fill | unset (SVG default black) | `--pie-text` | svg-marks |
| chart gridlines (charting) | shared | `packages/lib-react/charting/src/grid.tsx:12,72,76` | stroke | rows `GRIDLINES_COLOR` `#8E88EA` (:72); `GridColumns` gets no stroke and renders visx default `#eaf0f6` (:76), since visx's presentation attribute beats the group stroke at :12 | `--pie-border-light` | svg-marks |
| chart key legend panel (charting) | delivery | `packages/lib-react/charting/src/key-legend.tsx:17` | box-shadow | `inset 0px 1px 5px 0px #9297A6` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| chart key legend correctness glyphs (charting) | delivery | `packages/lib-react/charting/src/key-legend.tsx:39-49` | color, background | `color.defaults.WHITE` glyphs on `color.correct()` / `color.incorrectWithIcon()` discs, on the themed legend panel (`:13-14`) | glyphs stay `color.defaults.WHITE`; fills `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` (5.25:1, 6.42:1); the legend panel takes the plane palette | status-colours |
| histogram bar fills (charting) | shared | `packages/lib-react/charting/src/bars/common/bars.tsx:17-44,240-242` | fill | 12 literal hues plus 12 hover hues; nine rest hues are under 3:1 on the white plane, `#F0E442` 1.32:1 to `#54A77B` 2.92:1 | darken those nine to 3:1 on white while the plane stays white; `new token needed: --pie-chart-series-1..12 — histogram bar fill and hover` with a themed plane | svg-marks |
| hovered bar (charting) | shared | `packages/lib-react/charting/src/bars/common/bars.tsx:51` | fill | `ROLLOVER_FILL_BAR_COLOR` `#050F2D` | `new token needed: --pie-tertiary-dark — hovered chart mark` | svg-marks |
| bar fill (charting) | shared | `packages/lib-react/charting/src/bars/common/bars.tsx:57` | fill | `color.defaults.TERTIARY` | `--pie-tertiary` | svg-marks |
| correct-answer dashed bar indicator (charting) | shared | `packages/lib-react/charting/src/bars/common/bars.tsx:173` | stroke | `color.borderGray()` above the bar, also its check-icon ring (2.32:1 on the plane under base dark, white-on-black and light-gray-on-dark-gray, 2.49:1 under yellow-on-navy); `color.defaults.WHITE` over the bar | `color.defaults.BORDER_GRAY` above the bar (3.74:1); `WHITE` over the bar stays | svg-marks |
| correct-answer check badge (charting) | delivery | `packages/lib-react/charting/src/bars/common/correct-check-icon.tsx:12,19,23` | fill, stroke | circle `white` with dash fallback `#7E8494`; check `#0EA449`; glyph `white` | `--pie-background`; `--pie-border-gray`; `--pie-correct-tertiary` | status-colours |
| drag icon disc (charting) | shared | `packages/lib-react/charting/src/common/drag-icon.tsx:19` | fill | `white` | `--pie-background` | svg-marks |
| drag-handle correctness badge (charting) | delivery | `packages/lib-react/charting/src/common/drag-handle.tsx:23-44` | color, border, background | `color.defaults.WHITE` glyph and 4px ring on `color.correct()` / `color.incorrectWithIcon()` fills | glyph and ring stay `color.defaults.WHITE`; fills `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` | status-colours |
| drag-handle icon (charting) | shared | `packages/lib-react/charting/src/common/drag-handle.tsx:54` | color | `color.defaults.BORDER_GRAY` | `--pie-border-gray` | svg-marks |
| correctness indicators (charting) | delivery | `packages/lib-react/charting/src/common/correctness-indicators.tsx:12,17,31,36` | color, border, background | `color.defaults.WHITE` glyph and ring on themed correct / incorrect fills | as the drag-handle badge | status-colours |
| dot plot marks (charting) | shared | `packages/lib-react/charting/src/plot/dot.tsx:15,35` | fill, stroke | `PLOT_FILL_COLOR` `#1463B3`; overline `color.defaults.BORDER_GRAY` | `--pie-tertiary`; `--pie-border-gray` | svg-marks |
| line plot marks (charting) | shared | `packages/lib-react/charting/src/plot/line.tsx:16,36` | fill, stroke | `PLOT_FILL_COLOR`; overline `color.defaults.BORDER_GRAY` | `--pie-tertiary`; `--pie-border-gray` | svg-marks |
| plot marks and hover target (charting) | shared | `packages/lib-react/charting/src/plot/common/plot.tsx:150,278,283,288` | fill, stroke | hover rect `color.defaults.BORDER_GRAY`; marks `PLOT_FILL_COLOR` | `--pie-border-gray`; `--pie-tertiary` | svg-marks |
| plot correctness badge (charting) | delivery | `packages/lib-react/charting/src/plot/common/plot.tsx:292-305` | color, border, background | `color.defaults.WHITE` glyph and ring (:300, :305) on `color.correct()` / `color.incorrectWithIcon()` fills (:292-297) | as the drag-handle badge | status-colours |
| line chart line (charting) | shared | `packages/lib-react/charting/src/line/common/line.tsx:30,135` | stroke | `color.defaults.TERTIARY` | `--pie-tertiary` | svg-marks |
| line chart drag handle (charting) | shared | `packages/lib-react/charting/src/line/common/drag-handle.tsx:13` | color | `black`; the rules at :24, :29-30, :40, :45 (`TEXT`, `BLACK`, `WHITE`) target `.handle`/`.line`/`.disabledPoint`, and the `.correctIcon`/`.incorrectIcon` rules at :32-37 target classes only `plot/common/plot.tsx` uses, in its own sheet; no line-chart element carries any of them | `--pie-text` | svg-marks |
| line chart point and hover target (charting) | shared | `packages/lib-react/charting/src/line/line-dot.tsx:13,41-48,69` | fill, stroke | point fill unset (SVG default black); hover rect `color.defaults.BORDER_GRAY` (:69) | `--pie-tertiary`; `--pie-border-gray` | svg-marks |
| line-cross marks and hover target (charting) | shared | `packages/lib-react/charting/src/line/line-cross.tsx:16,24,28-29,81` | stroke | `color.defaults.TEXT`; `color.defaults.BLACK` once correctness is set; hover rect `BORDER_GRAY` (:81) | `--pie-text`; `--pie-border-gray` | svg-marks |
| category label input (charting) | shared | `packages/lib-react/charting/src/mark-label.tsx:24,27-60,184-222` | color | non-editable labels (the delivery default) inline `color.disabledText()` (:24, :208); fraction labels `StyledMathInput` `color.primaryDark()`, with `color.correct()` / `color.incorrect()` text under correctness (:40-60); editable labels UA default, because `StyledInput` (:27-38) is never used. On the white plane the themed ones fall as low as 1.47:1 (disabled), 1.41:1 (fraction) and 2.16:1 (incorrect, no theme) | on the white plane `DISABLED_TEXT` (7.57:1), `PRIMARY_DARK` (10.39:1), `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON`; `--pie-text` and the `-icon` states with a themed plane | literal-text |
| math category label error border (charting) | author | `packages/lib-react/charting/src/mark-label.tsx:53` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| category actions popover (charting) | shared | `packages/lib-react/charting/src/actions-button.tsx:26-35,87-110` | background, box-shadow, hover | Popover and Paper on MUI `background.paper` `#fff` with elevation shadows, under themed `color.text()` buttons (:34), so 1.00:1 under base dark and white-on-black; Button hover tint from MUI primary | `pieVar('background', color.defaults.WHITE)`, as the mask-markup menu does (`--pie-dropdown-background` fails `--pie-text` under purple-on-light-green, 4.13:1); `new token needed: --pie-shadow — elevation shadow colour`; `--pie-button-hover-bg` | mui-palette |
| category actions trigger (charting, `addCategoryEnabled`) | shared | `packages/lib-react/charting/src/actions-button.tsx:19-24` | color | `color.tertiary()` text on the white plane: 1.05–1.61:1 under base dark, white-on-black, yellow-on-blue, light-gray-on-dark-gray and yellow-on-navy | `color.defaults.TERTIARY` (5.37:1) | svg-marks |
| dot-plot and line-plot correctness marks (charting) | shared | `packages/lib-react/charting/src/common/styles.ts:11-21`, read by `plot/common/plot.tsx`, `plot/dot.tsx`, `plot/line.tsx` | fill, stroke, border | `color.correct()` / `color.incorrect()` on the white plane: 2.78:1 / 2.16:1 under no theme, 1.37:1 correct under base dark and white-on-black | `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` | svg-marks |
| chart type select (charting) | author | `packages/lib-react/charting/src/chart-type.tsx:29-47` | color, border, focus | MUI outlined Select defaults: `text.primary`, outline `rgba(0,0,0,.23)`, focus `primary.main` `#1976d2`, menu paper `#fff` | `--pie-text`; `--pie-border-dark`; `--pie-primary`; `--pie-dropdown-background` | mui-palette |

Dead literals, no element matches: `axes.tsx:72-89` `correctnessIconStyles` (`color.defaults.WHITE`) is passed as `classes` and ignored. Chart-setup fields are config-ui `NumberTextFieldCustom`, recorded under config-ui.

### `packages/lib-react/config-ui`

All author view. Every MUI default below traces to the first row's theme.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| author layout MUI theme (every element's author view) | author | `packages/lib-react/config-ui/src/layout/config-layout.tsx:10-27` | palette | `createTheme` with no palette: primary `#1976d2`, paper `#fff`, text `rgba(0,0,0,.87)`/`.6`, `action.active` `rgba(0,0,0,.54)`, error `#d32f2f`, divider `rgba(0,0,0,.12)` | primary `--pie-primary`, paper `--pie-background`, text `--pie-text`, error `--pie-incorrect-icon`, divider `--pie-border-light` | mui-palette |
| contained buttons (every author view) | author | `packages/lib-react/config-ui/src/layout/config-layout.tsx:18-21` | background, color | `#e0e0e0`; `#000000`; hover `#bdbdbd` | `--pie-button-bg`; `--pie-button-color`; `--pie-button-hover-bg` | literal-surface |
| settings panel (nearly every element) | author | `packages/lib-react/config-ui/src/layout/settings-box.tsx:16` | background | `color.white()`; the comment at :9-15 relies on `--pie-white` inverting, which holds in pie-players schemes; the ng dark preset keeps it `#ffffff` | `--pie-background` | absolute-white-black |
| author tabs (every element, tabbed layout at width ≤1135px) | author | `packages/lib-react/config-ui/src/tabs/index.tsx:35` | indicator, color | `indicatorColor="primary"` (also passed from `layout/layout-contents.tsx:101`); tab text `text.secondary`, selected `primary.main` | `--pie-primary`; `--pie-text` | mui-palette |
| confirm dialog (categorize, charting, drag-in-the-blank, fraction-model, graphing, graphing-solution-set, inline-dropdown, match, multiple-choice, number-line, placement-ordering) | author | `packages/lib-react/config-ui/src/alert-dialog.tsx:28-50` | background, color, box-shadow | Dialog paper `#fff`, title and content text on MUI text palette, elevation-24 shadow; Buttons `color="primary"` (:43, :48) | `--pie-background`; `--pie-text`; `--pie-primary` | mui-palette |
| help button and dialog (no element consumer) | author | `packages/lib-react/config-ui/src/help.tsx:17-24,37-47` | color, background | IconButton rest `action.active` (hover is themed); Dialog paper and text; Button `color="primary"` (:43) | `--pie-text`; `--pie-background`; `--pie-primary` | mui-palette |
| checkbox label (categorize, fraction-model, match, settings panel) | author | `packages/lib-react/config-ui/src/checkbox.tsx:18,21` | color | `rgba(0,0,0,1.0)`; mini label `grey[700]` | `--pie-text` | literal-text |
| checkbox error (categorize, fraction-model, match, settings panel) | author | `packages/lib-react/config-ui/src/checkbox.tsx:36` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| input checkbox and radio error (number-line, multiple-choice via ChoiceConfiguration) | author | `packages/lib-react/config-ui/src/inputs.tsx:67,85` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| InputSwitch (no element consumer) | author | `packages/lib-react/config-ui/src/inputs.tsx:48-56` | thumb, track | MUI Switch defaults: thumb `common.white`/`primary.main`, track black at .38 | `--pie-primary`; `--pie-background`; `--pie-border-dark` | mui-palette |
| settings radio-group header (nearly every element) | author | `packages/lib-react/config-ui/src/settings/panel.tsx:55` | color | `rgba(0, 0, 0, 0.89)`; on the `--pie-white` panel this is dark on black under pie-players base dark | `--pie-text` | literal-text |
| settings dropdown and number field outline | author | `packages/lib-react/config-ui/src/settings/panel.tsx:89,134` | border | `2px solid lightgrey` | `--pie-border-light` | literal-border |
| settings group header | author | `packages/lib-react/config-ui/src/settings/panel.tsx:189` | color | `#495B8F` | `--pie-blue-grey-900` | literal-text |
| settings dropdown menu | author | `packages/lib-react/config-ui/src/settings/panel.tsx:100-112` | color, border, background | Select, Input and MenuItem on MUI defaults: `text.primary`, underline `rgba(0,0,0,.42)`, focus `primary.main`, menu paper `#fff` | `--pie-text`; `--pie-border-dark`; `--pie-primary`; `--pie-dropdown-background` | mui-palette |
| settings toggle label (graphing, graphing-solution-set, settings panel) | author | `packages/lib-react/config-ui/src/settings/toggle.tsx:17` | color | `rgba(0, 0, 0, 0.89)` | `--pie-text` | literal-text |
| settings toggle switch (graphing, graphing-solution-set, settings panel) | author | `packages/lib-react/config-ui/src/settings/toggle.tsx:22-32` | thumb, track | `&.Mui-checked .MuiSwitch-thumb` (:23) and `&.Mui-checked .MuiSwitch-track` (:26) never match because MUI sets `Mui-checked` on the switchBase, so the checked thumb renders MUI primary `#1976d2`; unchecked thumb `common.white`, unchecked track black at .38 (the checked track is themed through :29-31) | thumb `--pie-tertiary`; unchecked thumb `--pie-background`; unchecked track `--pie-border-dark` | mui-palette |
| settings radio label (nearly every element) | author | `packages/lib-react/config-ui/src/settings/settings-radio-label.tsx:12` | color | `rgba(0, 0, 0, 0.89)` | `--pie-text` | literal-text |
| number field (fraction-model, hotspot, likert, match, number-line, select-text, settings panel) | author | `packages/lib-react/config-ui/src/number-text-field.tsx:13-35,178-179` | color, border, focus, background | MUI TextField defaults: input `text.primary`, label `text.secondary`, underline `rgba(0,0,0,.42)` (outline `rgba(0,0,0,.23)` where number-line passes `variant="outlined"`, `number-line/src/author/number-text-field.tsx:16`), focus `primary.main`, filled background `rgba(0,0,0,.06)`, error `error.main` | `--pie-text`; `--pie-border-dark`; `--pie-primary`; `--pie-secondary-background`; `--pie-incorrect-icon` | mui-palette |
| stepper number field (charting chart setup, graphing and graphing-solution-set grid setup, number-line) | author | `packages/lib-react/config-ui/src/number-text-field-custom.tsx:14-30,271-325` | color, border, focus | MUI TextField defaults (standard and outlined) as above; step IconButtons `action.active` | `--pie-text`; `--pie-border-dark`; `--pie-primary` | mui-palette |
| feedback accordion (categorize, match, math-inline, placement-ordering, select-text) | author | `packages/lib-react/config-ui/src/feedback-config/index.tsx:76-107` | background, color, icon, box-shadow | Accordion paper `#fff`, text, divider, ExpandMore `action.active`, elevation shadow | `--pie-background`; `--pie-text`; `--pie-border-light`; `new token needed: --pie-shadow — elevation shadow colour` | mui-palette |
| choice error text (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/index.tsx:195` | color | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| default-feedback text field (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/index.tsx:103,120-124` | color, border, focus | MUI TextField defaults | `--pie-text`; `--pie-border-dark`; `--pie-primary` | mui-palette |
| choice delete button (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/index.tsx:377-379` | color | IconButton `action.active` | `--pie-text` | mui-palette |
| feedback menu trigger icon (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/feedback-menu.tsx:106,111` | color | `color="primary"` or `"disabled"`: `#1976d2` or `action.disabled` | `--pie-primary`; `--pie-disabled` | mui-palette |
| feedback menu (multiple-choice) | author | `packages/lib-react/config-ui/src/choice-configuration/feedback-menu.tsx:74-86` | background, color, box-shadow | Menu paper `#fff`, MenuItem `text.primary`, elevation-8 shadow | `--pie-dropdown-background`; `--pie-text` | mui-palette |
| MuiBox (no element consumer) | author | `packages/lib-react/config-ui/src/mui-box/index.tsx:12,44` | border, background | `rgba(0, 0, 0, 0.42)`/`rgba(255, 255, 255, 0.7)` picked by `palette.mode`; `theme.palette.primary[mode]` | `--pie-border-dark`; `--pie-primary` | mui-palette |
| tags input chips (no element consumer) | author | `packages/lib-react/config-ui/src/tags-input/index.tsx:12-17` | background, color | MUI Chip defaults: fill `rgba(0,0,0,.08)`, `text.primary` | `--pie-secondary-background`; `--pie-text` | mui-palette |
| language select (no element consumer) | author | `packages/lib-react/config-ui/src/langs.tsx:64-68` | color, border, background | Select, Input and MenuItem on MUI defaults | `--pie-text`; `--pie-border-dark`; `--pie-dropdown-background` | mui-palette |

### `packages/lib-react/correct-answer-toggle`

No gaps. The label reads `var(--correct-answer-toggle-label-color, var(--pie-text, black))` (`index.tsx:67`); the toggle's icon is recorded under icons.

### `packages/lib-react/drag`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| draggable choice tile (categorize author choice preview) | author | `packages/lib-react/drag/src/draggable-choice.tsx:12-13` | background, border | `theme.palette.background.paper` `#fff`; `solid 1px grey[400]` | `--pie-background`; `--pie-border` | mui-palette |

`placeholder.tsx` is themed (`var(--pie-background, white)`).

### `packages/lib-react/editable-html-tip-tap`

Consumers: delivery in extended-text-entry (`delivery/main.tsx`, annotation editor) and explicit-constructed-response (through mask-markup `constructed-response.tsx`, `languageCharacters` plugin); author views of categorize, charting, drag-in-the-blank, drawing-response, explicit-constructed-response, extended-text-entry, fraction-model, graphing, graphing-solution-set, hotspot, image-cloze-association, inline-dropdown, likert, match, math-inline, math-templated, matrix, multi-trait-rubric, multiple-choice, number-line, passage, placement-ordering, select-text; and config-ui, graphing, graphing-solution-set, plot and rubric labels. "All hosts" below means every one of these.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| editor frame (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:15` | border | `1px solid #ccc` | `--pie-border-dark` | literal-border |
| editor error state (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:103-105` | border | `theme.palette.error.main` | `--pie-incorrect-icon` | mui-palette |
| highlighted editor (extended-text-entry delivery; explicit-constructed-response, inline-dropdown, math-templated authoring) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:115` | background | `theme.palette.action.selected` `rgba(0,0,0,.08)` | `--pie-dropdown-background` | mui-palette |
| inline code (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:56-62` | background, color | `var(--purple-light)`; `var(--black)` (literals set in `EditableHtml.tsx:96,106`) | `--pie-secondary-background`; `--pie-text` | private-hook-literal |
| code block (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:63-75` | background, color | `var(--black)` `#2e2b29`; `var(--white)` `#fff` | `--pie-background-dark`; `--pie-text` | private-hook-literal |
| blockquote (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/TiptapContainer.tsx:77-82` | background, border | `#f9f9f9`; `5px solid #ccc` | `--pie-secondary-background`; `--pie-border` | literal-surface |
| Tiptap template palette (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/EditableHtml.tsx:94-114,454-458` | custom properties | 18 literals (`--white`, `--black`, `--gray-1..5`, `--purple*`, `--yellow*`, `--red*`, `--green`, `--shadow`) written onto `document.documentElement` on every editor mount | point each reader at a `--pie-*` token and drop the block | private-hook-literal |
| empty-editor placeholder (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/EditableHtml.tsx:534` | color | `#9CA3AF` | `--pie-disabled-text` | literal-text |
| paragraph mark ¶ (authors with `showParagraphs`) | author | `packages/lib-react/editable-html-tip-tap/src/components/EditableHtml.tsx:544` | color | `#146EB3` | `--pie-tertiary` | literal-text |
| toolbar rest icons (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/MenuBar.tsx:576` | color | `grey` | `--pie-text` | literal-text |
| toolbar elevation (all hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/MenuBar.tsx:626-627` | box-shadow | MUI elevation-1 `rgba(0,0,0,.2)`, `.14`, `.12` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| table toolbar icons (authors with the table plugin) | author | `packages/lib-react/editable-html-tip-tap/src/components/icons/TableIcons.tsx:6-11` | fill | `grey`; hover `black`, ignoring the button's themed `color` | `currentColor` (the button reads `--pie-text`/`--pie-disabled`) | svg-marks |
| text-align menu (authors with text alignment) | author | `packages/lib-react/editable-html-tip-tap/src/components/icons/TextAlign.tsx:124-129` | background | `#fff` | `--pie-background` | literal-surface |
| special-character keys (extended-text-entry and explicit-constructed-response delivery, authors) | shared | `packages/lib-react/editable-html-tip-tap/src/components/CharacterPicker.tsx:196` | border | `1px solid #000` | `--pie-border-dark` | literal-border |
| special-character preview popper (same hosts) | shared | `packages/lib-react/editable-html-tip-tap/src/components/characters/custom-popper.tsx:9` | background | `#fff`, portalled to `document.body` | `--pie-background` | literal-surface |
| image alt-text dialog (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/components/image/AltDialog.tsx:52-79` | background, color, focus, box-shadow | MUI Dialog paper `#fff`, `text.primary`, TextField underline and focus `primary.main`, Button primary text, elevation-24 shadow | `--pie-background`; `--pie-text`; `--pie-primary` | mui-palette |
| image toolbar divider (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/components/image/ImageToolbar.tsx:27` | border-left | `1px solid grey` | `--pie-border` | literal-border |
| selected image outline and resize handle (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/image-component.tsx:59,63` | border, background | `theme.palette.primary.main` `#1976d2` | `--pie-primary` | mui-palette |
| image upload progress (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/image-component.tsx:19-30,261` | background | MUI LinearProgress primary bar and tinted track | `--pie-primary`; `--pie-primary-light` | mui-palette |
| image toolbar elevation (authors with images) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/image-component.tsx:286-287` | box-shadow | MUI elevation-1 `rgba(0,0,0,…)` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| response-area and image toolbar elevation (drag-in-the-blank, explicit-constructed-response, inline-dropdown authoring; images) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/custom-toolbar-wrapper.tsx:21-22` | box-shadow | MUI elevation-1 `rgba(0,0,0,…)` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| toolbar delete button (same) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/custom-toolbar-wrapper.tsx:41-46,70-72` | color | MUI IconButton default `action.active` `rgba(0,0,0,.54)` | `--pie-text` | mui-palette |
| math toolbar elevation (hosts with the math plugin) | shared | `packages/lib-react/editable-html-tip-tap/src/extensions/math.tsx:440-441` | box-shadow | MUI elevation-1 `rgba(0,0,0,…)` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| CSS class picker (authors with the css plugin) | author | `packages/lib-react/editable-html-tip-tap/src/extensions/css.tsx:90` | background | `white` | `--pie-background` | literal-surface |
| media insert dialog (authors with video or audio) | author | `packages/lib-react/editable-html-tip-tap/src/components/media/MediaDialog.tsx:87-91,108-111,460-472,586-591` | background, color, indicator | Dialog paper `#fff` and text; Tabs `indicatorColor="primary"` and tab text; TextFields; Buttons `color="primary"`; error text `theme.palette.error.main` (:110) | `--pie-background`; `--pie-text`; `--pie-primary`; `--pie-incorrect-icon` | mui-palette |
| media toolbar (authors with video or audio) | author | `packages/lib-react/editable-html-tip-tap/src/components/media/MediaToolbar.tsx:12,15,21` | background, box-shadow, border | `theme.palette.common.white`; `0px 4px 4px rgba(0, 0, 0, 0.25)`; divider `theme.palette.common.black` | `--pie-background`; `new token needed: --pie-shadow — elevation shadow colour`; `--pie-border-dark` | mui-palette |
| response box (explicit-constructed-response authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/ExplicitConstructedResponse.tsx:84-85` | background, border | `#FFF`; `#C0C3CF`, error `red`; text inherits the scheme ink, so light on white under dark | `--pie-background`; `--pie-border`; `--pie-incorrect-icon` | literal-surface |
| response toolbar holder (explicit-constructed-response authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/ExplicitConstructedResponse.tsx:101` | background, box-shadow | Tailwind `bg-white shadow-lg`, effective only where the host page ships Tailwind utilities | `--pie-background` | literal-surface |
| response box (inline-dropdown authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/InlineDropdown.tsx:167-168` | background, border | `#FFF`; `#C0C3CF` | `--pie-background`; `--pie-border` | literal-surface |
| blank tile (drag-in-the-blank authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/DragInTheBlank/choice.tsx:67-68,78` | background, border | fill `color.defaults.WHITE`, preview `color.defaults.BORDER_LIGHT`; border `color.defaults.BORDER_DARK`/`BORDER_LIGHT` | `--pie-background`/`--pie-secondary-background`; `--pie-border-dark`/`--pie-border-light` | literal-surface |
| blank grip icon (drag-in-the-blank authoring) | author | `packages/lib-react/editable-html-tip-tap/src/components/respArea/DragInTheBlank/choice.tsx:98` | color | `#9B9B9B` | `--pie-border-gray` | svg-marks |

Dead literals, no element matches: `MenuBar.tsx:610-613` `.isActive` (`var(--purple)`, `var(--white)`) and `MenuBar.tsx:670-672` `.label` (`var(--editable-html-toolbar-check, #00bb00)`) are never applied; `DragInTheBlank/choice.tsx:14` is a 0px border. Themed and fine: toolbar fill (`constants.ts:8`), focus rings (`MenuBar.tsx:597`, `toolbar-buttons.tsx:28`), Done check (`done-button.tsx:21`), tables (`extended-table.tsx`), math-templated box.

### `packages/lib-react/graphing`

Consumer: the graphing element; `GraphContainer` renders in delivery (`delivery/main.tsx`) and author (`correct-response.tsx`, `graphing-config.tsx`), so plane marks are `shared`; `KeyLegend` is delivery; `GridSetup` is author. The graph sits inside the `@pie-lib/plot` root (`graph.tsx:264`), which paints the plane `common.white` in every context, so the `color.defaults.BLACK` marks hold at 21:1. Commit 23637af1 (PIE-877/PIE-994) locked disabled and background marks to `color.defaults`, so those are intentional. Its record of the active strokes at 1.00:1 under white-on-black, on a transparent plane, is wrong: only the `color.black()` curves fail that way. The active marks stay rows because follow-up 7 decides whether the plane follows the scheme; their token Should-takes hold only together with the plane row under `packages/lib-react/plot`, and while the plane stays white they keep `color.defaults`. A `--pie-background` Should-take that replaces a white glyph needs the opaque form `pieVar('background', color.defaults.WHITE)`: `color.background()` falls back to transparent.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| graph gridlines (graphing) | shared | `packages/lib-react/graphing/src/grid.tsx:98,108,118,125` | stroke | minor `#E1E6EC`; labelled `#9FA8DA`/`#7985CB` | `--pie-border-light`; `--pie-border` | svg-marks |
| graph axes, ticks, tick labels and arrows (graphing) | shared | `packages/lib-react/graphing/src/axis/axes.tsx:53-55,71-83` | stroke, fill | `color.defaults.PRIMARY` (indigo[500]); this class shadows the `--arrow-color` hook in `axis/arrow.tsx:10` (fallback `theme.palette.common.black`) | `--pie-primary` | svg-marks |
| line, ray, segment and vector marks (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/line/index.tsx:18,23,487,492,496` | stroke, fill | `color.defaults.BLACK` at rest; hover `PRIMARY_DARK`; arrow fill `BLACK` | `--pie-text`; `--pie-primary-dark` | svg-marks |
| curve marks at rest: parabola, sine, exponential, absolute (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/line/line-path.tsx:19` | stroke | `color.black()` reads `--pie-black`, which pie-players inverts, so 1.00:1 on the white plane under base dark and white-on-black; absolute `#000000` under the ng dark preset | `color.defaults.BLACK`, as the other at-rest marks; `--pie-text` only with a themed plane, since it fails the same way on the white one | absolute-white-black |
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
| key legend panel (graphing) | delivery | `packages/lib-react/graphing/src/key-legend.tsx:18` | box-shadow | `0px 1px 5px 0px #9297A6` | `new token needed: --pie-shadow — elevation shadow colour` | shadow |
| key legend mark swatches (graphing) | delivery | `packages/lib-react/graphing/src/key-legend.tsx:66,69,71,90,93,95,118,119,122` | fill, stroke | `#6A78A1`, `#BF0D00`, `#0B7D38` with `white` glyphs, on the themed legend panel (`:12-18`), where they fall to 1.23–2.90:1 under light-gray-on-dark-gray, black-on-violet, yellow-on-blue and yellow-on-navy; the marks they describe read `--pie-missing-icon`/`--pie-incorrect-icon`/`--pie-correct-icon`, and `#0B7D38` also differs from `CORRECT_WITH_ICON` `#087D38` | the `*_WITH_ICON` literals the plane marks take, with the legend panel on the plane palette; `--pie-missing-icon`, `--pie-incorrect-icon`, `--pie-correct-icon` and `--pie-background` glyphs only with a themed plane | status-colours |
| key legend label swatches (graphing) | delivery | `packages/lib-react/graphing/src/key-legend.tsx:51,54,58,78,79,82,102,103,106,110,130,131,134,138` | fill, stroke | `white` boxes with `#BF0D00`, `#6A78A1`, `#0B7D38` | — (match the mark labels' "fixed light palette in both schemes" (:11-12)) | intentional |
| mark labels (graphing) | shared | `packages/lib-react/graphing/src/mark-label.tsx:28-82` | background, color, border | `color.defaults.WHITE`, `*_WITH_ICON`, `PRIMARY_DARK`, `SECONDARY` | — ("fixed light palette in both schemes" (`key-legend.tsx:11-12`)) | intentional |
| mark-label status icons (graphing) | shared | `packages/lib-react/graphing/src/label-svg-icon.tsx:12,20,28` | fill | `#0B7D38`; `#BF0D00` | — (part of the mark-label fixed light palette) | intentional |
| disabled and background marks (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/styles.ts:12-20` | fill, stroke | `color.defaults.DISABLED_SECONDARY` | — ("Locked to the palette default" so contrast against the plane does not depend on the scheme (:7-11)) | intentional |
| disabled arrowheads (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/arrow-head.tsx:11,28` | fill | `color.defaults.DISABLED_SECONDARY` | — (same lock as `tools/shared/styles.ts:7-11`) | intentional |
| disabled points (graphing) | shared | `packages/lib-react/graphing/src/tools/shared/point/index.tsx:35` | fill | `color.defaults.DISABLED_SECONDARY` | — (same lock as `tools/shared/styles.ts:7-11`) | intentional |
| correctness marks: lines, curves, circles, polygons, points, arrowheads (graphing) | delivery | `packages/lib-react/graphing/src/tools/shared/styles.ts:22-35`, `tools/shared/arrow-head.tsx:14-37` | fill, stroke | `color.correctWithIcon()` / `incorrectWithIcon()` / `missingWithIcon()` on the white plane: correct 1.33–1.37:1 under base dark, white-on-black, yellow-on-blue, light-gray-on-dark-gray and yellow-on-navy; incorrect 1.70:1 under yellow-on-navy; missing 1.23:1 under yellow-on-blue and 1.74:1 under yellow-on-navy | `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` / `MISSING_WITH_ICON`, the lock 23637af1 applied to the disabled marks | svg-marks |
| disabled tool buttons (graphing) | shared | `packages/lib-react/graphing/src/toggle-bar.tsx:34-39,55` | color, border | MUI outlined disabled: text `action.disabled` `rgba(0,0,0,.26)`, border `action.disabledBackground` `rgba(0,0,0,.12)`; the `& span` override (:35-37) matches nothing because MUI 7 Button renders no label span | `--pie-disabled-text`; `--pie-border-light` | mui-palette |
| collapsible toolbar accordion (graphing; `collapsibleToolbar` is set only in the author `graphing-config.tsx:290`) | author | `packages/lib-react/graphing/src/graph-with-controls.tsx:35-38,71-82` | color, icon, box-shadow | Accordion text `text.primary`, ExpandMore `action.active`, elevation-1 shadow; fill is themed | `--pie-text`; `new token needed: --pie-shadow — elevation shadow colour` | mui-palette |
| grid setup accordion (graphing) | author | `packages/lib-react/graphing/src/grid-setup.tsx:391-443` | background, color, icon, box-shadow | MUI Accordion paper `#fff`, `text.primary`, ExpandMore `action.active`, elevation shadow; its fields are config-ui `NumberTextFieldCustom` and `Toggle` | `--pie-background`; `--pie-text`; `new token needed: --pie-shadow — elevation shadow colour` | mui-palette |

Themed and fine: toggle-bar enabled state, undo/redo, legend container. Points take `currentColor` (`base-point.tsx:19`) from the plot root's `color.defaults.TEXT`; `graph-with-controls.tsx:26` does not reach them, because the graph is a sibling of the controls. `graph.tsx:291` and `bg.tsx:91` are a mask and an invisible hit area.

### `packages/lib-react/graphing-solution-set`

Consumer: the graphing-solution-set element; `GraphContainer` renders in delivery and author (`shared`), grid setup is author. As in graphing, the graph sits inside the `@pie-lib/plot` root (`graph.tsx:295`) on a plane fixed `common.white`: the marks' token Should-takes hold only together with the plane row under `packages/lib-react/plot`, and while the plane stays white the marks keep or take `color.defaults` literals.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| graph gridlines (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/grid.tsx:98,108,118,125` | stroke | minor `#D3D3D3`; labelled `#9FA8DA`/`#7985CB` | `--pie-border-light`; `--pie-border` | svg-marks |
| graph axes, ticks, tick labels and arrows (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/axis/axes.tsx:53-63,80-82` | stroke, fill | axis line and ticks `#8a92c0`; tick labels `color.defaults.BLACK`; arrows `#8a92c0`, which shadows the `--arrow-color` hook in `axis/arrow.tsx:10` (fallback `theme.palette.common.black`) | `--pie-border-dark`; `--pie-text` | svg-marks |
| line marks, solid and dashed (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/line/index.tsx:443,448,453,458,463` | stroke, fill | `color.defaults.BLACK` at rest and hover; arrow fill `color.defaults.SECONDARY` | `--pie-text`; `--pie-secondary` | svg-marks |
| line arrow markers (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/arrow-head.tsx:31` | fill | inline `color.defaults.BLACK` | `--pie-text` | svg-marks |
| points (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/point/base-point.tsx:102` | fill | inline `color.defaults.BLACK`; the inline style beats the class fills, so the correct, incorrect, missing and disabled fills (:16-30, `point/index.tsx:36-40`) never reach the circle | drop the inline fill so the state fills apply; rest `color.defaults.BLACK` on the white plane, `--pie-text` with a themed plane; states as the correctness-marks row below | svg-marks |
| arrow points (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/point/index.tsx:36` | fill | `color.defaults.SECONDARY` | `--pie-secondary` | svg-marks |
| solution-set polygon (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/polygon/polygon.tsx:13,16,25,28` | fill | `rgb(60, 73, 150, 0.6)`; hover `rgb(0, 0, 0, 0.25)` | `color-mix` over `--pie-primary` at 60%; hover `color-mix` over `--pie-text` at 25% | svg-marks |
| disabled marks (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tools/shared/styles.ts:10-13` | fill, stroke | `color.defaults.DISABLED` | — (locked to the palette default "matching @pie-lib/graphing" (:5-9)) | intentional |
| correctness polygon and line strokes (graphing-solution-set) | delivery | `packages/lib-react/graphing-solution-set/src/tools/shared/styles.ts:15-26` | fill, stroke | `color.correct()` / `incorrect()` / `missing()` on the white plane: correct 2.78:1 under no theme and 1.37:1 under base dark and white-on-black; incorrect 2.16:1 under no theme; missing 2.86:1 under base dark and white-on-black | `CORRECT_WITH_ICON` / `INCORRECT_WITH_ICON` / `MISSING_WITH_ICON` | svg-marks |
| mark label input (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/mark-label.tsx:23,25,26` | border, color, background | border `color.defaults.PRIMARY_DARK`/`SECONDARY`; text `PRIMARY_DARK`; background `theme.palette.background.paper` when disabled and `transparent` otherwise, so the label sits on the white plane, where `PRIMARY_DARK` is 10.39:1 | `--pie-primary-dark`; `--pie-secondary`; `--pie-background`, with a themed plane | literal-text |
| coordinates hover label (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/coordinates-label.tsx:15,16` | background, color | `theme.palette.common.white`; `color.defaults.BLACK` | `--pie-background`; `--pie-text` | mui-palette |
| controls bar (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/graph-with-controls.tsx:46` | background | `#9FA8DA` under `--pie-text` ink (:45): 2.31:1 under base dark and white-on-black, 1.75:1 under light-gray-on-dark-gray | `--pie-background-dark`; `--pie-primary-light` under `--pie-text` falls to 1.03–1.22:1 under the dark schemes | literal-surface |
| collapsible toolbar accordion (graphing-solution-set; `collapsibleToolbar` is set only in the author `graphing-config.tsx:278`) | author | `packages/lib-react/graphing-solution-set/src/graph-with-controls.tsx:54-58,81-88` | color, icon | Accordion text `text.primary`, ExpandMore `action.active`; fill (`--pie-primary-light`) and shadow are overridden | `--pie-text` | mui-palette |
| line select radios (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tool-menu.tsx:43-51,101-109,159-167,206-207` | color | `#000000 !important` for rest and checked | `--pie-text`; checked `--pie-primary` | literal-text |
| line type toggle buttons (graphing-solution-set) | shared | `packages/lib-react/graphing-solution-set/src/tool-menu.tsx:57-93,115-151,209-247` | background, color, border, box-shadow | selected fill `#3E4EB1` with `#FFFFFF` text; unselected fill `#FFFFFF` with `#3E4EB1` text; border `#3E4EB1`; MUI contained elevation shadow (`color="primary"` at :60, :79, :118, :137 is overridden) | `--pie-primary` (selected fill, unselected text, border); `--pie-background` (unselected fill, selected text) | literal-surface |
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
| blank chip while a choice is dragged over it: drag-in-the-blank | delivery | `packages/lib-react/mask-markup/src/components/blank.tsx:58-59` | border, background | `grey[500]`, `grey[300]` (`@mui/material/colors`), under `color.text()` | `--pie-border-dark`, `--pie-background-dark` | mui-palette |
| response input border: explicit-constructed-response | delivery | `packages/lib-react/mask-markup/src/constructed-response.tsx:23` | border | `color.black()`, absolute `#000000` on the dark preset background | `--pie-border-dark` | absolute-white-black |
| dropdown correctness glyph on the correct/incorrect fill: inline-dropdown | delivery | `packages/lib-react/mask-markup/src/components/dropdown.tsx:159,176` | color | `color.white()` | `--pie-background` in the opaque form `pieVar('background', color.defaults.WHITE)`: `color.background()` falls back to transparent | absolute-white-black |
| open dropdown listbox elevation: inline-dropdown | delivery | `packages/lib-react/mask-markup/src/components/dropdown.tsx:90-101` | box-shadow | MUI Menu paper elevation-8 `rgba(0,0,0,0.2/0.14/0.12)` (only the background is overridden) | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/lib-react/math-input`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| disabled keypad keys (for example `noDecimal`): math-inline, math-templated, editable-html-tip-tap math | shared | `packages/lib-react/math-input/src/keypad/index.tsx:188-193,395,410,430` | color | MUI `.Mui-disabled` `palette.action.disabled` beats `color.text()` | `--pie-disabled-text` | mui-palette |
| MathQuill bars in submitted answers: math-inline, math-templated | delivery | `packages/elements-react/math-inline/src/delivery/main.tsx:204`, `packages/elements-react/math-templated/src/delivery/main.tsx:436`; `@pie-framework/mathquill` `build/mathquill.css:116,201,234,279,286,304,375,644-645` | border (bars) | Evaluate and view render each answer through `applyStaticMath`, outside `mq.Static` and `mq.Input`, so the `mqInkStyles` overrides (`math-input/src/mq/common-mq-styles.ts`) miss it: abs, underline, overarc and xarrow bars `black`, 1.00:1 under base dark and white-on-black; overline and overarrow `#4d4d4d` | `mqInkStyles` on the answer block | literal-border |

The empty-slot placeholder (:31) is recorded under render-ui `keypadEmptyPlaceholder`. The key labels (:188-198) and LaTeX glyphs take `color.keypadInk()` on the `overBackground` key fill, both themed, so they have no row. `keypadInk` scales `--pie-text` towards black by up to 40% when its channels sum under 450: plain `--pie-text` fell under 4.5:1 at 19.6px normal weight under purple-on-light-green (3.92:1, operator keys 3.55:1) and on grey-on-light-grey operator keys (4.16:1), and the scaled inks hold 5.72:1 and 6.52:1 at their lowest. Raising the key-fill share cannot fix the purple operator keys, which reach only 4.24:1 at full share.

### `packages/lib-react/math-rendering`

No gaps. It re-exports `@pie-element/shared-math-rendering-mathjax`.

### `packages/lib-react/math-toolbar`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| math answer field: math-inline (delivery and author), math-templated author, editable-html-tip-tap math | shared | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:29` | border | `solid 1px lightgrey`, in a dead rule: `& > .mq-math-mode` matches nothing, because the MathQuill root is not a direct child, so math-input's `--pie-border-dark` unfocused border renders | fix the selector; `--pie-border-dark` | literal-border |
| focused math answer field: same elements | shared | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:34` | border (focus indicator) | `dotted 1px theme.palette.primary.main` (`#1976d2`), in a dead rule: `& > .mq-focused` matches nothing, for the same reason | fix the selector; THEMING.md focus chain | focus-ring |
| math answer field with an error: same elements | shared | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:180` | border | `2px solid red` | `--pie-incorrect-icon` | status-colours |
| add answer block button: math-inline and math-templated authoring | author | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:197,485-489` | border; disabled color | `1px solid lightgrey`; MUI `action.disabled` | `--pie-border-light`; `--pie-disabled-text` | literal-border |
| rule under the editor: same elements as the field | shared | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:206,494` | border-bottom | `theme.palette.primary.main` | `--pie-primary` | mui-palette |
| equation editor Select (controlledKeypadMode): math-inline and math-templated authoring | author | `packages/lib-react/math-toolbar/src/editor-and-pad.tsx:441-463` | underline, label, menu paper, selected item | MUI defaults: underline `rgba(0,0,0,0.42)`, focused underline `primary.main`, label `text.secondary`, paper `#fff` with elevation shadow, selected `primary` at 0.08 | `--pie-border-dark`, `--pie-primary`, `--pie-text`, `--pie-dropdown-background`, `--pie-faded-primary`; shadow `--pie-shadow` | mui-palette |
| math node preview: editable-html-tip-tap in every element's authoring and in delivery editors that take math | shared | `packages/lib-react/math-toolbar/src/math-preview.tsx:22` | border | `solid 1px lightgrey` | `--pie-border-light` | literal-border |
| focused math node preview: same | shared | `packages/lib-react/math-toolbar/src/math-preview.tsx:27` | border (focus indicator) | `solid 1px black`, in a dead rule: the preview's direct child is the `mq.Static` span, which never takes `mq-focused` | THEMING.md focus chain, on a selector that matches | focus-ring |
| selected math node preview: same | shared | `packages/lib-react/math-toolbar/src/math-preview.tsx:117-120` | border | `theme.palette.primary.main`, never applied: `MathPreview` never receives `isSelected`, because tip-tap `math.tsx:427` passes only `latex` | `--pie-primary` | mui-palette |
| Done check: math-inline and math-templated authoring Correct Answer card | author | `packages/lib-react/math-toolbar/src/done-button.tsx:19` | color | `#388E3C`. The comment says the card "stays white under every scheme"; the colour moves to the token once the card follows the scheme | — | intentional |

### `packages/lib-react/plot`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| graph and chart root container (the plane): charting, graphing, graphing-solution-set | shared | `packages/lib-react/plot/src/root.tsx:53-54` | color, background | `color.defaults.TEXT` (`black`), `theme.palette.common.white`, in every context since `08f827fb` | `--pie-text`, `--pie-background`, only together with every plane mark's token: alone they leave every literal `BLACK` mark invisible under the dark schemes. Keeping the plane white and locking the marks is the alternative (follow-up 7) | mui-palette |
| graph title and chart title: same elements | shared | `packages/lib-react/plot/src/root.tsx:82,99` | color | `color.defaults.TEXT` (`black`) | `--pie-text` | literal-text |
| axis label editor box: same elements | author | `packages/lib-react/plot/src/label.tsx:60` | box-shadow | `0px 5px 8px rgba(0,0,0,0.15)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/lib-react/render-ui`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| UiLayout MUI theme palette, wherever an MUI component inside UiLayout/PreviewLayout reads it: categorize, charting, drag-in-the-blank, drawing-response, explicit-constructed-response, extended-text-entry, fraction-model, graphing, graphing-solution-set, hotspot, image-cloze-association, inline-dropdown, likert, match, math-inline, math-templated, matrix, multiple-choice, multi-trait-rubric, number-line, passage, placement-ordering, rubric, select-text | shared | `packages/lib-react/render-ui/src/ui-layout.tsx:7-34` | palette, shadows | `createTheme` defaults: primary `#1976d2`, secondary `#9c27b0`, error `#d32f2f`, warning `#ed6c02`, info `#0288d1`, success `#2e7d32`, text `rgba(0,0,0,0.87/0.6/0.38)`, background.paper/default `#fff`, divider `rgba(0,0,0,0.12)`, action.active/hover/selected/focus `rgba(0,0,0,…)`, grey, common, 25 elevation shadows | primary `--pie-primary`, secondary `--pie-secondary`, error `--pie-incorrect-icon`, warning `--pie-missing`, success `--pie-correct`, info `--pie-tertiary`, text `--pie-text`/`--pie-disabled-text`, paper `--pie-dropdown-background`, default `--pie-background`, divider `--pie-border-light`, action `--pie-background-dark`/`--pie-focus-checked`; shadows: new token needed: `--pie-shadow` — elevation shadow colour | mui-palette |
| disabled MUI controls inside UiLayout (math keypad keys, rubric point-menu icon and others) | shared | `packages/lib-react/render-ui/src/ui-layout.tsx:13` | palette.action.disabled | `'rgba(0, 0, 0, 0.54);'` | `--pie-disabled-text` | mui-palette |
| contained MUI Button inside UiLayout (elements as in the palette row) | shared | `packages/lib-react/render-ui/src/ui-layout.tsx:22-31` | background, color, hover background | `#e0e0e0`, `#000000`, `#bdbdbd` | `--pie-button-bg`, `--pie-button-color`, `--pie-button-hover-bg` | literal-surface |
| Feedback message text: categorize, extended-text-entry, match-list, match, math-inline, multiple-choice, placement-ordering, select-text | delivery | `packages/lib-react/render-ui/src/feedback.tsx:27` | color | `var(--feedback-color, white)`. No preset or scheme sets `--feedback-color`. White sits on elements-ng light `#E8F5E9`/`#FFEBEE` (about 1.1:1), on the `color.correct()` fallback `#4caf50` under no theme (2.78:1) and, in pie-players, on `--pie-correct` (`#00ff00` in white-on-black) | `--pie-text`, with the fills (:21,29,32) moved to `--pie-correct-secondary`/`--pie-incorrect-secondary`/`--pie-background-dark`. `--pie-disabled-secondary` under `--pie-text` fails (2.10:1 under yellow-on-blue) | private-hook-literal |
| math keypad empty-slot placeholder on keys: math-inline, math-templated, editable-html-tip-tap math | shared | `packages/lib-react/render-ui/src/color.ts:64,166`; used at `packages/lib-react/math-input/src/keypad/index.tsx:31` | background | `--pie-keypad-empty-placeholder` (unregistered) → `rgba(245, 0, 87, 0.4)` | `overBackground(KEYPAD_EMPTY_PLACEHOLDER, …)` color-mix over `--pie-background`, as its keypad siblings do; that themes the slot and leaves it at about 1.75:1 in every context | unregistered-token |
| chart and graph marks (`visualElementsColors`): charting axes, grid, dot, line, plot, bars; graphing shape tools (`lib-react/graphing/src/tools/shared/styles.ts:5`) | shared | `packages/lib-react/render-ui/src/color.ts:176-182` | SVG stroke, fill | `AXIS_LINE_COLOR #5A53C9`, `ROLLOVER_FILL_BAR_COLOR #050F2D`, `GRIDLINES_COLOR #8E88EA`, `PLOT_FILL_COLOR #1463B3`, `SHAPES_FILL_COLOR #7986cb` | axis `--pie-tertiary`, gridlines `--pie-tertiary-light`, rollover bar `--pie-text`, plot fill `--pie-tertiary`, shapes fill `--pie-tertiary-light` | svg-marks |
| prompt custom audio play button: categorize, drag-in-the-blank, hotspot, image-cloze-association, multiple-choice | delivery | `packages/lib-react/render-ui/src/preview-prompt.tsx:148,199,206` | border (`element.style`) | `1px solid #326295` idle and paused, `1px solid #ccc` playing | `--pie-primary`; `--pie-border-light` | literal-border |
| undo/reset icon (withUndoReset: no element consumer in src) | shared | `packages/lib-react/render-ui/src/withUndoReset.tsx:24` | color | `gray` | `--pie-disabled-text` | literal-text |
| undo/reset buttons (no element consumer in src) | shared | `packages/lib-react/render-ui/src/withUndoReset.tsx:94,100` | Button colour | `color="primary"` (`palette.primary.main`) | `--pie-primary` | mui-palette |
| InlineMenu paper: matrix and multi-trait-rubric authoring, config-ui feedback menu, rubric point menu; mask-markup dropdown overrides only the background | shared | `packages/lib-react/render-ui/src/inline-menu.tsx:36-58` | background, color, box-shadow | MUI Menu paper defaults: `background.paper #fff`, `text.primary`, elevation-8 shadow | `--pie-dropdown-background`, `--pie-text`; shadow: new token needed: `--pie-shadow` — elevation shadow colour | mui-palette |
| InputContainer label: authoring panels of nearly every React element, plus config-ui, graphing grid setup, math-toolbar, rubric | author | `packages/lib-react/render-ui/src/input-container.tsx:16-34` | color | MUI InputLabel defaults: `text.secondary`, focused `primary.main`, error `error.main` | `--pie-text`; focused `--pie-primary`; error `--pie-incorrect-icon` | mui-palette |

**color.ts check** (`packages/lib-react/render-ui/src/color.ts`):
- Unregistered name, literal fallback: `keypadEmptyPlaceholder` (:166), a row above.
- Unregistered name chained to a registered token, so themed: `primaryText` (:105) and `secondaryText` (:112) → `--pie-text`. `tableGrid` (:127) → `--pie-text`. `tableGridLight` (:128) → `--pie-border-light`. `tableStripe` (:129) → `--pie-background-dark`. `keypadButton`, `keypadButtonOperator`, `keypadButtonHover`, `keypadButtonOperatorHover` (:163-169) → color-mix over `--pie-background`. `editorToolbar` (:171) has no name of its own and is a color-mix over `--pie-background`. `keyBoardFocusIndicator` (:172) is a deprecated alias of `focusOutline`, the THEMING.md focus chain. `keypadInk` has no name of its own and scales `--pie-text` towards black.
- Pure literal: `visualElementsColors` (:176-182), which is a row above. `transparent()` (:133) returns `transparent` and is no gap. The exported `defaults` object (:5-75) is a literal wherever it is read directly; those reads are recorded per package, for example `plot/src/root.tsx:53,82,99`.
- Registered, but the elements-ng presets never emit it, so the literal fallback renders under element-theme light and dark: `buttonFocusOutline` (:139) → `#3B82F6`, `buttonBorder` (:173) → `rgba(0, 0, 0, 0.23)`, `buttonHoverBg` (:174) → `rgba(0, 0, 0, 0.08)`. Recorded under shared/theming.
- `white()` and `black()` (:131-132) read registered names, which are absolute under the elements-ng dark preset and the DaisyUI mapping. Their use sites are recorded per package.
- Registered, with a fallback under the contrast minimum, so no row: `defaults.CORRECT` green[500] `#4caf50` (2.78:1 on white) and `defaults.INCORRECT` orange[500] `#ff9800` (2.16:1), the no-theme values of `correct()` and `incorrect()`. They fail under no theme in mask-markup `blank.tsx:61-66` (blank border), `constructed-response.tsx:24-29` (response-box border), `dropdown.tsx:78-81` (`.disabledCorrect` border) and `:159,176` (badge), and in the Feedback fills above. The fallbacks take `#208537` (4.70:1) and `#a65f00` (4.93:1).
- `background()` falls back to `rgba(255,255,255,0)`, so a `--pie-background` Should-take that replaces an opaque white uses `pieVar('background', defaults.WHITE)`, as mask-markup `dropdown.tsx:95` does.

**createTheme check:** `ui-layout.tsx:7` themes `typography.fontFamily`, `action.disabled` (a literal) and `MuiButton.contained` (literals). Every other palette and shadow entry is left at the MUI default: first row above. The other `createTheme` is `config-ui/src/layout/config-layout.tsx`, under `packages/lib-react/config-ui`.

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
| legend correctness glyph: select-text | delivery | `packages/lib-react/text-select/src/legend.tsx:53` | color | `color.white()` | `--pie-background`, in the same opaque form | absolute-white-black |
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
| rotation debug anchor (only with `showAnchor`): no src consumer | delivery | `packages/lib-react/tools/src/rotatable.tsx:19-20,29` | SVG stroke, fill | `green`, `white` | `--pie-primary`, `--pie-background` | svg-marks |

### `packages/lib-svelte/config-ui-svelte`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| settings panel checkbox and radio focus: simple-cloze, venn-classification | author | `packages/lib-svelte/config-ui-svelte/src/SettingsPanel.svelte:129` | outline | `var(--pie-focus-outline, #1a73e8)`. `--pie-focus-outline` is planned and excluded, so `#1a73e8` renders in every scheme | THEMING.md focus chain | focus-ring |

### `packages/lib-svelte/delivery-events`

No gaps. It holds event helpers only and renders no UI.

### `packages/lib-svelte/editable-html-tiptap-svelte`

All rows render in the simple-cloze and venn-classification authoring editors. The stylesheet's comment says its fallbacks are "render-ui's defaults for the same token". The rows are the rules that read no token.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| editor frame: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:618` | border | `1px solid #ccc` | `--pie-border-light` | literal-border |
| formatting toolbar: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:653` | background | `var(--editable-html-toolbar-bg, #efefef)`. No host sets it | `color.editorToolbar()`'s color-mix over `--pie-background`, as the React editor does (`lib-react/editable-html-tip-tap/src/constants.ts:8`) | private-hook-literal |
| toolbar and align-menu elevation: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:657-660,784-787` | box-shadow | `rgba(0, 0, 0, 0.2/0.14/0.12)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| toolbar buttons (rest, hover, disabled hover): simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:693,715,728` | color | `grey !important`, hover `black`, disabled hover `grey` | `--pie-disabled`; hover `--pie-text` | literal-text |
| toolbar button focus: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:719,700` | outline | `2px solid #666`. It never renders: `outline: none !important` at :700 wins, so the toolbar buttons show no focus indicator | THEMING.md focus chain, and drop the `!important` reset | focus-ring |
| active toolbar button text on `--pie-primary`: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:733` | color | `var(--pie-white, #ffffff)` | `--pie-background` | absolute-white-black |
| toolbar Done check: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:746,757` | color, hover background | `var(--editable-html-toolbar-check, #00bb00)`, hover `rgba(0, 187, 0, 0.08)` | `var(--editable-html-toolbar-check, --pie-correct-icon)`, as the React done button does (`lib-react/editable-html-tip-tap/src/components/common/done-button.tsx:21`); hover a color-mix of it | private-hook-literal |
| text-align menu: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:780` | background | `var(--pie-white, #ffffff)` | `--pie-dropdown-background` | absolute-white-black |
| text-align menu button hover: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:805-806` | color, background | `var(--pie-black, #000000)`, `rgba(0, 0, 0, 0.04)` | `--pie-text`, `--pie-background-dark` | absolute-white-black |
| inline code: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:871,873` | background, color | `rgba(88, 5, 255, 0.05)`, `#2e2b29` | `--pie-secondary-background`, `--pie-text` | literal-surface |
| code block: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:879,881` | background, color | `#2e2b29`, `#fff` | `--pie-text` and `--pie-background` (inverted block) | literal-surface |
| blockquote rule and horizontal rule: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:895,902` | border | `rgba(61, 37, 20, 0.12)`, `rgba(61, 37, 20, 0.08)` | `--pie-border-light` | literal-border |
| table grid, unbordered tables: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:922,935` | border | `#dfe2e5` | `--pie-border-light` (render-ui `tableGridLight` chain) | literal-border |
| table grid, `border="1"` tables: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:939,944` | border | `var(--pie-black, #000000)` | `--pie-text` (render-ui `tableGrid` chain) | absolute-white-black |
| selected table cell: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:948` | background | `rgba(200, 200, 255, 0.4)` | `--pie-focus-checked` | literal-surface |
| empty-editor placeholder: simple-cloze, venn-classification | author | `packages/lib-svelte/editable-html-tiptap-svelte/src/EditableHtml.svelte:955` | color | `#adb5bd` | `--pie-disabled-text` | literal-text |

### `packages/lib-svelte/media-svelte`

No gaps. Transcript.svelte reads only registered tokens. Its focus chain (:93-94) ends at `--pie-focus-checked-border` with no literal.

### `packages/shared/math-rendering-mathjax`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| MathJax context menu (right-click or menu key on rendered math): every element that renders math (nearly all React elements, simple-cloze, venn-classification, element-player) | shared | `packages/shared/math-rendering-mathjax/src/adapter.ts:282`; `src/engine/bundled/mathjax.ts:26,147` | background, color, border, box-shadow, hover | The bundled mj-context-menu stylesheet: `white` background, `black` text, `#CCCCCC` border, `0px 10px 20px #808080` shadow, hover `#606872` with `white` text. It switches only on `prefers-color-scheme: dark` | `--pie-dropdown-background`, `--pie-text`, `--pie-border-light`, hover `--pie-primary`/`--pie-background`; shadow `--pie-shadow` (a stylesheet override; the adapter passes no menu styling) | literal-surface |
| MathJax speech, braille, magnifier and tooltip region shadows (after a student turns one on from the menu): same elements | shared | `@mathjax/src` 4.1.3 `mjs/a11y/explorer/Region.js:121,169,188,209,498,509` | box-shadow | `#888`; `#000` under `prefers-color-scheme: dark`. The explorer stylesheet (`src/explorer-styles.ts`) themes the highlight, selection outline and region colours and leaves the shadows | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/shared/theming`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| every `--pie-white`/`--pie-black` and `color.white()`/`black()` surface under `pie-element-theme` dark (every pie-elements-ng `absolute-white-black` row) | shared | `packages/shared/theming/src/pie-themes.ts:181-182` | `--pie-black`, `--pie-white` | `'#000000'`, `'#ffffff'` | invert as pie-players does: `--pie-white` = base-100 `#1a202c`, `--pie-black` = base-content `#e2e8f0` | absolute-white-black |
| registered button tokens under element-theme light and dark: categorize, image-cloze-association and match-list focus borders (`buttonFocusOutline` → `#3B82F6`); graphing toggle-bar and undo-redo (`buttonBorder`/`buttonHoverBg` → `rgba(0, 0, 0, 0.23)`/`rgba(0, 0, 0, 0.08)`) | shared | `packages/shared/theming/src/constants.ts:81-393` | `--pie-button-*` | not in `DEFAULT_CSS_MAPPINGS`, so the readers' literal fallbacks render | emit all eight from the presets: `button-focus-outline` = `focus-checked-border`, `button-border` = `border`, `button-hover-bg` = `background-dark`, and so on | preset-coverage |
| private colour hooks emitted as fixed preset values: likert and matrix choice inputs (`--choice-input-*`), render-ui Feedback, match-list and multiple-choice (`--feedback-*-bg-color`), number-line, graphing and graphing-solution-set (`--arrow-color`, `--tick-color`, `--line-stroke`, `--point-fill`, `--point-stroke`), correct-answer-toggle (`--correct-answer-toggle-label-color`), extended-text-entry (`--before-border-color`) | shared | `packages/shared/theming/src/pie-themes.ts:93-104,185-196`; `src/constants.ts:304-386` | 14 non-`--pie-*` variables | a literal per preset. No pie-players scheme sets them, so element fallbacks render there | derive each from its `--pie-*` role, for example `--feedback-correct-bg-color` = `--pie-correct-secondary`, `--choice-input-color` = `--pie-text`, `--point-stroke` = `--pie-background`; or retire the hook for the token | private-hook-literal |

**Emitted vs registry check.** `generateCssVariables` (css-variables.ts:19) emits every entry of `DEFAULT_CSS_MAPPINGS` (constants.ts:81-393, 57 variables). An absent theme key falls back to `PIE_COLOR_DEFAULTS`. So the light preset, the dark preset and the DaisyUI mapping all emit the same 57 names.
- Emitted, unregistered: `--pie-primary-text` (constants.ts:389). Its only reader, render-ui `primaryText()`, chains to `--pie-text`. Register it, or drop the mapping.
- Emitted, not `--pie-*`: the 14 private hooks in the last row, plus the non-colour `--before-right`, `--before-top` and `--before-border-width`.
- Registered required, not emitted (13): `--pie-button-active-bg`, `--pie-button-bg`, `--pie-button-border`, `--pie-button-color`, `--pie-button-focus-outline`, `--pie-button-hover-bg`, `--pie-button-hover-border`, `--pie-button-hover-color`, `--pie-content-emphasis`, `--pie-fixed-hue-collapse`, `--pie-annotation-underline`, `--pie-annotation-underline-dark`, `--pie-tool-annotation-toolbar-border`. In elements-ng src only `button-focus-outline`, `button-border` and `button-hover-bg` have readers (row above). The other ten have none.
- Registered optional, not emitted (17), all pie-players component tokens: `--pie-answer-eliminator-strike-color`, `--pie-calculator-series-1`…`6`, `--pie-passage-header-background`, `--pie-section-player-card-header-background(-dark)`, `--pie-section-player-tab-{active-background,active-color,background,color}`, `--pie-tool-trigger-active-{background,border-color,color}`.
- Emitted and `excluded` or `planned`: none. `--pie-focus-outline` is not emitted, which matches the registry.

### `packages/element-player`

The player's consumers are `apps/element-demo` and `apps/element-a11y-demo`. `src/index.ts:13` loads Tailwind and DaisyUI 5 (`app.css`) for the demo chrome.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| player loading message: element-demo, element-a11y-demo, any element | shared | `packages/element-player/src/players/PieElementPlayer.svelte:699` | color | `hsl(var(--bc) / 0.6)`. `--bc` is a DaisyUI 4 name, and the installed DaisyUI 5.5 defines no `--bc`, so the declaration is invalid and the text inherits | `--pie-disabled-text` | literal-text |
| player IIFE-build warning: same | shared | `packages/element-player/src/players/PieElementPlayer.svelte:705` | color | `#9a6700` | `--pie-missing` | status-colours |
| player error box: same | shared | `packages/element-player/src/players/PieElementPlayer.svelte:711-714` | background, border, color | `hsl(var(--er) / 0.1)`, `1px solid hsl(var(--er) / 0.3)`, `hsl(var(--er))`. `--er` is undefined under DaisyUI 5, so there is no fill and no border, and the text inherits | `--pie-incorrect-secondary`, `--pie-incorrect`, `--pie-text` | status-colours |
| player error detail block: same | shared | `packages/element-player/src/players/PieElementPlayer.svelte:720` | background | `#fff` | `--pie-background` | literal-surface |

### `packages/element-theme`

No gaps of its own. `theme-elements.ts:138-152` applies `generateCssVariables(getPieTheme(...))` plus overrides to itself or the document. What it emits is the shared/theming preset set above.

### `packages/element-theme-daisyui`

`pie-element-theme-daisyui` only overrides `resolveDataTheme` (`theme-element-daisyui.ts:4`), so it emits the elements-ng light/dark presets. `daisyUiToPieTheme` is exported (`index.ts:13`) with no caller in the repo. The rows apply wherever it is called.

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| every `--pie-white`/`--pie-black` surface under a DaisyUI-mapped theme | shared | `packages/element-theme-daisyui/src/convert.ts:74-75` | `black`, `white` | `'#000000'`, `'#ffffff'` | `white` = `base-100`, `black` = `base-content` | absolute-white-black |
| surface and readable-disabled text under a dark DaisyUI theme | shared | `packages/element-theme-daisyui/src/convert.ts:5-90` | `surface`, `disabled-text` | never derived, so `generateCssVariables` emits the light defaults `#E0E1E6` and `#545454` | derive from `base-200`/`base-300` and `base-content` | preset-coverage |
| graph point stroke and tick colour: number-line | shared | `packages/element-theme-daisyui/src/convert.ts:83,85,113-117` | `point-stroke`, `tick-color` | `'#ffffff'` whenever `isDarkTheme` is false. `isDarkTheme` parses only `rgb()`, and DaisyUI 5 themes are `oklch`, so every theme counts as light | `--pie-background` (base-100); dark detection that parses oklch and hex | svg-marks |

## pie-players inventory

In pie-players, `--pie-white` is the page colour in both base themes and all 10 schemes, so most `absolute-white-black` rows below are correct under pie-players' own themes and turn white under a theme that keeps `--pie-white` absolute, such as the elements-ng dark preset. The section-player scroll-hint fade is wrong under every scheme. No scheme sets the optional `--pie-tool-trigger-active-*` or `--pie-calculator-series-*` tokens, so their fallbacks render in every scheme.

### `packages/assessment-player`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| previous/next navigation button | delivery | `pie-players:packages/assessment-player/src/components/AssessmentPlayerDefaultElement.ts:847-853,887,894` | color | none set; UA `ButtonText` | `--pie-button-color` | ua-default |
| previous/next navigation button | delivery | `pie-players:packages/assessment-player/src/components/AssessmentPlayerDefaultElement.ts:847-853,887,894` | outline (`:focus-visible`) | none set; UA focus ring | `--pie-button-focus-outline` | focus-ring |

### `packages/assessment-toolkit`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| active toolbar button ink, on `--pie-primary` | delivery | `pie-players:packages/assessment-toolkit/src/components/ItemToolBar.svelte:2908` | color | `var(--pie-white, #fff)` | `--pie-background` (page colour on primary, the pairing the active tab pill uses) | absolute-white-black |
| tool shell header ink (non-NDS chrome), on `--pie-primary-dark` | delivery | `pie-players:packages/assessment-toolkit/src/components/ItemToolBar.svelte:2114` | `style.color` | `var(--pie-white, #fff)` | `--pie-background` | absolute-white-black |
| tool shell header control and close-button fills | delivery | `pie-players:packages/assessment-toolkit/src/components/ItemToolBar.svelte:1586,2232,2234` | `style.background` | `color-mix(in srgb, var(--pie-white, #fff) 10% / 8% / 18%, transparent)` | `color-mix` over `--pie-background` | absolute-white-black |
| tool shell resize grip | delivery | `pie-players:packages/assessment-toolkit/src/components/ItemToolBar.svelte:2418` | `style.background` | `linear-gradient(… rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.35) 60% …)` | `--pie-border-dark` | literal-border |
| tool shell header (focusable via `tabIndex = 0`) | delivery | `pie-players:packages/assessment-toolkit/src/components/ItemToolBar.svelte:2273` | outline (focus) | none set; UA focus ring | `--pie-button-focus-outline` | focus-ring |
| legacy `ThemeProvider` writing tokens on the document root | shared | `pie-players:packages/assessment-toolkit/src/services/ThemeProvider.ts:52-75,188-252` | 22 inline `--pie-*` colour tokens on `documentElement` (background, text, primary, tertiary, status, borders, focus-checked, 8 button tokens) | `DEFAULT_THEME` literals `#ffffff`, `#000000`, `#3f51b5`, `#146eb3`, `#4caf50`, with `errorColor: #ff9800` → `--pie-incorrect` and `warningColor: #d32f2f` → `--pie-missing` (hues swapped against their names); `HIGH_CONTRAST_THEME` literals. Applied in the constructor. | retire in favour of `pie-theme` and the colour schemes; inline writes beat any scheme set on `<html>`. No caller in packages or apps; public export at `src/index.ts:257` | legacy-theme-writer |
| student annotation highlight swatches (screen) | delivery | `pie-players:packages/assessment-toolkit/src/services/HighlightCoordinator.ts:399-419,455-467,511-523` | `::highlight()` background-color | unregistered `--pie-annotation-{yellow,green,blue,pink,orange}-highlight` → `rgba()` literals. The dark set is chosen by `@media (prefers-color-scheme: dark)`, so it follows the OS rather than the scheme, while the underline follows `data-theme` at 485-497. Hues are fixed on purpose: "fixed swatches a student chose" (443). | new token needed: `--pie-annotation-{yellow,green,blue,pink,orange}-highlight` (register as optional) — student highlight swatch; select the dark set from `data-theme` and dark schemes, as the underline does | unregistered-token |
| student annotation marks (print) | print | `pie-players:packages/assessment-toolkit/src/services/HighlightCoordinator.ts:553-559` | border-bottom-color, text-decoration-color | `#ffeb3b`, `#a6e1c5`, `#a7e0f6`, `#ff9fae`, `#ffa500`; underline `#000` | — ("becomes an underline that keeps its colour coding", 543-544) | intentional |

### `packages/item-player`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| item error banner | delivery | `pie-players:packages/item-player/src/PieItemPlayer.svelte:1918-1940` | border, background, color | `color-mix(var(--pie-incorrect…) var(--pie-fixed-hue-collapse, 0%), #d32f2f)`; `#ffebee`; `#c62828` | — ("Fixed red encoding, folded into the palette once a scheme asks for one") | intentional |
| session debugger panel | delivery | `pie-players:packages/item-player/src/ItemSessionDebugger.svelte:646` | box-shadow | `0 25px 50px -12px rgba(0, 0, 0, 0.25)` | `color-mix` over `--pie-black`, as the toolbar button shadow does (`ItemToolBar.svelte:2898`) | shadow |

### `packages/print-player`

No gaps.

### `packages/section-player`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| section split divider | delivery | `pie-players:packages/section-player/src/components/shared/SectionSplitDivider.svelte:151` | outline (`:focus-visible`) | `var(--pie-section-player-focus-outline, var(--pie-focus-outline, #146eb3))`; neither name is set by any scheme | `--pie-button-focus-outline` chained before the literal | focus-ring |
| section split divider handle (hover, focus, drag) | delivery | `pie-players:packages/section-player/src/components/shared/SectionSplitDivider.svelte:184,186` | background, box-shadow | same chain → `#146eb3`; glow `color-mix(… #146eb3 … 30%, transparent)` | `--pie-button-focus-outline` chained before the literal | focus-ring |
| section split divider grip line, on `--pie-blue-grey-600` handle | delivery | `pie-players:packages/section-player/src/components/shared/SectionSplitDivider.svelte:176` | background | `var(--pie-white, white)` | `--pie-background` | absolute-white-black |
| card split divider | delivery | `pie-players:packages/section-player/src/components/shared/SectionCardSplitDivider.svelte:167` | outline (`:focus-visible`) | `var(--pie-section-player-focus-outline, var(--pie-focus-outline, #146eb3))` | `--pie-button-focus-outline` chained before the literal | focus-ring |
| card split divider handle (hover, focus, drag) | delivery | `pie-players:packages/section-player/src/components/shared/SectionCardSplitDivider.svelte:185` | background | same chain → `#146eb3` | `--pie-button-focus-outline` chained before the literal | focus-ring |
| passage card (focus within content) | delivery | `pie-players:packages/section-player/src/components/shared/SectionPassageCard.svelte:393` | outline | same chain → `#146eb3` | `--pie-button-focus-outline` chained before the literal | focus-ring |
| media-gated item card | delivery | `pie-players:packages/section-player/src/components/shared/SectionItemsPane.svelte:918-919` | outline (`:focus-visible`) | same chain → `#146eb3` | `--pie-button-focus-outline` chained before the literal | focus-ring |
| scroll-hint fade, over the `--pie-background-dark` pane backdrop | delivery | `pie-players:packages/section-player/src/components/shared/SectionItemsPane.svelte:825` | background (gradient end) | `var(--pie-white, #fff)`, which fades to page colour over the backdrop under every scheme | `--pie-background-dark` | absolute-white-black |
| scroll-hint fallback button (non-NDS) | delivery | `pie-players:packages/section-player/src/components/shared/SectionItemsPane.svelte:867` | background | `var(--pie-white, #fff)` | `--pie-button-bg` | absolute-white-black |
| section tab | delivery | `pie-players:packages/section-player/src/components/shared/SectionPlayerTabbedContent.svelte:326` | outline (`:focus-visible`) | `var(--pie-focus-outline, #1d4ed8)` | `--pie-button-focus-outline` chained before the literal | focus-ring |
| active section tab pill | delivery | `pie-players:packages/section-player/src/components/shared/SectionPlayerTabbedContent.svelte:298-322` | background, color | `color-mix(var(--pie-primary…) var(--pie-fixed-hue-collapse, 0%), #1D7375)`; ink the same with `#ffffff` | — ("fixed brand hue … folded into that palette when one is") | intentional |

### `packages/players-shared`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| item error banner | delivery | `pie-players:packages/players-shared/src/components/PieItemPlayer.svelte:1285-1314` | border, background, color | the fixed-hue-collapse mix over `#d32f2f`, `#ffebee`, `#c62828` | — ("fixed red encoding … folded into the palette") | intentional |
| loading spinner scrim | delivery | `pie-players:packages/players-shared/src/components/PieSpinner.svelte:16` | background-color | `var(--pie-white, #fff)` | `--pie-background` | absolute-white-black |
| vendored NDS icon button (glyph, fill, hover ring, focus ring) | shared | `pie-players:packages/players-shared/src/components/vendor/nds/nds-icon-button.js:661-736,773` | color, background, border, box-shadow, outline | `--color-interactive-blue` → `#146eb3`, `--color-new-gray` → `#f3f5f7`, `--color-primary-white` → `#ffffff`, `--color-primary-black` → `#000000`, `--color-focus-blue` → `#2b87ff`. Latent: every consumer bridges these to `--pie-*` (`ItemToolBar.svelte:2056-2066,2847-2858`, `SectionItemsPane.svelte:848-853`, tool-tts-inline), enforced by `scripts/check-theme-tokens.mjs`. | bridge the hooks inside the component to `--pie-button-color`, `--pie-background-dark`, `--pie-white`, `--pie-text`, `--pie-button-focus-outline`, so an unbridged consumer stays themed | private-hook-literal |

### `packages/theme`

All 54 `required` registry tokens are defined in each of the 10 schemes in `color-schemes.css`; no scheme sets an `optional` token. Both base blocks in `tokens.css` define the same 54 plus `--pie-font-scale`, so nothing there bypasses the schemes. The remaining gaps are in `components.css`:

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| content loading scrim (`.pie-loading`) | delivery | `pie-players:packages/theme/src/components.css:31` | background-color | `var(--pie-white, #fff)` | `--pie-background` | absolute-white-black |
| legacy content table cell (`.kds-verdana2t`, `.Verdana2t`) | delivery | `pie-players:packages/theme/src/components.css:526,536` | border | `1px solid var(--pie-white, white)` | `--pie-background` | absolute-white-black |
| answer-eliminator toggle | delivery | `pie-players:packages/theme/src/components.css:756` | background | `var(--pie-white, #fff)` | `--pie-button-bg` | absolute-white-black |
| answer-eliminator toggle (active), on `--pie-incorrect` | delivery | `pie-players:packages/theme/src/components.css:781` | color | `var(--pie-white, #fff)` | `--pie-background` | absolute-white-black |
| answer-eliminator image strike casing | delivery | `pie-players:packages/theme/src/components.css:839-844` | stroke | unregistered `--pie-answer-eliminator-image-strike-casing-color` → `rgba(255, 255, 255, 0.85)` | — ("so the X stays legible on dark imagery") | intentional |

`daisyui-mapping.ts:178-179` maps `--pie-white` to `base-100` but `--pie-black` to `neutral-content`, which is light in DaisyUI light themes. Under DaisyUI, the shadows mixed from `--pie-black` (`ItemToolBar.svelte:2898`, `OverlayPlacementControls.svelte:71`) therefore render light.

### `packages/default-tool-loaders`

No gaps. It renders only an unstyled audio-transcript region with a `currentColor` icon; the tool UIs are under the `tool-*` packages below.

### `packages/tool-annotation-toolbar`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| highlight colour swatches | delivery | `pie-players:packages/tool-annotation-toolbar/tool-annotation-toolbar.svelte:97,102,107,112,902` | inline `background-color` | `#fde995`, `#ff9fae`, `#a7e0f6`, `#a6e1c5` | new token needed: register `--pie-annotation-{yellow,pink,blue,green}-highlight`, the names the `::highlight` rules already read (`pie-players:packages/assessment-toolkit/src/services/HighlightCoordinator.ts:399-419`) | literal-surface |
| toolbar and swatch-hover elevation | delivery | `pie-players:packages/tool-annotation-toolbar/tool-annotation-toolbar.svelte:1068,1088` | box-shadow | `rgb(0 0 0 / 0.3)`, `rgb(0 0 0 / 0.15)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/tool-answer-eliminator`

No gaps. The strike reads the registered `--pie-answer-eliminator-strike-color`, then `--pie-incorrect` (`strikethrough-strategy.ts:200`). The toggle and strike styles live in `pie-players:packages/theme/src/components.css:743-921` (under `packages/theme` above): toggle surface `var(--pie-white, #fff)` (~756), active ink `var(--pie-white)` on `--pie-incorrect` (~781), and the unregistered `--pie-answer-eliminator-image-strike-casing-color` with fallback `rgba(255, 255, 255, 0.85)` (~842-843).

### `packages/tool-calculator-shared`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| calculator shell, container and loading scrim | delivery | `pie-players:packages/tool-calculator-shared/CalculatorTool.svelte:278,295,313` | background | `var(--pie-white, white)`; `color-mix(in srgb, var(--pie-white, #fff) 90%, transparent)` | `--pie-background` (comment at 288-294 relies on the token inverting "by design") | absolute-white-black |
| inline trigger hover elevation | delivery | `pie-players:packages/tool-calculator-shared/CalculatorInlineTool.svelte:211` | box-shadow | `rgb(0 0 0 / 10%)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| inline trigger active ink | delivery | `pie-players:packages/tool-calculator-shared/CalculatorInlineTool.svelte:224-227,240-243` | color | fallback `color-mix(in srgb, var(--pie-background) var(--pie-fixed-hue-collapse, 0%), white)`, which is `white` in base themes (white on `#ffff00` in base dark) | new token needed: `--pie-on-primary` — ink on a `--pie-primary` fill | literal-text |

### `packages/tool-calculator-cortex`

No gaps. A style-free wrapper over tool-calculator-shared.

### `packages/tool-calculator-desmos`

No gaps. A style-free wrapper over tool-calculator-shared.

### `packages/tool-calculator-geogebra`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| GeoGebra attribution chip | delivery | `pie-players:packages/tool-calculator-geogebra/tool-calculator-geogebra.svelte:89-90` | background, color | `rgb(255 255 255 / 88%)`, `#334155` | `--pie-background`, `--pie-text` | literal-surface |

### `packages/tool-calculator-inline-cortex`

No gaps. A style-free wrapper over tool-calculator-shared's CalculatorInlineTool.

### `packages/tool-calculator-inline-desmos`

No gaps. A style-free wrapper over tool-calculator-shared's CalculatorInlineTool.

### `packages/tool-calculator-inline-geogebra`

No gaps. A style-free wrapper over tool-calculator-shared's CalculatorInlineTool.

### `packages/calculator`

No gaps. Type and provider interfaces only.

### `packages/calculator-cortex`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| calculator card and display surface | delivery | `pie-players:packages/calculator-cortex/src/CalculatorView.svelte:397-400,660` | background | `var(--pie-calculator-surface, var(--pie-white, var(--cortex-surface)))`; `--pie-calculator-surface` is unregistered (comment at 413-419 rejects `--pie-background` as possibly translucent) | `--pie-background`, or register `--pie-calculator-surface` | absolute-white-black |
| angle-mode segment and layer tab, active ink | delivery | `pie-players:packages/calculator-cortex/src/CalculatorView.svelte:622,848` | color | `var(--pie-white, var(--cortex-on-primary))` on `--pie-primary` | new token needed: `--pie-on-primary` — ink on a `--pie-primary` fill | absolute-white-black |
| commit key ink | delivery | `pie-players:packages/calculator-cortex/src/Keypad.svelte:300` | color | `var(--pie-white, var(--cortex-on-primary))` on `--pie-primary` (comment at 296-299: "inverts by design") | new token needed: `--pie-on-primary` | absolute-white-black |
| graph layer tab, active ink | delivery | `pie-players:packages/calculator-cortex/src/GraphView.svelte:923` | color | `var(--pie-white, var(--cortex-on-primary))` on `--pie-primary` | new token needed: `--pie-on-primary` | absolute-white-black |
| MathLive input caret, selection, contains-highlight, placeholder | delivery | `pie-players:packages/calculator-cortex/src/MathFieldInput.svelte:168-189` | `--caret-color`, `--selection-background-color`, `--selection-color`, `--contains-highlight-background-color`, `--placeholder-color` | unset, so MathLive's blue `--hue` defaults render | `--pie-text`, `--pie-faded-primary`, `--pie-text`, `--pie-surface`, `--pie-disabled-text` | embed-defaults |

### `packages/calculator-desmos`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| Desmos calculator embed | delivery | `pie-players:packages/calculator-desmos/src/desmos-provider.ts:339-348,378-392` | Desmos `invertedColors` (all three calculators), `colors` (graphing) | never set from the theme, so the embed stays light under dark schemes | `invertedColors` from the active scheme's darkness; `colors` from `--pie-calculator-series-1…6` | embed-defaults |

### `packages/calculator-geogebra`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| GeoGebra applet border and graphics view | delivery | `pie-players:packages/calculator-geogebra/src/geogebra-provider.ts:72,333-352` | `borderColor` parameter; `api.setGraphicsOptions` bgColor, gridColor, axesColor | `borderColor` only from host settings; `appletOnLoad` never calls `setGraphicsOptions` | `--pie-border`; `--pie-background`, `--pie-blue-grey-300`, `--pie-text` | embed-defaults |

### `packages/tool-color-scheme`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| scheme dropdown elevation | delivery | `pie-players:packages/tool-color-scheme/tool-color-scheme.svelte:444` | box-shadow | `rgba(0, 0, 0, 0.15)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| scheme preview swatches | delivery | `pie-players:packages/tool-color-scheme/tool-color-scheme.svelte:274-276,322-324,498,504,514` | inline background, color, border | each scheme's own bg, text and primary from scheme data | — ("previews each scheme's own colours" (inline from scheme data; no comment)) | intentional |

### `packages/tool-dictionary`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| lookup submit button | delivery | `pie-players:packages/tool-dictionary/tool-dictionary.svelte:287-288` | background, color | `var(--pie-background-light, #f9fafb)` (excluded, so `#f9fafb` in every scheme) with `color: inherit` | `--pie-button-bg`, `--pie-button-color` | unregistered-token |

### `packages/tool-picture-dictionary`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| lookup submit button | delivery | `pie-players:packages/tool-picture-dictionary/tool-picture-dictionary.svelte:289-290` | background, color | `var(--pie-background-light, #f9fafb)` (excluded, so `#f9fafb` in every scheme) with `color: inherit` | `--pie-button-bg`, `--pie-button-color` | unregistered-token |

### `packages/tool-graph`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| toolbar tool-button ink, transparency label and hover/active washes | delivery | `pie-players:packages/tool-graph/tool-graph.svelte:638,642,648,674` | color, background | `var(--pie-white)`; `color-mix(--pie-white 20%/30%)` on a `--pie-primary-light` bar (~2.2:1 in base light) | `--pie-text`, with the bar on `--pie-surface` | absolute-white-black |
| transparency range input | delivery | `pie-players:packages/tool-graph/tool-graph.svelte:683-686` | accent-color | unset, so the UA accent renders | `accent-color: var(--pie-primary)` | native-control-default |

### `packages/tool-line-reader`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| masking frame | delivery | `pie-players:packages/tool-line-reader/tool-line-reader.svelte:671` | background | `var(--pie-tool-line-reader-frame-color, #000)` (excluded) | — ("stays a dark scrim in every colour scheme") | intentional |
| control glyphs on the frame | delivery | `pie-players:packages/tool-line-reader/tool-line-reader.svelte:717` | color | `var(--pie-tool-line-reader-control-color, #fff)` (excluded) | — ("stay white in every scheme" (paired with the scrim)) | intentional |

### `packages/tool-periodic-table`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| active category badge ink | delivery | `pie-players:packages/tool-periodic-table/tool-periodic-table.svelte:405` | color | `var(--pie-white)` on `--pie-primary-dark` | new token needed: `--pie-on-primary` — ink on a primary fill | absolute-white-black |
| element category fills and ink | delivery | `pie-players:packages/tool-periodic-table/tool-periodic-table.svelte:654-658,662-666,670-779` | background, color | fixed category hues, collapsed to scheme tokens by `--pie-fixed-hue-collapse` | — ("fixed data encoding") | intentional |

### `packages/tool-protractor`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| protractor marks and plate | delivery | `pie-players:packages/tool-protractor/protractor.svg:2-293` (loaded by `<img>` at `tool-protractor.svelte:148-153`) | SVG fill, stroke | `stroke="black"`, `fill="black"`; plate `fill="white" fill-opacity="0.1"`; CSS cannot reach an `<img>` | `--pie-text` for marks, `--pie-background` for the plate (needs inline SVG or a mask) | svg-marks |

### `packages/tool-ruler`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| centimetre ruler marks and plate | delivery | `pie-players:packages/tool-ruler/ruler-cm.svg:2-280` (loaded by `<img>` at `tool-ruler.svelte:169-176`) | SVG fill, stroke | `black` marks, `white` plate, over a 90% `--pie-background` container (`tool-ruler.svelte:280`), so ticks vanish on dark schemes | `--pie-text` for marks, `--pie-background` for the plate (needs inline SVG or a mask) | svg-marks |
| inch ruler marks and plate | delivery | `pie-players:packages/tool-ruler/ruler-inches.svg:2-93` (loaded by `<img>` at `tool-ruler.svelte:169-176`) | SVG fill, stroke | `black` marks, `white` plate | `--pie-text` for marks, `--pie-background` for the plate (needs inline SVG or a mask) | svg-marks |
| active unit button ink | delivery | `pie-players:packages/tool-ruler/tool-ruler.svelte:330` | color | `var(--pie-white, #fff)` on `--pie-primary` | new token needed: `--pie-on-primary` — ink on a primary fill | absolute-white-black |

### `packages/tool-sign-language`

No gaps. The video frame reads `--pie-blue-grey-900`; the caption's unregistered `--pie-text-light` chains to `--pie-text`.

### `packages/tool-text-to-speech`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| TTS panel elevation | delivery | `pie-players:packages/tool-text-to-speech/tool-text-to-speech.svelte:488` | box-shadow | `rgb(0 0 0 / 0.1)`, `rgb(0 0 0 / 0.05)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| header ink, close button ink and washes, primary play button ink | delivery | `pie-players:packages/tool-text-to-speech/tool-text-to-speech.svelte:505,522,524,538,668` | color, background | `var(--pie-white)` and washes over it on `--pie-primary-dark` / `--pie-primary` | new token needed: `--pie-on-primary` — ink on a primary fill | absolute-white-black |
| rate and volume range inputs | delivery | `pie-players:packages/tool-text-to-speech/tool-text-to-speech.svelte:612-634` | thumb and track colour | only `::-webkit-slider-thumb` is styled; Gecko `::-moz-range-thumb` and `::-moz-range-track` keep UA colours | `accent-color: var(--pie-primary)`, or moz pseudo-elements on `--pie-primary` and `--pie-secondary-background` | native-control-default |

### `packages/tool-tts-inline`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| trigger and speed-menu elevation | delivery | `pie-players:packages/tool-tts-inline/tool-tts-inline.svelte:1404,1585` | box-shadow | `color-mix(… var(--pie-shadow, #000) 14% …)`; `var(--pie-tts-menu-shadow, 0 1px 5px 0 rgba(0, 0, 0, 0.3))`; both tokens unregistered | register `--pie-shadow` — elevation shadow colour | shadow |
| NDS bridge on-accent glyph | delivery | `pie-players:packages/tool-tts-inline/tool-tts-inline.svelte:1339` | `--color-primary-white` | `var(--pie-white, #ffffff)` | new token needed: `--pie-on-primary` — ink on a primary fill | absolute-white-black |

### `packages/tts`

No gaps. Client interfaces only; renders nothing.

### `packages/section-player-tools-shared`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| floating debug panel elevation | debug | `pie-players:packages/section-player-tools-shared/SharedFloatingPanel.svelte:279` | box-shadow | `rgba(0, 0, 0, 0.25)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| debug panel toggle buttons | debug | `pie-players:packages/section-player-tools-shared/DebugPanelToggles.svelte:35-36,49-50,64-65,81-82` | background, border, color | DaisyUI `btn btn-sm btn-outline btn-square`, `btn-active` (DaisyUI `--color-*`, which no colour scheme sets) | `--pie-button-bg`, `--pie-button-border`, `--pie-button-color`, `--pie-button-active-bg` | daisyui-classes |

### `packages/section-player-tools-session-debugger`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| session panel elevation | debug | `pie-players:packages/section-player-tools-session-debugger/SectionSessionPanel.svelte:362` | box-shadow | `rgba(0, 0, 0, 0.25)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/section-player-tools-pnp-debugger`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| PNP panel elevation | debug | `pie-players:packages/section-player-tools-pnp-debugger/PnpPanel.svelte:399` | box-shadow | `rgba(0, 0, 0, 0.25)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |

### `packages/section-player-tools-event-debugger`

No gaps.

### `packages/section-player-tools-instrumentation-debugger`

No gaps.

### `packages/section-player-tools-tts-settings`

| Surface | View | Location | Property | Current | Should take | Cluster |
| --- | --- | --- | --- | --- | --- | --- |
| modal backdrop | debug | `pie-players:packages/section-player-tools-tts-settings/TtsSettingsPanel.svelte:2401` | background | `color-mix(in srgb, #000 30%, transparent)` | new token needed: `--pie-scrim` — modal backdrop | literal-surface |
| dialog elevation | debug | `pie-players:packages/section-player-tools-tts-settings/TtsSettingsPanel.svelte:2418` | box-shadow | `rgba(0, 0, 0, 0.22)` | new token needed: `--pie-shadow` — elevation shadow colour | shadow |
| settings fieldsets | debug | `pie-players:packages/section-player-tools-tts-settings/TtsSettingsPanel.svelte:2015,2107,2150,2233,2290,2315` | background, border | DaisyUI `bg-base-200 border-base-300` | `--pie-surface`, `--pie-border` | daisyui-classes |
| select, input, textarea and toggle controls | debug | `pie-players:packages/section-player-tools-tts-settings/TtsSettingsPanel.svelte:2020,2036,2061,2112,2153,2161,2171,2185,2197,2208,2216,2225,2236,2244,2254,2268,2281,2342` | background, border, color | DaisyUI `select`, `input`, `textarea`, `toggle` | `--pie-button-bg`, `--pie-border`, `--pie-text`, `--pie-primary` (toggle on) | daisyui-classes |
| action buttons | debug | `pie-players:packages/section-player-tools-tts-settings/TtsSettingsPanel.svelte:1994,2048,2076-2077,2088,2095,2321-2322,2330-2331,2346,2382,2384,2390` | background, border, color | DaisyUI `btn*`, `btn-active`, `btn-primary` (2390), `loading` (2088) | `--pie-button-*`; `--pie-primary` for the primary button | daisyui-classes |
| status alerts | debug | `pie-players:packages/section-player-tools-tts-settings/TtsSettingsPanel.svelte:2101,2369,2372,2375,2378` | background, color | DaisyUI `alert-warning` (2101), `alert-success` (2369), `alert-error` (2372, 2375), `alert-info` (2378) | `--pie-missing`, `--pie-correct`, `--pie-incorrect`, `--pie-tertiary`, with their `-secondary` variants | daisyui-classes |

## Defects found in passing

Not colour gaps, or not only colour gaps. They were found by reading the code and have not been observed in production.

- `packages/lib-react/render-ui/src/feedback.tsx:14-16`: `FeedbackContainer` never gets the `.incorrect` class, so its `#946202` rule is dead.
- `packages/lib-react/render-ui/src/color.ts:176`: `visualElementsColors` has no `AXIS_TICK_COLOR`, which `packages/lib-react/charting/src/axes.tsx:61,63` reads, so those declarations are dropped.
- `packages/lib-react/render-ui/src/ui-layout.tsx:13`: the `action.disabled` value carries a trailing `;` inside the string.
- `packages/shared/theming/src/pie-themes.ts:23-105`: the light preset has no `blue-grey-600`, so it emits the `PIE_COLOR_DEFAULTS` value `#7E8494`.
- `packages/shared/theming/src/constants.ts:65-70`: the `PIE_COLOR_DEFAULTS` hook fallbacks `TICK_COLOR`, `LINE_STROKE`, `POINT_STROKE` and `CORRECT_ANSWER_TOGGLE_LABEL_COLOR` are `#ffffff`, so a custom theme without those keys draws white ticks, lines and labels on a white page.
- `packages/elements-react/multi-trait-rubric/src/delivery/trait.tsx:14`: the NoDescription text is painted with `color.secondaryBackground()`, a surface token, near 1.1:1. It should read `--pie-disabled-text`.
- `packages/lib-react/render-ui/src/preview-prompt.tsx:130-210`: with `customAudioButton` set, the prompt's audio element is hidden and the play button is a `div` with a click listener and no `tabindex`, role or key handler, so prompt audio cannot be played from the keyboard (WCAG 2.1.1). It reaches categorize, drag-in-the-blank, hotspot, image-cloze-association and multiple-choice.
- `packages/lib-react/charting/src/actions-button.tsx:83-85`: the Actions trigger is `role="button" tabIndex={0}` with `onClick` only, so Enter and Space do not open the menu (WCAG 2.1.1).
- `packages/lib-react/graphing-solution-set/src/tools/shared/point/base-point.tsx:102`: the circle's inline `fill: color.defaults.BLACK` beats the group's correctness fills at `:22-33`, so points never show correctness; only the polygon stroke does.
- `packages/lib-react/charting/src/line/common/drag-handle.tsx:32-37`: no element under `charting/src/line` carries `.correctIcon` or `.incorrectIcon`, so both rules are dead.
- `pie-players:packages/section-player/src/components/shared/SectionPlayerTabbedContent.svelte:310-312`: the comment says the light base theme's `--pie-background` is transparent; `pie-players:packages/theme/src/tokens.css:8` defines it as `#ffffff`.
- `pie-players:packages/theme/src/daisyui-mapping.ts:178-179`: `--pie-white` maps to `base-100` but `--pie-black` to `neutral-content`, which is light in DaisyUI light themes, so shadows mixed from `--pie-black` render light under DaisyUI.

## Packages skipped

They render no themeable UI.

- pie-elements-ng: `packages/lib-react/test-utils` (test helpers); `packages/shared/{bundler-shared, configure-events, controller-utils, editor-runtime, feedback, lodash, player-events, test-utils, translator, types, utils}` (logic, types, i18n strings or build configuration).
- pie-players: `packages/pie-context` (context protocol); `packages/{tts-server-core, tts-server-google, tts-server-polly, tts-server-sc, tts-client-server}` (server-side TTS and its HTTP client).
