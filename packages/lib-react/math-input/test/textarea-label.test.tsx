import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import * as mq from '../src/mq/index.js';

const fieldTextareas = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLTextAreaElement>('.mq-editable-field textarea'));

describe('math input textarea name', () => {
  it('names every response field of static math', () => {
    const { container } = render(
      <mq.Static latex={'x+\\MathQuillMathField[r1]{}=\\MathQuillMathField[r2]{}'} />,
    );

    const textareas = fieldTextareas(container);
    expect(textareas).toHaveLength(2);
    for (const textarea of textareas) {
      expect(textarea).toHaveAccessibleName('Enter answer');
    }
  });

  it('names the response fields in the item language', () => {
    const { container } = render(
      <mq.Static latex={'\\MathQuillMathField[r1]{}'} language="es-ES" />,
    );

    expect(fieldTextareas(container)[0]).toHaveAccessibleName('Escribe la respuesta');
  });

  it('names the fields that a new latex adds', () => {
    const { container, rerender } = render(<mq.Static latex={'\\MathQuillMathField[r1]{}'} />);

    rerender(<mq.Static latex={'\\MathQuillMathField[r1]{}+\\MathQuillMathField[r2]{}'} />);

    const textareas = fieldTextareas(container);
    expect(textareas).toHaveLength(2);
    for (const textarea of textareas) {
      expect(textarea).toHaveAccessibleName('Enter answer');
    }
  });

  it('names the editable math input', () => {
    const { container } = render(<mq.Input latex="" />);

    expect(fieldTextareas(container)[0]).toHaveAccessibleName('Enter answer');
  });
});
