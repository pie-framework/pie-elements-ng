# @pie-element/match-list

## 8.0.2

### Patch Changes

- [#392](https://github.com/pie-framework/pie-elements-ng/pull/392) [`600bb62`](https://github.com/pie-framework/pie-elements-ng/commit/600bb62bb6913a232361372b84352e7623b08102) Thanks [@chillenious](https://github.com/chillenious)! - fix: sanitize element model HTML before it reaches the DOM
- Updated dependencies [[`bead077`](https://github.com/pie-framework/pie-elements-ng/commit/bead077eb36ca57a584248c3f7817fe4fc850785), [`e06ec61`](https://github.com/pie-framework/pie-elements-ng/commit/e06ec6184b64e0355763dcdb6256d77cc7cc1351), [`336223e`](https://github.com/pie-framework/pie-elements-ng/commit/336223e9efda67723a644b007cf5aad7dd72e221), [`7fc3257`](https://github.com/pie-framework/pie-elements-ng/commit/7fc32575d09e7ed3aa6252ad0a0bc21a4b7f6437), [`dbcfb0a`](https://github.com/pie-framework/pie-elements-ng/commit/dbcfb0a07ae275e865d035961c7ebfe176f26ad1), [`0804268`](https://github.com/pie-framework/pie-elements-ng/commit/080426876dda8057c150dd4b2e08f5e0f00c45ec)]:
  - @pie-lib/drag@5.0.2
  - @pie-lib/render-ui@8.0.2
  - @pie-element/shared-math-rendering-mathjax@0.1.3
  - @pie-element/shared-utils@0.1.2
  - @pie-lib/correct-answer-toggle@5.0.2

## 8.0.1

### Patch Changes

- [#308](https://github.com/pie-framework/pie-elements-ng/pull/308) [`eccf20a`](https://github.com/pie-framework/pie-elements-ng/commit/eccf20af3fd0b5b63830ac0ab3b89ee2cecbfaa5) Thanks [@chillenious](https://github.com/chillenious)! - Response areas are groups named by their prompt, and an empty area becomes a button named by its prompt while a selected answer can be placed in it. As buttons they had no name, and a placed answer was nested inside one. Placed answers no longer announce drag instructions while the item cannot be changed, and with two versions of match-list on one page, keyboard focus after a placement stays in the element being answered.

- [#268](https://github.com/pie-framework/pie-elements-ng/pull/268) [`cf1ccc0`](https://github.com/pie-framework/pie-elements-ng/commit/cf1ccc0d25c0c136dc01dab014c68a083ed595ed) Thanks [@chillenious](https://github.com/chillenious)! - chore: remove upstream sync tooling (PIE-1144)

- [#316](https://github.com/pie-framework/pie-elements-ng/pull/316) [`c1ce388`](https://github.com/pie-framework/pie-elements-ng/commit/c1ce388d0736ba88302157936f7808783d6f0ced) Thanks [@chillenious](https://github.com/chillenious)! - fix(theming): follow the theme background on answer slots, legends and media buttons

- [#325](https://github.com/pie-framework/pie-elements-ng/pull/325) [`56a9e32`](https://github.com/pie-framework/pie-elements-ng/commit/56a9e32e5852cc23929369da487ee250084c2d89) Thanks [@chillenious](https://github.com/chillenious)! - fix: take the remaining element DOM ids from the shared unique-id helper

- [#357](https://github.com/pie-framework/pie-elements-ng/pull/357) [`77151b1`](https://github.com/pie-framework/pie-elements-ng/commit/77151b1e927df26bd5ed974538c9d30aff13f742) Thanks [@chillenious](https://github.com/chillenious)! - fix(match-list): scroll the Tab target into view during a keyboard drag (PIE-1210)

- [#374](https://github.com/pie-framework/pie-elements-ng/pull/374) [`c71aac6`](https://github.com/pie-framework/pie-elements-ng/commit/c71aac64875677926e30a7c4271c33b2ded5606f) Thanks [@chillenious](https://github.com/chillenious)! - fix(render-ui, theming): make feedback and correctness colours readable under every scheme
- Updated dependencies [[`89241c4`](https://github.com/pie-framework/pie-elements-ng/commit/89241c4bfbc91b4d53ec9c6652990d046350bbf7), [`022488e`](https://github.com/pie-framework/pie-elements-ng/commit/022488e4766ef96ffdfdb73840235d6acc5a439f), [`cbe9fc0`](https://github.com/pie-framework/pie-elements-ng/commit/cbe9fc064c206d098af6f4151d5cf30288b1736f), [`38284bc`](https://github.com/pie-framework/pie-elements-ng/commit/38284bc1aecd6fd6cc88a01226840887c0d27975), [`f7646b3`](https://github.com/pie-framework/pie-elements-ng/commit/f7646b345e9bda9918a94c7baf26fa9ef18b168d), [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab), [`aa5e733`](https://github.com/pie-framework/pie-elements-ng/commit/aa5e73381ee663671154b113d4cdd2b17f0fb06e), [`852dfe3`](https://github.com/pie-framework/pie-elements-ng/commit/852dfe3d20c85c32996b986b6b20b0347896ee6e), [`5b59ed8`](https://github.com/pie-framework/pie-elements-ng/commit/5b59ed851bef7689a172cbb9ac2df6661e5950fc), [`4386fb2`](https://github.com/pie-framework/pie-elements-ng/commit/4386fb25129ab02d1b75aa97c7ede9ee06b758c4), [`b7ddb94`](https://github.com/pie-framework/pie-elements-ng/commit/b7ddb943f1b3191e1c42e138b7e4b25a1423f4ef), [`204385a`](https://github.com/pie-framework/pie-elements-ng/commit/204385af8ff6ca3511a06b0011c9917f615c9cec), [`c9e4781`](https://github.com/pie-framework/pie-elements-ng/commit/c9e47812260dfba8e0b4b0538eab78efad4e86ef), [`83a538d`](https://github.com/pie-framework/pie-elements-ng/commit/83a538dfa4cd03eb086d03648561a8cc1a6d7325), [`7dfa941`](https://github.com/pie-framework/pie-elements-ng/commit/7dfa941f4d8ef46c8625157739f72ae0d6d33983), [`4d24c81`](https://github.com/pie-framework/pie-elements-ng/commit/4d24c81f2d1d6438e71960c8df5b5eb10489c2c0), [`216ac0f`](https://github.com/pie-framework/pie-elements-ng/commit/216ac0f5591417cd7d1a83fbde0b4b724a97eb44), [`c0d98a0`](https://github.com/pie-framework/pie-elements-ng/commit/c0d98a0cb2bf1d8c5e6237d8861aa7c9615b5c01), [`212b424`](https://github.com/pie-framework/pie-elements-ng/commit/212b424194719fbba2e5652f59d80d6aa45da4ec), [`ebab8a6`](https://github.com/pie-framework/pie-elements-ng/commit/ebab8a69c0d3cea39f83f5d7dcc4818ffc2981e7), [`6728dc6`](https://github.com/pie-framework/pie-elements-ng/commit/6728dc6c6489f85e6185451f8ded583508e72acb), [`39d0980`](https://github.com/pie-framework/pie-elements-ng/commit/39d098078ba330bc71c76f453a3b526d3cfab86c), [`15c6bf5`](https://github.com/pie-framework/pie-elements-ng/commit/15c6bf5fbb1bbfc6c663ec71bc96d90d2d1813b5), [`2f66905`](https://github.com/pie-framework/pie-elements-ng/commit/2f6690526248104b3ffe83fe77b61c723f35ca9d)]:
  - @pie-element/shared-math-rendering-mathjax@0.1.2
  - @pie-lib/render-ui@8.0.1
  - @pie-element/shared-lodash@0.1.2
  - @pie-lib/correct-answer-toggle@5.0.1
  - @pie-lib/drag@5.0.1
  - @pie-element/shared-feedback@0.1.2

## 8.0.0

### Major Changes

- [#261](https://github.com/pie-framework/pie-elements-ng/pull/261) [`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - First stable release built from pie-elements-ng, which replaces the pie-elements and pie-lib builds of this package.
  
  It is a new major version, above every version those repositories published, so existing `^` ranges on the earlier line keep resolving the earlier builds. Moving to this version is opt-in.

### Patch Changes

- [#33](https://github.com/pie-framework/pie-elements-ng/pull/33) [`33d27e0`](https://github.com/pie-framework/pie-elements-ng/commit/33d27e0e13954e986a4a7e8a45e7508f1628712b) Thanks [@chillenious](https://github.com/chillenious)! - define and enforce packaging contracts PIE-626

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`0bcd6d8`](https://github.com/pie-framework/pie-elements-ng/commit/0bcd6d84612ba583d6248041d395ab753ab946de) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish corrected React element next prereleases from stable npm baselines.

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`b82e87c`](https://github.com/pie-framework/pie-elements-ng/commit/b82e87c1bd6c138b3d88bdb69b12731795ba9297) Thanks [@chillenious](https://github.com/chillenious)! - Prepare all PIE element packages for the next prerelease patch wave

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`fbf3695`](https://github.com/pie-framework/pie-elements-ng/commit/fbf3695636c20afa6a31655c5f1a1d6ed130a374) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Trigger the next prerelease patch for all PIE element packages.

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`d0f8d8e`](https://github.com/pie-framework/pie-elements-ng/commit/d0f8d8ead911f8c6256a4898a2f6b6863b7538ac) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Trigger another prerelease patch for all PIE element packages.

- [#88](https://github.com/pie-framework/pie-elements-ng/pull/88) [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229) Thanks [@chillenious](https://github.com/chillenious)! - React element colours drawn from MUI's grey palette now follow the active colour scheme.
  
  `theme.palette.grey[N]` does not track `--pie-*`, so every one of these borders, fills
  and glyphs held a single hex under all ten schemes. Measured against each scheme's own
  `--pie-background`, the worst case per site ran between 1.01:1 and 1.72:1 — the
  answer-choice separator in `multiple-choice` that George reported was the visible end of
  it, not an isolated defect. Each site now reads the token matching its role, and the
  worst case across every scheme is at least 3.17:1.
  
  Strokes, dividers and connectors take `--pie-border`; the heavier card outlines in
  `math-inline` and `math-templated` take `--pie-border-dark`. Fills take
  `--pie-background-dark`, and selected or pressed fills `--pie-dropdown-background`. Text
  and interactive icons take `--pie-text` — no neutral token clears 4.5:1 in every scheme,
  so the `likert` column header that measured 1.88:1 on plain white gains contrast rather
  than keeping its tint. De-emphasised glyphs take `--pie-border-gray`, disabled
  affordances `--pie-disabled`.
  
  Four surfaces move with their strokes, because a scheme's border colour on a permanently
  white card is worse than the grey it replaced: under white-on-black `--pie-border` is
  `#ffffff`. The two `extended-text-entry` annotation popovers, the `inline-dropdown` menu
  item and the `config-ui` settings panel now paint `--pie-white`, which inverts with the
  scheme as `palette.common.white` never did.
  
  `@pie-lib/render-ui` gains `color.buttonFocusOutline()` for `--pie-button-focus-outline`,
  used by the two editor toolbar focus rings that were drawing themselves in `grey[700]` —
  1.28:1 on yellow-on-navy.
  
  Visible change in the default light theme: strokes that were `#e0e0e0` or `#bdbdbd` are
  now `--pie-border`, which resolves to `#8f8f8f`. That is deliberate; the previous values
  were below the 3:1 non-text minimum before any scheme was applied.

- [#95](https://github.com/pie-framework/pie-elements-ng/pull/95) [`a644ec3`](https://github.com/pie-framework/pie-elements-ng/commit/a644ec3877219c3f9220483640ce031993441580) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.

- [#118](https://github.com/pie-framework/pie-elements-ng/pull/118) [`425feaf`](https://github.com/pie-framework/pie-elements-ng/commit/425feaf875af977834d3b15b82bd970133191db8) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Sync upstream drag fixes, visx v4, tiptap and number-line math changes

- [#123](https://github.com/pie-framework/pie-elements-ng/pull/123) [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Fix keyboard placement: center the dragged item on its target instead of top-aligning it there, which let the item bleed into a neighbouring target and register the wrong drop; and correct the placement-ordering Tab cycle (PIE-803, PIE-963, PIE-964)

- [#163](https://github.com/pie-framework/pie-elements-ng/pull/163) [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Skip empty response areas in the native Tab order, and move focus to the destination tile after a move (PIE-996)

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#205](https://github.com/pie-framework/pie-elements-ng/pull/205) [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704) Thanks [@chillenious](https://github.com/chillenious)! - Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.

- [#208](https://github.com/pie-framework/pie-elements-ng/pull/208) [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6) Thanks [@chillenious](https://github.com/chillenious)! - MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.

- [#203](https://github.com/pie-framework/pie-elements-ng/pull/203) [`1ecdcf5`](https://github.com/pie-framework/pie-elements-ng/commit/1ecdcf5e66d6f87e4bdfeea54b1228c00bd01ac9) Thanks [@chillenious](https://github.com/chillenious)! - The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)

- [#203](https://github.com/pie-framework/pie-elements-ng/pull/203) [`24caee6`](https://github.com/pie-framework/pie-elements-ng/commit/24caee65b3f6bc3ae0c0682da71b1ee01f160fb4) Thanks [@chillenious](https://github.com/chillenious)! - The shuffled choice order is saved through `updateSession`, so the next render shows the same order. These elements shuffle each part separately and never saved the result, so every render shuffled again.

- [#204](https://github.com/pie-framework/pie-elements-ng/pull/204) [`f64aeac`](https://github.com/pie-framework/pie-elements-ng/commit/f64aeac84eef164000a855e6ac2842d0067e26aa) Thanks [@chillenious](https://github.com/chillenious)! - The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.

- [#217](https://github.com/pie-framework/pie-elements-ng/pull/217) [`269257a`](https://github.com/pie-framework/pie-elements-ng/commit/269257a68d5aa5c5211b0e119b2f83927bfcde50) Thanks [@chillenious](https://github.com/chillenious)! - Elements declare React and React DOM as dependencies only. The React peer they also declared let pnpm and yarn bind an element to the host's React; each element now runs on the React 18 it installs.

- [#225](https://github.com/pie-framework/pie-elements-ng/pull/225) [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02) Thanks [@chillenious](https://github.com/chillenious)! - Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).

- [#209](https://github.com/pie-framework/pie-elements-ng/pull/209) [`76a2592`](https://github.com/pie-framework/pie-elements-ng/commit/76a2592d4e46392e148c6e31b7559dfec3a95296) Thanks [@chillenious](https://github.com/chillenious)! - Fix `dist/index.iife.js`, which threw on load (`Cannot read properties of null (reading 'isRequired')`) and never defined its global or element. The `prop-types` and `debug` stand-ins in the IIFE build now match the real packages' production behaviour.

- [#232](https://github.com/pie-framework/pie-elements-ng/pull/232) [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50) Thanks [@chillenious](https://github.com/chillenious)! - Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.

- [#248](https://github.com/pie-framework/pie-elements-ng/pull/248) [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651) Thanks [@chillenious](https://github.com/chillenious)! - Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.

- [#251](https://github.com/pie-framework/pie-elements-ng/pull/251) [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755) Thanks [@chillenious](https://github.com/chillenious)! - When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1), [`509caf6`](https://github.com/pie-framework/pie-elements-ng/commit/509caf638617921bb62037b4e0d5d69b5bdca37d), [`5ca8ec1`](https://github.com/pie-framework/pie-elements-ng/commit/5ca8ec140ac4b115c8d11cb783d856be42f3de7b), [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`e6ef621`](https://github.com/pie-framework/pie-elements-ng/commit/e6ef621171a160d8bbcbf6972a454f68e155548a), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229), [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3), [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae), [`285c07c`](https://github.com/pie-framework/pie-elements-ng/commit/285c07c8e426d64c63e0719f3046246068edae21), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53), [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704), [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6), [`1ecdcf5`](https://github.com/pie-framework/pie-elements-ng/commit/1ecdcf5e66d6f87e4bdfeea54b1228c00bd01ac9), [`24caee6`](https://github.com/pie-framework/pie-elements-ng/commit/24caee65b3f6bc3ae0c0682da71b1ee01f160fb4), [`24caee6`](https://github.com/pie-framework/pie-elements-ng/commit/24caee65b3f6bc3ae0c0682da71b1ee01f160fb4), [`3e7bed4`](https://github.com/pie-framework/pie-elements-ng/commit/3e7bed4be9c77e42f044547304dd67852b873209), [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02), [`8c16787`](https://github.com/pie-framework/pie-elements-ng/commit/8c167879921c21939d2f93561d462a27d77b2b27), [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50), [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651), [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-lib/drag@5.0.0
  - @pie-lib/render-ui@8.0.0
  - @pie-element/shared-controller-utils@0.1.1
  - @pie-lib/correct-answer-toggle@5.0.0
  - @pie-element/shared-math-rendering-mathjax@0.1.1
  - @pie-element/shared-lodash@0.1.1
  - @pie-element/shared-player-events@0.1.1
  - @pie-element/shared-feedback@0.1.1

## 7.1.2-next.31

### Patch Changes

- @pie-element/shared-controller-utils@0.1.1-next.8

## 7.1.2-next.30

### Patch Changes

- cd1f4f9: When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.
- Updated dependencies [cd1f4f9]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.8
  - @pie-lib/drag@4.1.0-next.54
  - @pie-lib/render-ui@6.2.0-next.53
  - @pie-lib/correct-answer-toggle@5.0.0-next.56

## 7.1.2-next.29

### Patch Changes

- 3bad6b6: Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.
- Updated dependencies [3bad6b6]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.7
  - @pie-lib/drag@4.1.0-next.53
  - @pie-lib/render-ui@6.2.0-next.52
  - @pie-lib/correct-answer-toggle@5.0.0-next.55

## 7.1.2-next.28

### Patch Changes

- Updated dependencies [c96fae3]
  - @pie-lib/render-ui@6.2.0-next.51
  - @pie-lib/correct-answer-toggle@5.0.0-next.54
  - @pie-lib/drag@4.1.0-next.52

## 7.1.2-next.27

### Patch Changes

- @pie-element/shared-controller-utils@0.1.1-next.7

## 7.1.2-next.26

### Patch Changes

- define and enforce packaging contracts PIE-626
- Publish corrected React element next prereleases from stable npm baselines.
- Prepare all PIE element packages for the next prerelease patch wave
- Trigger the next prerelease patch for all PIE element packages.
- Trigger another prerelease patch for all PIE element packages.
- React element colours drawn from MUI's grey palette now follow the active colour scheme.
  
  `theme.palette.grey[N]` does not track `--pie-*`, so every one of these borders, fills
  and glyphs held a single hex under all ten schemes. Measured against each scheme's own
  `--pie-background`, the worst case per site ran between 1.01:1 and 1.72:1 — the
  answer-choice separator in `multiple-choice` that George reported was the visible end of
  it, not an isolated defect. Each site now reads the token matching its role, and the
  worst case across every scheme is at least 3.17:1.
  
  Strokes, dividers and connectors take `--pie-border`; the heavier card outlines in
  `math-inline` and `math-templated` take `--pie-border-dark`. Fills take
  `--pie-background-dark`, and selected or pressed fills `--pie-dropdown-background`. Text
  and interactive icons take `--pie-text` — no neutral token clears 4.5:1 in every scheme,
  so the `likert` column header that measured 1.88:1 on plain white gains contrast rather
  than keeping its tint. De-emphasised glyphs take `--pie-border-gray`, disabled
  affordances `--pie-disabled`.
  
  Four surfaces move with their strokes, because a scheme's border colour on a permanently
  white card is worse than the grey it replaced: under white-on-black `--pie-border` is
  `#ffffff`. The two `extended-text-entry` annotation popovers, the `inline-dropdown` menu
  item and the `config-ui` settings panel now paint `--pie-white`, which inverts with the
  scheme as `palette.common.white` never did.
  
  `@pie-lib/render-ui` gains `color.buttonFocusOutline()` for `--pie-button-focus-outline`,
  used by the two editor toolbar focus rings that were drawing themselves in `grey[700]` —
  1.28:1 on yellow-on-navy.
  
  Visible change in the default light theme: strokes that were `#e0e0e0` or `#bdbdbd` are
  now `--pie-border`, which resolves to `#8f8f8f`. That is deliberate; the previous values
  were below the 3:1 non-text minimum before any scheme was applied.
- Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.
- Sync upstream drag fixes, visx v4, tiptap and number-line math changes
- Fix keyboard placement: center the dragged item on its target instead of top-aligning it there, which let the item bleed into a neighbouring target and register the wrong drop; and correct the placement-ordering Tab cycle (PIE-803, PIE-963, PIE-964)
- Skip empty response areas in the native Tab order, and move focus to the destination tile after a move (PIE-996)
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
- The shuffled choice order is saved through `updateSession`, so the next render shows the same order. These elements shuffle each part separately and never saved the result, so every render shuffled again.
- The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.
- Elements declare React and React DOM as dependencies only. The React peer they also declared let pnpm and yarn bind an element to the host's React; each element now runs on the React 18 it installs.
- Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- Fix `dist/index.iife.js`, which threw on load (`Cannot read properties of null (reading 'isRequired')`) and never defined its global or element. The `prop-types` and `debug` stand-ins in the IIFE build now match the real packages' production behaviour.
- b6ef8b1: Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.
- Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies [b6ef8b1]
- Updated dependencies
- Updated dependencies
  - @pie-element/shared-controller-utils@0.1.1-next.6
  - @pie-lib/correct-answer-toggle@5.0.0-next.53
  - @pie-lib/drag@4.1.0-next.51
  - @pie-lib/render-ui@6.2.0-next.50
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.6
  - @pie-element/shared-lodash@0.1.1-next.3
  - @pie-element/shared-player-events@0.1.1-next.3
  - @pie-element/shared-feedback@0.1.1-next.1

## 7.1.2-next.25

### Patch Changes

- 54541e0: Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- Updated dependencies [54541e0]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.5
  - @pie-lib/drag@4.1.0-next.50
  - @pie-lib/render-ui@6.2.0-next.49
  - @pie-lib/correct-answer-toggle@5.0.0-next.52

## 7.1.2-next.24

### Patch Changes

- 269257a: Elements declare React and React DOM as dependencies only. The React peer they also declared let pnpm and yarn bind an element to the host's React; each element now runs on the React 18 it installs.

## 7.1.2-next.23

### Patch Changes

- Updated dependencies
  - @pie-lib/drag@4.1.0-next.49

## 7.1.2-next.22

### Patch Changes

- 76a2592: Fix `dist/index.iife.js`, which threw on load (`Cannot read properties of null (reading 'isRequired')`) and never defined its global or element. The `prop-types` and `debug` stand-ins in the IIFE build now match the real packages' production behaviour.
  - @pie-lib/correct-answer-toggle@5.0.0-next.51

## 7.1.2-next.21

### Patch Changes

- 80e386a: MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- Updated dependencies [80e386a]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.4
  - @pie-lib/drag@4.1.0-next.48
  - @pie-lib/render-ui@6.2.0-next.48
  - @pie-lib/correct-answer-toggle@5.0.0-next.50

## 7.1.2-next.20

### Patch Changes

- 1ecdcf5: The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
- 24caee6: The shuffled choice order is saved through `updateSession`, so the next render shows the same order. These elements shuffle each part separately and never saved the result, so every render shuffled again.
- Updated dependencies [1ecdcf5]
- Updated dependencies [24caee6]
- Updated dependencies [24caee6]
  - @pie-element/shared-controller-utils@0.1.1-next.5

## 7.1.2-next.19

### Patch Changes

- 6ed08c4: Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, only for content that holds math, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- f64aeac: The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.
- Updated dependencies [6ed08c4]
- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.3
  - @pie-element/shared-player-events@0.1.1-next.2
  - @pie-lib/drag@4.1.0-next.47
  - @pie-lib/render-ui@6.2.0-next.47
  - @pie-element/shared-controller-utils@0.1.1-next.4
  - @pie-lib/correct-answer-toggle@5.0.0-next.49

## 7.1.2-next.18

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-element/shared-controller-utils@0.1.1-next.3
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2
  - @pie-lib/correct-answer-toggle@5.0.0-next.48
  - @pie-lib/drag@4.1.0-next.46
  - @pie-lib/render-ui@6.2.0-next.46

## 7.1.2-next.17

### Patch Changes

- Updated dependencies
  - @pie-element/shared-feedback@0.1.1-next.0
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1
  - @pie-element/shared-player-events@0.1.1-next.1
  - @pie-lib/drag@4.1.0-next.45
  - @pie-lib/render-ui@6.2.0-next.45
  - @pie-lib/correct-answer-toggle@5.0.0-next.47

## 7.1.2-next.16

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/correct-answer-toggle@5.0.0-next.46
  - @pie-lib/drag@4.1.0-next.44
  - @pie-lib/render-ui@6.2.0-next.44

## 7.1.2-next.15

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/correct-answer-toggle@5.0.0-next.45
  - @pie-lib/drag@4.1.0-next.43
  - @pie-lib/render-ui@6.2.0-next.43

## 7.1.2-next.14

### Patch Changes

- @pie-lib/correct-answer-toggle@5.0.0-next.44

## 7.1.2-next.13

### Patch Changes

- @pie-lib/correct-answer-toggle@5.0.0-next.43

## 7.1.2-next.12

### Patch Changes

- 4fe8ce6: Skip empty response areas in the native Tab order, and move focus to the destination tile after a move (PIE-996)
- Updated dependencies [2f26122]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42
  - @pie-lib/drag@4.1.0-next.42
  - @pie-lib/correct-answer-toggle@5.0.0-next.42

## 7.1.2-next.11

### Patch Changes

- Updated dependencies [285c07c]
  - @pie-element/shared-player-events@0.1.1-next.0

## 7.1.2-next.10

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/correct-answer-toggle@5.0.0-next.41
  - @pie-lib/render-ui@6.2.0-next.41
  - @pie-lib/drag@4.1.0-next.41

## 7.1.2-next.9

### Patch Changes

- 7cae8f9: Fix keyboard placement: center the dragged item on its target instead of top-aligning it there, which let the item bleed into a neighbouring target and register the wrong drop; and correct the placement-ordering Tab cycle (PIE-803, PIE-963, PIE-964)
- Updated dependencies [7cae8f9]
  - @pie-lib/drag@4.1.0-next.40
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/correct-answer-toggle@4.0.3-next.40

## 7.1.2-next.8

### Patch Changes

- 425feaf: Sync upstream drag fixes, visx v4, tiptap and number-line math changes

## 7.1.2-next.7

### Patch Changes

- a644ec3: Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.

## 7.1.2-next.6

### Patch Changes

- d6e12a5: React element colours drawn from MUI's grey palette now follow the active colour scheme.

  `theme.palette.grey[N]` does not track `--pie-*`, so every one of these borders, fills
  and glyphs held a single hex under all ten schemes. Measured against each scheme's own
  `--pie-background`, the worst case per site ran between 1.01:1 and 1.72:1 — the
  answer-choice separator in `multiple-choice` that George reported was the visible end of
  it, not an isolated defect. Each site now reads the token matching its role, and the
  worst case across every scheme is at least 3.17:1.

  Strokes, dividers and connectors take `--pie-border`; the heavier card outlines in
  `math-inline` and `math-templated` take `--pie-border-dark`. Fills take
  `--pie-background-dark`, and selected or pressed fills `--pie-dropdown-background`. Text
  and interactive icons take `--pie-text` — no neutral token clears 4.5:1 in every scheme,
  so the `likert` column header that measured 1.88:1 on plain white gains contrast rather
  than keeping its tint. De-emphasised glyphs take `--pie-border-gray`, disabled
  affordances `--pie-disabled`.

  Four surfaces move with their strokes, because a scheme's border colour on a permanently
  white card is worse than the grey it replaced: under white-on-black `--pie-border` is
  `#ffffff`. The two `extended-text-entry` annotation popovers, the `inline-dropdown` menu
  item and the `config-ui` settings panel now paint `--pie-white`, which inverts with the
  scheme as `palette.common.white` never did.

  `@pie-lib/render-ui` gains `color.buttonFocusOutline()` for `--pie-button-focus-outline`,
  used by the two editor toolbar focus rings that were drawing themselves in `grey[700]` —
  1.28:1 on yellow-on-navy.

  Visible change in the default light theme: strokes that were `#e0e0e0` or `#bdbdbd` are
  now `--pie-border`, which resolves to `#8f8f8f`. That is deliberate; the previous values
  were below the 3:1 non-text minimum before any scheme was applied.

- Updated dependencies [d6e12a5]
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-element/shared-controller-utils@0.1.1-next.2
  - @pie-lib/correct-answer-toggle@4.0.3-next.39
  - @pie-lib/drag@4.0.3-next.39

## 7.1.2-next.5

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/correct-answer-toggle@4.0.3-next.38
  - @pie-lib/drag@4.0.3-next.38
  - @pie-lib/render-ui@6.1.1-next.38

## 7.1.2-next.4

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 7.1.2-next.3

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 7.1.2-next.2

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/drag@4.0.3-next.37
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/correct-answer-toggle@4.0.3-next.37

## 7.1.2-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/correct-answer-toggle@4.0.3-next.0
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 7.1.2-next.0

### Patch Changes

- Publish corrected React element next prereleases from stable npm baselines.

## 7.1.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626

## 7.1.1-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/correct-answer-toggle@4.0.3-next.0
  - @pie-lib/drag@4.0.3-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 7.1.1-next.1

### Patch Changes

- Updated dependencies [5ca8ec1]
  - @pie-element/shared-controller-utils@0.1.1-next.1

## 7.1.1-next.0

### Patch Changes

- Updated dependencies [509caf6]
  - @pie-element/shared-controller-utils@0.1.1-next.0
