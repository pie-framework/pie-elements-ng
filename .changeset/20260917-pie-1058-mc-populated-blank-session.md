---
'@pie-element/mc-populated-blank': patch
'@pie-element/simple-cloze': patch
'@pie-element/venn-classification': patch
'@pie-lib/delivery-events-svelte': patch
---

The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).

A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.

The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.
