import { describe, expect, it } from 'vitest';
import { mathContentName } from '../src/math-name.js';

const MML = '<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>';

/** MathJax's output: hidden MathML for assistive technology beside aria-hidden glyphs. */
const typeset = (mathml = MML) =>
  `<mjx-container class="MathJax"><mjx-math aria-hidden="true">glyphs</mjx-math><mjx-assistive-mml>${mathml}</mjx-assistive-mml></mjx-container>`;

function control(html: string, attributes: Record<string, string> = {}): HTMLElement {
  const element = document.createElement('div');
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.innerHTML = html;
  return element;
}

describe('mathContentName', () => {
  it('names a control that holds only math from its hidden MathML', () => {
    expect(mathContentName(control(typeset()))).toBe('1 half');
  });

  it('keeps text and math in order', () => {
    const content = control(
      `<p>Walk ${typeset('<math><mn>9.7</mn><mo>+</mo><msqrt><mn>25</mn></msqrt></math>')} <span>feet</span></p>`
    );
    expect(mathContentName(content)).toBe('Walk 9.7 plus square root of 25 feet');
  });

  it('speaks MathML that is not typeset yet', () => {
    expect(mathContentName(control(`<span>Half: </span>${MML}`))).toBe('Half: 1 half');
  });

  it('leaves the name to the browser when the content has no math', () => {
    expect(mathContentName(control('<p>Antigone</p>'))).toBeUndefined();
  });

  it('leaves the name to the browser when typesetting left no MathML', () => {
    expect(
      mathContentName(
        control('<mjx-container><mjx-math aria-hidden="true">glyphs</mjx-math></mjx-container>')
      )
    ).toBeUndefined();
  });

  it('ignores the control own label, which an earlier run set', () => {
    expect(mathContentName(control(typeset(), { 'aria-label': '1 half' }))).toBe('1 half');
    expect(mathContentName(control(typeset(), { 'aria-label': 'stale' }))).toBe('1 half');
  });

  it('skips hidden content and honours nested labels and image alternatives', () => {
    const content = control(
      `<span aria-hidden="true">decoy</span><span hidden>decoy</span><span style="display:none">decoy</span><span aria-label="Point A"></span><img alt="graph" src="x.png">${typeset()}`
    );
    expect(mathContentName(content)).toBe('Point A graph 1 half');
  });

  it('keeps words in block elements apart', () => {
    expect(mathContentName(control(`<p>Choose</p><p>${typeset()}</p>`))).toBe('Choose 1 half');
  });

  it('names several expressions in one control', () => {
    const content = control(
      `${typeset('<math><mi>x</mi></math>')} or ${typeset('<math><mi>y</mi></math>')}`
    );
    expect(mathContentName(content)).toBe('x or y');
  });

  it('takes the host speaker over the built-in one', () => {
    const speak = (math: Element) => `spoken ${math.localName}`;
    expect(mathContentName(control(typeset()), { speak })).toBe('spoken math');
  });

  it('falls back to the MathML text when the speaker returns nothing', () => {
    expect(
      mathContentName(control(typeset('<math><mi>x</mi></math>')), { speak: () => undefined })
    ).toBe('x');
  });
});
