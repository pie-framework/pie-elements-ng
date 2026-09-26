# @pie-element/shared-math-rendering-mathjax

## 0.1.1-next.2

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.

## 0.1.1-next.1

### Patch Changes

- Merge pull request #193 from pie-framework/feat/PIE-1085

## 0.1.1-next.0

### Patch Changes

- Delegate ESM math rendering to the player-owned renderer with standalone fallback
