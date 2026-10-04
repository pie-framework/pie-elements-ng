import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the combobox's semantics.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Dropdown } = await import('../dropdown');

const choices = [
  { value: '0', label: 'Jupiter' },
  { value: '1', label: 'Saturn' },
];

const renderDropdown = () => render(<Dropdown id="0" choices={choices} onChange={vi.fn()} />);

describe('Dropdown', () => {
  it('is a collapsed combobox while closed', () => {
    renderDropdown();

    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('is an expanded combobox that controls its listbox while open', () => {
    renderDropdown();
    const combobox = screen.getByRole('combobox');

    fireEvent.click(combobox);

    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox');
    expect(combobox).toHaveAttribute('aria-controls', listbox.id);
  });

  it('collapses again once an option is chosen', () => {
    renderDropdown();
    const combobox = screen.getByRole('combobox');

    fireEvent.click(combobox);
    fireEvent.click(screen.getByRole('option', { name: 'Saturn' }));

    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Dropdown ids', () => {
  const ids = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

  it('stay unique when two items render the same response on one page', () => {
    render(<Dropdown id="0" choices={choices} value="0" onChange={vi.fn()} />);
    render(<Dropdown id="0" choices={choices} value="1" onChange={vi.fn()} />);

    expect(new Set(ids()).size).toBe(ids().length);
    const [first, second] = screen.getAllByRole('combobox');
    expect(first).toHaveAccessibleName(expect.stringContaining('Jupiter'));
    expect(second).toHaveAccessibleName(expect.stringContaining('Saturn'));
  });

  it('stay the same across re-renders', () => {
    const { rerender } = render(<Dropdown id="0" choices={choices} onChange={vi.fn()} />);
    const before = ids();

    rerender(<Dropdown id="0" choices={choices} value="1" onChange={vi.fn()} />);

    expect(ids()).toEqual(before);
  });
});
