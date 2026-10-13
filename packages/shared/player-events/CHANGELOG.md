# @pie-element/shared-player-events

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
