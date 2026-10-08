import { describe, expect, it } from 'vitest';
import { speakMathml } from '../src/math-speech.js';

function speak(mathml: string): string {
  const host = document.createElement('div');
  host.innerHTML = `<math>${mathml}</math>`;
  return speakMathml(host.firstElementChild as Element);
}

describe('speakMathml', () => {
  it('speaks a sign before an operand as a sign and the same symbol between operands as an operator', () => {
    expect(speak('<mi>x</mi><mo>=</mo><mo>-</mo><mfrac><mn>7</mn><mn>6</mn></mfrac>')).toBe(
      'x equals negative 7 over 6'
    );
    expect(speak('<mn>5</mn><mo>&#x2212;</mo><mn>3</mn>')).toBe('5 minus 3');
    expect(speak('<mo>(</mo><mo>-</mo><mn>3</mn><mo>)</mo><mo>-</mo><mn>1</mn>')).toBe(
      'open parenthesis negative 3 close parenthesis minus 1'
    );
  });

  it('speaks fences, roots and the units that follow', () => {
    expect(
      speak(
        '<mrow><mo>(</mo><mrow><mn>9.7</mn><mo>+</mo><msqrt><mn>25</mn></msqrt></mrow><mo>)</mo></mrow><mtext>feet</mtext>'
      )
    ).toBe('open parenthesis 9.7 plus square root of 25 close parenthesis feet');
    expect(speak('<mn>30</mn><mo>&#xb0;</mo>')).toBe('30 degrees');
    expect(speak('<mn>40</mn><mo>%</mo>')).toBe('40 percent');
  });

  it('marks where a long radicand ends', () => {
    expect(speak('<msqrt><mi>x</mi><mo>+</mo><mn>1</mn></msqrt>')).toBe(
      'square root of x plus 1 end root'
    );
    expect(speak('<mroot><mi>x</mi><mn>3</mn></mroot>')).toBe('cube root of x');
    expect(speak('<mroot><mi>x</mi><mn>4</mn></mroot>')).toBe('4th root of x');
  });

  it('speaks a fraction of two atoms with "over" and a longer one by its parts', () => {
    expect(speak('<mfrac><mn>4</mn><mn>12</mn></mfrac>')).toBe('4 over 12');
    expect(speak('<mfrac><mn>4</mn><mn>1</mn></mfrac>')).toBe('4 over 1');
    expect(speak('<mfrac><mi>a</mi><mi>b</mi></mfrac>')).toBe('a over b');
    expect(
      speak(
        '<mfrac><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mrow><mi>x</mi><mo>-</mo><mn>1</mn></mrow></mfrac>'
      )
    ).toBe('the fraction with numerator x plus 1 and denominator x minus 1');
  });

  it('speaks scripts', () => {
    expect(speak('<msup><mi>x</mi><mn>2</mn></msup>')).toBe('x squared');
    expect(speak('<msup><mi>x</mi><mn>3</mn></msup>')).toBe('x cubed');
    expect(speak('<msup><mi>x</mi><mi>n</mi></msup>')).toBe('x to the power of n');
    expect(speak('<msup><mi>x</mi><mrow><mi>n</mi><mo>+</mo><mn>1</mn></mrow></msup>')).toBe(
      'x to the power of n plus 1 end power'
    );
    expect(speak('<msup><mi>f</mi><mo>&#x2032;</mo></msup>')).toBe('f prime');
    expect(speak('<msub><mi>x</mi><mi>i</mi></msub>')).toBe('x sub i');
    expect(speak('<msubsup><mi>x</mi><mi>i</mi><mn>2</mn></msubsup>')).toBe('x sub i squared');
  });

  it('speaks the bounds of sums, integrals and limits', () => {
    expect(
      speak(
        '<munderover><mo>&#x2211;</mo><mrow><mi>i</mi><mo>=</mo><mn>1</mn></mrow><mi>n</mi></munderover><mi>i</mi>'
      )
    ).toBe('sum from i equals 1 to n of i');
    expect(speak('<msubsup><mo>&#x222b;</mo><mn>0</mn><mn>1</mn></msubsup><mi>x</mi>')).toBe(
      'integral from 0 to 1 of x'
    );
    expect(
      speak(
        '<munder><mi>lim</mi><mrow><mi>x</mi><mo>&#x2192;</mo><mn>0</mn></mrow></munder><mi>x</mi>'
      )
    ).toBe('limit as x right arrow 0 of x');
  });

  it('speaks absolute values only when the bars enclose the whole expression', () => {
    expect(speak('<mo>|</mo><mi>x</mi><mo>|</mo>')).toBe('absolute value of x end absolute value');
    expect(speak('<mo>|</mo><mi>x</mi><mo>|</mo><mo>+</mo><mo>|</mo><mi>y</mi><mo>|</mo>')).toBe(
      'vertical bar x vertical bar plus vertical bar y vertical bar'
    );
  });

  it('speaks accents', () => {
    expect(speak('<mover><mi>x</mi><mo>&#xaf;</mo></mover>')).toBe('x bar');
    expect(speak('<mover><mi>AB</mi><mo>&#x2192;</mo></mover>')).toBe('vector AB');
  });

  it('speaks a table by its rows', () => {
    expect(
      speak(
        '<mtable><mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr><mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr></mtable>'
      )
    ).toBe('table with 2 rows and 2 columns. row 1: 1, 2. row 2: 3, 4');
  });

  it('speaks Greek letters and function names, and stays silent on invisible operators', () => {
    expect(speak('<mn>2</mn><mo>&#x2062;</mo><mi>&#x3c0;</mi><mo>&#x2062;</mo><mi>r</mi>')).toBe(
      '2 pi r'
    );
    expect(speak('<mi>sin</mi><mo>&#x2061;</mo><mo>(</mo><mi>x</mi><mo>)</mo>')).toBe(
      'sine open parenthesis x close parenthesis'
    );
  });

  it('reads an mfenced with its separators', () => {
    expect(speak('<mfenced><mi>a</mi><mi>b</mi></mfenced>')).toBe(
      'open parenthesis a comma b close parenthesis'
    );
  });

  it('speaks the first child of semantics and skips its annotations', () => {
    expect(
      speak(
        '<semantics><mrow><mi>x</mi><mo>=</mo><mn>1</mn></mrow><annotation encoding="application/x-tex">x=1</annotation></semantics>'
      )
    ).toBe('x equals 1');
  });

  it('speaks the children of an element it does not know, in order', () => {
    expect(speak('<mglyph-unknown><mi>a</mi><mi>b</mi></mglyph-unknown>')).toBe('a b');
  });
});
