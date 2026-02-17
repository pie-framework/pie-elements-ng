export const countResponseAreas = (latex = '') =>
  latex.match(/answerBlock|\\%response\\%|\\MathQuillMathField\[r\d+\]\{[\s\S]*?\}/g)?.length || 0;
