---
"@pie-lib/delivery-events-svelte": minor
"@pie-element/mc-populated-blank": patch
"@pie-element/simple-cloze": patch
"@pie-element/venn-classification": patch
---

`defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.
