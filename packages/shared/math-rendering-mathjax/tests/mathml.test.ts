import { describe, expect, it } from 'vitest';
import { MATHML_NS, unprefixMathml } from '../src/mathml.js';

function unprefix(html: string): Element {
  const root = document.createElement('div');
  root.innerHTML = html;
  unprefixMathml(root);
  return root;
}

describe('unprefixMathml', () => {
  it('re-creates prefixed MathML as MathML, keeping attributes and text', () => {
    const root = unprefix(
      '<p>A <mml:math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><mml:mfrac><mml:mn>1</mml:mn><mml:mn>2</mml:mn></mml:mfrac></mml:math> B</p>'
    );
    const math = root.querySelector('math');
    expect(math?.namespaceURI).toBe(MATHML_NS);
    expect(math?.getAttribute('display')).toBe('block');
    expect([...(math?.querySelectorAll('*') ?? [])].map((element) => element.localName)).toEqual([
      'mfrac',
      'mn',
      'mn',
    ]);
    expect(math?.querySelector('mfrac')?.namespaceURI).toBe(MATHML_NS);
    expect(root.textContent).toBe('A 12 B');
  });

  it('reads any prefix on a root named math', () => {
    const root = unprefix('<m:math><m:msup><m:mi>x</m:mi><m:mn>2</m:mn></m:msup></m:math>');
    expect(root.innerHTML).toBe('<math><msup><mi>x</mi><mn>2</mn></msup></math>');
  });

  it('leaves other prefixed markup alone', () => {
    const root = unprefix('<p>Text<o:p></o:p></p>');
    expect(root.querySelector('p')?.lastElementChild?.tagName.toLowerCase()).toBe('o:p');
  });

  it('leaves MathJax output alone', () => {
    const root = unprefix('<mjx-container><mml:math><mml:mi>x</mml:mi></mml:math></mjx-container>');
    expect(root.querySelector('math')).toBeNull();
  });
});
