# @pie-lib/math-input-svelte

**This package is a placeholder.** It has no math editor: `MathField` is a plain text input that
edits the LaTeX source. No PIE element uses it, and it is not published (`private` in
`package.json`; the `0.1.0` on npm predates that and ships the same stub as raw source).

## Components

- `MathField` - a text input for LaTeX. Props: `latex`, `disabled`, and `onChange(value)`, which
  receives the input's value on every keystroke.
- `StaticMath` - renders `latex` as inline math through `renderMath` from
  `@pie-element/shared-math-rendering-mathjax`, which uses the player's math renderer when one is
  installed and otherwise loads MathJax from its CDN on first use.

```svelte
<script lang="ts">
  import { MathField, StaticMath } from '@pie-lib/math-input-svelte';

  let latex = $state('x^2');
</script>

<MathField {latex} onChange={(value) => (latex = value)} />
<StaticMath {latex} />
```

## Related

The React elements' math editing lives in `@pie-lib/math-input` and `@pie-lib/math-toolbar`
(`packages/lib-react`). A Svelte math editor with parity is not implemented.
