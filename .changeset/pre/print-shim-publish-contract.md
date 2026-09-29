---
'@pie-element/complex-rubric': patch
'@pie-element/ebsr': patch
'@pie-element/explicit-constructed-response': patch
'@pie-element/extended-text-entry': patch
'@pie-element/math-inline': patch
'@pie-element/math-templated': patch
'@pie-element/multiple-choice': patch
'@pie-element/passage': patch
'@pie-element/rubric': patch
'@pie-element/select-text': patch
'@pie-element/mc-populated-blank': patch
'@pie-element/simple-cloze': patch
'@pie-element/element-bundler': patch
'@pie-element/cli': patch
---

Publish a root `print.js` shim from print-bearing elements, and resolve bundler entry
subpaths from what a package declares.

An alias-based IIFE builder resolves `@pie-element/<element>/print` as a filesystem path
and never reads the exports map, so print needs the same root shim `controller.js` and
`configure.js` already provide. Without it the subpath resolved only from TypeScript
sources, so print worked in a workspace build and failed every build against published
tarballs — taking the whole bundle with it rather than just the print view.
