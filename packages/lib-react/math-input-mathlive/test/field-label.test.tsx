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
    latexToMarkup: (l) => `<span>${l}</span>`,
    latexToMathMl: () => '',
    createMathField: (ml) => new ml.MathfieldElement(),
  };
});

import { Input } from '../src/mf/input';
import Static from '../src/mf/static';

const mathField = (container: HTMLElement) => container.querySelector('math-field');

describe('math field name', () => {
  it('names the editable math input', async () => {
    const { container } = render(<Input latex="" />);

    await waitFor(() => expect(mathField(container)).toHaveAccessibleName('Enter answer'));
  });

  it('names the answer-block field of static math in the item language', async () => {
    const { container } = render(<Static latex={'x+\\MathQuillMathField[r1]{}'} language="es-ES" />);

    await waitFor(() => expect(mathField(container)).toHaveAccessibleName('Escribe la respuesta'));
  });

  it('renames the field when the language changes', async () => {
    const { container, rerender } = render(<Input latex="" />);

    await waitFor(() => expect(mathField(container)).not.toBeNull());
    rerender(<Input latex="" language="es-ES" />);

    expect(mathField(container)).toHaveAccessibleName('Escribe la respuesta');
  });

  it('names the keyboard input inside the field, which the field\'s own label does not reach', async () => {
    const { labelMathField } = await import('../src/mf/field-label');
    const field = document.createElement('div');
    const sink = document.createElement('span');

    sink.className = 'ML__keyboard-sink';
    field.attachShadow({ mode: 'open' }).append(sink);
    labelMathField(field, 'es-ES');

    expect(field.getAttribute('role')).toEqual('group');
    expect(field.getAttribute('aria-label')).toEqual('Escribe la respuesta');
    expect(sink.getAttribute('aria-label')).toEqual('Escribe la respuesta');
  });
});
