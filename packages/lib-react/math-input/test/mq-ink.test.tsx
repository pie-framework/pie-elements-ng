import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import * as mq from '../src/mq/index.js';

// The rules emotion emits for the MathQuill root's own class.
const rulesFor = (el: Element) => {
  const [cls] = [...el.classList].filter((c) => c.startsWith('css-'));
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  return css.split('}').filter((r) => r.includes(`.${cls}`));
};

const declarationsFor = (rules: string[], selector: string) =>
  rules.find((r) => r.split('{')[0].split(',').map((s) => s.trim()).includes(selector))?.split('{')[1];

describe.each([
  ['static math', () => render(<mq.Static latex={'\\overline{x}+\\MathQuillMathField[r1]{}'} />)],
  ['an answer field', () => render(<mq.Input latex={'\\overline{x}'} />)],
])('MathQuill ink in %s', (_, renderMath) => {
  it('takes the field text colour for the caret, on the root or a nested field', () => {
    const root = renderMath().container.querySelector('.mq-math-mode')!;
    const rules = rulesFor(root);
    const cls = [...root.classList].find((c) => c.startsWith('css-'));

    for (const selector of [`.${cls}.mq-editable-field .mq-cursor`, `.${cls} .mq-editable-field .mq-cursor`]) {
      expect(declarationsFor(rules, selector)).toBe('border-left-color:currentColor;');
    }
  });

  it('borders an unfocused field in --pie-border-dark and leaves the focused border to MathQuill', () => {
    const root = renderMath().container.querySelector('.mq-math-mode')!;
    const cls = [...root.classList].find((c) => c.startsWith('css-'));

    expect(declarationsFor(rulesFor(root), `.${cls} .mq-editable-field:not(.mq-focused)`)).toBe(
      'border-color:var(--pie-border-dark, #66686A);',
    );
  });

  // mathquill.css paints these in black, #4d4d4d and grey at two classes; each override has three.
  it.each([
    ['.mq-overline .mq-overline-inner', 'border-top-color'],
    ['.mq-overarrow .mq-overarrow-inner', 'border-top-color'],
    ['.mq-overleftrightarrow .mq-overleftrightarrow-inner', 'border-top-color'],
    ['.mq-overarc', 'border-top-color'],
    ['.mq-longdiv .mq-longdiv-inner', 'border-top-color'],
    ['.mq-underline', 'border-bottom-color'],
    ['.mq-xarrow .mq-xarrow-over', 'border-bottom-color'],
    ['.mq-abs', 'border-left-color'],
    ['.mq-matrix td.mq-empty', 'border-color'],
  ])('draws %s in the text colour', (bar, property) => {
    const root = renderMath().container.querySelector('.mq-math-mode')!;
    const cls = [...root.classList].find((c) => c.startsWith('css-'));

    for (const selector of [`.${cls}.mq-math-mode ${bar}`, `.${cls} .mq-math-mode ${bar}`]) {
      expect(declarationsFor(rulesFor(root), selector)).toContain(`${property}:currentColor;`);
    }
  });
});
