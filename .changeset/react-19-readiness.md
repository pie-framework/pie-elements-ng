---
"@pie-element/drawing-response": patch
"@pie-element/graphing": patch
"@pie-element/hotspot": patch
"@pie-element/image-cloze-association": patch
"@pie-element/inline-dropdown": patch
"@pie-element/math-inline": patch
"@pie-element/math-templated": patch
"@pie-element/matrix": patch
"@pie-element/number-line": patch
"@pie-element/placement-ordering": patch
"@pie-element/select-text": patch
"@pie-lib/config-ui": patch
"@pie-lib/editable-html-tip-tap": patch
"@pie-lib/graphing": patch
"@pie-lib/graphing-solution-set": patch
"@pie-lib/icons": patch
"@pie-lib/mask-markup": patch
"@pie-lib/plot": patch
"@pie-lib/render-ui": patch
"@pie-lib/tools": patch
---

Stop using the React APIs that React 19 removes — `findDOMNode`, `ReactDOM.render`, legacy
context and `defaultProps` on function components — while staying on React 18. `UiLayout` and
`ConfigLayout` take a `containerRef` for their root element; the elements that measured or
rendered math into that element through `findDOMNode` got the extraCSSRules `<style>` node
instead whenever rules were set. `@pie-lib/editable-html-tip-tap` drops its unused `react-jss`
dependency.
