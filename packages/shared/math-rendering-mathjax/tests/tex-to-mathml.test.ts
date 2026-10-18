// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { texToMathml } from '../src/tex-to-mathml/index.js';

const MATH = '<math xmlns="http://www.w3.org/1998/Math/MathML">';
const DISPLAY = '<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">';

describe('texToMathml', () => {
  it('returns HTML without TeX as given', () => {
    const html = '<p>No math &amp; <b>bold</b><br></p>';
    expect(texToMathml(html)).toBe(html);
  });

  it('converts inline and display delimiters', () => {
    expect(texToMathml('<p>\\(x^2\\) and $$y$$ and \\[z\\]</p>')).toBe(
      `<p>${MATH}<msup><mi>x</mi><mn>2</mn></msup></math> and ${DISPLAY}<mi>y</mi></math>` +
        ` and ${DISPLAY}<mi>z</mi></math></p>`
    );
  });

  it('leaves single dollars as text, as delivery does by default', () => {
    expect(texToMathml('<p>$5 and $6</p>')).toBe('<p>$5 and $6</p>');
  });

  it('expands the legacy macros', () => {
    expect(texToMathml('\\(\\abs{x}\\divide\\)')).toBe(
      `${MATH}<mrow><mo>|</mo><mi>x</mi><mo>|</mo></mrow><mo>&#xF7;</mo></math>`
    );
  });

  it('converts [data-latex] elements whatever delimiters they were saved with', () => {
    expect(texToMathml('<span data-latex="">$$\\frac{1}{2}$$</span>')).toBe(
      `<span data-latex="" data-math-handled="true">${MATH}<mfrac><mn>1</mn><mn>2</mn></mfrac></math></span>`
    );
  });

  it('skips what mathjax_ignore marks, unless mathjax_process reopens it, and code', () => {
    expect(
      texToMathml(
        '<div class="mathjax_ignore">\\(a\\)<span class="mathjax_process">\\(b\\)</span></div><code>\\(c\\)</code>'
      )
    ).toBe(
      `<div class="mathjax_ignore">\\(a\\)<span class="mathjax_process">${MATH}<mi>b</mi></math></span></div><code>\\(c\\)</code>`
    );
  });

  it('passes authored MathML through', () => {
    const html = '<p><math><mi>x</mi></math> \\(y\\)</p>';
    expect(texToMathml(html)).toBe(`<p><math><mi>x</mi></math> ${MATH}<mi>y</mi></math></p>`);
  });

  it('writes no data attributes', () => {
    expect(texToMathml('\\(\\left(x\\right)\\)')).not.toMatch(/data-/);
  });

  it('shows TeX it cannot parse as an error', () => {
    expect(texToMathml('\\(\\frac{1}\\)')).toContain('<merror');
    expect(texToMathml('\\(\\nosuchmacro\\)')).toContain(
      '<mtext mathcolor="red">\\nosuchmacro</mtext>'
    );
  });

  it('numbers nothing across calls', () => {
    const html = '\\[x\\tag{1}\\]';
    expect(texToMathml(html)).toBe(texToMathml(html));
  });

  describe('menclose', () => {
    it('draws a box as a bordered row', () => {
      expect(texToMathml('\\(\\enclose{box}{x}\\)')).toBe(
        `${MATH}<mrow style="border:0.067em solid;padding:0.2em"><mi>x</mi></mrow></math>`
      );
    });

    it('draws strikes as gradients, combined', () => {
      const mathml = texToMathml('\\(\\enclose{updiagonalstrike downdiagonalstrike}{x}\\)');
      expect(mathml).toContain('background-image:linear-gradient(to top right,');
      expect(mathml).toContain('),linear-gradient(to bottom right,');
      expect(mathml).not.toContain('menclose');
    });

    it('draws long division as a bracket under a rule', () => {
      expect(texToMathml('\\(\\longdiv{12}\\)')).toBe(
        `${MATH}<mrow><mrow><mo stretchy="true" lspace="0" rspace="0">)</mo>` +
          `<mrow style="border-top:0.067em solid;padding:0.2em 0.1em 0"><mn>12</mn></mrow></mrow></mrow></math>`
      );
    });

    it('draws a radical as a square root', () => {
      expect(texToMathml('\\(\\enclose{radical}{x}\\)')).toBe(
        `${MATH}<mrow><msqrt><mi>x</mi></msqrt></mrow></math>`
      );
    });

    it('keeps its other attributes', () => {
      expect(texToMathml('\\(\\enclose{circle}[mathcolor=red]{x}\\)')).toBe(
        `${MATH}<mrow mathcolor="red" style="border:0.067em solid;border-radius:50%;padding:0.2em"><mi>x</mi></mrow></math>`
      );
    });
  });

  describe('tables', () => {
    it('carries alignment and spacing on the cells', () => {
      const mathml = texToMathml('\\(\\begin{aligned}x&=1\\\\y&=2\\end{aligned}\\)');
      expect(mathml).toContain(
        '<mtd style="padding:0 0 calc(3pt / 2) 0;text-align:right"><mi>x</mi></mtd>'
      );
      expect(mathml).toContain('<mtd style="padding:calc(3pt / 2) 0 0 0;text-align:left">');
      expect(mathml).not.toMatch(/columnalign|columnspacing|rowspacing/);
    });

    it('draws column and row lines as cell borders', () => {
      const mathml = texToMathml('\\(\\begin{array}{c|c}a&b\\\\\\hline c&d\\end{array}\\)');
      expect(mathml).toContain(
        '<mtd style="padding:0 calc(1em / 2) calc(4pt / 2) 0;border-right:0.067em solid;border-bottom:0.067em solid"><mi>a</mi></mtd>'
      );
      expect(mathml).toContain(
        '<mtd style="padding:calc(4pt / 2) 0 0 calc(1em / 2)"><mi>d</mi></mtd>'
      );
      expect(mathml).not.toMatch(/columnlines|rowlines/);
    });

    it('moves an equation label to the end of its row', () => {
      const mathml = texToMathml('\\begin{align}x\\tag{A}\\end{align}');
      expect(mathml).not.toContain('mlabeledtr');
      expect(mathml).toContain(
        '<mtr><mtd style="padding:0;text-align:right"><mi>x</mi></mtd>' +
          '<mtd style="padding:0;text-align:right"><mtext>(</mtext><mtext>A</mtext>'
      );
    });
  });

  describe('mathvariant', () => {
    it('writes letters and digits as mathematical alphanumerics', () => {
      expect(texToMathml('\\(\\mathbb{R}\\mathbf{v}\\mathcal{L}\\mathfrak{g}\\)')).toBe(
        `${MATH}<mrow><mi>&#x211D;</mi></mrow><mrow><mi>&#x1D42F;</mi></mrow>` +
          `<mrow><mi>&#x2112;</mi></mrow><mrow><mi>&#x1D524;</mi></mrow></math>`
      );
    });

    it('keeps the attribute when a character has no alphanumeric', () => {
      expect(texToMathml('\\(\\boldsymbol{\\alpha}\\)')).toContain('mathvariant="bold-italic"');
    });

    it('keeps normal, which MathML Core renders', () => {
      expect(texToMathml('\\(\\mathrm{d}\\)')).toContain('<mi mathvariant="normal">d</mi>');
    });
  });
});
