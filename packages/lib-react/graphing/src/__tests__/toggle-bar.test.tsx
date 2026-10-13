import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { ToggleBar } from '../toggle-bar';

const options = ['point', 'line', 'segment'];

const renderBar = (draggableTools: boolean, onChange = vi.fn()) =>
  render(
    <ToggleBar
      options={options}
      selectedToolType="point"
      draggableTools={draggableTools}
      onChange={onChange}
      onChangeToolsOrder={vi.fn()}
      language="en_US"
    />,
  );

const toolButtons = () => ['Point', 'Line', 'Segment'].map((name) => screen.getByRole('button', { name }));

const expectNoWrapperSemantics = (button: HTMLElement) => {
  for (const attribute of ['role', 'tabindex', 'aria-disabled', 'aria-roledescription']) {
    expect(button.parentElement).not.toHaveAttribute(attribute);
  }
};

describe('ToggleBar', () => {
  it('renders each tool as one named button while tools cannot be reordered', () => {
    const { container } = renderBar(false);

    expect(screen.getAllByRole('button')).toHaveLength(options.length);
    for (const button of toolButtons()) {
      expect(button).not.toHaveAttribute('aria-roledescription');
      expectNoWrapperSemantics(button);
    }
    expect(container.querySelector('[role="button"] button, [aria-roledescription]')).toBeNull();
  });

  it('makes each tool button the draggable while tools can be reordered', () => {
    const { container } = renderBar(true);

    expect(screen.getAllByRole('button')).toHaveLength(options.length);
    for (const button of toolButtons()) {
      expect(button).toHaveAttribute('aria-roledescription', 'draggable');
      expectNoWrapperSemantics(button);
    }
    expect(container.querySelector('[role="button"] button')).toBeNull();
  });

  it('selects a tool on click', () => {
    const onChange = vi.fn();
    renderBar(true, onChange);

    fireEvent.click(screen.getByRole('button', { name: 'Line' }));

    expect(onChange).toHaveBeenCalledWith('line');
  });

  it('picks a tool up from its button by keyboard while tools can be reordered', () => {
    renderBar(true);

    const point = screen.getByRole('button', { name: 'Point' });
    fireEvent.keyDown(point, { code: 'Space' });

    expect(point).toHaveAttribute('aria-pressed', 'true');
  });
});
