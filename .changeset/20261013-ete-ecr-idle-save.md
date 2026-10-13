---
"@pie-lib/mask-markup": minor
"@pie-element/extended-text-entry": minor
"@pie-element/explicit-constructed-response": minor
---

Extended text entry and explicit constructed response save the student's response once the student stops typing for `playerIdleSaveDelay` milliseconds, not only when the editor loses focus. The new model property defaults to 1000, and 0 saves on blur only. `ConstructedResponse` in `@pie-lib/mask-markup` passes a new `idleSaveDelay` prop on to each blank's editor.
