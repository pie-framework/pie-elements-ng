// @vitest-environment jsdom
// DOMPurify needs jsdom here; vitest.setup.ts says why.
/**
 * Cloze markup and choice labels come from the model, which players hand to elements
 * verbatim, so mask-markup sanitizes both before they reach the DOM.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

// MathJax loads off a CDN and has no bearing on sanitization.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// `choices` reaches the dropdowns through the mask's render callback, outside its propTypes.
const InlineDropdown: any = (await import('../inline-dropdown')).default;
const { default: Blank } = await import('../components/blank');
const { default: Choice } = await import('../choices/choice');

const UNSAFE = '<img src="x.png" onerror="alert(1)"><script>alert(1)</script>';

const unsafeNodes = (container: HTMLElement) => container.querySelectorAll('script, [onerror], [onclick]');

describe('mask-markup model HTML', () => {
  it('builds the cloze from sanitized markup and keeps its blanks', () => {
    const { container } = render(
      <InlineDropdown
        markup={`<p>Pick ${UNSAFE}{{0}} <a href="javascript:alert(1)" onclick="alert(1)">here</a>.</p>`}
        choices={{ 0: [{ value: '0', label: 'Mars' }] }}
        value={{}}
        onChange={vi.fn()}
      />,
    );

    expect(unsafeNodes(container)).toHaveLength(0);
    expect(container.querySelector('a')?.hasAttribute('href')).toBe(false);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('sanitizes dropdown choice labels in the menu and the chosen value', () => {
    const { container } = render(
      <InlineDropdown
        markup="<p>{{0}}</p>"
        choices={{ 0: [{ value: '0', label: `Mars${UNSAFE}` }] }}
        value={{ 0: '0' }}
        onChange={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: /^Mars/ })).toBeInTheDocument();
    expect(unsafeNodes(container)).toHaveLength(0);
    expect(unsafeNodes(document.body)).toHaveLength(0);
  });

  it('sanitizes drag-in-the-blank choice and blank labels', () => {
    const { container } = render(
      <DndContext>
        <Choice choice={{ id: '0', value: `Jupiter${UNSAFE}` }} instanceId="dib" />
        <Blank id="1" instanceId="dib" onChange={vi.fn()} choice={{ value: `Saturn${UNSAFE}` }} />
      </DndContext>,
    );

    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(unsafeNodes(container)).toHaveLength(0);
  });
});
