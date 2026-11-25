# @pie-lib/delivery-events-svelte

## 0.2.4

### Patch Changes

- [#718](https://github.com/pie-framework/pie-elements-ng/pull/718) [`32d8334`](https://github.com/pie-framework/pie-elements-ng/commit/32d83340a0939d588bea7ab6297964ac68665821) Thanks [@chillenious](https://github.com/chillenious)! - chore: bump Kit, DaisyUI and Vite, share the IIFE and resolver configs, fix the dev:demo port lock
- Updated dependencies [[`5d5d6ab`](https://github.com/pie-framework/pie-elements-ng/commit/5d5d6abcdf7d12a03700d47d6744b404bd6187d3)]:
  - @pie-element/shared-i18n@0.1.4
  - @pie-element/shared-player-events@0.2.3

## 0.2.3

### Patch Changes

- [#633](https://github.com/pie-framework/pie-elements-ng/pull/633) [`736ad4f`](https://github.com/pie-framework/pie-elements-ng/commit/736ad4fe6edf8a3fb5af17fe0adf0e936d1368ab) Thanks [@chillenious](https://github.com/chillenious)! - The Svelte elements' interface strings ship in fourteen interface languages and follow the interface locale a player publishes, else the item's declared language, else US English: the correct-answer and teacher-instructions toggles, status messages, blank and choice names, the Venn tray, region and tile names with their announcements, and the video's status messages and transcript controls. An element first renders once its language has loaded, so it shows no English frame first. The element keeps the item's declared language as its content `lang`, and stamps none for an item that declares none. A video stimulus with no declared language no longer reads as English, and its authored `uiText` overrides apply in every interface language.

- [#552](https://github.com/pie-framework/pie-elements-ng/pull/552) [`b00321c`](https://github.com/pie-framework/pie-elements-ng/commit/b00321cc5bc48b72de24f6e5db52fb446a5e9e8d) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the dev-dependencies group across 1 directory with 3 updates

- [#559](https://github.com/pie-framework/pie-elements-ng/pull/559) [`efc633c`](https://github.com/pie-framework/pie-elements-ng/commit/efc633cb4a3b7870f2237d374d43bcd6d1b18d8c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.4 to 8.3.5

- [#615](https://github.com/pie-framework/pie-elements-ng/pull/615) [`ca4e017`](https://github.com/pie-framework/pie-elements-ng/commit/ca4e01737d08875caa6b334f0f596332a31be45e) Thanks [@chillenious](https://github.com/chillenious)! - chore: declare the MIT licence in every published manifest

- [#647](https://github.com/pie-framework/pie-elements-ng/pull/647) [`7d3a323`](https://github.com/pie-framework/pie-elements-ng/commit/7d3a32301eb3393937961919256da39e57e8104f) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.5 to 8.3.6

- [#655](https://github.com/pie-framework/pie-elements-ng/pull/655) [`174a4b8`](https://github.com/pie-framework/pie-elements-ng/commit/174a4b8c7273efcf8da799eccc7cf8577bcf062e) Thanks [@chillenious](https://github.com/chillenious)! - build: ship third-party license notices in every bundling package

- [#656](https://github.com/pie-framework/pie-elements-ng/pull/656) [`ab1c731`](https://github.com/pie-framework/pie-elements-ng/commit/ab1c7310a6129afbbcfff49d9055ad726e2b9356) Thanks [@chillenious](https://github.com/chillenious)! - fix(packaging): ship the MIT LICENSE in every publishable package
- Updated dependencies [[`dda73a6`](https://github.com/pie-framework/pie-elements-ng/commit/dda73a6124deccb371b9b93ab9c515495e1e7f35), [`c16bda2`](https://github.com/pie-framework/pie-elements-ng/commit/c16bda219ae96974e60e6e747809b1481c01bee8), [`c9ddebe`](https://github.com/pie-framework/pie-elements-ng/commit/c9ddebe12ab58d1d1c98a27f09aeca7005464253), [`3d364e6`](https://github.com/pie-framework/pie-elements-ng/commit/3d364e651386bd5ec5c03c0cbac9800dbed51ea8), [`6ac2b66`](https://github.com/pie-framework/pie-elements-ng/commit/6ac2b6616b4c49333cf0aee02d08d89b453a73cd), [`5479c19`](https://github.com/pie-framework/pie-elements-ng/commit/5479c19523118e69286e8dc8d142eb183edbdf2b), [`2867c08`](https://github.com/pie-framework/pie-elements-ng/commit/2867c082419e42a211067959be12d8e310403e2e), [`ba9faca`](https://github.com/pie-framework/pie-elements-ng/commit/ba9facaa40cce2266b5357e137f83108101f346d), [`5314efa`](https://github.com/pie-framework/pie-elements-ng/commit/5314efacd01cac72358aceaaf157ed60d7c511f0), [`37be6b8`](https://github.com/pie-framework/pie-elements-ng/commit/37be6b84f1a50dcf53f6df9dccce05fd58d54c60), [`d18d9e7`](https://github.com/pie-framework/pie-elements-ng/commit/d18d9e72bb88dc5911cbbd3dab7d314682536961), [`db48dfd`](https://github.com/pie-framework/pie-elements-ng/commit/db48dfd851ae4385d068a9f94cc092bdd05833d3), [`f6e8801`](https://github.com/pie-framework/pie-elements-ng/commit/f6e880189215966f224b93da5072cfa1e8d1b839), [`4689dfa`](https://github.com/pie-framework/pie-elements-ng/commit/4689dfac1e9d83296c77ef001eabfac58ef62d16), [`d895fde`](https://github.com/pie-framework/pie-elements-ng/commit/d895fdeb39499be8bfff64d7e6f26e647959e948), [`38838ba`](https://github.com/pie-framework/pie-elements-ng/commit/38838bae2b474a1cb629b6d47022c4b64b740850)]:
  - @pie-element/shared-i18n@0.1.3
  - @pie-element/shared-player-events@0.2.2

## 0.2.2

### Patch Changes

- [#501](https://github.com/pie-framework/pie-elements-ng/pull/501) [`6bf1082`](https://github.com/pie-framework/pie-elements-ng/commit/6bf1082d7732ff9c28a010d0344c1749852c43d3) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.1.5 to 8.3.4
- Updated dependencies [[`0a16eb5`](https://github.com/pie-framework/pie-elements-ng/commit/0a16eb585bd48633b5ec7d81a8cc502a8002d3a9)]:
  - @pie-element/shared-player-events@0.2.1

## 0.2.1

### Patch Changes

- Updated dependencies [[`026d10e`](https://github.com/pie-framework/pie-elements-ng/commit/026d10ed3f16b1e016f8ad2d25facce600080857)]:
  - @pie-element/shared-player-events@0.2.0

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
