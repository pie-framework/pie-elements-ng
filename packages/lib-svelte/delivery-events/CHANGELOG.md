# @pie-lib/delivery-events-svelte

## 0.2.0

### Minor Changes

- [#179](https://github.com/pie-framework/pie-elements-ng/pull/179) [`53bed4b`](https://github.com/pie-framework/pie-elements-ng/commit/53bed4b0373ba756b545f45541a6af2d9430da52) Thanks [@chillenious](https://github.com/chillenious)! - `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.

### Patch Changes

- [#147](https://github.com/pie-framework/pie-elements-ng/pull/147) [`ea07637`](https://github.com/pie-framework/pie-elements-ng/commit/ea0763784c4c84bc1b9a0ee7e04a461ff2b5ef76) Thanks [@chillenious](https://github.com/chillenious)! - The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).
  
  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.
  
  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.

- [#165](https://github.com/pie-framework/pie-elements-ng/pull/165) [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713) Thanks [@chillenious](https://github.com/chillenious)! - Write the session before the fallback `session-changed`.

- [#168](https://github.com/pie-framework/pie-elements-ng/pull/168) [`54d6ad4`](https://github.com/pie-framework/pie-elements-ng/commit/54d6ad4b28fe9c0c9a3e7c36d856b24da0c124a0) Thanks [@chillenious](https://github.com/chillenious)! - `resolveDeliveryHost` continues from a shadow root to its host, so a wrapper that renders the element inside its own shadow root is found. `forwardSessionChange` warns once per source element when there is no host to forward to (PIE-1075).

- [#165](https://github.com/pie-framework/pie-elements-ng/pull/165) [`a84b6c5`](https://github.com/pie-framework/pie-elements-ng/commit/a84b6c5e14a67655c8e5e8ec7840032ea8ef8713) Thanks [@chillenious](https://github.com/chillenious)! - Leave the session's `element` to the player (PIE-1075).
- Updated dependencies [[`285c07c`](https://github.com/pie-framework/pie-elements-ng/commit/285c07c8e426d64c63e0719f3046246068edae21), [`303496f`](https://github.com/pie-framework/pie-elements-ng/commit/303496f4da5b06cdf479ee4f184b07200bf34b53), [`3e7bed4`](https://github.com/pie-framework/pie-elements-ng/commit/3e7bed4be9c77e42f044547304dd67852b873209)]:
  - @pie-element/shared-player-events@0.1.1

## 0.2.0-next.5

### Minor Changes

- `defineDeliveryElement` builds a Svelte delivery element from its component and an `isComplete` rule, and hands the component `onSessionChange` as a prop. `resolveDeliveryHost`, `forwardSessionChange` and `DeliveryHostElement` are removed. The three Svelte elements are built on it: `element.session` returns the player's session object after an update, and mc-populated-blank's `model-set` now reports a restored response as complete.

### Patch Changes

- The Svelte delivery elements write each session update into the object the player handed them, through the new `writeSessionInPlace` in `@pie-lib/delivery-events-svelte` (PIE-1058).
  
  A player reads the learner's response back off that object, so replacing the reference left the player's entry at its load-time value and the forwarded container normalized to `session: null` with `intent: "metadata-only"`. All three elements-svelte packages shared the defect, and `mc-populated-blank`'s audio handlers dropped `audioStartTime`/`audioEndTime` the same way.
  
  The elements-svelte packages do not adopt `createSessionNotifier`: they dispatch synchronously, so installing `commitPendingSession()` would tell a player they had committed when nothing was pending.
- Write the session before the fallback `session-changed`.
- `resolveDeliveryHost` continues from a shadow root to its host, so a wrapper that renders the element inside its own shadow root is found. `forwardSessionChange` warns once per source element when there is no host to forward to (PIE-1075).
- Leave the session's `element` to the player (PIE-1075).
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-element/shared-player-events@0.1.1-next.3

## 0.2.0-next.4

### Patch Changes

- Updated dependencies
  - @pie-element/shared-player-events@0.1.1-next.2

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
