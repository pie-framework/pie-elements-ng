---
"@pie-element/mc-populated-blank": patch
---

Leave the session's `id` and `element` to the player, so a versioned tag survives a response (PIE-1075). Audio timing now survives the learner's next pick and `waitTime` is recorded, and a reset session clears the selection. An item missing its prompt, template or choices no longer shows demo content.
