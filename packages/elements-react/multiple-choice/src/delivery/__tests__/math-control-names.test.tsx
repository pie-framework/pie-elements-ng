import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on naming.
vi.mock('@pie-element/shared-math-rendering-mathjax', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  renderMath: () => {},
}));

// happy-dom parses `<math>` into the HTML namespace, where DOMPurify drops it, so the prompt shows its
// markup as given, which is what a browser keeps.
vi.mock('@pie-lib/render-ui', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  default: undefined,
  PreviewPrompt: ({ prompt, className }: { prompt: string; className?: string }) => (
    <span className={className} dangerouslySetInnerHTML={{ __html: prompt }} />
  ),
}));

const { ChoiceInput } = await import('../choice-input');

// Chrome leaves MathML out of a label's text, so a choice that holds math has no name.
const SQUARED = '<math><msup><mi>x</mi><mn>2</mn></msup></math>';

const renderChoice = (props: Record<string, unknown>) =>
  render(<ChoiceInput value="a" disabled={false} onChange={vi.fn()} label={SQUARED} {...props} />);

describe('multiple-choice input names', () => {
  it('names a radio from the math in its label', () => {
    renderChoice({ choiceMode: 'radio' });

    expect(screen.getByRole('radio', { name: 'x squared' })).toBeTruthy();
  });

  it('names a checkbox from the math in its label', () => {
    renderChoice({ choiceMode: 'checkbox' });

    expect(screen.getByRole('checkbox', { name: 'x squared' })).toBeTruthy();
  });

  it('leaves a text label to the browser', () => {
    renderChoice({ choiceMode: 'radio', label: 'Antigone' });

    expect(screen.getByRole('radio', { name: 'Antigone' }).hasAttribute('aria-label')).toBe(false);
  });
});
