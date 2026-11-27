import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { MultipleChoice } = await import('../multiple-choice');

// multiple-choice.tsx is untyped, so its class declares no props.
const Item = MultipleChoice as unknown as React.ComponentType<Record<string, unknown>>;

const renderItem = (props: object = {}) => {
  const onChoiceChanged = vi.fn();
  const { container } = render(
    <Item
      mode="gather"
      choiceMode="checkbox"
      choices={[
        { value: 'a', label: 'Mercury' },
        { value: 'b', label: 'Venus' },
      ]}
      session={{ value: [] }}
      onChoiceChanged={onChoiceChanged}
      {...props}
    />,
  );

  return { inputs: [...container.querySelectorAll('input')], onChoiceChanged };
};

// A native radio or checkbox takes only Space; docs/ACCESSIBILITY.md also promises Enter (PIE-1628).
describe('multiple-choice Enter key', () => {
  it.each(['checkbox', 'radio'])('selects a focused %s choice', (choiceMode) => {
    const { inputs, onChoiceChanged } = renderItem({ choiceMode });

    fireEvent.keyDown(inputs[1], { key: 'Enter' });

    expect(onChoiceChanged).toHaveBeenCalledTimes(1);
    expect(onChoiceChanged).toHaveBeenCalledWith({ value: 'b', selected: true, selector: 'Keyboard' });
  });

  it('unselects a checked checkbox choice', () => {
    const { inputs, onChoiceChanged } = renderItem({ session: { value: ['b'] } });

    fireEvent.keyDown(inputs[1], { key: 'Enter' });

    expect(onChoiceChanged).toHaveBeenCalledWith({ value: 'b', selected: false, selector: 'Keyboard' });
  });

  it('leaves a checked radio choice checked', () => {
    const { inputs, onChoiceChanged } = renderItem({ choiceMode: 'radio', session: { value: ['b'] } });

    fireEvent.keyDown(inputs[1], { key: 'Enter' });

    expect(onChoiceChanged).not.toHaveBeenCalled();
  });

  it('selects no more checkbox choices than the maximum', () => {
    const { inputs, onChoiceChanged } = renderItem({ maxSelections: 1, session: { value: ['a'] } });

    fireEvent.keyDown(inputs[1], { key: 'Enter' });

    expect(onChoiceChanged).not.toHaveBeenCalled();
  });

  it('does nothing while an input method editor composes', () => {
    const { inputs, onChoiceChanged } = renderItem();

    fireEvent.keyDown(inputs[1], { key: 'Enter', isComposing: true });

    expect(onChoiceChanged).not.toHaveBeenCalled();
  });
});

// A browser fires a choice's click and change after the key or pointer press that made them.
describe('multiple-choice selector', () => {
  it.each(['checkbox', 'radio'])('records a %s choice picked with Space as a keyboard selection', (choiceMode) => {
    const { inputs, onChoiceChanged } = renderItem({ choiceMode });

    fireEvent.keyDown(inputs[0], { key: ' ' });
    fireEvent.click(inputs[0]);

    expect(onChoiceChanged).toHaveBeenCalledWith({ value: 'a', selected: true, selector: 'Keyboard' });
  });

  it('records the arrow keys moving the check in a radio group as a keyboard selection', () => {
    const { inputs, onChoiceChanged } = renderItem({ choiceMode: 'radio', session: { value: ['a'] } });

    fireEvent.keyDown(inputs[0], { key: 'ArrowDown' });
    fireEvent.click(inputs[1]);

    expect(onChoiceChanged).toHaveBeenCalledWith({ value: 'b', selected: true, selector: 'Keyboard' });
  });

  it('records a pointer press after a key as a mouse selection', () => {
    const { inputs, onChoiceChanged } = renderItem();

    fireEvent.keyDown(inputs[0], { key: ' ' });
    fireEvent.pointerDown(inputs[1]);
    fireEvent.click(inputs[1]);

    expect(onChoiceChanged).toHaveBeenCalledWith({ value: 'b', selected: true, selector: 'Mouse' });
  });

  it('records a click after Tab as a mouse selection, as Tab changes no choice', () => {
    const { inputs, onChoiceChanged } = renderItem();

    fireEvent.keyDown(inputs[0], { key: 'Tab' });
    fireEvent.click(inputs[0]);

    expect(onChoiceChanged).toHaveBeenCalledWith({ value: 'a', selected: true, selector: 'Mouse' });
  });
});
