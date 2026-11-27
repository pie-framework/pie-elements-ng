// Read by a screen reader and invisible otherwise (the usual clip pattern, so it keeps a layout box).
export const visuallyHidden = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/**
 * The class MathJax leaves alone (its default `ignoreHtmlClass`). Hidden text that already says math in
 * words carries it, so a typeset of the element around it does not turn that text into unnamed math.
 */
export const MATHJAX_IGNORE = 'mathjax_ignore';
