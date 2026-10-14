---
"@pie-lib/mask-markup": minor
"@pie-element/extended-text-entry": minor
"@pie-element/explicit-constructed-response": minor
---

Extended text entry and explicit constructed response save the student's response once the student stops typing for `playerIdleSaveDelay` milliseconds, not only when the editor loses focus. The new model property defaults to 1500, and 0 saves on blur only. `ConstructedResponse` in `@pie-lib/mask-markup` passes a new `idleSaveDelay` prop on to each blank's editor. Its `onChange` also gets the changed blank's id as a second argument, which explicit constructed response uses so a blank's save no longer overwrites another blank's answer. A player's `commitPendingSession()` now also sends a save still waiting in the response editor, so the session it commits holds what the student typed in the last delay.
