---
'@pie-element/mc-populated-blank': minor
'@pie-element/simple-cloze': patch
'@pie-element/venn-classification': patch
'@pie-lib/delivery-events-svelte': patch
---

`mc-populated-blank` reports the learner's selection where a player reads it (PIE-1058).

The session key is `value`, renamed from `choiceId`. `value` is the key `hasResponseValue` in `players-shared`, the item controller's overwrite guard and the teardown commit's discriminant all read, so an element-specific name left the response invisible to all three, and silently so. No session migration: Quiz Engine could not render this element until now.

The Svelte delivery wrappers write each update into the session object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte`. A player reads the response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three Svelte elements shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.

The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.
