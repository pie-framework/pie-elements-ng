import { describe, expect, it } from 'vitest';
import { nameMathInControls } from '../src/math-name.js';

const FRACTION = '<math><mfrac><mn>4</mn><mn>12</mn></mfrac></math>';

/** MathJax's output: hidden MathML for assistive technology beside aria-hidden glyphs. */
const typeset = (mathml = FRACTION) =>
  `<mjx-container class="MathJax"><mjx-math aria-hidden="true">glyphs</mjx-math><mjx-assistive-mml>${mathml}</mjx-assistive-mml></mjx-container>`;

function render(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  document.body.replaceChildren(root);
  return root;
}

const labels = (root: Element) =>
  [...root.querySelectorAll('mjx-container')].map((c) => c.getAttribute('aria-label'));

describe('nameMathInControls', () => {
  it('labels math inside controls with its speech', () => {
    const root = render(
      [
        `<button>${typeset()}</button>`,
        `<label><input type="radio">${typeset()}</label>`,
        `<ul role="listbox"><li role="option">${typeset()}</li></ul>`,
        `<div role="button" tabindex="0"><p>${typeset()} feet</p></div>`,
      ].join('')
    );
    nameMathInControls(root);
    expect(labels(root)).toEqual(['4 over 12', '4 over 12', '4 over 12', '4 over 12']);
  });

  it('leaves math outside controls to its MathML', () => {
    const root = render(`<p>Simplify ${typeset()}.</p><div role="listbox">${typeset()}</div>`);
    nameMathInControls(root);
    expect(labels(root)).toEqual([null, null]);
  });

  it('labels math in a control around the rendered element', () => {
    const root = render(`<button><span id="content">${typeset()}</span></button>`);
    nameMathInControls(root.querySelector('#content') as Element);
    expect(labels(root)).toEqual(['4 over 12']);
  });

  it('keeps a label already on the container', () => {
    const root = render(
      `<button>${typeset().replace('class', 'aria-label="four twelfths" class')}</button>`
    );
    nameMathInControls(root);
    expect(labels(root)).toEqual(['four twelfths']);
  });

  it('leaves a container without hidden MathML unlabelled', () => {
    const root = render(
      '<button><mjx-container><mjx-math>glyphs</mjx-math></mjx-container></button>'
    );
    nameMathInControls(root);
    expect(labels(root)).toEqual([null]);
  });
});
