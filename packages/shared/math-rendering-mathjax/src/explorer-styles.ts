/**
 * Theme colours for the MathJax explorer: the highlight on the explored expression, the outline on
 * the current selection, and the speech, braille, magnifier and tooltip regions. MathJax paints
 * them from its own palette, which follows the OS colour scheme.
 *
 * Each rule is MathJax 4.1.3's own selector under `:root`, one pseudo-class above it, so it wins
 * over MathJax's `!important` declarations wherever either stylesheet loads. Deliberate trades:
 *
 * - The theme colours replace any highlight colours a student picks in the MathJax menu.
 * - The regions are appended to `document.body`, so they resolve only a theme set on the document,
 *   and take the fallbacks under a theme scoped to an element.
 * - The stylesheet is page-global, so a host's own MathJax 4 explorer takes it too.
 */

export const EXPLORER_STYLESHEET_ID = 'PIE-MJX-explorer-styles';

const TEXT = 'var(--pie-text, black)';
const BACKGROUND = 'var(--pie-background, #ffffff)';
const BORDER = 'var(--pie-border-dark, #66686A)';
// The THEMING.md focus chain.
const FOCUS =
  'var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border, #1565C0)))';
// 15% keeps the scheme text at 4.5:1 and the focus outline at 3:1 on the tint in every pie-players
// scheme; the outline carries the selection.
const TINT = `color-mix(in srgb, ${FOCUS} 15%, transparent)`;

export const EXPLORER_CSS = `
:root mjx-container [data-sre-highlight-1]:not([data-mjx-collapsed], rect) {
  color: ${TEXT} !important;
  fill: ${TEXT} !important;
}
:root mjx-container:not([data-mjx-clone-container]) [data-sre-highlight-1]:not([data-sre-enclosed], rect) {
  background-color: ${TINT} !important;
}
:root mjx-container rect[data-sre-highlight-1]:not([data-sre-enclosed]) {
  fill: ${TINT} !important;
}
:root mjx-container .mjx-selected {
  outline: 2px solid ${FOCUS} !important;
}
:root mjx-container [data-sre-highlight-2] {
  color: ${TEXT} !important;
  background-color: transparent !important;
  fill: ${TEXT} !important;
  outline: 2px dashed ${FOCUS} !important;
}
:root mjx-container rect[data-sre-highlight-2] {
  fill: transparent !important;
  stroke: ${FOCUS} !important;
  stroke-width: 2px !important;
  vector-effect: non-scaling-stroke;
}
:root .MJX_LiveRegion, :root .MJX_HoverRegion, :root .MJX_ToolTip {
  color: ${TEXT} !important;
  background-color: ${BACKGROUND} !important;
  border-color: ${BORDER} !important;
}
:root .MJX_LiveRegion > div, :root .MJX_HoverRegion > div {
  color: ${TEXT} !important;
  background-color: ${TINT} !important;
}
`;

/**
 * Adds the explorer theme stylesheet to the document's `<head>` once. Every element bundles its
 * own copy of this adapter, so the stylesheet id is the record that one copy has added it.
 */
export function injectExplorerStyles(doc: Document = document): void {
  if (doc.getElementById(EXPLORER_STYLESHEET_ID)) return;
  const style = doc.createElement('style');
  style.id = EXPLORER_STYLESHEET_ID;
  style.textContent = EXPLORER_CSS;
  doc.head.appendChild(style);
}
