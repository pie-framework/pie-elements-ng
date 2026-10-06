import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import FeedbackMenu from '../src/choice-configuration/feedback-menu.js';

// Two choices, each with its feedback menu.
const Choices = ({ type = 'default' }: { type?: string }) => (
  <>
    <FeedbackMenu value={{ type }} onChange={vi.fn()} />
    <FeedbackMenu value={{ type }} onChange={vi.fn()} />
  </>
);

const menus = () => [...document.querySelectorAll('[id^="feedback-menu-"]')].map((el) => el.id);

afterEach(cleanup);

describe('choice feedback menu', () => {
  it('gives each open menu its own id', () => {
    render(<Choices />);

    for (const button of screen.getAllByRole('button', { name: 'Default Feedback' })) {
      fireEvent.click(button);
    }

    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(menus()).toHaveLength(2);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps its id when the feedback type changes', () => {
    const { rerender } = render(<Choices />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Default Feedback' })[0]);
    const before = menus();

    rerender(<Choices type="custom" />);

    expect(menus()).toEqual(before);
  });
});
