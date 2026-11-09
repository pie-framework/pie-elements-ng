import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { MultipleChoice } = await import('../multiple-choice');

// multiple-choice.tsx is untyped, so its class declares no props.
const Item = MultipleChoice as unknown as React.ComponentType<Record<string, unknown>>;

const CHOICES = [
  { value: 'a', label: '<img src="a.png" alt="">' },
  { value: 'b', label: '<img src="b.png" alt="A red triangle">' },
  { value: 'c', label: 'Twelve' },
];

const item = (keyMode: string) => (
  <Item
    mode="gather"
    choiceMode="radio"
    keyMode={keyMode}
    prompt="<p>Pick one.</p>"
    choices={CHOICES}
    session={{ value: [] }}
    onChoiceChanged={vi.fn()}
  />
);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('choices with no text and no image description (PIE-1484)', () => {
  it('are named from their key', () => {
    render(item('letters'));

    expect(screen.getByRole('radio', { name: 'Choice A' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /A red triangle/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Twelve/ })).toBeInTheDocument();
  });

  it('are named from their position when choices have no key', () => {
    render(item('none'));

    expect(screen.getByRole('radio', { name: 'Choice 1' })).toBeInTheDocument();
  });
});
