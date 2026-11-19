# @pie-element/shared-player-events

## 0.2.2

### Patch Changes

- [#564](https://github.com/pie-framework/pie-elements-ng/pull/564) [`3d364e6`](https://github.com/pie-framework/pie-elements-ng/commit/3d364e651386bd5ec5c03c0cbac9800dbed51ea8) Thanks [@chillenious](https://github.com/chillenious)! - `interfaceLocaleContext` and `InterfaceLocaleContextValue` come from `@pie-players/pie-context` 1.0.0-beta.6, which now publishes them, in place of a local copy on the same `Symbol.for` key.

- [#552](https://github.com/pie-framework/pie-elements-ng/pull/552) [`b00321c`](https://github.com/pie-framework/pie-elements-ng/commit/b00321cc5bc48b72de24f6e5db52fb446a5e9e8d) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the dev-dependencies group across 1 directory with 3 updates

- [#559](https://github.com/pie-framework/pie-elements-ng/pull/559) [`efc633c`](https://github.com/pie-framework/pie-elements-ng/commit/efc633cb4a3b7870f2237d374d43bcd6d1b18d8c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.4 to 8.3.5

- [#570](https://github.com/pie-framework/pie-elements-ng/pull/570) [`0585bc2`](https://github.com/pie-framework/pie-elements-ng/commit/0585bc20bf7669c380e6a30e6f8816152063d514) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vitest from 4.1.11 to 5.0.5

- [#603](https://github.com/pie-framework/pie-elements-ng/pull/603) [`c0d40a0`](https://github.com/pie-framework/pie-elements-ng/commit/c0d40a001058f0051e7e557b1f1da8ba217233e5) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump @pie-players/pie-context from 1.0.0-beta.6 to 1.0.0-beta.7

- [#641](https://github.com/pie-framework/pie-elements-ng/pull/641) [`6b3a398`](https://github.com/pie-framework/pie-elements-ng/commit/6b3a3987fe0b11cc885d75168622ccbfa85d5e44) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the test-dependencies group across 1 directory with 2 updates

- [#647](https://github.com/pie-framework/pie-elements-ng/pull/647) [`7d3a323`](https://github.com/pie-framework/pie-elements-ng/commit/7d3a32301eb3393937961919256da39e57e8104f) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.5 to 8.3.6

- [#656](https://github.com/pie-framework/pie-elements-ng/pull/656) [`ab1c731`](https://github.com/pie-framework/pie-elements-ng/commit/ab1c7310a6129afbbcfff49d9055ad726e2b9356) Thanks [@chillenious](https://github.com/chillenious)! - fix(packaging): ship the MIT LICENSE in every publishable package

- [#687](https://github.com/pie-framework/pie-elements-ng/pull/687) [`e0e39b7`](https://github.com/pie-framework/pie-elements-ng/commit/e0e39b73edc6cbe89afa07d222bf8db3236e1e38) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump @pie-players/pie-context from 1.0.0-beta.7 to 1.0.0-beta.10

- [#655](https://github.com/pie-framework/pie-elements-ng/pull/655) [`38838ba`](https://github.com/pie-framework/pie-elements-ng/commit/38838bae2b474a1cb629b6d47022c4b64b740850) Thanks [@chillenious](https://github.com/chillenious)! - Ship the license and NOTICE texts of every bundled third-party package in `THIRD_PARTY_LICENSES.txt` files beside the build output that bundles it.

## 0.2.1

### Patch Changes

- [#501](https://github.com/pie-framework/pie-elements-ng/pull/501) [`6bf1082`](https://github.com/pie-framework/pie-elements-ng/commit/6bf1082d7732ff9c28a010d0344c1749852c43d3) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.1.5 to 8.3.4

## 0.2.0

### Minor Changes

- [#442](https://github.com/pie-framework/pie-elements-ng/pull/442) [`026d10e`](https://github.com/pie-framework/pie-elements-ng/commit/026d10ed3f16b1e016f8ad2d25facce600080857) Thanks [@lakatosandrei](https://github.com/lakatosandrei)! - Extended text entry and explicit constructed response save the student's response once the student stops typing for the player's idle-save delay, not only when the editor loses focus. The player sets the delay through `sessionCommitContext` from `@pie-players/pie-context` (`idleSaveDelayMs`); without a provider, or with the field left out, the delay is 1500 ms, and `0` saves on blur only. `@pie-element/shared-player-events` exports `subscribeIdleSaveDelay`, `resolveIdleSaveDelay` and `DEFAULT_IDLE_SAVE_DELAY_MS` for this. `ConstructedResponse` in `@pie-lib/mask-markup` passes a new `idleSaveDelay` prop on to each blank's editor. Its `onChange` also gets the changed blank's id as a second argument, which explicit constructed response uses so a blank's save no longer overwrites another blank's answer. A player's `commitPendingSession()` now also sends a save still waiting in the response editor, so the session it commits holds what the student typed in the last delay.

## 0.1.1

### Patch Changes

- [#147](https://github.com/pie-framework/pie-elements-ng/pull/147) [`285c07c`](https://github.com/pie-framework/pie-elements-ng/commit/285c07c8e426d64c63e0719f3046246068edae21) Thanks [@chillenious](https://github.com/chillenious)! - A coalesced `session-changed` is no longer dropped when the element is torn down inside its own debounce window (PIE-1058).

  `@pie-element/shared-player-events` gains `createSessionNotifier`, which registers each deferred notification against its host element. One `flushSessionNotifiers(this)` call in `disconnectedCallback` commits everything the element owns, and the helper installs `commitPendingSession()` for a player to call before discarding the element — while it is still attached, so the event still reaches a `document`-level host listener. The install wraps an element-declared method of the same name, and disposing the last notifier removes it again, so a player never counts an element as committed while a pending dispatch is dropped. A dispatch that throws is reported through `onDispatchError`, defaulting to `console.warn`.

  All five elements that coalesced their session write adopt it. `extended-text-entry` and `explicit-constructed-response` also move their debounce off the value path onto the dispatch, so `.session` holds the response as soon as the editor commits it. No debounce delay changes.

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#193](https://github.com/pie-framework/pie-elements-ng/issues/193) from pie-framework/feat/PIE-1085

- [#265](https://github.com/pie-framework/pie-elements-ng/pull/265) [`3e7bed4`](https://github.com/pie-framework/pie-elements-ng/commit/3e7bed4be9c77e42f044547304dd67852b873209) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Merge pull request [#205](https://github.com/pie-framework/pie-elements-ng/issues/205) from pie-framework/fix/mathjax-esm-adapter

## 0.1.1-next.3

### Patch Changes

- A coalesced `session-changed` is no longer dropped when the element is torn down inside its own debounce window (PIE-1058).

  `@pie-element/shared-player-events` gains `createSessionNotifier`, which registers each deferred notification against its host element. One `flushSessionNotifiers(this)` call in `disconnectedCallback` commits everything the element owns, and the helper installs `commitPendingSession()` for a player to call before discarding the element — while it is still attached, so the event still reaches a `document`-level host listener. The install wraps an element-declared method of the same name, and disposing the last notifier removes it again, so a player never counts an element as committed while a pending dispatch is dropped. A dispatch that throws is reported through `onDispatchError`, defaulting to `console.warn`.

  All five elements that coalesced their session write adopt it. `extended-text-entry` and `explicit-constructed-response` also move their debounce off the value path onto the dispatch, so `.session` holds the response as soon as the editor commits it. No debounce delay changes.
- Merge pull request #193 from pie-framework/feat/PIE-1085
- Merge pull request #205 from pie-framework/fix/mathjax-esm-adapter

## 0.1.1-next.2

### Patch Changes

- Merge pull request #205 from pie-framework/fix/mathjax-esm-adapter

## 0.1.1-next.1

### Patch Changes

- Merge pull request #193 from pie-framework/feat/PIE-1085

## 0.1.1-next.0

### Patch Changes

- 285c07c: A coalesced `session-changed` is no longer dropped when the element is torn down inside its own debounce window (PIE-1058).

  `@pie-element/shared-player-events` gains `createSessionNotifier`, which registers each deferred notification against its host element. One `flushSessionNotifiers(this)` call in `disconnectedCallback` commits everything the element owns, and the helper installs `commitPendingSession()` for a player to call before discarding the element — while it is still attached, so the event still reaches a `document`-level host listener. The install wraps an element-declared method of the same name, and disposing the last notifier removes it again, so a player never counts an element as committed while a pending dispatch is dropped. A dispatch that throws is reported through `onDispatchError`, defaulting to `console.warn`.

  All five elements that coalesced their session write adopt it. `extended-text-entry` and `explicit-constructed-response` also move their debounce off the value path onto the dispatch, so `.session` holds the response as soon as the editor commits it. No debounce delay changes.
