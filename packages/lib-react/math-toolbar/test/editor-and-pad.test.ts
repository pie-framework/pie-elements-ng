import { describe, expect, it } from 'vitest';
import { countResponseAreas } from '../src/response-area-count';

describe('countResponseAreas', () => {
  it('counts legacy and migrated response placeholders', () => {
    const latex =
      '\\MathQuillMathField[r1]{x} + \\%response\\% + answerBlock + \\MathQuillMathField[r2]{y}';
    expect(countResponseAreas(latex)).toBe(4);
  });

  it('returns zero for empty expressions', () => {
    expect(countResponseAreas('x + y')).toBe(0);
  });
});
