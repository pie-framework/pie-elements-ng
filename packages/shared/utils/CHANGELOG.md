# @pie-element/shared-utils

## 0.1.7

### Patch Changes

- [#550](https://github.com/pie-framework/pie-elements-ng/pull/550) [`8f90c30`](https://github.com/pie-framework/pie-elements-ng/commit/8f90c30d2149d0070c660208729d0cb506ebdc26) Thanks [@chillenious](https://github.com/chillenious)! - Keys that commit or steer an IME composition no longer trigger element shortcuts: Enter and Escape in a drawing-response text box, Escape in math-inline, the arrow keys on fraction-model's count fields, and multiple choice's number and letter shortcuts. Safari's committing Enter, which reports `keyCode` 229 with `isComposing` false, is covered. `@pie-element/shared-utils` exports the check as `isComposingKeyEvent`.

- [#559](https://github.com/pie-framework/pie-elements-ng/pull/559) [`efc633c`](https://github.com/pie-framework/pie-elements-ng/commit/efc633cb4a3b7870f2237d374d43bcd6d1b18d8c) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.4 to 8.3.5

- [#570](https://github.com/pie-framework/pie-elements-ng/pull/570) [`0585bc2`](https://github.com/pie-framework/pie-elements-ng/commit/0585bc20bf7669c380e6a30e6f8816152063d514) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vitest from 4.1.11 to 5.0.5

- [#641](https://github.com/pie-framework/pie-elements-ng/pull/641) [`6b3a398`](https://github.com/pie-framework/pie-elements-ng/commit/6b3a3987fe0b11cc885d75168622ccbfa85d5e44) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump the test-dependencies group across 1 directory with 2 updates

- [#647](https://github.com/pie-framework/pie-elements-ng/pull/647) [`7d3a323`](https://github.com/pie-framework/pie-elements-ng/commit/7d3a32301eb3393937961919256da39e57e8104f) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.3.5 to 8.3.6

- [#655](https://github.com/pie-framework/pie-elements-ng/pull/655) [`174a4b8`](https://github.com/pie-framework/pie-elements-ng/commit/174a4b8c7273efcf8da799eccc7cf8577bcf062e) Thanks [@chillenious](https://github.com/chillenious)! - build: ship third-party license notices in every bundling package

- [#656](https://github.com/pie-framework/pie-elements-ng/pull/656) [`ab1c731`](https://github.com/pie-framework/pie-elements-ng/commit/ab1c7310a6129afbbcfff49d9055ad726e2b9356) Thanks [@chillenious](https://github.com/chillenious)! - fix(packaging): ship the MIT LICENSE in every publishable package

- [#582](https://github.com/pie-framework/pie-elements-ng/pull/582) [`0fcf803`](https://github.com/pie-framework/pie-elements-ng/commit/0fcf8036fc88c44d4cb7b38181e99f7e21e0d2a2) Thanks [@chillenious](https://github.com/chillenious)! - In right-to-left fields the arrow key that steps back over a math node is ArrowRight, the math toolbar opens from the right edge of the math node, and blockquotes, drag-in-the-blank choices, inline dropdowns and math-templated response boxes lay out from the inline start.

  `@pie-element/shared-utils` adds `inlineSideOfArrow` and `isRightToLeft`, which map a horizontal arrow key to the inline start or end from the element's computed direction when the key is pressed.
- Updated dependencies [[`6ac2b66`](https://github.com/pie-framework/pie-elements-ng/commit/6ac2b6616b4c49333cf0aee02d08d89b453a73cd), [`5479c19`](https://github.com/pie-framework/pie-elements-ng/commit/5479c19523118e69286e8dc8d142eb183edbdf2b), [`2867c08`](https://github.com/pie-framework/pie-elements-ng/commit/2867c082419e42a211067959be12d8e310403e2e), [`d18d9e7`](https://github.com/pie-framework/pie-elements-ng/commit/d18d9e72bb88dc5911cbbd3dab7d314682536961), [`db48dfd`](https://github.com/pie-framework/pie-elements-ng/commit/db48dfd851ae4385d068a9f94cc092bdd05833d3), [`f6e8801`](https://github.com/pie-framework/pie-elements-ng/commit/f6e880189215966f224b93da5072cfa1e8d1b839), [`9072e7c`](https://github.com/pie-framework/pie-elements-ng/commit/9072e7cca26f08246c8f85984651f5b3cbad1a93)]:
  - @pie-element/shared-types@0.2.4

## 0.1.6

### Patch Changes

- [#537](https://github.com/pie-framework/pie-elements-ng/pull/537) [`b0ec80f`](https://github.com/pie-framework/pie-elements-ng/commit/b0ec80f12fd27eb84f8622ed31edd5a5b09712a5) Thanks [@chillenious](https://github.com/chillenious)! - The prompt-audio elements share one implementation of autoplay, `completeAudioEnabled` and audio
  timing from `@pie-element/shared-utils`. image-cloze-association now records `audioStartTime`,
  `audioEndTime` and `waitTime` like the others, so the session changes when its prompt audio ends
  (PIE-1340).

- [#499](https://github.com/pie-framework/pie-elements-ng/pull/499) [`0eb31a8`](https://github.com/pie-framework/pie-elements-ng/commit/0eb31a86b9b71f9b8acaea1dea83f827f223c295) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps): bump dompurify from 3.4.16 to 3.4.17

- [#501](https://github.com/pie-framework/pie-elements-ng/pull/501) [`6bf1082`](https://github.com/pie-framework/pie-elements-ng/commit/6bf1082d7732ff9c28a010d0344c1749852c43d3) Thanks [@dependabot](https://github.com/apps/dependabot)! - chore(deps)(deps-dev): bump vite from 8.1.5 to 8.3.4
- Updated dependencies [[`0a16eb5`](https://github.com/pie-framework/pie-elements-ng/commit/0a16eb585bd48633b5ec7d81a8cc502a8002d3a9)]:
  - @pie-element/shared-types@0.2.3

## 0.1.5

### Patch Changes

- [#476](https://github.com/pie-framework/pie-elements-ng/pull/476) [`306f0fd`](https://github.com/pie-framework/pie-elements-ng/commit/306f0fd281436a318a3c7b7d051e8bb65249b293) Thanks [@chillenious](https://github.com/chillenious)! - Prompt audio honours `autoplayAudioHeld`, which pie-players' item player writes when the host holds autoplay: the audio does not start on its own and the learner gets native controls to start it. EBSR holds both parts. The model sanitizer drops authored `autoplay`, so the model setting is the only start. Completion no longer waits on prompt audio that failed to load, has no source, or that a resumed session (`audioEndTime`) already played.

- [#477](https://github.com/pie-framework/pie-elements-ng/pull/477) [`2751283`](https://github.com/pie-framework/pie-elements-ng/commit/275128308e656ed8d9296f5e49b4ff891245206c) Thanks [@chillenious](https://github.com/chillenious)! - refactor(shared-utils): move the autoplay strip into a prompt-audio feature list (PIE-1286)
- Updated dependencies [[`4d6379c`](https://github.com/pie-framework/pie-elements-ng/commit/4d6379cf5c32a6e89ba923cf167f125307d027e3)]:
  - @pie-element/shared-types@0.2.2

## 0.1.4

### Patch Changes

- Updated dependencies [[`7ca6fe6`](https://github.com/pie-framework/pie-elements-ng/commit/7ca6fe6735c2b9b95209b39221c6484ac282bbdf)]:
  - @pie-element/shared-types@0.2.1

## 0.1.3

### Patch Changes

- [#397](https://github.com/pie-framework/pie-elements-ng/pull/397) [`b0fd8ee`](https://github.com/pie-framework/pie-elements-ng/commit/b0fd8ee4fd76fd3c3bd4c02276673e05965a5184) Thanks [@chillenious](https://github.com/chillenious)! - `sanitizeModelHtml` keeps elementary math (`mstack`, `mlongdiv` and their groups, rows, lines and carries, with their attributes) and `mspace`'s `linebreak`, which it reduced to a row of digits. A link whose handler only plays an `<audio>` by id, as Star's listening prompts do, plays it again: the sanitizer moves the id to `data-pie-play-audio`, and one document listener plays it.

- [#403](https://github.com/pie-framework/pie-elements-ng/pull/403) [`0526cf9`](https://github.com/pie-framework/pie-elements-ng/commit/0526cf9527c94fc7a3bc994a25de250a6cd75dc9) Thanks [@chillenious](https://github.com/chillenious)! - feat(shared-utils): mark authored colors in model HTML (PIE-1119)

## 0.1.2

### Patch Changes

- [#392](https://github.com/pie-framework/pie-elements-ng/pull/392) [`0804268`](https://github.com/pie-framework/pie-elements-ng/commit/080426876dda8057c150dd4b2e08f5e0f00c45ec) Thanks [@chillenious](https://github.com/chillenious)! - Add `sanitizeModelHtml`, which elements run model rich text through before writing it into the DOM: scripts, inline event handlers and `javascript:` URLs are removed.

## 0.1.1

### Patch Changes

- [#23](https://github.com/pie-framework/pie-elements-ng/pull/23) [`509caf6`](https://github.com/pie-framework/pie-elements-ng/commit/509caf638617921bb62037b4e0d5d69b5bdca37d) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Fix: republish to replace workspace:* with resolved versions in published manifests

- [#27](https://github.com/pie-framework/pie-elements-ng/pull/27) [`5ca8ec1`](https://github.com/pie-framework/pie-elements-ng/commit/5ca8ec140ac4b115c8d11cb783d856be42f3de7b) Thanks [@CarlaCostea](https://github.com/CarlaCostea)! - Republish shared packages with resolved workspace:* dependencies (fixes broken 0.1.0 manifests on npm)
- Updated dependencies [[`1d74cc2`](https://github.com/pie-framework/pie-elements-ng/commit/1d74cc2527432a58a73752b62e069fbf92fa0a43), [`7abcbd2`](https://github.com/pie-framework/pie-elements-ng/commit/7abcbd20a631a99df3c58158eaee953596615633), [`e3aa4f8`](https://github.com/pie-framework/pie-elements-ng/commit/e3aa4f863fddb219b58e9cdb0ababeeb84795021), [`3e49e88`](https://github.com/pie-framework/pie-elements-ng/commit/3e49e88b2768e706859eb54e1dfcb5223afe8b4c), [`4ffda53`](https://github.com/pie-framework/pie-elements-ng/commit/4ffda53aa3441080a56847d43b43698ba9a8d735)]:
  - @pie-element/shared-types@0.2.0

## 0.1.1-next.7

### Patch Changes

- Updated dependencies [3e49e88]
  - @pie-element/shared-types@0.2.0-next.5

## 0.1.1-next.6

### Patch Changes

- Updated dependencies [4ffda53]
  - @pie-element/shared-types@0.2.0-next.4

## 0.1.1-next.5

### Patch Changes

- Fix: republish to replace workspace:* with resolved versions in published manifests
- Republish shared packages with resolved workspace:* dependencies (fixes broken 0.1.0 manifests on npm)
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-element/shared-types@0.2.0-next.3

## 0.1.1-next.4

### Patch Changes

- Updated dependencies [e3aa4f8]
  - @pie-element/shared-types@0.2.0-next.2

## 0.1.1-next.3

### Patch Changes

- Updated dependencies [7abcbd2]
  - @pie-element/shared-types@0.2.0-next.1

## 0.1.1-next.2

### Patch Changes

- Updated dependencies [1d74cc2]
  - @pie-element/shared-types@0.2.0-next.0

## 0.1.1-next.1

### Patch Changes

- 5ca8ec1: Republish shared packages with resolved workspace:\* dependencies (fixes broken 0.1.0 manifests on npm)

## 0.1.1-next.0

### Patch Changes

- 509caf6: Fix: republish to replace workspace:\* with resolved versions in published manifests
