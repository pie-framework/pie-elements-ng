---
"@pie-element/shared-player-events": minor
"@pie-lib/mask-markup": minor
"@pie-element/extended-text-entry": minor
"@pie-element/explicit-constructed-response": minor
---

Extended text entry and explicit constructed response save the student's response once the student stops typing for the player's idle-save delay, not only when the editor loses focus. The player sets the delay through `sessionCommitContext` from `@pie-players/pie-context` (`idleSaveDelayMs`); without a provider, or with the field left out, the delay is 1500 ms, and `0` saves on blur only. `@pie-element/shared-player-events` exports `subscribeIdleSaveDelay`, `resolveIdleSaveDelay` and `DEFAULT_IDLE_SAVE_DELAY_MS` for this. `ConstructedResponse` in `@pie-lib/mask-markup` passes a new `idleSaveDelay` prop on to each blank's editor. Its `onChange` also gets the changed blank's id as a second argument, which explicit constructed response uses so a blank's save no longer overwrites another blank's answer. A player's `commitPendingSession()` now also sends a save still waiting in the response editor, so the session it commits holds what the student typed in the last delay.
