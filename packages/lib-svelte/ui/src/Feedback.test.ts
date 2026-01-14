import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Feedback from './Feedback.svelte';

describe('Feedback', () => {
  it('renders correct feedback with icon', () => {
    const { container } = render(Feedback, { correct: true });
    const feedback = container.querySelector('.pie-feedback');
    expect(feedback).toHaveClass('correct');
    expect(feedback).not.toHaveClass('incorrect');
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders incorrect feedback with icon', () => {
    const { container } = render(Feedback, { correct: false });
    const feedback = container.querySelector('.pie-feedback');
    expect(feedback).toHaveClass('incorrect');
    expect(feedback).not.toHaveClass('correct');
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has role="alert" and aria-live="polite"', () => {
    const { container } = render(Feedback, { correct: true });
    const feedback = container.querySelector('.pie-feedback');
    expect(feedback).toHaveAttribute('role', 'alert');
    expect(feedback).toHaveAttribute('aria-live', 'polite');
  });

  it('renders feedback message when provided', () => {
    render(Feedback, {
      correct: true,
      feedback: 'Great job!',
    });
    expect(screen.getByText('Great job!')).toBeInTheDocument();
  });

  it('does not render message div when feedback is not provided', () => {
    const { container } = render(Feedback, { correct: true });
    const message = container.querySelector('.message');
    expect(message).not.toBeInTheDocument();
  });

  it('renders HTML feedback message', () => {
    render(Feedback, {
      correct: false,
      feedback: '<p>Try again. Remember to <strong>carry the one</strong>.</p>',
    });
    expect(screen.getByText(/Try again/)).toBeInTheDocument();
    expect(screen.getByText('carry the one')).toBeInTheDocument();
    const strong = screen.getByText('carry the one');
    expect(strong.tagName).toBe('STRONG');
  });

  it('applies custom className', () => {
    const { container } = render(Feedback, {
      correct: true,
      className: 'custom-feedback',
    });
    const feedback = container.querySelector('.pie-feedback');
    expect(feedback).toHaveClass('custom-feedback');
  });

  it('renders correct icon SVG', () => {
    const { container } = render(Feedback, { correct: true });
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelector('path')).toBeInTheDocument();
  });

  it('renders incorrect icon SVG', () => {
    const { container } = render(Feedback, { correct: false });
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.querySelector('path')).toBeInTheDocument();
  });

  it('renders with empty feedback string', () => {
    const { container } = render(Feedback, {
      correct: true,
      feedback: '',
    });
    const message = container.querySelector('.message');
    expect(message).not.toBeInTheDocument();
  });

  it('maintains correct styling for correct feedback', () => {
    const { container } = render(Feedback, {
      correct: true,
      feedback: 'Correct!',
    });
    const feedback = container.querySelector('.pie-feedback');
    expect(feedback).toHaveClass('correct');
  });

  it('maintains incorrect styling for incorrect feedback', () => {
    const { container } = render(Feedback, {
      correct: false,
      feedback: 'Incorrect',
    });
    const feedback = container.querySelector('.pie-feedback');
    expect(feedback).toHaveClass('incorrect');
  });

  it('renders multiline feedback', () => {
    const multilineText = `
      <p>Your answer is incorrect.</p>
      <p>Hint: Consider the order of operations.</p>
    `;
    render(Feedback, {
      correct: false,
      feedback: multilineText,
    });
    expect(screen.getByText(/Your answer is incorrect/)).toBeInTheDocument();
    expect(screen.getByText(/Hint: Consider the order of operations/)).toBeInTheDocument();
  });
});
