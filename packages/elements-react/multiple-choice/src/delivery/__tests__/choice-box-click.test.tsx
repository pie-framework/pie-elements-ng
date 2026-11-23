import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

import { Choice as ChoiceComponent } from '../choice';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// choice.tsx is untyped, so its class declares no props.
const Choice = ChoiceComponent as unknown as React.ComponentType<Record<string, unknown>>;

const renderChoice = (props: object = {}) => {
  const onChoiceChanged = vi.fn();
  const { container } = render(
    <Choice
      choice={{ label: 'Mercury', value: 'mercury' }}
      index={0}
      choicesLength={4}
      choiceMode="radio"
      displayKey="A"
      choicesLayout="horizontal"
      checked={false}
      disabled={false}
      onChoiceChanged={onChoiceChanged}
      {...props}
    />,
  );

  return { box: container.querySelector('.choice') as HTMLElement, onChoiceChanged };
};

// The answer box is the choice's outer element, around the padding that holds its label (PIE-1549).
describe('multiple-choice answer box click', () => {
  it('picks the choice on a click in the box outside its label, and moves focus to its input', () => {
    const { box, onChoiceChanged } = renderChoice();

    fireEvent.click(box);

    expect(onChoiceChanged).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(box.querySelector('input'));
  });

  it('picks the choice once on a click on its label', () => {
    const { box, onChoiceChanged } = renderChoice();

    fireEvent.click(box.querySelector('label') as HTMLElement);

    expect(onChoiceChanged).toHaveBeenCalledTimes(1);
  });

  it('changes a checkbox choice once per click in the box', () => {
    const { box, onChoiceChanged } = renderChoice({ choiceMode: 'checkbox' });

    fireEvent.click(box);
    expect(onChoiceChanged).toHaveBeenCalledTimes(1);

    fireEvent.click(box);
    expect(onChoiceChanged).toHaveBeenCalledTimes(2);
  });

  it('leaves a click on a control in the box, such as the eliminator toggle, to the control', () => {
    const { box, onChoiceChanged } = renderChoice();
    // The answer eliminator ends the choice's row with its toggle.
    const toggle = document.createElement('button');
    box.querySelector('.choice-input-row')?.append(toggle);

    fireEvent.click(toggle);

    expect(onChoiceChanged).not.toHaveBeenCalled();
  });

  it('does nothing in a disabled choice, as an eliminated one is', () => {
    const { box, onChoiceChanged } = renderChoice({ disabled: true });

    fireEvent.click(box);

    expect(onChoiceChanged).not.toHaveBeenCalled();
    expect(box.style.cursor).toBe('');
  });

  it('shows the pointer over an enabled box', () => {
    expect(renderChoice().box.style.cursor).toBe('pointer');
  });
});
