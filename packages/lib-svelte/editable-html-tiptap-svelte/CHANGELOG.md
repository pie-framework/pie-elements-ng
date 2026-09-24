# @pie-lib/editable-html-tiptap-svelte

## 0.1.3-next.1

### Patch Changes

- d8f1c99: Scope the editor styles to the editor, and stop reporting changes the author did not make.
- 85910c0: The rich-text editor shows its `placeholder` while empty, as the React editor does; the prop was accepted and never displayed (PIE-1075).
- 3f989fb: The rich-text editor's Done and alignment buttons take the editor stylesheet's padding, colours and hover states, which hard-coded inline styles overrode (PIE-1075).
- 3f989fb: The type declarations in `dist` resolve on their own and export `EditableHtmlProps` (PIE-1075).

## 0.1.3-next.0

### Patch Changes

- Updated dependencies [7634975]
  - @pie-lib/styling-svelte@0.1.3-next.0

## 0.1.2

### Patch Changes

- Publish Svelte styling under a publishable npm scope and update dependent packages to consume the published library.
- Updated dependencies
  - @pie-lib/styling-svelte@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies
  - @pie-lib-svelte/styling@0.1.1
