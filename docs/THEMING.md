# PIE Elements Theming

PIE elements are themed with CSS custom properties. Keep it simple:

- Set `--pie-*` variables on a wrapper element.
- Let variables cascade to all nested PIE elements.
- Prefer semantic tokens (`--pie-primary`, `--pie-correct`, etc.) over component-specific overrides.

## Packages

- `@pie-element/shared-theming`: core theme objects and CSS-variable helpers.
- `@pie-element/element-theme`: generic custom-element wrapper (`pie-element-theme`).
- `@pie-element/element-theme-daisyui`: DaisyUI wrapper/utilities (`pie-element-theme-daisyui`), no React hooks.
- `@pie-element/shared-theming-mui`: MUI adapter and React provider/hooks.

## Core Usage

```ts
import { PIE_LIGHT_THEME, generateCssVariables, injectCssVariables } from '@pie-element/shared-theming';

const vars = generateCssVariables(PIE_LIGHT_THEME);
injectCssVariables(vars); // defaults to document.documentElement
```

Or scope variables to a specific container:

```ts
const container = document.querySelector('.pie-container');
if (container) {
  injectCssVariables(vars, container as HTMLElement);
}
```

## Wrapper Usage

Generic wrapper:

```html
<pie-element-theme theme="light">
  <pie-esm-element-player element-name="multiple-choice"></pie-esm-element-player>
</pie-element-theme>
```

DaisyUI wrapper:

```html
<pie-element-theme-daisyui theme="auto">
  <pie-esm-element-player element-name="multiple-choice"></pie-esm-element-player>
</pie-element-theme-daisyui>
```

`theme` supports `light | dark | auto`.  
`scope` supports `self | document`.

## High-Value Variables

Use these first:

- Core: `--pie-text`, `--pie-background`, `--pie-border`
- Brand: `--pie-primary`, `--pie-primary-light`, `--pie-primary-dark`
- Status: `--pie-correct`, `--pie-incorrect`, `--pie-missing`
- Focus: `--pie-focus-checked`, `--pie-focus-checked-border`

Component-specific tokens still exist (e.g. `--choice-input-*`, `--feedback-*`) but should be optional refinements.

## Runtime Theme Changes

Theme changes apply immediately because elements consume CSS variables at render time.  
Updating wrapper attributes or re-injecting variables updates the computed styles automatically.

## Accessibility

- Keep text/background contrast at WCAG AA (4.5:1 for body text).
- Ensure focus indicators remain visible in both light and dark modes.
- Do not rely on color alone to communicate correctness/incorrectness.

## Source of Truth

- Mappings/defaults: `packages/shared/theming/src/constants.ts`
- Theme presets: `packages/shared/theming/src/pie-themes.ts`
- Generic wrapper: `packages/element-theme/src/theme-elements.ts`
- DaisyUI wrapper: `packages/element-theme-daisyui/src/theme-element-daisyui.ts`
