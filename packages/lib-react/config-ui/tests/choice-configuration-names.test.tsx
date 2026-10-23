import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ChoiceConfiguration from '../src/choice-configuration/index.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const choice = { label: 'Paris', value: 'paris', correct: false, feedback: { type: 'custom', value: 'Try again.' } };

describe('choice authoring names', () => {
  it('names hidden-label fields by their choice and keeps the names current', async () => {
    const onChange = vi.fn();
    const props = { data: choice, mode: 'radio', defaultFeedback: {}, onChange, noLabels: true };
    const { rerender } = render(<ChoiceConfiguration {...props} index={1} useLetterOrdering />);

    expect(await screen.findByRole('textbox', { name: 'Choice A' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Feedback Text for choice A' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('radio', { name: 'Correct answer for choice A' }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'paris', correct: true }));

    rerender(<ChoiceConfiguration {...props} index={2} useLetterOrdering={false} />);
    expect(await screen.findByRole('textbox', { name: 'Choice 2' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Feedback Text for choice 2' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Correct answer for choice 2' })).toBeInTheDocument();
  });

  it('keeps visible labels in the names of choice fields and checkboxes', async () => {
    render(<ChoiceConfiguration data={choice} mode="checkbox" defaultFeedback={{}} onChange={vi.fn()} index={1} />);

    expect(await screen.findByRole('textbox', { name: 'Label for choice 1' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Correct answer for choice 1' })).toBeInTheDocument();
  });
});
