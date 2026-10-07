# @pie-lib/render-ui

## 8.0.2

### Patch Changes

- [#390](https://github.com/pie-framework/pie-elements-ng/pull/390) [`e06ec61`](https://github.com/pie-framework/pie-elements-ng/commit/e06ec6184b64e0355763dcdb6256d77cc7cc1351) Thanks [@chillenious](https://github.com/chillenious)! - A prompt's table keeps its striped rows, collapsed borders and indented paragraphs inside the player's scroll wrapper, as it does in the legacy player, which does not wrap tables.

- [#392](https://github.com/pie-framework/pie-elements-ng/pull/392) [`600bb62`](https://github.com/pie-framework/pie-elements-ng/commit/600bb62bb6913a232361372b84352e7623b08102) Thanks [@chillenious](https://github.com/chillenious)! - fix: sanitize element model HTML before it reaches the DOM
- Updated dependencies [[`336223e`](https://github.com/pie-framework/pie-elements-ng/commit/336223e9efda67723a644b007cf5aad7dd72e221), [`7fc3257`](https://github.com/pie-framework/pie-elements-ng/commit/7fc32575d09e7ed3aa6252ad0a0bc21a4b7f6437), [`0804268`](https://github.com/pie-framework/pie-elements-ng/commit/080426876dda8057c150dd4b2e08f5e0f00c45ec)]:
  - @pie-element/shared-math-rendering-mathjax@0.1.3
  - @pie-element/shared-utils@0.1.2

## 8.0.1

### Patch Changes

- [#329](https://github.com/pie-framework/pie-elements-ng/pull/329) [`cbe9fc0`](https://github.com/pie-framework/pie-elements-ng/commit/cbe9fc064c206d098af6f4151d5cf30288b1736f) Thanks [@chillenious](https://github.com/chillenious)! - Math keypad keys and the editable-html formatting toolbars mix their fill into the theme background (`--pie-background`), so under a dark theme they darken with it and keep the theme's light text legible, with operator keys still a distinct hue from number keys. A key's press and focus ripple darkens under a dark theme too, and the editable-html toolbar's Done check takes the theme's correct-icon colour (`--pie-correct-icon`). Over a white background, or with no theme, the fills are the same colours as before.

- [#334](https://github.com/pie-framework/pie-elements-ng/pull/334) [`38284bc`](https://github.com/pie-framework/pie-elements-ng/commit/38284bc1aecd6fd6cc88a01226840887c0d27975) Thanks [@chillenious](https://github.com/chillenious)! - A prompt's audio player and custom play button take generated ids and keep `pie-prompt-audio-player` and `play-audio-button` as classes, and each prompt looks them up inside its own markup, so with two audio prompts on one page each one's autoplay and play button drive only its own audio. Authored CSS that selects `#pie-prompt-audio-player` or `#play-audio-button` must select `.pie-prompt-audio-player` or `.play-audio-button` instead.

- [#337](https://github.com/pie-framework/pie-elements-ng/pull/337) [`f7646b3`](https://github.com/pie-framework/pie-elements-ng/commit/f7646b345e9bda9918a94c7baf26fa9ef18b168d) Thanks [@chillenious](https://github.com/chillenious)! - An item's authored `extraCSSRules` style only that item: each layout nests them under a class of its own instead of the `extraCSSRules` class every item carries. EBSR's item-level rules now apply when the model arrives after the element connects, and follow model changes.

- [#330](https://github.com/pie-framework/pie-elements-ng/pull/330) [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab) Thanks [@chillenious](https://github.com/chillenious)! - Region names, screen-reader headings, the teacher instructions, rationale and rubric toggles, the drawing-response tool names, the inline dropdown names, the math keypad instructions, the editor toolbar buttons and the chart and graph key legends follow the item language, in English and Spanish, and follow a language change after the first render. A two-part question also labels its parts in the item language. The drawing-response background image is decorative, so screen readers skip it.

- [#342](https://github.com/pie-framework/pie-elements-ng/pull/342) [`aa5e733`](https://github.com/pie-framework/pie-elements-ng/commit/aa5e73381ee663671154b113d4cdd2b17f0fb06e) Thanks [@chillenious](https://github.com/chillenious)! - The custom audio play button on a prompt and the chart's Actions control are buttons a keyboard can reach and press with Enter or Space, with a visible focus ring and an accessible name in the item language ("Play audio", "Actions"). The Actions control tells screen readers whether its popover is open.

- [#268](https://github.com/pie-framework/pie-elements-ng/pull/268) [`cf1ccc0`](https://github.com/pie-framework/pie-elements-ng/commit/cf1ccc0d25c0c136dc01dab014c68a083ed595ed) Thanks [@chillenious](https://github.com/chillenious)! - chore: remove upstream sync tooling (PIE-1144)

- [#285](https://github.com/pie-framework/pie-elements-ng/pull/285) [`484e54d`](https://github.com/pie-framework/pie-elements-ng/commit/484e54db45cd13778de739cbc293e4f43f7cf938) Thanks [@chillenious](https://github.com/chillenious)! - fix(render-ui): render the Collapsible header as a disclosure button

- [#309](https://github.com/pie-framework/pie-elements-ng/pull/309) [`2b9b87a`](https://github.com/pie-framework/pie-elements-ng/commit/2b9b87a2daad815729685d245c01dc55bcd1cb9e) Thanks [@chillenious](https://github.com/chillenious)! - fix(render-ui): meet text contrast on feedback backgrounds

- [#318](https://github.com/pie-framework/pie-elements-ng/pull/318) [`7bbe5ef`](https://github.com/pie-framework/pie-elements-ng/commit/7bbe5eff1c9915e0c44f47830ede0ee9da53450a) Thanks [@chillenious](https://github.com/chillenious)! - fix(render-ui): create page-unique ids for delivery components

- [#344](https://github.com/pie-framework/pie-elements-ng/pull/344) [`925bef9`](https://github.com/pie-framework/pie-elements-ng/commit/925bef92b459dbb0a9932501e1ddfb7cb07f2cca) Thanks [@andreeimiron](https://github.com/andreeimiron)! - fix(render-ui): update color-contrast especially for placement-ordering PIE-821

- [#356](https://github.com/pie-framework/pie-elements-ng/pull/356) [`d6cbf50`](https://github.com/pie-framework/pie-elements-ng/commit/d6cbf5000a44a238a99280b73e2b0d3d3b724b2b) Thanks [@chillenious](https://github.com/chillenious)! - fix(render-ui): close inline menus on an outside click or tap (PIE-1209)

- [#374](https://github.com/pie-framework/pie-elements-ng/pull/374) [`c71aac6`](https://github.com/pie-framework/pie-elements-ng/commit/c71aac64875677926e30a7c4271c33b2ded5606f) Thanks [@chillenious](https://github.com/chillenious)! - fix(render-ui, theming): make feedback and correctness colours readable under every scheme

- [#376](https://github.com/pie-framework/pie-elements-ng/pull/376) [`dbaf591`](https://github.com/pie-framework/pie-elements-ng/commit/dbaf5918e41c3aec101037e521972de636a74251) Thanks [@chillenious](https://github.com/chillenious)! - fix: theme the focus rings on choices, the inline dropdown, the math keypad and the MathJax explorer
- Updated dependencies [[`89241c4`](https://github.com/pie-framework/pie-elements-ng/commit/89241c4bfbc91b4d53ec9c6652990d046350bbf7), [`022488e`](https://github.com/pie-framework/pie-elements-ng/commit/022488e4766ef96ffdfdb73840235d6acc5a439f), [`eccf20a`](https://github.com/pie-framework/pie-elements-ng/commit/eccf20af3fd0b5b63830ac0ab3b89ee2cecbfaa5), [`260da48`](https://github.com/pie-framework/pie-elements-ng/commit/260da48c8db25fa0da4380d5bf8f26875c5da87b), [`8170ce7`](https://github.com/pie-framework/pie-elements-ng/commit/8170ce7efe7a13675b914e8d187df23022bff8ab), [`aa5e733`](https://github.com/pie-framework/pie-elements-ng/commit/aa5e73381ee663671154b113d4cdd2b17f0fb06e), [`852dfe3`](https://github.com/pie-framework/pie-elements-ng/commit/852dfe3d20c85c32996b986b6b20b0347896ee6e), [`5b59ed8`](https://github.com/pie-framework/pie-elements-ng/commit/5b59ed851bef7689a172cbb9ac2df6661e5950fc), [`4386fb2`](https://github.com/pie-framework/pie-elements-ng/commit/4386fb25129ab02d1b75aa97c7ede9ee06b758c4), [`b7ddb94`](https://github.com/pie-framework/pie-elements-ng/commit/b7ddb943f1b3191e1c42e138b7e4b25a1423f4ef), [`204385a`](https://github.com/pie-framework/pie-elements-ng/commit/204385af8ff6ca3511a06b0011c9917f615c9cec), [`fa8466c`](https://github.com/pie-framework/pie-elements-ng/commit/fa8466cae6f9b8aa91cfae36dc37ebb5a1c5684b), [`3294b83`](https://github.com/pie-framework/pie-elements-ng/commit/3294b83b6893501c0ca16fd27e6995845fa2fb73), [`cffcecc`](https://github.com/pie-framework/pie-elements-ng/commit/cffcecccd7d2b33c31bf14ea1c90ba6688ccd13d), [`8b9c697`](https://github.com/pie-framework/pie-elements-ng/commit/8b9c697b36265441141c130c20ed2b71cd502990), [`2cdbdcb`](https://github.com/pie-framework/pie-elements-ng/commit/2cdbdcb2317c8fa81d9935674765d69941894c54), [`7c077c7`](https://github.com/pie-framework/pie-elements-ng/commit/7c077c76a684118cc2b6b9e2482974bab9078b07), [`d79762a`](https://github.com/pie-framework/pie-elements-ng/commit/d79762aacec2694e537e37eabfc6aa20983a6ae3), [`178c397`](https://github.com/pie-framework/pie-elements-ng/commit/178c397756c98fad9f9f49d216bed6eadd4a32e9), [`2aa9344`](https://github.com/pie-framework/pie-elements-ng/commit/2aa9344a5de85cd2909c35f6d5d3218342662278), [`a75551f`](https://github.com/pie-framework/pie-elements-ng/commit/a75551fdf3f44957f73f4106097944e43b33253e), [`2e5cb09`](https://github.com/pie-framework/pie-elements-ng/commit/2e5cb09a131875b67cb7b845b141a52ff6597164), [`0848bf3`](https://github.com/pie-framework/pie-elements-ng/commit/0848bf3d5de0489c0a46eb04e87dcb9c94889b45), [`ee44175`](https://github.com/pie-framework/pie-elements-ng/commit/ee44175c4c019c6320bf3611a6bcd48c78d036a0), [`bb4dd44`](https://github.com/pie-framework/pie-elements-ng/commit/bb4dd449ad943440cb869a868534edce8dc1e402), [`15c6bf5`](https://github.com/pie-framework/pie-elements-ng/commit/15c6bf5fbb1bbfc6c663ec71bc96d90d2d1813b5), [`2f66905`](https://github.com/pie-framework/pie-elements-ng/commit/2f6690526248104b3ffe83fe77b61c723f35ca9d)]:
  - @pie-element/shared-math-rendering-mathjax@0.1.2
  - @pie-lib/translator@5.0.1
  - @pie-element/shared-lodash@0.1.2
  - @pie-lib/icons@5.0.1

## 8.0.0

### Major Changes

- [#261](https://github.com/pie-framework/pie-elements-ng/pull/261) [`29d19da`](https://github.com/pie-framework/pie-elements-ng/commit/29d19daf732eb4cff629084534cdbf0d27f0acb1) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - First stable release built from pie-elements-ng, which replaces the pie-elements and pie-lib builds of this package.
  
  It is a new major version, above every version those repositories published, so existing `^` ranges on the earlier line keep resolving the earlier builds. Moving to this version is opt-in.

### Minor Changes

- [#123](https://github.com/pie-framework/pie-elements-ng/pull/123) [`7cae8f9`](https://github.com/pie-framework/pie-elements-ng/commit/7cae8f985f8932ee3b6b1df8addec177405ad0c3) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- [#31](https://github.com/pie-framework/pie-elements-ng/pull/31) [`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Publish ng ESM builds for PIE lib packages

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

- [#126](https://github.com/pie-framework/pie-elements-ng/pull/126) [`2f26122`](https://github.com/pie-framework/pie-elements-ng/commit/2f261228e302c3d8289d8f45232083e6fc73c5ae) Thanks [@PatriciaRomaniuc](https://github.com/PatriciaRomaniuc)! - Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)
  
  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `[#545454](https://github.com/pie-framework/pie-elements-ng/issues/545454)`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.

- [#163](https://github.com/pie-framework/pie-elements-ng/pull/163) [`4fe8ce6`](https://github.com/pie-framework/pie-elements-ng/commit/4fe8ce6735adf3b7923a657bca2d94883f374111) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Let the custom audio button start playback when autoplay is off (PIE-1068)

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#131](https://github.com/pie-framework/pie-elements-ng/issues/131) from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1

- [#240](https://github.com/pie-framework/pie-elements-ng/pull/240) [`c96fae3`](https://github.com/pie-framework/pie-elements-ng/commit/c96fae3a1d7ce9c94eada8d1ec7659e50bb26ec3) Thanks [@PatriciaRomaniuc](https://github.com/PatriciaRomaniuc)! - Draw hovered, selected and scored select-text tokens in the page's own ink
  (`--pie-text`) instead of black. pie-theme chooses the hover fill
  (`--pie-blue-grey-300`) against that ink, so black on it fell to 3.44:1 in Light
  Gray on Dark Gray and 3.77:1 in White on Black, and black on the selected fill
  (`--pie-blue-grey-100`) was 1.46:1 in the dark schemes.
  
  The `--pie-blue-grey-300` fallback moves to `#81848F`, pie-theme's light base
  value, and the PIE light and dark themes take `#9094A0` and `#526B77` so their
  own ink stays over 4.5:1 on the hover fill.

- [#35](https://github.com/pie-framework/pie-elements-ng/pull/35) [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4) Thanks [@chillenious](https://github.com/chillenious)! - Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies [[`b34750c`](https://github.com/pie-framework/pie-elements-ng/commit/b34750cda5fb9ba30b844a8fe646bb0f91f1f50a), [`e6ef621`](https://github.com/pie-framework/pie-elements-ng/commit/e6ef621171a160d8bbcbf6972a454f68e155548a), [`0e9882f`](https://github.com/pie-framework/pie-elements-ng/commit/0e9882f4e6eafae3e6fe39ffe40406422144e47f), [`d242e4c`](https://github.com/pie-framework/pie-elements-ng/commit/d242e4cbf8f1194c5ae67689f2e3e21d5c783339), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`7f5b63d`](https://github.com/pie-framework/pie-elements-ng/commit/7f5b63d4207ab434d313295a9cf582fc612e14ba), [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53), [`6ed08c4`](https://github.com/pie-framework/pie-elements-ng/commit/6ed08c43bbfd26b6bcc34f50e0e6760ec02fe704), [`80e386a`](https://github.com/pie-framework/pie-elements-ng/commit/80e386ac213e0ed6e19168fa12d9e9e08e64c0b6), [`54541e0`](https://github.com/pie-framework/pie-elements-ng/commit/54541e041f18eeb625b517d95387e05102ce3e02), [`b6ef8b1`](https://github.com/pie-framework/pie-elements-ng/commit/b6ef8b1c432787df49293b9271b4bace5cd60d50), [`3bad6b6`](https://github.com/pie-framework/pie-elements-ng/commit/3bad6b6d27789a9c7d165d465f4846ce6d97d651), [`cd1f4f9`](https://github.com/pie-framework/pie-elements-ng/commit/cd1f4f9c26d72be0a486ab17d8d56ba529056755), [`ed2cbd6`](https://github.com/pie-framework/pie-elements-ng/commit/ed2cbd602546d5baf3c3181d318ae8c7b04bd608), [`a4c6279`](https://github.com/pie-framework/pie-elements-ng/commit/a4c6279fa4175905f52c0696ae92eb53b21a6ce4)]:
  - @pie-lib/icons@5.0.0
  - @pie-element/shared-math-rendering-mathjax@0.1.1
  - @pie-element/shared-lodash@0.1.1

## 6.2.0-next.53

### Patch Changes

- Updated dependencies [cd1f4f9]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.8

## 6.2.0-next.52

### Patch Changes

- Updated dependencies [3bad6b6]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.7

## 6.2.0-next.51

### Patch Changes

- c96fae3: Draw hovered, selected and scored select-text tokens in the page's own ink
  (`--pie-text`) instead of black. pie-theme chooses the hover fill
  (`--pie-blue-grey-300`) against that ink, so black on it fell to 3.44:1 in Light
  Gray on Dark Gray and 3.77:1 in White on Black, and black on the selected fill
  (`--pie-blue-grey-100`) was 1.46:1 in the dark schemes.
  
  The `--pie-blue-grey-300` fallback moves to `#81848F`, pie-theme's light base
  value, and the PIE light and dark themes take `#9094A0` and `#526B77` so their
  own ink stays over 4.5:1 on the hover fill.

## 6.2.0-next.50

### Minor Changes

- Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- Publish ng ESM builds for PIE lib packages
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
- Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)
  
  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `#545454`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.
- Let the custom audio button start playback when autoplay is off (PIE-1068)
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
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
- Updated dependencies [b6ef8b1]
- Updated dependencies
- Updated dependencies
  - @pie-lib/icons@5.0.0-next.3
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.6
  - @pie-element/shared-lodash@0.1.1-next.3

## 6.2.0-next.49

### Patch Changes

- Updated dependencies [54541e0]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.5

## 6.2.0-next.48

### Patch Changes

- Updated dependencies [80e386a]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.4

## 6.2.0-next.47

### Patch Changes

- Updated dependencies [6ed08c4]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.3

## 6.2.0-next.46

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2
  - @pie-lib/icons@5.0.0-next.2

## 6.2.0-next.45

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1

## 6.2.0-next.44

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2

## 6.2.0-next.43

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/icons@5.0.0-next.1
  - @pie-lib/test-utils@3.0.0-next.2

## 6.2.0-next.42

### Patch Changes

- 2f26122: Add a `disabled-text` color for disabled text that still has to be read, and use it for charting tick labels (PIE-922)

  `@pie-lib/render-ui` gains `color.disabledText()` (`--pie-disabled-text`, default
  `#545454`), registered in `@pie-element/shared-theming` and set in the light and dark
  themes. Charting's disabled tick labels took two different colors: the MathJax fraction
  variant used the `disabled` grey, while the plain-text variant fell through to the
  browser's own disabled-input color. Both now use `disabled-text`, which stays dimmed but
  keeps text-grade contrast - the `disabled` grey is 3.94:1 on white, below WCAG AA for
  normal text, and fraction numerals render smaller still.

- 4fe8ce6: Let the custom audio button start playback when autoplay is off (PIE-1068)
- Updated dependencies [4fe8ce6]
  - @pie-lib/test-utils@3.0.0-next.1

## 6.2.0-next.41

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/icons@5.0.0-next.0
  - @pie-lib/test-utils@3.0.0-next.0

## 6.2.0-next.40

### Minor Changes

- 7cae8f9: Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

## 6.1.1-next.39

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

## 6.1.1-next.38

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1

## 6.1.1-next.37

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0

## 6.1.1-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0

## 6.1.1-next.0

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- Updated dependencies [b34750c]
  - @pie-lib/icons@4.0.3-next.0
  - @pie-lib/math-rendering@0.1.1-next.0
  - @pie-lib/test-utils@2.0.3-next.0
