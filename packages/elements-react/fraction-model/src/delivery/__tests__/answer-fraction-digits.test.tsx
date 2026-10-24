import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

import { AnswerFraction } from '../answer-fraction';

// answer-fraction.tsx is untyped, so its class declares no props.
const Fraction = AnswerFraction as unknown as React.ComponentType<Record<string, unknown>>;

function mount(answers: object = { noOfModel: '', partsPerModel: '' }) {
  const onAnswerChange = vi.fn();
  const { container } = render(
    <Fraction
      model={{ allowedStudentConfig: true, maxModelSelected: 5, partsPerModel: 4 }}
      answers={answers}
      disabled={false}
      showCorrect={false}
      onAnswerChange={onAnswerChange}
    />,
  );
  const [models, parts] = [...container.querySelectorAll('input')] as HTMLInputElement[];
  return { models, parts, onAnswerChange };
}

describe('fraction-model count inputs', () => {
  it('count Arabic-Indic and Extended Arabic-Indic digits', () => {
    const { models, parts, onAnswerChange } = mount();

    fireEvent.change(parts, { target: { value: '٣' } });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ noOfModel: '', partsPerModel: 3 });

    fireEvent.change(models, { target: { value: '۴' } });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ noOfModel: 4, partsPerModel: '' });
  });

  it('clamp to the field range and store a cleared field as unanswered', () => {
    const { models, parts, onAnswerChange } = mount({ noOfModel: 2, partsPerModel: 2 });

    fireEvent.change(models, { target: { value: '٨' } });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ noOfModel: 5, partsPerModel: 2 });

    fireEvent.change(parts, { target: { value: '' } });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ noOfModel: 2, partsPerModel: '' });
  });

  it('step with the arrow keys within the range', () => {
    const { models, parts, onAnswerChange } = mount({ noOfModel: 5, partsPerModel: '' });

    fireEvent.keyDown(models, { key: 'ArrowUp' });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ noOfModel: 5, partsPerModel: '' });

    fireEvent.keyDown(models, { key: 'ArrowDown' });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ noOfModel: 4, partsPerModel: '' });

    fireEvent.keyDown(parts, { key: 'ArrowUp' });
    expect(onAnswerChange).toHaveBeenLastCalledWith({ noOfModel: 5, partsPerModel: 1 });
  });

  it('expose each field as a spinbutton with its range and value', () => {
    const { models, parts } = mount({ noOfModel: 3, partsPerModel: '' });

    expect(models.type).toBe('text');
    expect(models.inputMode).toBe('numeric');
    expect(models.getAttribute('role')).toBe('spinbutton');
    expect(models.getAttribute('aria-valuemax')).toBe('5');
    expect(models.getAttribute('aria-valuenow')).toBe('3');
    expect(parts.getAttribute('aria-valuemax')).toBe('9');
    expect(parts.hasAttribute('aria-valuenow')).toBe(false);
  });
});
