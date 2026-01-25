import { describe, expect, it, vi } from 'vitest';
import { BracketTypes, unWrapMath, wrapMath } from '../src/normalization';

describe('wrapMath', () => {
  it('wraps content with round brackets by default', () => {
    const result = wrapMath('x^2');
    expect(result).toBe('\\(x^2\\)');
  });

  it('wraps content with round brackets explicitly', () => {
    const result = wrapMath('x^2', BracketTypes.ROUND_BRACKETS);
    expect(result).toBe('\\(x^2\\)');
  });

  it('wraps content with dollar signs', () => {
    const result = wrapMath('x^2', BracketTypes.DOLLAR);
    expect(result).toBe('$x^2$');
  });

  it('falls back to round brackets for square brackets', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = wrapMath('x^2', BracketTypes.SQUARE_BRACKETS);
    expect(result).toBe('\\(x^2\\)');
    expect(consoleWarn).toHaveBeenCalledWith('\\[...\\] is not supported yet');
    consoleWarn.mockRestore();
  });

  it('falls back to dollar for double dollar', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = wrapMath('x^2', BracketTypes.DOUBLE_DOLLAR);
    expect(result).toBe('$x^2$');
    expect(consoleWarn).toHaveBeenCalledWith('$$...$$ is not supported yet');
    consoleWarn.mockRestore();
  });

  it('handles empty content', () => {
    const result = wrapMath('');
    expect(result).toBe('\\(\\)');
  });

  it('handles complex LaTeX', () => {
    const result = wrapMath('\\frac{a}{b} + \\sqrt{x}');
    expect(result).toBe('\\(\\frac{a}{b} + \\sqrt{x}\\)');
  });

  it('handles content with spaces', () => {
    const result = wrapMath('x + y = z');
    expect(result).toBe('\\(x + y = z\\)');
  });
});

describe('unWrapMath', () => {
  it('unwraps round brackets', () => {
    const result = unWrapMath('\\(x^2\\)');
    expect(result.unwrapped).toBe('x^2');
    expect(result.wrapType).toBe(BracketTypes.ROUND_BRACKETS);
  });

  it('unwraps dollar signs', () => {
    const result = unWrapMath('$x^2$');
    expect(result.unwrapped).toBe('x^2');
    expect(result.wrapType).toBe(BracketTypes.DOLLAR);
  });

  it('unwraps double dollar signs with warning', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = unWrapMath('$$x^2$$');
    expect(result.unwrapped).toBe('x^2');
    expect(result.wrapType).toBe(BracketTypes.DOLLAR);
    expect(consoleWarn).toHaveBeenCalledWith('$$ syntax is not yet supported');
    consoleWarn.mockRestore();
  });

  it('unwraps square brackets with warning', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = unWrapMath('\\[x^2\\]');
    expect(result.unwrapped).toBe('x^2');
    expect(result.wrapType).toBe(BracketTypes.ROUND_BRACKETS);
    expect(consoleWarn).toHaveBeenCalledWith('\\[..\\] syntax is not yet supported');
    consoleWarn.mockRestore();
  });

  it('returns unwrapped for content without delimiters', () => {
    const result = unWrapMath('x^2');
    expect(result.unwrapped).toBe('x^2');
    expect(result.wrapType).toBe(BracketTypes.ROUND_BRACKETS);
  });

  it('removes displaystyle with warning', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = unWrapMath('\\(\\displaystyle x^2\\)');
    expect(result.unwrapped).toBe(' x^2');
    expect(consoleWarn).toHaveBeenCalledWith('\\displaystyle is not supported - removing');
    consoleWarn.mockRestore();
  });

  it('handles displaystyle in middle of content', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = unWrapMath('$a + \\displaystyle b + c$');
    expect(result.unwrapped).toBe('a +  b + c');
    expect(consoleWarn).toHaveBeenCalledWith('\\displaystyle is not supported - removing');
    consoleWarn.mockRestore();
  });

  it('handles empty content', () => {
    const result = unWrapMath('');
    expect(result.unwrapped).toBe('');
    expect(result.wrapType).toBe(BracketTypes.ROUND_BRACKETS);
  });

  it('handles complex LaTeX', () => {
    const result = unWrapMath('\\(\\frac{a}{b} + \\sqrt{x}\\)');
    expect(result.unwrapped).toBe('\\frac{a}{b} + \\sqrt{x}');
    expect(result.wrapType).toBe(BracketTypes.ROUND_BRACKETS);
  });

  it('handles partial delimiters - only opening', () => {
    const result = unWrapMath('\\(x^2');
    expect(result.unwrapped).toBe('\\(x^2');
    expect(result.wrapType).toBe(BracketTypes.ROUND_BRACKETS);
  });

  it('handles partial delimiters - only closing', () => {
    const result = unWrapMath('x^2\\)');
    expect(result.unwrapped).toBe('x^2\\)');
    expect(result.wrapType).toBe(BracketTypes.ROUND_BRACKETS);
  });

  it('handles mismatched delimiters', () => {
    const result = unWrapMath('\\(x^2$');
    expect(result.unwrapped).toBe('\\(x^2$');
    expect(result.wrapType).toBe(BracketTypes.ROUND_BRACKETS);
  });

  it('prioritizes double dollar over single dollar', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = unWrapMath('$$x^2$$');
    expect(result.unwrapped).toBe('x^2');
    consoleWarn.mockRestore();
  });

  it('handles nested content', () => {
    const result = unWrapMath('$\\text{if } x > 0 \\text{ then } y = 1$');
    expect(result.unwrapped).toBe('\\text{if } x > 0 \\text{ then } y = 1');
    expect(result.wrapType).toBe(BracketTypes.DOLLAR);
  });

  it('trims whitespace after removing displaystyle', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = unWrapMath('\\(  \\displaystyle  x^2  \\)');
    expect(result.unwrapped).toBe('    x^2  ');
    consoleWarn.mockRestore();
  });
});

describe('wrapMath and unWrapMath round-trip', () => {
  it('round-trips with round brackets', () => {
    const original = 'x^2 + 2x + 1';
    const wrapped = wrapMath(original, BracketTypes.ROUND_BRACKETS);
    const result = unWrapMath(wrapped);
    expect(result.unwrapped).toBe(original);
    expect(result.wrapType).toBe(BracketTypes.ROUND_BRACKETS);
  });

  it('round-trips with dollar signs', () => {
    const original = 'x^2 + 2x + 1';
    const wrapped = wrapMath(original, BracketTypes.DOLLAR);
    const result = unWrapMath(wrapped);
    expect(result.unwrapped).toBe(original);
    expect(result.wrapType).toBe(BracketTypes.DOLLAR);
  });

  it('round-trips complex LaTeX', () => {
    const original = '\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}';
    const wrapped = wrapMath(original);
    const result = unWrapMath(wrapped);
    expect(result.unwrapped).toBe(original);
  });

  it('can re-wrap with same type', () => {
    const original = 'x^2';
    const wrapped1 = wrapMath(original, BracketTypes.DOLLAR);
    const { unwrapped, wrapType } = unWrapMath(wrapped1);
    const wrapped2 = wrapMath(unwrapped, wrapType);
    expect(wrapped2).toBe(wrapped1);
  });
});
