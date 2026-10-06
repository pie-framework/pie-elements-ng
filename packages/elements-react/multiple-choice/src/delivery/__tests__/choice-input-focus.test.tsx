import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { ChoiceInput } from '../choice-input';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const Choice = ChoiceInput as unknown as React.ComponentType<Record<string, unknown>>;

// The THEMING.md focus chain.
const FOCUS_RING =
  'var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border, #1565C0)))';

const emittedCss = () => [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');

describe('multiple-choice choice focus ring', () => {
  it.each(['radio', 'checkbox'])('draws the %s focus outline and hover ring on the focus chain', (choiceMode) => {
    render(
      <Choice
        choiceMode={choiceMode}
        displayKey="A"
        label="Choice A"
        value="a"
        checked={false}
        disabled={false}
        onChange={() => {}}
      />,
    );

    const rules = emittedCss().split('}');
    const focus = rules.filter((r) => r.includes('.Mui-focusVisible') && r.includes('outline:2px'));
    const hover = rules.filter((r) => r.includes(':hover:not(.Mui-disabled) svg{'));

    expect(focus.length).toBeGreaterThan(0);
    expect(hover.length).toBeGreaterThan(0);
    for (const rule of focus) expect(rule).toContain(`outline:2px solid ${FOCUS_RING};`);
    for (const rule of hover) expect(rule).toContain(`box-shadow:0px 0px 0px 2px ${FOCUS_RING};`);
    // The retired fixed ring and its unregistered hook.
    expect(emittedCss()).not.toMatch(/2B87FF|keyboard-focus-indicator/i);
  });
});
