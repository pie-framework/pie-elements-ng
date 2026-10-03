# Math Rendering in pie-elements-ng

**Last Updated:** 2026-10-02

## Overview

Elements typeset math with MathJax 4.1.3 through `@pie-element/shared-math-rendering-mathjax`: TeX and MathML input, CommonHTML output. Its delimiters, macros and typesetting scope match the legacy `@pie-lib/math-rendering` renderer. The npm build loads MathJax's `tex-mml-chtml.js` into the page; the browser build, which element browser builds use, bundles a MathJax of its own (see [Builds](#builds)).

## Packages

1. **`@pie-element/shared-math-rendering-mathjax`** (`packages/shared/math-rendering-mathjax/`): the adapter. It exports the legacy API (`renderMath`, `wrapMath`, `unWrapMath`, `mmlToLatex`) and `createMathjaxRenderer` for players.
2. **`@pie-lib/math-rendering`** (`packages/lib-react/math-rendering/`): a wrapper that re-exports the legacy API from the adapter for code that imports the legacy package name.

Elements import `@pie-element/shared-math-rendering-mathjax` directly.

## Builds

The adapter has two builds with one API.

- **npm build**, `dist/index.js`, the `default` export condition: loads `tex-mml-chtml.js` and runs on `window.MathJax`. Element npm entries resolve it, and with them the IIFE bundles built from those entries and hosts that bundle the elements themselves.
- **Browser build**, `dist/browser/index.js`, the `pie-browser-esm` export condition: bundles MathJax, built from the `@mathjax/src` modules, as a module-private instance. Element browser builds (`./browser/*`) resolve it through that condition, which `tools/vite/element-browser.config.ts` and `tools/vite/svelte-element-browser.config.ts` set. It neither reads nor writes `window.MathJax`, so a host's MathJax of any version, and every other element's copy, runs beside it.

The browser build's engine loads as a chunk on the first render: about 1.3 MB minified, 320 kB gzipped, with the CHTML font data. The font's dynamic ranges, about 1 MB in all, load as chunks when math first uses them. Its output is the npm build's, with these differences:

- SVG output and collapsible math are not bundled. Their menu items are disabled, and a stored menu setting that names either is overridden.
- `\require` is unsupported. The packages `tex-mml-chtml.js` autoloads are bundled, mhchem with its font extension.
- The font files and the speech worker load from jsDelivr at pinned versions: `@mathjax/mathjax-newcm-font@4.1.3`, `@mathjax/mathjax-mhchem-font-extension@4.1.3` and `@mathjax/src@4.1.3/bundle/sre`.
- `srcUrl` is ignored.
- Each copy's CHTML stylesheet has its own id, `PIE-MJX-CHTML-styles-<n>`. Another MathJax's `MJX-CHTML-styles` stylesheet matches every CHTML container, this build's included, so the adapter reports it as `foreign-output-stylesheet`.

Both builds pin one MathJax version: `mathjax`, `@mathjax/src` and the font packages are exact devDependencies at the same version, which a unit test checks.

## Renderer Resolution

`renderMath(element)` hands the element to the renderer at `window['@pie-lib/math-rendering']` when the page installs one with a `renderMath` function other than the adapter's own, which would call itself. Otherwise the adapter typesets the element itself.

- `@pie-players/pie-item-player` installs the legacy renderer under the `iife` strategy only, so ESM elements, loaded by the player under `esm` or registered by the host under `preloaded`, typeset through the adapter. A generated `@pie-players/pie-preloaded-player` build installs the legacy renderer in its own entry. A host installs its own renderer with `setMathRenderer` from `@pie-players/pie-players-shared/pie`.
- `@pie-element/element-player` uses a renderer the page installed before the player mounted. Otherwise it installs a renderer it creates with `createMathjaxRenderer`, which later players reuse. The player reads the global on every render, so its next render uses a renderer the host installs later.
- `apps/element-demo` installs the legacy MathJax 3 renderer from `@pie-lib/math-rendering-module` on `player=iife` pages, as `@pie-players/pie-item-player` does under `iife`, so IIFE pages run MathJax 3 and ESM pages MathJax 4.

## Loading

