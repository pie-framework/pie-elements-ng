# @pie-element/shared-controller-utils

## 0.1.1-next.7

### Patch Changes

- Updated dependencies [4ffda53]
  - @pie-element/shared-types@0.2.0-next.4

## 0.1.1-next.6

### Patch Changes

- Fix: republish to replace workspace:* with resolved versions in published manifests
- Republish shared packages with resolved workspace:* dependencies (fixes broken 0.1.0 manifests on npm)
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
- The shuffled choice order is saved through `updateSession`, so the next render shows the same order. These elements shuffle each part separately and never saved the result, so every render shuffled again.
- A session without an `id` or `element` keeps its shuffled choice order across renders. The order is saved through `updateSession`, which receives both as `undefined`, as in pie-elements.
- Updated dependencies
- Updated dependencies
- Updated dependencies
  - @pie-element/shared-types@0.2.0-next.3

## 0.1.1-next.5

### Patch Changes

- 1ecdcf5: The instructor role no longer locks the choice order, as in pie-elements: an instructor sees the order stored in the session, and a session with none gets a new shuffle, saved as for a student. inline-dropdown still shows an instructor the authored order in view and evaluate mode while choice rationales are enabled. A host that wants the authored order sets `env['@pie-element'].lockChoiceOrder`. (PIE-714)
- 24caee6: The shuffled choice order is saved through `updateSession`, so the next render shows the same order. These elements shuffle each part separately and never saved the result, so every render shuffled again.
- 24caee6: A session without an `id` or `element` keeps its shuffled choice order across renders. The order is saved through `updateSession`, which receives both as `undefined`, as in pie-elements.

## 0.1.1-next.4

### Patch Changes

- Updated dependencies [e3aa4f8]
  - @pie-element/shared-types@0.2.0-next.2

## 0.1.1-next.3

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
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
