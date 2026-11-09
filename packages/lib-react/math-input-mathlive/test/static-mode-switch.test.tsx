import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

// A real <math-field> needs layout happy-dom does not have; a plain element stands in for it.
vi.mock('../src/mathlive-instance', () => {
  class FakeMathfieldElement {
    constructor() {
      const el = global.document.createElement('math-field');

      el.value = '';
      el.getValue = () => el.value;
      el.getPrompts = () => [];

      return el;
    }
  }

  return {
    loadMathLive: () => Promise.resolve({ MathfieldElement: FakeMathfieldElement }),
    getMacros: () => ({}),
    MATH_MODE_SPACE: '\\ ',
    applyShadowStyles: () => {},
    trackPlaceholderCaret: () => () => {},
    latexToMarkup: (l) => `<span class="markup">${l}</span>`,
    latexToMathMl: (l) => `<math data-source="${l}"></math>`,
    createMathField: (ml) => new ml.MathfieldElement(),
  };
});

import Static from '../src/mf/static';

const DISPLAY = 'x+\\frac{1}{2}';
const GATHER = 'x+\\MathQuillMathField[r1]{}';

const mathField = (container: HTMLElement) => container.querySelector('math-field');
const markup = (container: HTMLElement) => container.querySelector('.markup');

describe('Static switching between display and answer blocks', () => {
  it('mounts a field when answer blocks arrive after a display render', async () => {
    const { container, rerender } = render(<Static latex={DISPLAY} />);

    await waitFor(() => expect(markup(container)).not.toBeNull());
    rerender(<Static latex={GATHER} />);

    await waitFor(() => expect(mathField(container)).not.toBeNull());
    expect(markup(container)).toBeNull();
    expect(mathField(container).value).toEqual('x+\\placeholder[r1]{}');
  });

  it('renders markup when the answer blocks go away', async () => {
    const { container, rerender } = render(<Static latex={GATHER} />);

    await waitFor(() => expect(mathField(container)).not.toBeNull());
    rerender(<Static latex={DISPLAY} />);

    await waitFor(() => expect(markup(container)).not.toBeNull());
    expect(mathField(container)).toBeNull();
  });

  it('does not mount a field the latex no longer needs', async () => {
    const { container, rerender } = render(<Static latex={GATHER} />);

    // Before MathLive has loaded.
    rerender(<Static latex={DISPLAY} />);

    await waitFor(() => expect(markup(container)).not.toBeNull());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mathField(container)).toBeNull();
  });

  it('hides display markup from assistive technology behind MathML', async () => {
    const { container } = render(<Static latex={DISPLAY} />);

    await waitFor(() => expect(markup(container)).not.toBeNull());
    expect(markup(container).closest('[aria-hidden="true"]')).not.toBeNull();
    expect(container.querySelector('math').getAttribute('data-source')).toEqual(DISPLAY);
    expect(container.querySelector('math').closest('[aria-hidden]')).toBeNull();
  });
});
