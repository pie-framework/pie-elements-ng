# @pie-element/shared-utils

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
