# @pie-element/select-text

A PIE element where students select words, sentences or other tokens in a passage. Content
authoring tools often call this item type "Hot Text".

One package serves every mode: delivery, authoring, the controller and print.

## Entry points

| Import | What it is |
| --- | --- |
| `@pie-element/select-text` | The delivery element |
| `@pie-element/select-text/author` (or `/configure`) | The authoring element |
| `@pie-element/select-text/controller` | The controller: `model()`, `outcome()`, `createCorrectResponseSession()` |
| `@pie-element/select-text/print` | The print element |
| `@pie-element/select-text/browser/*` | Browser builds of the above, for loading straight from a CDN |

## Printing

The print element renders the item read-only, with a dashed box around every token. For the
`instructor` role the correct answers are outlined, and teacher instructions and rationale are
shown.

Two builds of it are published:

- `print` (and `browser/print`) for players in this repository, such as
  `<pie-element-player view="print">`.
- `module/print.js` for the legacy `pie-print` player used by PIEOneer and other content
  systems. Math in the item (LaTeX or MathML) is typeset through `pie-print`'s own renderer.

See [Print Support](../../../docs/PRINT_SUPPORT.md) for how the two print players differ.
