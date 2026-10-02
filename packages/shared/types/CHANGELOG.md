# @pie-element/shared-types

## 0.2.0

### Minor Changes

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`1d74cc2`](https://github.com/pie-framework/pie-elements-ng/commit/1d74cc2527432a58a73752b62e069fbf92fa0a43) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Carry sign-language cards on `CatalogCard`, the shape pie-players canonicalises (PIE-879)
  
  An accessibility catalog card is now a single `CatalogCard`: `catalog` (the QTI
  `support=` token, and the only discriminant), optional `language`, and exactly
  one of `content` — the string form, SSML for `spoken` — or `payload`, the
  structured form for what a string cannot express. Adds
  `SignLanguageCardPayload` (a `MediaAssetRef` with multiple sources and MIME
  types, an optional `MediaFragmentRange`, and an optional `signLang`), the
  `CatalogCardPayload` union, `MediaAssetRef`, `MediaKind`, `MediaSource`, and an
  `isSignLanguageCard` narrowing guard.
  
  A signing card's adaptation language belongs on the card's `language`. That is
  the only field pie-players resolves a card on — resolution runs before anything
  knows the card is a signing card, so it can only key on the generic field — and
  the player falls back to it when the payload omits `signLang`. So `signLang` is
  optional, and redundant on every card the Learnosity importer produces, which
  emits `language` alone. It stays declared for the one shape where the two differ:
  a card tagged with the item's content language, so resolution reaches it by the
  default-language rung while the payload says what the clip is signed in.
  `isSignLanguageCard` deliberately says nothing about it — it briefly required a
  non-empty `signLang`, which would have rejected every imported card.
  
  The previous flat `content: string` could only hold a bare URL, which cannot
  express a signing video and left malformed payloads indistinguishable from
  text.
  
  This replaces the `SignLanguageCatalogCard | TextCatalogCard` union that was
  staged here earlier, and with it the `signLanguage` payload key. pie-players
  owns the card shape and canonicalises one generic `payload` slot interpreted by
  `catalog`: QTI's `qti-card` has a single content slot that `@support` already
  discriminates, and a field per accommodation makes every new structured
  alternate — braille next — a breaking widening of the card type in every
  consumer that reads cards. The divergence was not academic: pie-players
  tolerated `signLanguage` as an input alias on its resolution path but not its
  enumeration path, so a card authored against the old shape rendered its signing
  video and was simultaneously reported as carrying no alternate.
  
  `SignLanguageCatalogCard` survives as a narrowing of `CatalogCard` for the write
  side, since an open-ended `catalog` vocabulary means the type cannot state "a
  signing card must carry a payload".
  
  Breaking for consumers that referenced `AccessibilityCatalogCard`,
  `TextCatalogCard`, `MediaFragment`, or `card.signLanguage`: they are
  `CatalogCard`, `CatalogCard`, `MediaFragmentRange`, and `card.payload`. No
  element in this repo reads any of them, so nothing here changes behaviour. Data
  model only — resolution, rendering, and PNP gating live in pie-players.

- [#204](https://github.com/pie-framework/pie-elements-ng/pull/204) [`e3aa4f8`](https://github.com/pie-framework/pie-elements-ng/commit/e3aa4f863fddb219b58e9cdb0ababeeb84795021) Thanks [@chillenious](https://github.com/chillenious)! - Breaking: remove `ModelSetEvent`, `SessionChangedEvent`, `ModelUpdatedEvent` and `isPieEvent`, which dispatched `pie.*` events that no player listens for. Import the event classes from `@pie-element/shared-player-events` and `@pie-element/shared-configure-events` instead.

### Patch Changes

- [#198](https://github.com/pie-framework/pie-elements-ng/pull/198) [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633) Thanks [@chillenious](https://github.com/chillenious)! - Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

- [#257](https://github.com/pie-framework/pie-elements-ng/pull/257) [`3e49e88`](https://github.com/pie-framework/pie-elements-ng/commit/3e49e88b2768e706859eb54e1dfcb5223afe8b4c) Thanks [@chillenious](https://github.com/chillenious)! - The sign-language card doc comments name the pie-api-aws importer.

- [#169](https://github.com/pie-framework/pie-elements-ng/pull/169) [`4ffda53`](https://github.com/pie-framework/pie-elements-ng/commit/4ffda53aa3441080a56847d43b43698ba9a8d735) Thanks [@chillenious](https://github.com/chillenious)! - Add an accessible Svelte video stimulus element with authoring, captions, transcripts, localized UI, and native timed-media discovery support, plus shared Svelte media helpers and the accepted media asset type fields.

## 0.2.0-next.5

### Patch Changes

- 3e49e88: The sign-language card doc comments name the pie-api-aws importer.

## 0.2.0-next.4

### Patch Changes

- 4ffda53: Add an accessible Svelte video stimulus element with authoring, captions, transcripts, localized UI, and native timed-media discovery support, plus shared Svelte media helpers and the accepted media asset type fields.

## 0.2.0-next.3

### Minor Changes

- Carry sign-language cards on `CatalogCard`, the shape pie-players canonicalises (PIE-879)
  
  An accessibility catalog card is now a single `CatalogCard`: `catalog` (the QTI
  `support=` token, and the only discriminant), optional `language`, and exactly
  one of `content` — the string form, SSML for `spoken` — or `payload`, the
  structured form for what a string cannot express. Adds
  `SignLanguageCardPayload` (a `MediaAssetRef` with multiple sources and MIME
  types, an optional `MediaFragmentRange`, and an optional `signLang`), the
  `CatalogCardPayload` union, `MediaAssetRef`, `MediaKind`, `MediaSource`, and an
  `isSignLanguageCard` narrowing guard.
  
  A signing card's adaptation language belongs on the card's `language`. That is
  the only field pie-players resolves a card on — resolution runs before anything
  knows the card is a signing card, so it can only key on the generic field — and
  the player falls back to it when the payload omits `signLang`. So `signLang` is
  optional, and redundant on every card the Learnosity importer produces, which
  emits `language` alone. It stays declared for the one shape where the two differ:
  a card tagged with the item's content language, so resolution reaches it by the
  default-language rung while the payload says what the clip is signed in.
  `isSignLanguageCard` deliberately says nothing about it — it briefly required a
  non-empty `signLang`, which would have rejected every imported card.
  
  The previous flat `content: string` could only hold a bare URL, which cannot
  express a signing video and left malformed payloads indistinguishable from
  text.
  
  This replaces the `SignLanguageCatalogCard | TextCatalogCard` union that was
  staged here earlier, and with it the `signLanguage` payload key. pie-players
  owns the card shape and canonicalises one generic `payload` slot interpreted by
  `catalog`: QTI's `qti-card` has a single content slot that `@support` already
  discriminates, and a field per accommodation makes every new structured
  alternate — braille next — a breaking widening of the card type in every
  consumer that reads cards. The divergence was not academic: pie-players
  tolerated `signLanguage` as an input alias on its resolution path but not its
  enumeration path, so a card authored against the old shape rendered its signing
  video and was simultaneously reported as carrying no alternate.
  
  `SignLanguageCatalogCard` survives as a narrowing of `CatalogCard` for the write
  side, since an open-ended `catalog` vocabulary means the type cannot state "a
  signing card must carry a payload".
  
  Breaking for consumers that referenced `AccessibilityCatalogCard`,
  `TextCatalogCard`, `MediaFragment`, or `card.signLanguage`: they are
  `CatalogCard`, `CatalogCard`, `MediaFragmentRange`, and `card.payload`. No
  element in this repo reads any of them, so nothing here changes behaviour. Data
  model only — resolution, rendering, and PNP gating live in pie-players.
- Breaking: remove `ModelSetEvent`, `SessionChangedEvent`, `ModelUpdatedEvent` and `isPieEvent`, which dispatched `pie.*` events that no player listens for. Import the event classes from `@pie-element/shared-player-events` and `@pie-element/shared-configure-events` instead.

### Patch Changes

- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

## 0.2.0-next.2

### Minor Changes

- e3aa4f8: Breaking: remove `ModelSetEvent`, `SessionChangedEvent`, `ModelUpdatedEvent` and `isPieEvent`, which dispatched `pie.*` events that no player listens for. Import the event classes from `@pie-element/shared-player-events` and `@pie-element/shared-configure-events` instead.

## 0.2.0-next.1

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

## 0.2.0-next.0

### Minor Changes

- 1d74cc2: Carry sign-language cards on `CatalogCard`, the shape pie-players canonicalises (PIE-879)

  An accessibility catalog card is now a single `CatalogCard`: `catalog` (the QTI
  `support=` token, and the only discriminant), optional `language`, and exactly
  one of `content` — the string form, SSML for `spoken` — or `payload`, the
  structured form for what a string cannot express. Adds
  `SignLanguageCardPayload` (a `MediaAssetRef` with multiple sources and MIME
  types, an optional `MediaFragmentRange`, and an optional `signLang`), the
  `CatalogCardPayload` union, `MediaAssetRef`, `MediaKind`, `MediaSource`, and an
  `isSignLanguageCard` narrowing guard.

  A signing card's adaptation language belongs on the card's `language`. That is
  the only field pie-players resolves a card on — resolution runs before anything
  knows the card is a signing card, so it can only key on the generic field — and
  the player falls back to it when the payload omits `signLang`. So `signLang` is
  optional, and redundant on every card the Learnosity importer produces, which
  emits `language` alone. It stays declared for the one shape where the two differ:
  a card tagged with the item's content language, so resolution reaches it by the
  default-language rung while the payload says what the clip is signed in.
  `isSignLanguageCard` deliberately says nothing about it — it briefly required a
  non-empty `signLang`, which would have rejected every imported card.

  The previous flat `content: string` could only hold a bare URL, which cannot
  express a signing video and left malformed payloads indistinguishable from
  text.

  This replaces the `SignLanguageCatalogCard | TextCatalogCard` union that was
  staged here earlier, and with it the `signLanguage` payload key. pie-players
  owns the card shape and canonicalises one generic `payload` slot interpreted by
  `catalog`: QTI's `qti-card` has a single content slot that `@support` already
  discriminates, and a field per accommodation makes every new structured
  alternate — braille next — a breaking widening of the card type in every
  consumer that reads cards. The divergence was not academic: pie-players
  tolerated `signLanguage` as an input alias on its resolution path but not its
  enumeration path, so a card authored against the old shape rendered its signing
  video and was simultaneously reported as carrying no alternate.

  `SignLanguageCatalogCard` survives as a narrowing of `CatalogCard` for the write
  side, since an open-ended `catalog` vocabulary means the type cannot state "a
  signing card must carry a payload".

  Breaking for consumers that referenced `AccessibilityCatalogCard`,
  `TextCatalogCard`, `MediaFragment`, or `card.signLanguage`: they are
  `CatalogCard`, `CatalogCard`, `MediaFragmentRange`, and `card.payload`. No
  element in this repo reads any of them, so nothing here changes behaviour. Data
  model only — resolution, rendering, and PNP gating live in pie-players.
