import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { MultipleChoice } = await import('../multiple-choice');

// multiple-choice.tsx is untyped, so its class declares no props.
const Item = MultipleChoice as unknown as React.ComponentType<Record<string, unknown>>;

function errorTextColor(hostStyle: Record<string, string> = {}) {
  render(
    <div style={hostStyle}>
      <Item
        mode="gather"
        choiceMode="checkbox"
        minSelections={2}
        choices={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
        session={{ value: [] }}
        onChoiceChanged={vi.fn()}
      />
    </div>,
  );
  // happy-dom resolves var() chains to the declared value without normalising it.
  return getComputedStyle(screen.getByText('Select at least 2.')).color.toLowerCase();
}

describe('multiple-choice minimum-selection error text', () => {
  it('falls back to the missing red with no theme loaded', () => {
    expect(errorTextColor()).toBe('#d32f2f');
  });

  it('takes the scheme --pie-missing', () => {
    expect(errorTextColor({ '--pie-missing': 'rgb(1, 2, 3)' })).toBe('rgb(1, 2, 3)');
  });
});
