# @pie-element/shared-player-events

## 0.1.1-next.1

### Patch Changes

- Merge pull request #193 from pie-framework/feat/PIE-1085

## 0.1.1-next.0

### Patch Changes

- 285c07c: A coalesced `session-changed` is no longer dropped when the element is torn down inside its own debounce window (PIE-1058).

  `@pie-element/shared-player-events` gains `createSessionNotifier`, which registers each deferred notification against its host element. One `flushSessionNotifiers(this)` call in `disconnectedCallback` commits everything the element owns, and the helper installs `commitPendingSession()` for a player to call before discarding the element — while it is still attached, so the event still reaches a `document`-level host listener. The install wraps an element-declared method of the same name, and disposing the last notifier removes it again, so a player never counts an element as committed while a pending dispatch is dropped. A dispatch that throws is reported through `onDispatchError`, defaulting to `console.warn`.

  All five elements that coalesced their session write adopt it. `extended-text-entry` and `explicit-constructed-response` also move their debounce off the value path onto the dispatch, so `.session` holds the response as soon as the editor commits it. No debounce delay changes.
