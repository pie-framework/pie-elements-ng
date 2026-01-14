import { render, screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MultipleChoiceViewModel } from '../types';
import MultipleChoice from './MultipleChoice.svelte';

describe('MultipleChoice Component', () => {
  const baseModel: MultipleChoiceViewModel = {
    disabled: false,
    mode: 'gather',
    prompt: '<p>What is 2 + 2?</p>',
    promptEnabled: true,
    choiceMode: 'radio',
    choicePrefix: 'letters',
    choicesLayout: 'vertical',
    choices: [
      { value: 'a', label: '3', correct: false, index: 0 },
      { value: 'b', label: '4', correct: true, index: 1 },
      { value: 'c', label: '5', correct: false, index: 2 },
    ],
  };

  it('renders prompt when enabled', () => {
    render(MultipleChoice, {
      model: baseModel,
      session: {},
      onChange: vi.fn(),
    });

    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('does not render prompt when disabled', () => {
    const model = { ...baseModel, promptEnabled: false };
    render(MultipleChoice, {
      model,
      session: {},
      onChange: vi.fn(),
    });

    expect(screen.queryByText('What is 2 + 2?')).not.toBeInTheDocument();
  });

  it('renders all choices', () => {
    const { container } = render(MultipleChoice, {
      model: baseModel,
      session: {},
      onChange: vi.fn(),
    });

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    const labels = container.querySelectorAll('.choice');
    expect(labels).toHaveLength(3);
  });

  it('renders radio inputs for radio mode', () => {
    const { container } = render(MultipleChoice, {
      model: baseModel,
      session: {},
      onChange: vi.fn(),
    });

    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios).toHaveLength(3);
  });

  it('renders checkbox inputs for checkbox mode', () => {
    const model = { ...baseModel, choiceMode: 'checkbox' as const };
    const { container } = render(MultipleChoice, {
      model,
      session: {},
      onChange: vi.fn(),
    });

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes).toHaveLength(3);
  });

  it('renders choice prefixes with letters', () => {
    render(MultipleChoice, {
      model: baseModel,
      session: {},
      onChange: vi.fn(),
    });

    expect(screen.getByText('A.')).toBeInTheDocument();
    expect(screen.getByText('B.')).toBeInTheDocument();
    expect(screen.getByText('C.')).toBeInTheDocument();
  });

  it('renders choice prefixes with numbers', () => {
    const model = { ...baseModel, choicePrefix: 'numbers' as const };
    render(MultipleChoice, {
      model,
      session: {},
      onChange: vi.fn(),
    });

    expect(screen.getByText('1.')).toBeInTheDocument();
    expect(screen.getByText('2.')).toBeInTheDocument();
    expect(screen.getByText('3.')).toBeInTheDocument();
  });

  it('does not render prefixes when none', () => {
    const model = { ...baseModel, choicePrefix: 'none' as const };
    render(MultipleChoice, {
      model,
      session: {},
      onChange: vi.fn(),
    });

    expect(screen.queryByText('A.')).not.toBeInTheDocument();
    expect(screen.queryByText('1.')).not.toBeInTheDocument();
  });

  it('marks selected choice as checked', () => {
    const { container } = render(MultipleChoice, {
      model: baseModel,
      session: { value: ['a'] },
      onChange: vi.fn(),
    });

    const inputs = container.querySelectorAll('input');
    expect(inputs[0]).toBeChecked();
    expect(inputs[1]).not.toBeChecked();
    expect(inputs[2]).not.toBeChecked();
  });

  it('calls onChange when radio is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(MultipleChoice, {
      model: baseModel,
      session: {},
      onChange,
    });

    const secondRadio = container.querySelectorAll('input')[1];
    await user.click(secondRadio);

    expect(onChange).toHaveBeenCalledWith(['b']);
  });

  it('calls onChange when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const model = { ...baseModel, choiceMode: 'checkbox' as const };
    const { container } = render(MultipleChoice, {
      model,
      session: {},
      onChange,
    });

    const firstCheckbox = container.querySelectorAll('input')[0];
    await user.click(firstCheckbox);

    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('toggles checkbox selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const model = { ...baseModel, choiceMode: 'checkbox' as const };
    const { container } = render(MultipleChoice, {
      model,
      session: { value: ['a'] },
      onChange,
    });

    const firstCheckbox = container.querySelectorAll('input')[0];
    await user.click(firstCheckbox);

    expect(onChange).toHaveBeenCalledWith([]); // Unchecked
  });

  it('allows multiple checkbox selections', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const model = { ...baseModel, choiceMode: 'checkbox' as const };
    const { container } = render(MultipleChoice, {
      model,
      session: { value: ['a'] },
      onChange,
    });

    const secondCheckbox = container.querySelectorAll('input')[1];
    await user.click(secondCheckbox);

    expect(onChange).toHaveBeenCalledWith(['a', 'b']);
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const model = { ...baseModel, disabled: true };
    const { container } = render(MultipleChoice, {
      model,
      session: {},
      onChange,
    });

    const firstRadio = container.querySelectorAll('input')[0];
    await user.click(firstRadio);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('disables inputs when model is disabled', () => {
    const model = { ...baseModel, disabled: true };
    const { container } = render(MultipleChoice, {
      model,
      session: {},
      onChange: vi.fn(),
    });

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('shows feedback when choice has showFeedback true', () => {
    const model: MultipleChoiceViewModel = {
      ...baseModel,
      choices: [
        {
          value: 'a',
          label: '3',
          correct: false,
          index: 0,
          checked: true,
          showFeedback: true,
          feedback: 'Try again',
        },
        { value: 'b', label: '4', correct: true, index: 1 },
        { value: 'c', label: '5', correct: false, index: 2 },
      ],
    };

    render(MultipleChoice, {
      model,
      session: { value: ['a'] },
      onChange: vi.fn(),
    });

    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('shows correct response indicator when responseCorrect is true', () => {
    const model = { ...baseModel, responseCorrect: true };
    render(MultipleChoice, {
      model,
      session: { value: ['b'] },
      onChange: vi.fn(),
    });

    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('shows incorrect response indicator when responseCorrect is false', () => {
    const model = { ...baseModel, responseCorrect: false };
    render(MultipleChoice, {
      model,
      session: { value: ['a'] },
      onChange: vi.fn(),
    });

    expect(screen.getByText(/Incorrect/)).toBeInTheDocument();
  });

  it('shows rationale when showRationale is true', () => {
    const model = {
      ...baseModel,
      showRationale: true,
      rationale: '<p>Explanation here</p>',
    };
    render(MultipleChoice, {
      model,
      session: {},
      onChange: vi.fn(),
    });

    expect(screen.getByText('Explanation here')).toBeInTheDocument();
  });

  it('does not show rationale when showRationale is false', () => {
    const model = {
      ...baseModel,
      showRationale: false,
      rationale: '<p>Explanation here</p>',
    };
    render(MultipleChoice, {
      model,
      session: {},
      onChange: vi.fn(),
    });

    expect(screen.queryByText('Explanation here')).not.toBeInTheDocument();
  });

  it('applies vertical layout class', () => {
    const { container } = render(MultipleChoice, {
      model: baseModel,
      session: {},
      onChange: vi.fn(),
    });

    const choices = container.querySelector('.choices');
    expect(choices).toHaveClass('vertical');
  });

  it('applies horizontal layout class', () => {
    const model = { ...baseModel, choicesLayout: 'horizontal' as const };
    const { container } = render(MultipleChoice, {
      model,
      session: {},
      onChange: vi.fn(),
    });

    const choices = container.querySelector('.choices');
    expect(choices).toHaveClass('horizontal');
  });

  it('applies grid layout class', () => {
    const model = { ...baseModel, choicesLayout: 'grid' as const };
    const { container } = render(MultipleChoice, {
      model,
      session: {},
      onChange: vi.fn(),
    });

    const choices = container.querySelector('.choices');
    expect(choices).toHaveClass('grid');
  });

  it('has accessible group role', () => {
    const { container } = render(MultipleChoice, {
      model: baseModel,
      session: {},
      onChange: vi.fn(),
    });

    const group = container.querySelector('[role="group"]');
    expect(group).toBeInTheDocument();
  });

  it('has aria-labelledby pointing to prompt', () => {
    const { container } = render(MultipleChoice, {
      model: baseModel,
      session: {},
      onChange: vi.fn(),
    });

    const group = container.querySelector('[role="group"]');
    expect(group).toHaveAttribute('aria-labelledby', 'mc-prompt');
  });

  it('has response indicator with status role', () => {
    const model = { ...baseModel, responseCorrect: true };
    const { container } = render(MultipleChoice, {
      model,
      session: { value: ['b'] },
      onChange: vi.fn(),
    });

    const status = container.querySelector('[role="status"]');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('highlights correct choices in evaluate mode', () => {
    const model = {
      ...baseModel,
      mode: 'evaluate' as const,
      correctResponse: ['b'],
    };
    const { container } = render(MultipleChoice, {
      model,
      session: { value: ['a'] },
      onChange: vi.fn(),
    });

    const labels = container.querySelectorAll('.choice');
    expect(labels[1]).toHaveClass('correct'); // Second choice is correct
  });
});
