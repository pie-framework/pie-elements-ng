# @pie-element/shared-player-events

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
