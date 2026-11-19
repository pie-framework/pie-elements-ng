import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { Choice as ChoiceComponent } from '../choice';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// choice.tsx is untyped, so its class declares no props.
const Choice = ChoiceComponent as unknown as React.ComponentType<Record<string, unknown>>;

const baseProps = {
  choice: { label: 'London', value: 'a' },
  index: 0,
  choicesLength: 2,
  choiceMode: 'radio',
  displayKey: 'A',
  choicesLayout: 'vertical',
  checked: false,
  disabled: false,
  onChoiceChanged: () => {},
};

const choice = (props: object = {}) => <Choice {...baseProps} {...props} />;

// happy-dom drops declarations holding color-mix, so read the style object the row renders with.
const rowStyle = (props: object = {}, state: object = {}) => {
  const instance = new (ChoiceComponent as any)({ ...baseProps, ...props });
  instance.state = { ...instance.state, ...state };
  return instance.render().props.style;
};

// The CSS emotion emitted for the elements' own classes.
const emittedRules = (el: Element) => {
  const classes = [...el.classList];
  return [...document.querySelectorAll('style')]
    .map((style) => style.textContent ?? '')
    .join('\n')
    .split('}')
    .filter((rule) => classes.some((name) => rule.includes(`.${name}`)));
};

describe('multiple-choice choice state colours', () => {
  it('fill a selected choice with the authored colour, collapsible by a colour scheme', () => {
    expect(rowStyle({ checked: true, selectedAnswerBackgroundColor: 'rgb(182,210,232)' }).backgroundColor).toBe(
      'color-mix(in srgb, var(--pie-background-dark, #ECEDF1) var(--pie-fixed-hue-collapse, 0%), rgb(182,210,232))',
    );
  });

  it('fill a hovered choice the same way', () => {
    expect(rowStyle({ hoverAnswerBackgroundColor: '#ffff00' }, { isHovered: true }).backgroundColor).toBe(
      'color-mix(in srgb, var(--pie-background-dark, #ECEDF1) var(--pie-fixed-hue-collapse, 0%), #ffff00)',
    );
  });

  it('collapse an authored stroke into the ink, leaving the resting stroke transparent', () => {
    expect(rowStyle({ checked: true, selectedAnswerStrokeColor: 'red', selectedAnswerStrokeWidth: '3' }).border).toBe(
      '3px solid color-mix(in srgb, var(--pie-text, black) var(--pie-fixed-hue-collapse, 0%), red)',
    );
    expect(
      rowStyle({ hoverAnswerStrokeColor: 'red', hoverAnswerStrokeWidth: '1' }, { isHovered: true }).border,
    ).toBe('1px solid color-mix(in srgb, var(--pie-text, black) var(--pie-fixed-hue-collapse, 0%), red)');
    expect(rowStyle({ selectedAnswerStrokeColor: 'red' }).border).toBe('2px solid transparent');
  });

  it('leave an unset or initial colour unpainted', () => {
    for (const selectedAnswerBackgroundColor of [undefined, 'initial']) {
      expect(rowStyle({ checked: true, selectedAnswerBackgroundColor }).backgroundColor).toBe('initial');
    }
  });

  // Each of these sat over the choice's fill painting --pie-background, which pie-theme publishes
  // opaque, so the fill showed only as a frame in the padding.
  it('paint no background between the choice and its text', () => {
    const { container } = render(choice({ checked: true, selectedAnswerBackgroundColor: 'rgb(182,210,232)' }));
    const label = container.querySelector('.MuiFormControlLabel-root') as Element;
    const layers = [
      container.querySelector('.corespring-radio-button > div'),
      container.querySelector('.checkbox-holder'),
      label,
      label.querySelector('.MuiFormControlLabel-label > span'),
    ];

    for (const layer of layers) {
      expect(layer).not.toBeNull();
      expect(emittedRules(layer as Element).join('}')).not.toMatch(/background/);
    }
  });
});
