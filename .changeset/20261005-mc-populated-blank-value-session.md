---
"@pie-element/mc-populated-blank": patch
---

mc-populated-blank stores the learner's pick as `value`, a one-entry array of choice ids as in multiple-choice, in place of `choiceId` (PIE-1218). Hosts that read the response from `value` now get it. Sessions holding `choiceId` still score and render, and the next pick replaces it.