- MathJax loads on the first render, whatever the element holds, so later math does not wait on the download: the npm build loads `https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-mml-chtml.js`, the browser build its engine chunk. A render waits on the load only when its element holds a TeX delimiter or a `<math>` element.
- Element IIFE bundles each bundle their own copy of the npm build. The copies share one load per page, because a second MathJax startup on one page throws. Each element browser build starts its own MathJax.
- `startup.typeset` is `false`: MathJax typesets only the elements the renderer is given, never the host page's own text.
- On the npm build, a MathJax the page already has is used as the page configured it, and the adapter loads no copy of its own. A configuration object at `window.MathJax`, for a page that loads MathJax itself, is awaited through its `startup.ready`; a MathJax 3 or 4 build is used once its startup completes. The legacy macros and delimiters then apply only where the page's configuration defines them.
- On the npm build, a page runs one MathJax major version. MathJax 3 on the same page, from a host or from IIFE element bundles, is unsupported: the adapter still attempts to render and guarantees nothing. See [One MathJax version per page](https://github.com/pie-framework/pie-players/blob/develop/docs/item-player/loading-strategies.md#one-mathjax-version-per-page) for the failures observed.
- On the npm build, a MathJax global without `typesetPromise`, such as MathJax 2, leaves math untypeset and logs `[mathjax-renderer] MathJax on this page has no typesetPromise; math stays untypeset.`
- The first renderer to start MathJax on a page configures it, and every later renderer shares that instance. On the browser build this holds per copy.

## Content

**Delimiters:**

- Inline math: `\(...\)`
- Display math: `\[...\]` and `$$...$$`
- `\$` escapes a dollar sign.
- Environments such as `\begin{align}...\end{align}` typeset without delimiters.
- Single `$...$` stays text unless the page sets the legacy opt-in before the first `renderMath` call, `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`. The adapter then logs the legacy renderer's warning that single dollars are not advisable.

```html
<div>Inline: \(x^2 + y^2 = z^2\)</div>
<div>Display: \[E = mc^2\]</div>
```

**Math spans:** the adapter rewrites the LaTeX in each `[data-latex]` element as inline math and marks it handled, as the legacy renderer does, so math saved by the editors typesets whatever delimiters it was saved with. `\embed{newLine}[]` becomes `\newline`.

**Macros:** `\parallelogram`, `\overarc`, `\napprox`, `\longdiv`, and `\abs{x}` for an absolute value.

**MathML:** `<math>` elements typeset as MathML input, at display size (`displaystyle="true"`) as the legacy renderer sets it. A prefixed root such as `<mml:math>` typesets too. Elementary math, `mstack` and `mlongdiv`, is rewritten as the `mtable` it describes before MathJax reads it: MathJax 4 reads it only through its `mml3` extension, which depends on XSLT.

```html
<math>
  <mfrac>
    <msup><mi>x</mi><mn>2</mn></msup>
    <mn>2</mn>
  </mfrac>
</math>
```

**Line breaking:** displayed math wider than its container breaks to the container's width at typeset. Math typeset while hidden, or narrowed later, scrolls inside its own container.

## Accessibility

Each typeset expression carries hidden MathML (`mjx-assistive-mml`) for screen readers, and the MathJax context menu. The speech-rule-engine output is off: no semantic enrichment, no generated speech and no speech web worker, so no `worker-src blob:` CSP entry is needed. Math stays out of the tab order, so it offers no Tab or arrow-key exploration.

A student's menu choices are saved in localStorage under `PIE-MathJax-Menu-Settings`, a key MathJax 3 does not share, and apply on later loads. Hidden MathML is exempt: the renderer's configuration sets it on every load.

## Usage

### Element Developers

```typescript
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';

// After the element's DOM holds the content
await renderMath(this);
```

`renderMath` also accepts an HTML string and resolves with the typeset HTML.

### Player Developers

A player that installs its own renderer creates it with `createMathjaxRenderer`:

```typescript
import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';

const renderMath = createMathjaxRenderer({
  srcUrl: 'https://assets.example.com/mathjax/4.1.3/tex-mml-chtml.js',
});

window['@pie-lib/math-rendering'] = { renderMath };
await renderMath(container);
```

Options, which apply only when this renderer is the one that loads MathJax:

- `useSingleDollar` (default `false`): treat `$...$` as inline math.
- `accessibility` (default `true`): add the hidden MathML and the context menu.
- `loadFonts` (default `true`): load MathJax's fonts.
- `srcUrl`: the MathJax script URL, by default MathJax 4.1.3 `tex-mml-chtml.js` on jsDelivr. The browser build ignores it.

## Authoring Tools

React author views use `@pie-lib/editable-html-tip-tap` (`packages/lib-react/editable-html-tip-tap`). Its TipTap math extension edits math with MathQuill through `@pie-lib/math-input` and renders it with this adapter.

Svelte author views use `@pie-lib/editable-html-tiptap-svelte`, which has no math editing. Svelte delivery and print views that show math call `renderMath` from the adapter.


## Troubleshooting

### Math Not Rendering

1. **Console**: a `Failed to load MathJax` error means the script URL did not load. The `no typesetPromise` warning means an older MathJax is already on the page.
2. **Delimiters**: `$...$` stays text unless the page sets the legacy opt-in.
3. **Timing**: call `renderMath()` once the DOM holds the content.

### Screen Reader Output

Inspect a rendered `mjx-container` for its `mjx-assistive-mml` child. `createMathjaxRenderer({ accessibility: false })` omits it.

## Development

### Building

```bash
cd packages/shared/math-rendering-mathjax && bun run build
cd packages/lib-react/math-rendering && bun run build
```

### Testing

```bash
cd packages/shared/math-rendering-mathjax && bun run test

# Both builds in Chromium; run after a build
cd packages/shared/math-rendering-mathjax && bun run test:e2e

# Demo app
cd apps/element-demo
bun run dev
# Open http://localhost:5222/multiple-choice/deliver
```

## References

### Code Locations

- Adapter: `packages/shared/math-rendering-mathjax/`
- npm build engine: `packages/shared/math-rendering-mathjax/src/engine/page.ts`
- Browser build engine: `packages/shared/math-rendering-mathjax/src/engine/bundled.ts` and `src/engine/bundled/`, built by `vite.browser.config.ts`
- Wrapper package: `packages/lib-react/math-rendering/`
- Element player integration: `packages/element-player/src/players/PieElementPlayer.svelte`

### Documentation

- IIFE bundle architecture: [IIFE-BUNDLE-ARCHITECTURE.md](./IIFE-BUNDLE-ARCHITECTURE.md)
- Accessibility review: the `/accessibility-reviewer-assessments` skill

### External Resources

- [MathJax Documentation](https://docs.mathjax.org/en/latest/)
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)

## Migration History

- **2026-01-30**: Initial KaTeX wrapper (ESM compatibility)
- **2026-02-01**: Switched to MathJax v4
- **2026-02-09**: Simplified to MathJax-only (removed abstraction layer)
- **2026-09-27**: Pinned MathJax 4.1.3 and matched the legacy renderer's delimiters, macros and typesetting scope
- **2026-10-02**: Element browser builds bundle a module-private MathJax 4.1.3
