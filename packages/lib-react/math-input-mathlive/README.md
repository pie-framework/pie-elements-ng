# @pie-lib/math-input-mathlive

MathLive-backed math input: a drop-in alternative to `@pie-lib/math-input`, which is built on the
`@pie-framework/mathquill` fork. `@pie-lib/math-toolbar`, `@pie-lib/editable-html-tip-tap`,
`@pie-element/math-inline` and `@pie-element/math-templated` use it.

## Migrating

The export surface mirrors `@pie-lib/math-input`, so most call sites change only the import:

```diff
-import { mq, keys, keysForGrade, HorizontalKeypad, registerEmbed, applyStaticMath } from '@pie-lib/math-input';
+import { mq, keys, keysForGrade, HorizontalKeypad, registerEmbed, applyStaticMath } from '@pie-lib/math-input-mathlive';
```

The field wrappers are exported as `mf`, with `mq` kept as an alias so `mq.Input` / `mq.Static` call
sites keep working. Both take `language`, which names the field "Enter answer" in the item language,
and `ariaDescribedBy`, the id of an element that describes it.

### Behaviour differences

|                             | `@pie-lib/math-input`            | this package                                                          |
| --------------------------- | -------------------------------- | --------------------------------------------------------------------- |
| `mq.Input`                  | MathQuill `MathField`            | `<math-field>`                                                        |
| `mq.Static` (display)       | one `MQ.StaticMath` per instance | `convertLatexToMarkup`, no live instance                              |
| `mq.Static` (answer blocks) | `innerFields`                    | prompts API, through handles with `latex`, `write`, `cmd`, `keystroke`, `clear`, `focus` and `el` |
| Whole static latex          | `mathField.latex()`              | `latex()` on the `mq.Static` instance                                 |
| `updateSpans()`             | patched MathQuill DOM            | **no-op** (kept for compatibility)                                    |
| `registerEmbed`             | MathQuill embed plugin           | macro + `\htmlData` shim, see below                                   |
| Loading                     | synchronous                      | **async**: fields and static math fill in once MathLive has loaded    |

MathLive's `input` event fires asynchronously, so `onChange` / `onSubFieldChange` run on the next
task after an edit.

### Content model is preserved

Stored latex keeps its MathQuill-era form, so items authored with either implementation stay
readable and MathJax rendering needs no change. Translation happens at the package boundary:

| stored                      | in MathLive             |
| --------------------------- | ----------------------- |
| `\embed{newLine}[]`         | `\displaylines{… \\ …}` |
| `\MathQuillMathField[id]{}` | `\placeholder[id]{}`    |
| `\embed{answerBlock}[id]`   | `\answerBlock{id}`      |

`\answerBlock{id}` is a built-in macro: a box labelled "Response", tagged `data-response-area`, that
serialises back unchanged and deletes as one atom. To show a submitted answer in the same box, build
the latex with `answerBlockLatex(id, answer)`, which tags it `data-answer-block` and its label
`data-answer-block-index`. This replaces rendering an empty embed and calling `applyStaticMath` on
a span inside it, which has no MathLive equivalent.

`toMathLive()` / `fromMathLive()` are exported if you need the conversion directly.

### `registerEmbed`

Same signature, different mechanism. MathLive has no embed plugin system, so an embed becomes a
macro that expands to real LaTeX, tagged with `\htmlData{embed=<name>}` so CSS can target
`[data-embed="<name>"]`. `newLine` and `answerBlock` are handled natively, and registering them
changes nothing. Any other name falls back to a `\placeholder{}` unless the factory returns
`mathliveLatex`:

```js
registerEmbed('myEmbed', () => ({
  latex: () => '\\embed{myEmbed}[]',
  mathliveLatex: '\\boxed{?}',
}));
```

**Limitation:** MathQuill's `htmlString` could inject an arbitrary DOM subtree. `\htmlData` only
decorates MathLive's own output, so an embed that mounted a custom widget needs a redesign.

## Notes

- **Browser only.** MathLive registers custom elements. `loadMathLive()` returns `undefined` during
  SSR, and under Node it resolves MathLive's render-only build, which has no `MathfieldElement`: fields
  then stay empty while static math still renders.
- **Loading.** MathLive is loaded with a dynamic `import()` marked `webpackMode: "eager"`, so a webpack
  host keeps it in its main bundle rather than a chunk that may not be served.
- **Fonts.** Some symbols (`\neq`, `\nsim`, `\ncong`) are built from Private Use Area glyphs that exist
  only in the KaTeX fonts. With no `configureFonts()` call the fonts come from a version-pinned CDN
  (`https://unpkg.com/mathlive@<version>/fonts`); call `configureFonts('/path/to/fonts')` before the
  first load to serve them yourself, or `configureFonts(null)` to opt out.
- **Core stylesheet.** `convertLatexToMarkup` output (keypad labels, display-mode static math) needs
  MathLive's core styles; the package has MathLive inject them on load.
- **Custom macros.** `PIE_MACROS` covers the pie-specific commands the MathQuill fork understood
  (`\parallelogram`, `\longdiv`, `\napprox`, …), kept in sync with the MathJax macros.

## Testing

happy-dom cannot run MathLive's editor. Tests that need a mounted field mock `mathlive` with a
stand-in `MathfieldElement` (see `test/field-label.test.tsx`, and
`packages/elements-react/math-inline/src/delivery/__tests__/fake-mathlive.ts` for one with prompts).
A package that mocks `mathlive` must list it as a devDependency so the mock resolves to the module
this package imports.
