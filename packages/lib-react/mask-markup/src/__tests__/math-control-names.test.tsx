import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on naming.
vi.mock('@pie-element/shared-math-rendering-mathjax', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  renderMath: () => {},
}));

// happy-dom parses `<math>` into the HTML namespace, where DOMPurify drops it. A browser keeps it.
vi.mock('@pie-element/shared-utils', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sanitizeModelHtml: (html: string) => html,
}));

const { default: Choice } = await import('../choices/choice');
const { default: Blank } = await import('../components/blank');
const { default: Dropdown } = await import('../components/dropdown');

// Chrome leaves MathML out of a control's name from content, so a control that holds math has none.
const SQUARED = '<math><msup><mi>x</mi><mn>2</mn></msup></math>';
const HALF = '<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>';

describe('Math in drag-in-the-blank', () => {
  it('names a choice from its math', () => {
    render(
      <DndContext>
        <Choice choice={{ id: '0', value: SQUARED }} instanceId="a" />
      </DndContext>
    );

    expect(screen.getByRole('button', { name: 'x squared' })).toBeTruthy();
  });

  it('leaves a text choice to its content', () => {
    render(
      <DndContext>
        <Choice choice={{ id: '0', value: 'Antigone' }} instanceId="a" />
      </DndContext>
    );

    expect(screen.getByRole('button', { name: 'Antigone' }).hasAttribute('aria-label')).toBe(false);
  });

  it('names the answer held by a blank from its math', () => {
    render(
      <DndContext>
        <Blank id="0" choice={{ id: '0', value: SQUARED }} instanceId="a" onChange={vi.fn()} />
      </DndContext>
    );

    expect(screen.getByRole('button', { name: 'x squared' })).toBeTruthy();
  });
});

describe('Math in an inline dropdown', () => {
  const choices = [
    { value: 'a', label: SQUARED },
    { value: 'b', label: HALF },
  ];
  const dropdown = (value?: string) => (
    <Dropdown id="0" value={value} choices={choices} onChange={vi.fn()} language="en-US" />
  );

  it('names the combobox from the chosen math', async () => {
    render(dropdown('a'));

    await waitFor(() => expect(screen.getByRole('combobox').getAttribute('aria-labelledby')).toMatch(/-value-name$/));
    const names = screen.getByRole('combobox').getAttribute('aria-labelledby')?.split(' ') ?? [];

    expect(document.getElementById(names[1])?.textContent).toBe('x squared');
  });

  it('keeps naming the combobox from its value when that holds no math', () => {
    render(<Dropdown id="0" value="a" choices={[{ value: 'a', label: 'Antigone' }]} onChange={vi.fn()} />);

    expect(screen.getByRole('combobox').getAttribute('aria-labelledby')).toMatch(/-value$/);
  });

  it('names each option from its math', async () => {
    render(dropdown());

    await waitFor(() => {
      const options = [...document.querySelectorAll('[role="option"]')];
      expect(options.map((option) => option.getAttribute('aria-label'))).toEqual(['x squared', '1 half']);
    });
  });
});
