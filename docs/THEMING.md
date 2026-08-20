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
  <pie-element-player element-name="multiple-choice"></pie-element-player>
</pie-element-theme>
```

DaisyUI wrapper:

```html
<pie-element-theme-daisyui theme="auto">
  <pie-element-player element-name="multiple-choice"></pie-element-player>
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

## Token Ownership

`pie-players` owns the `--pie-*` namespace. Its token registry
(`packages/theme/src/token-registry.json`, published as
`@pie-players/pie-theme/token-registry.json`) records what a host may theme and
who owns each name. An element must not invent a `--pie-*` name: an unregistered
one is invisible to that registry's gate, so no color scheme overrides it and no
contrast rule covers it. It renders its hardcoded fallback in every scheme.

Elements read canonical tokens and declare none. Where an element needs a local
hook — sizing, a Learnosity variant override, a per-instance handoff — it uses
its own prefix (`--mpb-*` for `mc-populated-blank`), which is element-private and
outside the host contract. A per-component `--pie-*` hook is possible but is a
`component-public` registry entry owned by the defining package, so it needs a
registry change in `pie-players` first.

`tests/pie-token-contract.test.ts` pins this for the Svelte element packages: it
fails on any unregistered `--pie-*` read and on any `--pie-*` declaration.

Focus outlines chain through registered focus tokens rather than a literal
color:

```css
outline: 2px solid
  var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border, #1565c0)));
```

`--pie-focus-outline` is `planned` in the registry and not yet defined by the
theme, so the chain falls through to `--pie-button-focus-outline` (set by every
`pie-players` scheme) and then `--pie-focus-checked-border` (also defined by
`packages/shared/theming`).

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
