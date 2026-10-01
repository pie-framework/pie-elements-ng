# @pie-lib/drag

## 4.1.0-next.53

### Patch Changes

- Updated dependencies [3bad6b6]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.7
  - @pie-lib/render-ui@6.2.0-next.52

## 4.1.0-next.52

### Patch Changes

- Updated dependencies [c96fae3]
  - @pie-lib/render-ui@6.2.0-next.51

## 4.1.0-next.51

### Minor Changes

- Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- Publish ng ESM builds for PIE lib packages
- Paint the empty choice slot on the surface token, so placement-ordering's empty slots follow the theme (PIE-872)
- Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Merge pull request #219 from pie-framework/chore/remove-unused-code
- Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.
  
  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies
- Updated dependencies [b6ef8b1]
- Updated dependencies
  - @pie-lib/render-ui@6.2.0-next.50
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.6
  - @pie-element/shared-lodash@0.1.1-next.3

## 4.1.0-next.50

### Patch Changes

- Updated dependencies [54541e0]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.5
  - @pie-lib/render-ui@6.2.0-next.49

## 4.1.0-next.49

### Patch Changes

- Merge pull request #219 from pie-framework/chore/remove-unused-code

## 4.1.0-next.48

### Patch Changes

- Updated dependencies [80e386a]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.4
  - @pie-lib/render-ui@6.2.0-next.48

## 4.1.0-next.47

### Patch Changes

- Updated dependencies [6ed08c4]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.3
  - @pie-lib/render-ui@6.2.0-next.47

## 4.1.0-next.46

### Patch Changes

- 7abcbd2: Element packages export `./package.json` and accept React 18.2 or 19 as peers, and the React libraries they use accept React 19. `@emotion/style` and `@pie-lib/test-utils` are gone from runtime dependencies. Multiple choice dispatches `session-changed` when the student answers and no longer when its session is set, and EBSR's session holds a part's answer as soon as the part records it. MathJax initializes once per page, and `PieUpdateSession` types the `updateSession(id, element, properties)` call controllers make.
- Updated dependencies [7abcbd2]
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.2
  - @pie-lib/render-ui@6.2.0-next.46

## 4.1.0-next.45

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.1
  - @pie-lib/render-ui@6.2.0-next.45

## 4.1.0-next.44

### Patch Changes

- Updated dependencies [d242e4c]
  - @pie-element/shared-lodash@0.1.1-next.2
  - @pie-lib/render-ui@6.2.0-next.44

## 4.1.0-next.43

### Patch Changes

- Merge pull request #131 from pie-framework/dependabot/bun/vitejs/plugin-react-6.1.1
- Updated dependencies
  - @pie-lib/render-ui@6.2.0-next.43

## 4.1.0-next.42

### Patch Changes

- 4fe8ce6: Paint the empty choice slot on the surface token, so placement-ordering's empty slots follow the theme (PIE-872)
- Updated dependencies [2f26122]
- Updated dependencies [4fe8ce6]
  - @pie-lib/render-ui@6.2.0-next.42

## 4.1.0-next.41

### Patch Changes

- @pie-lib/render-ui@6.2.0-next.41

## 4.1.0-next.40

### Minor Changes

- 7cae8f9: Add a surface theming token and use it for drag placeholders, so placeholder fills come from the theme instead of hard-coded greys (PIE-865, PIE-870, PIE-874, PIE-878)

### Patch Changes

- Updated dependencies [7cae8f9]
  - @pie-lib/render-ui@6.2.0-next.40

## 4.0.3-next.39

### Patch Changes

- Updated dependencies [d6e12a5]
  - @pie-lib/render-ui@6.1.1-next.39

## 4.0.3-next.38

### Patch Changes

- Updated dependencies
  - @pie-element/shared-lodash@0.1.1-next.1
  - @pie-lib/render-ui@6.1.1-next.38

## 4.0.3-next.37

### Patch Changes

- Updated dependencies
  - @pie-element/shared-math-rendering-mathjax@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.37

## 4.0.3-next.0

### Patch Changes

- a4c6279: Vendor the lodash helper surface through `@pie-element/shared-lodash` so browser ESM output no longer depends on runtime lodash or lodash-es resolution.

  Replace `@pie-lib/config-ui`'s tiny `mathjs` fraction-to-number usage with a generated local helper, while keeping `mathjs@^15.2.0` for packages such as `@pie-element/number-line` that use the broader math surface.

- Updated dependencies [a4c6279]
  - @pie-element/shared-lodash@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.0

## 4.0.3-next.0

### Patch Changes

- b34750c: Publish ng ESM builds for PIE lib packages
- Updated dependencies [b34750c]
  - @pie-lib/math-rendering@0.1.1-next.0
  - @pie-lib/render-ui@6.1.1-next.0
