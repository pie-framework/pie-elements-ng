# @pie-element/graphing-solution-set

## 6.1.2-next.19

### Patch Changes

- 473da8e: Browser ESM and legacy print bundles install the stylesheets they import, MathQuill's among them, so math fields render styled in the player and in hosts that bundle the elements with Vite or webpack. MathQuill's font ships as a WOFF2 file beside the bundle.
- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2
  - @pie-lib/config-ui@14.0.0-next.40
  - @pie-lib/correct-answer-toggle@5.0.0-next.48
  - @pie-lib/editable-html-tip-tap@3.0.0-next.40
  - @pie-lib/graphing-solution-set@5.0.0-next.43
  - @pie-lib/render-ui@6.2.0-next.46

## 6.1.2-next.18

### Patch Changes

- e79662b: The author element merges the host's configuration over its defaults, as the element contract requires, so a configuration without `language` no longer throws.
- Updated dependencies
  - @pie-element/shared-configure-events@0.1.1-next.0
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1
  - @pie-element/shared-player-events@0.1.1-next.1
  - @pie-lib/editable-html-tip-tap@3.0.0-next.39
  - @pie-lib/render-ui@6.2.0-next.45
  - @pie-lib/graphing-solution-set@5.0.0-next.42
  - @pie-lib/config-ui@14.0.0-next.39
  - @pie-lib/correct-answer-toggle@5.0.0-next.47

## 6.1.2-next.17

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/config-ui@14.0.0-next.38
  - @pie-lib/correct-answer-toggle@5.0.0-next.46
  - @pie-lib/editable-html-tip-tap@3.0.0-next.38
  - @pie-lib/graphing-solution-set@5.0.0-next.41
  - @pie-lib/render-ui@6.2.0-next.44

## 6.1.2-next.16

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/config-ui@14.0.0-next.37
  - @pie-lib/correct-answer-toggle@5.0.0-next.45
  - @pie-lib/editable-html-tip-tap@3.0.0-next.37
  - @pie-lib/graphing-solution-set@5.0.0-next.40
  - @pie-lib/render-ui@6.2.0-next.43

## 6.1.2-next.15

### Patch Changes

- @pie-lib/graphing-solution-set@5.0.0-next.39

## 6.1.2-next.14

### Patch Changes

- @pie-lib/correct-answer-toggle@5.0.0-next.44
- @pie-lib/graphing-solution-set@5.0.0-next.38

## 6.1.2-next.13

### Patch Changes

- Merge pull request #175 from pie-framework/fix/author-shim-cross-element-bundles
  - @pie-lib/correct-answer-toggle@5.0.0-next.43
  - @pie-lib/graphing-solution-set@5.0.0-next.37

## 6.1.2-next.12

### Patch Changes

- Updated dependencies [2f26122]
- Updated dependencies [f3f1abb]
- Updated dependencies [d22cfb1]
- Updated dependencies [4fe8ce6]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42
  - @pie-lib/editable-html-tip-tap@3.0.0-next.36
  - @pie-lib/config-ui@14.0.0-next.36
  - @pie-lib/correct-answer-toggle@5.0.0-next.42
  - @pie-lib/graphing-solution-set@5.0.0-next.36

## 6.1.2-next.11

### Patch Changes

- Updated dependencies [285c07c]
  - @pie-element/shared-player-events@0.1.1-next.0

## 6.1.2-next.10

### Patch Changes

- Updated dependencies [ed2cbd6]
  - @pie-lib/config-ui@14.0.0-next.35
  - @pie-lib/correct-answer-toggle@5.0.0-next.41
  - @pie-lib/editable-html-tip-tap@3.0.0-next.35
  - @pie-lib/graphing-solution-set@5.0.0-next.35
  - @pie-lib/render-ui@6.2.0-next.41

## 6.1.2-next.9

### Patch Changes

- Updated dependencies [7cae8f9]
- Updated dependencies [a204d11]
  - @pie-lib/render-ui@6.2.0-next.40
  - @pie-lib/graphing-solution-set@4.0.4-next.34
  - @pie-lib/editable-html-tip-tap@2.1.2-next.34
  - @pie-lib/config-ui@13.0.4-next.34
  - @pie-lib/correct-answer-toggle@4.0.3-next.40

## 6.1.2-next.8

### Patch Changes

- Updated dependencies [425feaf]
- Updated dependencies [425feaf]
  - @pie-lib/editable-html-tip-tap@2.1.2-next.33
  - @pie-lib/graphing-solution-set@4.0.4-next.33
  - @pie-lib/config-ui@13.0.4-next.33

## 6.1.2-next.7

### Patch Changes

- a644ec3: Declare react and react-dom as installable dependencies pinned to the browser ESM shared version (18.2.0), not peer-only. Legacy webpack bundlers install dependencies and never peers, so peer-only React left node_modules/react absent and every @mui/@emotion/@dnd-kit peer failed to resolve. Bundle output is unchanged - React stays external in every build.

## 6.1.2-next.6

### Patch Changes

- Updated dependencies [d6e12a5]
  - @pie-lib/config-ui@13.0.4-next.32
  - @pie-lib/editable-html-tip-tap@2.1.2-next.32
  - @pie-lib/render-ui@6.1.1-next.39
  - @pie-lib/graphing-solution-set@4.0.4-next.32
  - @pie-lib/correct-answer-toggle@4.0.3-next.39

## 6.1.2-next.5

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/config-ui@13.0.4-next.31
  - @pie-lib/correct-answer-toggle@4.0.3-next.38
  - @pie-lib/editable-html-tip-tap@2.1.2-next.31
  - @pie-lib/graphing-solution-set@4.0.4-next.31
  - @pie-lib/render-ui@6.1.1-next.38

## 6.1.2-next.4

### Patch Changes

- Trigger another prerelease patch for all PIE element packages.

## 6.1.2-next.3

### Patch Changes

- Trigger the next prerelease patch for all PIE element packages.

## 6.1.2-next.2

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.30
  - @pie-lib/render-ui@6.1.1-next.37
  - @pie-lib/graphing-solution-set@4.0.4-next.30
  - @pie-lib/config-ui@13.0.4-next.30
  - @pie-lib/correct-answer-toggle@4.0.3-next.37

## 6.1.2-next.1

### Patch Changes

- Prepare all PIE element packages for the next prerelease patch wave
- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/correct-answer-toggle@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/graphing-solution-set@4.0.4-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 6.1.2-next.0

### Patch Changes

- Publish corrected React element next prereleases from stable npm baselines.

## 6.1.1-next.0

### Patch Changes

- 33d27e0: define and enforce packaging contracts PIE-626

## 6.1.1-next.0

### Patch Changes

- Updated dependencies [b34750c]
  - @pie-lib/config-ui@13.0.4-next.0
  - @pie-lib/correct-answer-toggle@4.0.3-next.0
  - @pie-lib/editable-html-tip-tap@2.1.2-next.0
  - @pie-lib/render-ui@6.1.1-next.0
  - @pie-lib/graphing-solution-set@4.0.4-next.0
