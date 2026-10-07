# Math Rendering in pie-elements-ng

**Last Updated:** 2026-10-06

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

Each element bundles the browser build, and with it a MathJax of its own, a deliberate trade: every element type on a page downloads the engine once per element release, and in exchange keeps its own options, MathJax version and failures. The [shared browser runtime](prds/shared-browser-runtime/PRD.md#decisions) leaves the adapter out for that reason.

The browser build's engine is a chunk the adapter requests as its module loads and starts on the first render: about 1.3 MB minified, 320 kB gzipped, with the CHTML font data. The font's dynamic ranges, 40 chunks of about 1 MB in all, 150 kB gzipped, are requested with it, so math that first uses one mid-session waits on no download. Its output is the npm build's, with these differences:

- SVG output and collapsible math are not bundled. Their menu items are disabled, and a stored menu setting that names either is overridden.
- `\require` is unsupported. The packages `tex-mml-chtml.js` autoloads are bundled, mhchem with its font extension.
- `srcUrl` is ignored.
- Each copy's CHTML stylesheet has its own id, `PIE-MJX-CHTML-styles-<n>`. Another MathJax's `MJX-CHTML-styles` stylesheet matches every CHTML container, this build's included, so the adapter reports it as `foreign-output-stylesheet`.

Both builds pin one MathJax version: `mathjax`, `@mathjax/src` and the font packages are exact devDependencies at the same version, which a unit test checks.

## Renderer Resolution

`renderMath(element)` hands the element to the renderer at `window['@pie-lib/math-rendering']` when the page installs one with a `renderMath` function other than the adapter's own, which would call itself. Otherwise the adapter typesets the element itself.

- `@pie-players/pie-item-player` installs the legacy renderer under the `iife` strategy only, so ESM elements, loaded by the player under `esm` or registered by the host under `preloaded`, typeset through the adapter. A `@pie-players/pie-preloaded-player` build that carries an IIFE bundle installs the legacy renderer in its own entry. One that bundles the elements' browser builds installs none: each element, and the item player for markup math, starts its own private MathJax from the files the build ships, and the build takes elements on adapter 0.1.3 or later. A host installs its own renderer with `setMathRenderer` from `@pie-players/pie-players-shared/pie`.
- `@pie-element/element-player` uses a renderer the page installed before the player mounted. Otherwise it installs a renderer it creates with `createMathjaxRenderer`, which later players reuse. The player reads the global on every render, so its next render uses a renderer the host installs later.
- `apps/element-demo` installs the legacy MathJax 3 renderer from `@pie-lib/math-rendering-module` on `player=iife` pages, as `@pie-players/pie-item-player` does under `iife`, so IIFE pages run MathJax 3 and ESM pages MathJax 4.

## Loading

- MathJax loads on the first render, whatever the element holds, so later math does not wait on the download: the npm build loads `mathjax@4.1.3/tex-mml-chtml.js` from the [asset root](#assets); the browser build starts its engine chunk, requested as the adapter module loaded, so a player that imports elements ahead of rendering them, as the section player does for a whole section, has it before the first render. A render waits on the load only when its element holds a TeX delimiter or a `<math>` element.
- Element IIFE bundles each bundle their own copy of the npm build. The copies share one load per page, because a second MathJax startup on one page throws. Each element browser build starts its own MathJax.
- `startup.typeset` is `false`: MathJax typesets only the elements the renderer is given, never the host page's own text.
- On the npm build, a MathJax the page already has is used as the page configured it, and the adapter loads no copy of its own. A configuration object at `window.MathJax`, for a page that loads MathJax itself, is awaited through its `startup.ready`; a MathJax 3 or 4 build is used once its startup completes. The legacy macros and delimiters then apply only where the page's configuration defines them.
- On the npm build, a page runs one MathJax major version. MathJax 3 on the same page, from a host or from IIFE element bundles, is unsupported: the adapter still attempts to render and guarantees nothing. See [One MathJax version per page](https://github.com/pie-framework/pie-players/blob/develop/docs/item-player/loading-strategies.md#one-mathjax-version-per-page) for the failures observed.
- On the npm build, a MathJax global without `typesetPromise`, such as MathJax 2, leaves math untypeset and logs `[mathjax-renderer] MathJax on this page has no typesetPromise; math stays untypeset.`
- The first renderer to start MathJax on a page configures it, and every later renderer shares that instance. On the browser build this holds per copy.

## Assets

Neither build names a host. MathJax's fonts, its speech worker and, on the npm build, MathJax itself load from an npm root: a URL under which `<package>@<version>/<path>` serves that file of the package. `https://cdn.jsdelivr.net/npm`, `https://raw.esm.sh`, `https://unpkg.com` and npm-mirroring proxies are npm roots. `https://esm.sh` is not one: it serves a JavaScript file as an ES module wrapper, which neither the speech worker nor MathJax's script loads.

Each adapter copy takes the first root it finds:

1. The renderer's `assetRoot` option.
2. `window['@pie-lib/math-rendering@2'].opts.assetRoot`, the legacy renderer's page options.
3. The npm root of the URL the adapter module loaded from, the part before its last `<package>@<version>` segment: an element browser build loaded from `https://cdn.jsdelivr.net/npm/@pie-element/multiple-choice@12.0.0/dist/browser/delivery/index.js` takes `https://cdn.jsdelivr.net/npm`. A bundled adapter has none: bundlers give the module a `file:` URL or a path on the host's own server, and the search stops at `node_modules`.

A relative root resolves against the page's base URL. A copy reads its assets when it starts MathJax, at its first render, so a host sets the page options before any element renders. `@pie-players` hosts pass them to `registerPreloadedElements` ([preloaded player](https://github.com/pie-framework/pie-players/blob/develop/docs/preloaded-player/readme.md)); other hosts set them on the page:

```html
<script>
  window['@pie-lib/math-rendering@2'] = {
    opts: { assetRoot: 'https://assets.example.com/npm', speechLocales: ['en'] },
  };
</script>
```

- `assetRoot`: the npm root.
- `assetUrls`: the URL of individual files, keyed by npm path (`'mathjax@4.1.3/sre/mathmaps/en.json': url`). A listed file loads from its URL, the others from the root and `speechPath`. The browser build reads it for its fonts, speech worker and mathmaps; the npm build ignores it.
- `speechPath`: the directory of `speech-worker.js` and its `mathmaps/`, by default `mathjax@4.1.3/sre` under the root.
- `speechLocales`: the locales the menu's speech language submenu lists, by id (`['en', 'de']`), or by id with the label it shows (`{ en: 'English', cy: 'Cymraeg' }`). Unset, it lists SRE's 13 locales. When English is not listed, speech starts in the first listed locale, and a stored menu locale that is not listed is dropped.

The renderer options of the same names take precedence over the page's.

**Files**, every package at 4.1.3:

| Under the root | Holds | Build |
| --- | --- | --- |
| `mathjax@4.1.3/tex-mml-chtml.js` | MathJax, and beside it the TeX extensions it autoloads | npm |
| `@mathjax/mathjax-newcm-font@4.1.3/chtml/woff2/` | the fonts | both |
| `@mathjax/mathjax-newcm-font@4.1.3/chtml/dynamic/` | the font's dynamic ranges | npm |
| `@mathjax/mathjax-mhchem-font-extension@4.1.3/chtml/woff2/` | the mhchem fonts | both |
| `mathjax@4.1.3/sre/speech-worker.js` | the speech worker | both |
| `mathjax@4.1.3/sre/mathmaps/` | `base.json`, one file per locale, and `nemeth.json` and `euro.json` for braille | both |

A self-hosted root holds those paths, and only the mathmaps of the listed locales. A bundle that carries the browser build's files lists them in `assetUrls` instead, each as a `new URL('./…', import.meta.url)`: a host bundler emits each file so referenced into its own output under a hashed name, and copies nothing a directory URL names. A bundle listing the fonts needs no root. The adapter's manifest lists the three packages and their version under `pie.assetPackages`, which `pie-players`' preloaded-player build reads to ship them. A locale SRE does not ship needs a speech worker built with it and its `mathmaps/<locale>.json` at `speechPath`, and a `speechLocales` entry giving its label.

`srcUrl` replaces the npm build's MathJax script only; its fonts and speech still load from the root.

**Without a root**, each build reports it once per page: the npm build with `console.error`, the browser build with `console.warn`, each beginning `[math-rendering] No asset root for MathJax`. Each report also dispatches `pie-mathjax-no-asset-root` (`NO_ASSET_ROOT_EVENT`) on `window`, whose `detail` carries the `effect` (`untypeset`, `no-web-fonts` or `no-web-fonts-or-speech`), the `message` and the `docsUrl`; `@pie-players` forward it to their instrumentation.

- The browser build, with no fonts in `assetUrls` either, typesets without web fonts, so glyphs fall back to the system's fonts. Without a speech worker from `speechPath` or `assetUrls`, Semantic Enrichment is disabled in the menu, and with it speech, braille and the explorer.
- The npm build loads no MathJax, and math stays untypeset. Given a `srcUrl`, it loads that script with MathJax's own defaults for fonts and speech, which for MathJax 4's component builds are on jsDelivr.

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

Each typeset expression carries hidden MathML (`mjx-assistive-mml`) for screen readers, and the MathJax context menu. The speech-rule-engine output is off by default: no semantic enrichment, no generated speech and no speech web worker, so no `worker-src blob:` CSP entry is needed. A student who turns on Semantic Enrichment from the menu starts the speech worker, a `blob:` worker that imports `speech-worker.js` from the [asset root](#assets). A worker that fails to start, because a content security policy refuses `blob:` workers or the root's script, ends speech, braille and the explorer for the page and logs one warning; math goes on typesetting with its hidden MathML. Math stays out of the tab order, so it offers no Tab or arrow-key exploration.

A student's menu choices are saved in localStorage under `PIE-MathJax-Menu-Settings`, a key MathJax 3 does not share, and apply on later loads. Hidden MathML is exempt: the renderer's configuration sets it on every load.

Turning on speech, braille or the magnifier from the menu starts MathJax's explorer. Its highlight, selection outline and speech, braille, magnifier and tooltip regions take `--pie-text`, `--pie-background`, `--pie-border-dark` and the [THEMING.md](./THEMING.md) focus chain from `src/explorer-styles.ts`, which the first render that typesets math adds to `<head>` once per document. The regions are appended to `document.body`, so they take the fallbacks under a theme scoped to an element, and the theme colours replace any highlight colours a student picks in the menu.

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
  assetRoot: 'https://assets.example.com/npm',
});

window['@pie-lib/math-rendering'] = { renderMath };
await renderMath(container);
```

Options, which apply only when this renderer is the one that loads MathJax:

- `useSingleDollar` (default `false`): treat `$...$` as inline math.
- `accessibility` (default `true`): add the hidden MathML and the context menu.
- `loadFonts` (default `true`): load MathJax's fonts.
- `assetRoot`, `speechPath`, `speechLocales`: where MathJax's files load from and which speech locales the menu lists ([Assets](#assets)).
- `srcUrl`: the MathJax script URL, by default `mathjax@4.1.3/tex-mml-chtml.js` under the asset root. The browser build ignores it.

## Authoring Tools

React author views use `@pie-lib/editable-html-tip-tap` (`packages/lib-react/editable-html-tip-tap`). Its TipTap math extension edits math with MathQuill through `@pie-lib/math-input` and renders it with this adapter.

Svelte author views use `@pie-lib/editable-html-tiptap-svelte`, which has no math editing. Svelte delivery and print views that show math call `renderMath` from the adapter.


## Troubleshooting

### Math Not Rendering

1. **Console**: a `Failed to load MathJax` error means the script URL did not load. `No asset root for MathJax` means the adapter found no root ([Assets](#assets)). The `no typesetPromise` warning means an older MathJax is already on the page.
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
- Asset resolution: `packages/shared/math-rendering-mathjax/src/assets.ts`
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
- **2026-10-03**: Element browser builds bundle a module-private MathJax 4.1.3
- **2026-10-06**: MathJax's files load from an asset root; neither build names a CDN host
