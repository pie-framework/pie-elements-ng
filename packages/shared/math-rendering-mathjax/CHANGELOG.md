# @pie-element/shared-math-rendering-mathjax

## 0.1.4

### Patch Changes

- [#402](https://github.com/pie-framework/pie-elements-ng/pull/402) [`add92b7`](https://github.com/pie-framework/pie-elements-ng/commit/add92b764fdc3776bb2fd75487a7af12a7408ea9) Thanks [@chillenious](https://github.com/chillenious)! - feat(render-ui): name math-only controls from their MathML (PIE-1153)

- [#404](https://github.com/pie-framework/pie-elements-ng/pull/404) [`d1250d8`](https://github.com/pie-framework/pie-elements-ng/commit/d1250d87125a003405eaed70cb606d88a9b98f20) Thanks [@chillenious](https://github.com/chillenious)! - feat(math-rendering): label math in controls as it is typeset (PIE-1153)

## 0.1.3

### Patch Changes

- [#385](https://github.com/pie-framework/pie-elements-ng/pull/385) [`336223e`](https://github.com/pie-framework/pie-elements-ng/commit/336223e9efda67723a644b007cf5aad7dd72e221) Thanks [@chillenious](https://github.com/chillenious)! - Each copy of the browser build's MathJax gives its explorer regions stylesheet ids of its own. MathJax ids them by class name, which minifiers rename, so two copies on one page, such as an element's and the item player's, could give different regions one id; with enrichment on, the copy that started second threw as its explorer started and lost its highlighting and speech regions.

- [#385](https://github.com/pie-framework/pie-elements-ng/pull/385) [`7fc3257`](https://github.com/pie-framework/pie-elements-ng/commit/7fc32575d09e7ed3aa6252ad0a0bc21a4b7f6437) Thanks [@chillenious](https://github.com/chillenious)! - MathJax's fonts, speech worker and, in the npm build, MathJax itself load from an asset root, an npm root under which `<package>@<version>/<path>` serves each file, and neither build names a CDN host. The root is the renderer's `assetRoot` option, then `window['@pie-lib/math-rendering@2'].opts.assetRoot`, then the npm root of the URL the adapter loaded from, so an element browser build loaded from jsDelivr, raw.esm.sh or an npm mirror loads MathJax's files from there. `speechPath` sets the speech worker's directory, `speechLocales` the locales the speech language menu lists, and `assetUrls` the URL of individual files, which lets a bundle carry the browser build's fonts and speech through its host's bundler. Hosts that bundle the npm build, and `preloaded` hosts, must set the asset root: without one the npm build loads no MathJax and logs an error, and the browser build renders without web fonts and speech and warns, each once per page and with a `pie-mathjax-no-asset-root` event on `window`. A speech worker that fails to start, as under a content security policy that refuses `blob:` workers, now ends speech for the page; math rendering no longer stalls behind it.

## 0.1.2

### Patch Changes

- [#276](https://github.com/pie-framework/pie-elements-ng/pull/276) [`89241c4`](https://github.com/pie-framework/pie-elements-ng/commit/89241c4bfbc91b4d53ec9c6652990d046350bbf7) Thanks [@chillenious](https://github.com/chillenious)! - MathJax 4 renders MathML as the legacy renderer did: vertical arithmetic and long division (`mstack`, `mlongdiv`) typeset as tables where they showed "Math input error", prefixed MathML such as `<mml:math>` typesets, and inline MathML fractions, sums and limits keep display size. Displayed math wider than its container breaks across lines, and scrolls inside its own container where MathJax did not break it.

- [#277](https://github.com/pie-framework/pie-elements-ng/pull/277) [`022488e`](https://github.com/pie-framework/pie-elements-ng/commit/022488e4766ef96ffdfdb73840235d6acc5a439f) Thanks [@chillenious](https://github.com/chillenious)! - Element browser builds typeset math on a MathJax 4.1.3 of their own, bundled through the new `pie-browser-esm` export condition, and leave `window.MathJax` to the host page, so a host's MathJax of any version runs beside them. Their menu leaves out SVG output and collapsible math, `\require` is unsupported, and `srcUrl` is ignored. Element npm entries keep loading MathJax into the page.

- [#268](https://github.com/pie-framework/pie-elements-ng/pull/268) [`cf1ccc0`](https://github.com/pie-framework/pie-elements-ng/commit/cf1ccc0d25c0c136dc01dab014c68a083ed595ed) Thanks [@chillenious](https://github.com/chillenious)! - chore: remove upstream sync tooling (PIE-1144)

- [#270](https://github.com/pie-framework/pie-elements-ng/pull/270) [`aac3b26`](https://github.com/pie-framework/pie-elements-ng/commit/aac3b262b84128468ff409c0e02abb7d0f4634fb) Thanks [@chillenious](https://github.com/chillenious)! - fix(math-rendering-mathjax): drop removed math from MathJax's list and clear failed typesets

- [#271](https://github.com/pie-framework/pie-elements-ng/pull/271) [`a36b60d`](https://github.com/pie-framework/pie-elements-ng/commit/a36b60d870affd07081e14b1f3d6b2199cc63eac) Thanks [@chillenious](https://github.com/chillenious)! - fix(math-rendering-mathjax): keep MathJax 4 menu settings and SVG styles apart from MathJax 3

- [#376](https://github.com/pie-framework/pie-elements-ng/pull/376) [`dbaf591`](https://github.com/pie-framework/pie-elements-ng/commit/dbaf5918e41c3aec101037e521972de636a74251) Thanks [@chillenious](https://github.com/chillenious)! - fix: theme the focus rings on choices, the inline dropdown, the math keypad and the MathJax explorer

- [#379](https://github.com/pie-framework/pie-elements-ng/pull/379) [`ed0cdbe`](https://github.com/pie-framework/pie-elements-ng/commit/ed0cdbe0121972aa64de7ea810728520bcaa26a2) Thanks [@chillenious](https://github.com/chillenious)! - docs(math-rendering): describe the per-element MathJax that browser builds bundle

## 0.1.1

### Patch Changes

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`e6ef621`](https://github.com/pie-framework/pie-elements-ng/commit/e6ef621171a160d8bbcbf6972a454f68e155548a) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Delegate ESM math rendering to the player-owned renderer with standalone fallback

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#193](https://github.com/pie-framework/pie-elements-ng/issues/193) from pie-framework/feat/PIE-1085

- [#205](https://github.com/pie-framework/pie-elements-ng/pull/205) [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704) Thanks [@chillenious](https://github.com/chillenious)! - Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.

- [#208](https://github.com/pie-framework/pie-elements-ng/pull/208) [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6) Thanks [@chillenious](https://github.com/chillenious)! - MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.

- [#225](https://github.com/pie-framework/pie-elements-ng/pull/225) [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02) Thanks [@chillenious](https://github.com/chillenious)! - Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).

- [#232](https://github.com/pie-framework/pie-elements-ng/pull/232) [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50) Thanks [@chillenious](https://github.com/chillenious)! - Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.

- [#248](https://github.com/pie-framework/pie-elements-ng/pull/248) [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651) Thanks [@chillenious](https://github.com/chillenious)! - Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.

- [#251](https://github.com/pie-framework/pie-elements-ng/pull/251) [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755) Thanks [@chillenious](https://github.com/chillenious)! - When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.

## 0.1.1-next.8

### Patch Changes

- cd1f4f9: When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.

## 0.1.1-next.7

### Patch Changes

- 3bad6b6: Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.

## 0.1.1-next.6

### Patch Changes

- Delegate ESM math rendering to the player-owned renderer with standalone fallback
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #193 from pie-framework/feat/PIE-1085
- Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- b6ef8b1: Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.

## 0.1.1-next.5

### Patch Changes

- 54541e0: Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).

## 0.1.1-next.4

### Patch Changes

- 80e386a: MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.

## 0.1.1-next.3

### Patch Changes

- 6ed08c4: Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, only for content that holds math, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.

## 0.1.1-next.2

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

## 0.1.1-next.1

### Patch Changes

- Merge pull request #193 from pie-framework/feat/PIE-1085

## 0.1.1-next.0

### Patch Changes

- Delegate ESM math rendering to the player-owned renderer with standalone fallback
