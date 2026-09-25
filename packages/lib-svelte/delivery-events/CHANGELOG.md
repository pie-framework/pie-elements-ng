# @pie-lib/delivery-events-svelte

## 0.2.0-next.3

### Patch Changes

- Updated dependencies
  - @pie-element/shared-player-events@0.1.1-next.1

## 0.2.0-next.2

### Minor Changes

- 53bed4b: `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.

## 0.1.1-next.1

### Patch Changes

- a84b6c5: Write the session before the fallback `session-changed`.
- 54d6ad4: `resolveDeliveryHost` continues from a shadow root to its host, so a wrapper that renders the element inside its own shadow root is found. `forwardSessionChange` warns once per source element when there is no host to forward to (PIE-1075).
- a84b6c5: Leave the session's `element` to the player (PIE-1075).

## 0.1.1-next.0

### Patch Changes

- ea07637: The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).

  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.

  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.

- Updated dependencies [285c07c]
  - @pie-element/shared-player-events@0.1.1-next.0
