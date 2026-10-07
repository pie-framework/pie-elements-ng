# @pie-element/ebsr

## 15.0.2

### Patch Changes

- Updated dependencies [[`e06ec61`](https://github.com/pie-framework/pie-elements-ng/commit/e06ec6184b64e0355763dcdb6256d77cc7cc1351), [`dbcfb0a`](https://github.com/pie-framework/pie-elements-ng/commit/dbcfb0a07ae275e865d035961c7ebfe176f26ad1)]:
  - @pie-lib/render-ui@8.0.2
  - @pie-element/multiple-choice@14.0.2
  - @pie-lib/config-ui@14.0.2

## 15.0.1

### Patch Changes

- [#337](https://github.com/pie-framework/pie-elements-ng/pull/337) [`f7646b3`](https://github.com/pie-framework/pie-elements-ng/commit/f7646b345e9bda9918a94c7baf26fa9ef18b168d) Thanks [@chillenious](https://github.com/chillenious)! - An item's authored `extraCSSRules` style only that item: each layout nests them under a class of its own instead of the `extraCSSRules` class every item carries. EBSR's item-level rules now apply when the model arrives after the element connects, and follow model changes.

- [#330](https://github.com/pie-framework/pie-elements-ng/pull/330) [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab) Thanks [@chillenious](https://github.com/chillenious)! - Region names, screen-reader headings, the teacher instructions, rationale and rubric toggles, the drawing-response tool names, the inline dropdown names, the math keypad instructions, the editor toolbar buttons and the chart and graph key legends follow the item language, in English and Spanish, and follow a language change after the first render. A two-part question also labels its parts in the item language. The drawing-response background image is decorative, so screen readers skip it.

- [#332](https://github.com/pie-framework/pie-elements-ng/pull/332) [`338861f`](https://github.com/pie-framework/pie-elements-ng/commit/338861f5ff91ec4d46b567cf0c3ecafa8b2ac467) Thanks [@chillenious](https://github.com/chillenious)! - Two items on one page, and the two parts of an EBSR item, now render every DOM id once. The item container and the enable-audio prompt take generated ids and keep their `main-container` and `play-audio-info` classes, which the elements look them up by. EBSR marks its parts with `data-part`, math-templated marks its answer blocks with `data-answer-block`, and a categorize category carries its model id as `data-category-id`. The annotation editor, the multi-trait rubric menus, the choice feedback menu and the hotspot toolbar icons take generated ids. Authored CSS that selects `#main-container`, `#play-audio-info` or an EBSR part by `#a` or `#b` must select the class or `[data-part]` instead.

- [#268](https://github.com/pie-framework/pie-elements-ng/pull/268) [`cf1ccc0`](https://github.com/pie-framework/pie-elements-ng/commit/cf1ccc0d25c0c136dc01dab014c68a083ed595ed) Thanks [@chillenious](https://github.com/chillenious)! - chore: remove upstream sync tooling (PIE-1144)
- Updated dependencies [[`eccf20a`](https://github.com/pie-framework/pie-elements-ng/commit/eccf20af3fd0b5b63830ac0ab3b89ee2cecbfaa5), [`199ae92`](https://github.com/pie-framework/pie-elements-ng/commit/199ae92c9ca6fda549936306a82036dd770f619a), [`cbe9fc0`](https://github.com/pie-framework/pie-elements-ng/commit/cbe9fc064c206d098af6f4151d5cf30288b1736f), [`38284bc`](https://github.com/pie-framework/pie-elements-ng/commit/38284bc1aecd6fd6cc88a01226840887c0d27975), [`f7646b3`](https://github.com/pie-framework/pie-elements-ng/commit/f7646b345e9bda9918a94c7baf26fa9ef18b168d), [`260da48`](https://github.com/pie-framework/pie-elements-ng/commit/260da48c8db25fa0da4380d5bf8f26875c5da87b), [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab), [`338861f`](https://github.com/pie-framework/pie-elements-ng/commit/338861f5ff91ec4d46b567cf0c3ecafa8b2ac467), [`aa5e733`](https://github.com/pie-framework/pie-elements-ng/commit/aa5e73381ee663671154b113d4cdd2b17f0fb06e), [`852dfe3`](https://github.com/pie-framework/pie-elements-ng/commit/852dfe3d20c85c32996b986b6b20b0347896ee6e), [`5b59ed8`](https://github.com/pie-framework/pie-elements-ng/commit/5b59ed851bef7689a172cbb9ac2df6661e5950fc), [`4386fb2`](https://github.com/pie-framework/pie-elements-ng/commit/4386fb25129ab02d1b75aa97c7ede9ee06b758c4), [`fa8466c`](https://github.com/pie-framework/pie-elements-ng/commit/fa8466cae6f9b8aa91cfae36dc37ebb5a1c5684b), [`3294b83`](https://github.com/pie-framework/pie-elements-ng/commit/3294b83b6893501c0ca16fd27e6995845fa2fb73), [`c9e4781`](https://github.com/pie-framework/pie-elements-ng/commit/c9e47812260dfba8e0b4b0538eab78efad4e86ef), [`cffcecc`](https://github.com/pie-framework/pie-elements-ng/commit/cffcecccd7d2b33c31bf14ea1c90ba6688ccd13d), [`8b9c697`](https://github.com/pie-framework/pie-elements-ng/commit/8b9c697b36265441141c130c20ed2b71cd502990), [`2cdbdcb`](https://github.com/pie-framework/pie-elements-ng/commit/2cdbdcb2317c8fa81d9935674765d69941894c54), [`7c077c7`](https://github.com/pie-framework/pie-elements-ng/commit/7c077c76a684118cc2b6b9e2482974bab9078b07), [`d79762a`](https://github.com/pie-framework/pie-elements-ng/commit/d79762aacec2694e537e37eabfc6aa20983a6ae3), [`178c397`](https://github.com/pie-framework/pie-elements-ng/commit/178c397756c98fad9f9f49d216bed6eadd4a32e9), [`7dfa941`](https://github.com/pie-framework/pie-elements-ng/commit/7dfa941f4d8ef46c8625157739f72ae0d6d33983), [`2aa9344`](https://github.com/pie-framework/pie-elements-ng/commit/2aa9344a5de85cd2909c35f6d5d3218342662278), [`2e5cb09`](https://github.com/pie-framework/pie-elements-ng/commit/2e5cb09a131875b67cb7b845b141a52ff6597164), [`216ac0f`](https://github.com/pie-framework/pie-elements-ng/commit/216ac0f5591417cd7d1a83fbde0b4b724a97eb44), [`0848bf3`](https://github.com/pie-framework/pie-elements-ng/commit/0848bf3d5de0489c0a46eb04e87dcb9c94889b45), [`5fd1f97`](https://github.com/pie-framework/pie-elements-ng/commit/5fd1f97e1189baab5d62970989c76865f9d29d16), [`c0d98a0`](https://github.com/pie-framework/pie-elements-ng/commit/c0d98a0cb2bf1d8c5e6237d8861aa7c9615b5c01), [`32b1c5b`](https://github.com/pie-framework/pie-elements-ng/commit/32b1c5b5997002eb7c7909c22f21bdaf67a268db), [`ebab8a6`](https://github.com/pie-framework/pie-elements-ng/commit/ebab8a69c0d3cea39f83f5d7dcc4818ffc2981e7), [`ee44175`](https://github.com/pie-framework/pie-elements-ng/commit/ee44175c4c019c6320bf3611a6bcd48c78d036a0), [`39d0980`](https://github.com/pie-framework/pie-elements-ng/commit/39d098078ba330bc71c76f453a3b526d3cfab86c), [`bb4dd44`](https://github.com/pie-framework/pie-elements-ng/commit/bb4dd449ad943440cb869a868534edce8dc1e402), [`15c6bf5`](https://github.com/pie-framework/pie-elements-ng/commit/15c6bf5fbb1bbfc6c663ec71bc96d90d2d1813b5)]:
  - @pie-lib/translator@5.0.1
  - @pie-lib/config-ui@14.0.1
  - @pie-lib/render-ui@8.0.1
  - @pie-element/multiple-choice@14.0.1
  - @pie-element/shared-lodash@0.1.2

## 15.0.0

### Major Changes

- [#261](https://github.com/pie-framework/pie-elements-ng/pull/261) [`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - First stable release built from pie-elements-ng, which replaces the pie-elements and pie-lib builds of this package.
  
  It is a new major version, above every version those repositories published, so existing `^` ranges on the earlier line keep resolving the earlier builds. Moving to this version is opt-in.

### Patch Changes

- [#33](https://github.com/pie-framework/pie-elements-ng/pull/33) [`33d27e0`](https://github.com/pie-framework/pie-elements-ng/commit/33d27e0e13954e986a4a7e8a45e7508f1628712b) Thanks [@chillenious](https://github.com/chillenious)! - define and enforce packaging contracts PIE-626

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`0bcd6d8`](https://github.com/pie-framework/pie-elements-ng/commit/0bcd6d84612ba583d6248041d395ab753ab946de) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish corrected React element next prereleases from stable npm baselines.

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`b82e87c`](https://github.com/pie-framework/pie-elements-ng/commit/b82e87c1bd6c138b3d88bdb69b12731795ba9297) Thanks [@chillenious](https://github.com/chillenious)! - Prepare all PIE element packages for the next prerelease patch wave

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`fbf3695`](https://github.com/pie-framework/pie-elements-ng/commit/fbf3695636c20afa6a31655c5f1a1d6ed130a374) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Trigger the next prerelease patch for all PIE element packages.

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`d0f8d8e`](https://github.com/pie-framework/pie-elements-ng/commit/d0f8d8ead911f8c6256a4898a2f6b6863b7538ac) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Trigger another prerelease patch for all PIE element packages.

- [#59](https://github.com/pie-framework/pie-elements-ng/pull/59) [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.

- [#95](https://github.com/pie-framework/pie-elements-ng/pull/95) [`a644ec3`](https://github.com/pie-framework/pie-elements-ng/commit/a644ec3877219c3f9220483640ce031993441580) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.

- [#120](https://github.com/pie-framework/pie-elements-ng/pull/120) [`9f6033c`](https://github.com/pie-framework/pie-elements-ng/commit/9f6033c036503e667f21ee90399a7fc53fa6a3d8) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Restore the legacy print bundle (module/print.js) so print works with the current @pie-framework/pie-print client loader

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`82406bf`](https://github.com/pie-framework/pie-elements-ng/commit/82406bf47738f81d020706b639f5f22748bcd5d0) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#175](https://github.com/pie-framework/pie-elements-ng/issues/175) from pie-framework/fix/author-shim-cross-element-bundles

- [#195](https://github.com/pie-framework/pie-elements-ng/pull/195) [`473da8e`](https://github.com/pie-framework/pie-elements-ng/commit/473da8e7c62e0ffd80001673c2df4fab79d2ec4d) Thanks [@chillenious](https://github.com/chillenious)! - Browser ESM and legacy print bundles install the stylesheets they import, MathQuill's among them, so math fields render styled in the player and in hosts that bundle the elements with Vite or webpack. MathQuill's font ships as a WOFF2 file beside the bundle.

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#199](https://github.com/pie-framework/pie-elements-ng/pull/199) [`c4e2ba3`](https://github.com/pie-framework/pie-elements-ng/commit/c4e2ba313d3137c90af800715606e3f372e4beac) Thanks [@chillenious](https://github.com/chillenious)! - Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.

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

- [#142](https://github.com/pie-framework/pie-elements-ng/pull/142) [`8d69fb5`](https://github.com/pie-framework/pie-elements-ng/commit/8d69fb58ff9b482b46d74a9165ac4a4da700b8c9) Thanks [@chillenious](https://github.com/chillenious)! - Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.
  
  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1), [`259eb4d`](https://github.com/pie-framework/pie-elements-ng/commit/259eb4d33d60c0a413d608048345ce24c65d7429), [`509caf6`](https://github.com/pie-framework/pie-elements-ng/commit/509caf638617921bb62037b4e0d5d69b5bdca37d), [`5ca8ec1`](https://github.com/pie-framework/pie-elements-ng/commit/5ca8ec140ac4b115c8d11cb783d856be42f3de7b), [`42e1684`](https://github.com/pie-framework/pie-elements-ng/commit/42e1684c77b902e36f8900da92cff3cb50fc2710), [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`33d27e0`](https://github.com/pie-framework/pie-elements-ng/commit/33d27e0e13954e986a4a7e8a45e7508f1628712b), [`0bcd6d8`](https://github.com/pie-framework/pie-elements-ng/commit/0bcd6d84612ba583d6248041d395ab753ab946de), [`b82e87c`](https://github.com/pie-framework/pie-elements-ng/commit/b82e87c1bd6c138b3d88bdb69b12731795ba9297), [`fbf3695`](https://github.com/pie-framework/pie-elements-ng/commit/fbf3695636c20afa6a31655c5f1a1d6ed130a374), [`d0f8d8e`](https://github.com/pie-framework/pie-elements-ng/commit/d0f8d8ead911f8c6256a4898a2f6b6863b7538ac), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d6e12a5`](https://github.com/pie-framework/pie-elements-ng/commit/d6e12a5e47e15a93507d7ef5a9eeeee02f230229), [`991b31a`](https://github.com/pie-framework/pie-elements-ng/commit/991b31ac954c87c5064f757277edcf8804c072fb), [`a644ec3`](https://github.com/pie-framework/pie-elements-ng/commit/a644ec3877219c3f9220483640ce031993441580), [`9f6033c`](https://github.com/pie-framework/pie-elements-ng/commit/9f6033c036503e667f21ee90399a7fc53fa6a3d8), [`285c07c`](https://github.com/pie-framework/pie-elements-ng/commit/285c07c8e426d64c63e0719f3046246068edae21), [`0f1b96e`](https://github.com/pie-framework/pie-elements-ng/commit/0f1b96e33ead1c1f47a87b291692880991c53a3e), [`b2d3248`](https://github.com/pie-framework/pie-elements-ng/commit/b2d3248a488d850e6afd3f6fa1263eb8d1779ba2), [`a0ee0d5`](https://github.com/pie-framework/pie-elements-ng/commit/a0ee0d51370f2f412501957f8ddf0fd108810a3e), [`2bb02ad`](https://github.com/pie-framework/pie-elements-ng/commit/2bb02ad58032658871f6456960a25346a13ccb66), [`dad31dc`](https://github.com/pie-framework/pie-elements-ng/commit/dad31dcc718bf7f5438ac1ee1fb2e2cae89c650b), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`82406bf`](https://github.com/pie-framework/pie-elements-ng/commit/82406bf47738f81d020706b639f5f22748bcd5d0), [`473da8e`](https://github.com/pie-framework/pie-elements-ng/commit/473da8e7c62e0ffd80001673c2df4fab79d2ec4d), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53), [`c4e2ba3`](https://github.com/pie-framework/pie-elements-ng/commit/c4e2ba313d3137c90af800715606e3f372e4beac), [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704), [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6), [`1ecdcf5`](https://github.com/pie-framework/pie-elements-ng/commit/1ecdcf5e66d6f87e4bdfeea54b1228c00bd01ac9), [`24caee6`](https://github.com/pie-framework/pie-elements-ng/commit/24caee65b3f6bc3ae0c0682da71b1ee01f160fb4), [`24caee6`](https://github.com/pie-framework/pie-elements-ng/commit/24caee65b3f6bc3ae0c0682da71b1ee01f160fb4), [`f64aeac`](https://github.com/pie-framework/pie-elements-ng/commit/f64aeac84eef164000a855e6ac2842d0067e26aa), [`3e7bed4`](https://github.com/pie-framework/pie-elements-ng/commit/3e7bed4be9c77e42f044547304dd67852b873209), [`269257a`](https://github.com/pie-framework/pie-elements-ng/commit/269257a68d5aa5c5211b0e119b2f83927bfcde50), [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02), [`76a2592`](https://github.com/pie-framework/pie-elements-ng/commit/76a2592d4e46392e148c6e31b7559dfec3a95296), [`619ea67`](https://github.com/pie-framework/pie-elements-ng/commit/619ea67e7e5668408b1f3a1d6a3abb2dd06af1cd), [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50), [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651), [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755), [`307d489`](https://github.com/pie-framework/pie-elements-ng/commit/307d489ef910e9e1754a31a12d683407d75dbcce), [`7bd4a51`](https://github.com/pie-framework/pie-elements-ng/commit/7bd4a5189a39cca5bb9949d76ed04ea4ff569f74), [`7077034`](https://github.com/pie-framework/pie-elements-ng/commit/7077034c1ab4fdda2e0bd844716aed79e4f02493), [`e32415a`](https://github.com/pie-framework/pie-elements-ng/commit/e32415a7d80e6b5b3f36e2c26631c856ca9a8a07), [`b083e3a`](https://github.com/pie-framework/pie-elements-ng/commit/b083e3a6675dd0be10d995937831916d4e872e55), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`8d69fb5`](https://github.com/pie-framework/pie-elements-ng/commit/8d69fb58ff9b482b46d74a9165ac4a4da700b8c9), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-element/multiple-choice@14.0.0
  - @pie-element/shared-controller-utils@0.1.1
  - @pie-lib/config-ui@14.0.0
  - @pie-lib/translator@5.0.0
  - @pie-element/shared-lodash@0.1.1
  - @pie-element/shared-player-events@0.1.1
  - @pie-element/shared-configure-events@0.1.1

## 14.2.2-next.35

### Patch Changes

- @pie-element/shared-controller-utils@0.1.1-next.8
  - @pie-element/multiple-choice@13.4.0-next.30

## 14.2.2-next.34

### Patch Changes

- cd1f4f9: When a page installs the adapter's own `renderMath` as its math renderer, at `window['@pie-lib/math-rendering']` or, for elements inside `<pie-print>`, at `window.renderMath`, the adapter now typesets with its own MathJax. It previously called itself without end, which overflowed the stack or hung the page.
- Updated dependencies [cd1f4f9]
  - @pie-element/multiple-choice@13.4.0-next.29
  - @pie-lib/config-ui@14.0.0-next.50

## 14.2.2-next.33

### Patch Changes

- 3bad6b6: Print modules rendered by the `@pie-framework/pie-print` print player typeset their math through that player's renderer, waiting up to 10 seconds while the player imports it. Math previously stayed untypeset there, because the element's MathJax 4 does not start on a page that already holds the player's MathJax 3.
- Updated dependencies [3bad6b6]
  - @pie-element/multiple-choice@13.4.0-next.28
  - @pie-lib/config-ui@14.0.0-next.49

## 14.2.2-next.32

### Patch Changes

- @pie-element/multiple-choice@13.4.0-next.27
  - @pie-lib/config-ui@14.0.0-next.48

## 14.2.2-next.31

### Patch Changes

- @pie-element/shared-controller-utils@0.1.1-next.7
  - @pie-element/multiple-choice@13.4.0-next.26

## 14.2.2-next.30

### Patch Changes

- @pie-element/multiple-choice@13.4.0-next.25
  - @pie-lib/config-ui@14.0.0-next.47

## 14.2.2-next.29

### Patch Changes

- define and enforce packaging contracts PIE-626
- Publish corrected React element next prereleases from stable npm baselines.
- Prepare all PIE element packages for the next prerelease patch wave
- Trigger the next prerelease patch for all PIE element packages.
- Trigger another prerelease patch for all PIE element packages.
- Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.
- Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.
- Restore the legacy print bundle (module/print.js) so print works with the current @pie-framework/pie-print client loader
- Merge pull request #175 from pie-framework/fix/author-shim-cross-element-bundles
- Browser ESM and legacy print bundles install the stylesheets they import, MathQuill's among them, so math fields render styled in the player and in hosts that bundle the elements with Vite or webpack. MathQuill's font ships as a WOFF2 file beside the bundle.
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.
- Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, on the first render, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
- The shuffled choice order is saved through `updateSession`, so the next render shows the same order. These elements shuffle each part separately and never saved the result, so every render shuffled again.
- The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.
- Elements declare React and React DOM as dependencies only. The React peer they also declared let pnpm and yarn bind an element to the host's React; each element now runs on the React 18 it installs.
- Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- Fix `dist/index.iife.js`, which threw on load (`Cannot read properties of null (reading 'isRequired')`) and never defined its global or element. The `prop-types` and `debug` stand-ins in the IIFE build now match the real packages' production behaviour.
- b6ef8b1: Element math rendered through a player's MathJax 3 renderer, as on `iife` pages, no longer logs an unsupported-page `console.error` or dispatches `pie-mathjax-version-conflict`. The adapter still reports MathJax 4 meeting MathJax 3.
- Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.
  
  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.
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
- Updated dependencies [307d489]
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-element/multiple-choice@13.4.0-next.24
  - @pie-element/shared-controller-utils@0.1.1-next.6
  - @pie-lib/config-ui@14.0.0-next.46
  - @pie-lib/translator@5.0.0-next.7
  - @pie-element/shared-lodash@0.1.1-next.3
  - @pie-element/shared-player-events@0.1.1-next.3
  - @pie-element/shared-configure-events@0.1.1-next.1

## 14.2.2-next.28

### Patch Changes

- 54541e0: Keep MathJax 4 output intact on pages that also run MathJax 3: typeset output carries no `data-latex` attributes, and the MathJax the adapter loads writes its styles to `<style id="PIE-MJX-CHTML-styles">`. Such pages remain unsupported; the adapter logs one `console.error` naming the conflict and dispatches `pie-mathjax-version-conflict` on `window` for each condition it detects (exported as `MATHJAX_CONFLICT_EVENT`).
- Updated dependencies [54541e0]
  - @pie-element/multiple-choice@13.4.0-next.23
  - @pie-lib/config-ui@14.0.0-next.45

## 14.2.2-next.27

### Patch Changes

- @pie-element/multiple-choice@13.4.0-next.22
- @pie-lib/config-ui@14.0.0-next.44

## 14.2.2-next.26

### Patch Changes

- 269257a: Elements declare React and React DOM as dependencies only. The React peer they also declared let pnpm and yarn bind an element to the host's React; each element now runs on the React 18 it installs.
- Updated dependencies [269257a]
  - @pie-element/multiple-choice@13.4.0-next.21

## 14.2.2-next.25

### Patch Changes

- @pie-element/multiple-choice@13.4.0-next.20
- @pie-lib/config-ui@14.0.0-next.43

## 14.2.2-next.24

### Patch Changes

- 76a2592: Fix `dist/index.iife.js`, which threw on load (`Cannot read properties of null (reading 'isRequired')`) and never defined its global or element. The `prop-types` and `debug` stand-ins in the IIFE build now match the real packages' production behaviour.
- Updated dependencies [76a2592]
- Updated dependencies [619ea67]
  - @pie-element/multiple-choice@13.4.0-next.19
  - @pie-lib/translator@5.0.0-next.6

## 14.2.2-next.23

### Patch Changes

- 80e386a: MathJax starts loading on the first render whatever the element holds, so math that appears later does not wait on the download. Renders without math return without waiting on it.
- Updated dependencies [80e386a]
  - @pie-element/multiple-choice@13.4.0-next.18
  - @pie-lib/config-ui@14.0.0-next.42

## 14.2.2-next.22

### Patch Changes

- 1ecdcf5: The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
- 24caee6: The shuffled choice order is saved through `updateSession`, so the next render shows the same order. These elements shuffle each part separately and never saved the result, so every render shuffled again.
- Updated dependencies [1ecdcf5]
- Updated dependencies [24caee6]
- Updated dependencies [24caee6]
  - @pie-element/shared-controller-utils@0.1.1-next.5
  - @pie-element/multiple-choice@13.4.0-next.17

## 14.2.2-next.21

### Patch Changes

- 6ed08c4: Where no player renderer is installed on the page, as under `strategy="esm"`, elements load MathJax 4.1.3 (`tex-mml-chtml.js` on jsDelivr unless `srcUrl` overrides it) once per page, only for content that holds math, and typeset just the element they render once MathJax has started; host page text is no longer typeset, and a MathJax the page loads itself is used as the page configured it. As under IIFE, single `$…$` stays text unless the page sets `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`, `\abs` is defined, and math carries hidden MathML for screen readers with no tab stops and no generated speech. No speech worker starts, so no `worker-src blob:` CSP entry is needed.
- f64aeac: The `./browser/*` exports declare `types`, pointing at the declarations of the matching `./delivery`, `./author`, `./controller` and `./print` entries.
- Updated dependencies [6ed08c4]
- Updated dependencies [f64aeac]
- Updated dependencies
  - @pie-element/multiple-choice@13.4.0-next.16
  - @pie-element/shared-player-events@0.1.1-next.2
  - @pie-element/shared-controller-utils@0.1.1-next.4
  - @pie-lib/config-ui@14.0.0-next.41

## 14.2.2-next.20

### Patch Changes

- c4e2ba3: Add `@pie-element/shared-editor-runtime`, one browser ESM build of the tiptap editor engine, and an editor-runtime variant of each browser view of the elements that bundle the engine, declared in `pie.browserEditorRuntime`, which `pie-cli` sync now writes. `./browser/*` and the IIFE builds are unchanged.
- Updated dependencies [c4e2ba3]
  - @pie-element/multiple-choice@13.4.0-next.15

## 14.2.2-next.19

### Patch Changes

- 473da8e: Browser ESM and legacy print bundles install the stylesheets they import, MathQuill's among them, so math fields render styled in the player and in hosts that bundle the elements with Vite or webpack. MathQuill's font ships as a WOFF2 file beside the bundle.
- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [473da8e]
- Updated dependencies [7abcbd2]
  - @pie-element/multiple-choice@13.4.0-next.14
  - @pie-element/shared-controller-utils@0.1.1-next.3
  - @pie-lib/config-ui@14.0.0-next.40

## 14.2.2-next.18

### Patch Changes

- Updated dependencies
- Updated dependencies [7077034]
  - @pie-element/shared-configure-events@0.1.1-next.0
  - @pie-element/shared-player-events@0.1.1-next.1
  - @pie-element/multiple-choice@13.4.0-next.13
  - @pie-lib/config-ui@14.0.0-next.39

## 14.2.2-next.17

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-element/multiple-choice@13.3.5-next.12
  - @pie-lib/config-ui@14.0.0-next.38

## 14.2.2-next.16

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-element/multiple-choice@13.3.5-next.11
  - @pie-lib/config-ui@14.0.0-next.37

## 14.2.2-next.15

### Patch Changes

- Updated dependencies [dad31dc]
  - @pie-lib/translator@5.0.0-next.5
  - @pie-element/multiple-choice@13.3.5-next.10

## 14.2.2-next.14

### Patch Changes

- Merge pull request #175 from pie-framework/fix/author-shim-cross-element-bundles
- Updated dependencies [0f1b96e]
- Updated dependencies [b2d3248]
- Updated dependencies [a0ee0d5]
- Updated dependencies [2bb02ad]
- Updated dependencies
  - @pie-lib/translator@5.0.0-next.4
  - @pie-element/multiple-choice@13.3.5-next.9

## 14.2.2-next.13

### Patch Changes

- @pie-element/multiple-choice@13.3.5-next.8
- @pie-lib/config-ui@14.0.0-next.36

## 14.2.2-next.12

### Patch Changes

- Updated dependencies [285c07c]
  - @pie-element/shared-player-events@0.1.1-next.0
  - @pie-element/multiple-choice@13.3.5-next.7

## 14.2.2-next.11

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/config-ui@14.0.0-next.35
  - @pie-lib/translator@5.0.0-next.3
  - @pie-element/multiple-choice@13.3.5-next.6

## 14.2.2-next.10

### Patch Changes

- 8d69fb5: Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
  subpaths from what a package declares.

  An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
  and never reads the exports map, so print needs the same root shim `controller.js` and
  `configure.js` already provide. Without it the subpath resolved only from TypeScript
  sources, so print worked in a workspace build and failed every build against published
  tarballs — taking the whole bundle with it rather than just the print view.

- Updated dependencies [8d69fb5]
  - @pie-element/multiple-choice@13.3.5-next.5

## 14.2.2-next.9

### Patch Changes

- 9f6033c: Restore the legacy print bundle (module/print.js) so print works with the current @pie-framework/pie-print client loader
- Updated dependencies [9f6033c]
  - @pie-element/multiple-choice@13.3.5-next.4
  - @pie-lib/config-ui@13.0.4-next.34

## 14.2.2-next.8

### Patch Changes

- @pie-element/multiple-choice@13.3.5-next.3
- @pie-lib/config-ui@13.0.4-next.33

## 14.2.2-next.7

### Patch Changes

- a644ec3: Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.
- Updated dependencies [a644ec3]
  - @pie-element/multiple-choice@13.3.5-next.2

## 14.2.2-next.6

### Patch Changes

- Updated dependencies [d6e12a5]
- Updated dependencies [991b31a]
  - @pie-element/multiple-choice@13.3.5-next.1
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/translator@4.0.3-next.2
  - @pie-element/shared-controller-utils@0.1.1-next.2

## 14.2.2-next.5

### Patch Changes

- Publish the fixed vendored lodash get helper through EBSR's authoring dependency graph.
- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-element/multiple-choice@13.2.2-next.5
  - @pie-lib/translator@4.0.3-next.1

## 14.2.2-next.4

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.
- Updated dependencies
  - @pie-element/multiple-choice@13.2.2-next.4

## 14.2.2-next.3

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.
- Updated dependencies
  - @pie-element/multiple-choice@13.2.2-next.3

## 14.2.2-next.2

### Patch Changes

- @pie-element/multiple-choice@13.2.2-next.2
- @pie-lib/config-ui@13.0.4-next.30

## 14.2.2-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies
- Updated dependencies [a4c6279]
  - @pie-element/multiple-choice@13.2.2-next.1
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/translator@4.0.3-next.0

## 14.2.2-next.0

### Patch Changes

- Publish corrected React element next prereleases from stable npm baselines.
- Updated dependencies
  - @pie-element/multiple-choice@13.2.2-next.0

## 14.2.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626
- Updated dependencies [33d27e0]
  - @pie-element/multiple-choice@13.2.1-next.0

## 14.2.1-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/translator@4.0.3-next.0
  - @pie-element/multiple-choice@13.2.1-next.0

## 14.2.1-next.2

### Patch Changes

- Updated dependencies [42e1684]
  - @pie-element/multiple-choice@13.2.1-next.2

## 14.2.1-next.1

### Patch Changes

- Updated dependencies [5ca8ec1]
  - @pie-element/shared-controller-utils@0.1.1-next.1
  - @pie-element/multiple-choice@13.2.1-next.1

## 14.2.1-next.0

### Patch Changes

- Updated dependencies [509caf6]
  - @pie-element/shared-controller-utils@0.1.1-next.0
  - @pie-element/multiple-choice@13.2.1-next.0

## 14.1.1-next.2

### Patch Changes

- Updated dependencies [b083e3a]
  - @pie-element/multiple-choice@13.1.1-next.0

## 14.1.1-next.1

### Patch Changes

- Updated dependencies [e32415a]
  - @pie-element/multiple-choice@13.1.1-next.1

## 14.1.1-next.0

### Patch Changes

- Updated dependencies [259eb4d]
- Updated dependencies [7bd4a51]
  - @pie-element/multiple-choice@13.1.1-next.0
