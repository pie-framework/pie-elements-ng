import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import AnswerArea from '../answer-area';

const theme = createTheme();

const model = {
  mode: 'gather',
  config: {
    prompts: [
      { id: 1, title: 'Prompt one', relatedAnswer: 3 },
      { id: 2, title: 'Prompt two', relatedAnswer: 4 },
    ],
    answers: [
      { id: 3, title: 'Answer three' },
      { id: 4, title: 'Answer four' },
    ],
  },
};

// Prompt 2 holds an answer; prompt 1 is empty.
const session = { value: { 2: 4 } };

const renderAnswerArea = (extras?: any) =>
  render(
    <ThemeProvider theme={theme}>
      <DndContext>
        <AnswerArea
          instanceId="1"
          uid="42"
          model={model}
          session={session}
          showCorrect={false}
          disabled={false}
          onRemoveAnswer={vi.fn()}
          {...extras}
        />
      </DndContext>
    </ThemeProvider>,
  );

describe('AnswerArea response areas', () => {
  it('are groups named by their prompts while nothing is selected', () => {
    renderAnswerArea();

    const empty = screen.getByRole('group', { name: 'Prompt one' });
    expect(empty).toHaveAttribute('tabindex', '-1');
    expect(within(empty).queryByRole('button')).not.toBeInTheDocument();

    const filled = screen.getByRole('group', { name: 'Prompt two' });
    expect(within(filled).getByRole('button', { name: 'Answer four' })).toHaveAttribute(
      'aria-roledescription',
      'draggable',
    );
  });

  it('make an empty area a button named by its prompt once a choice is selected', () => {
    renderAnswerArea({ selectedAnswer: { type: 'answer', id: 3, instanceId: '1' } });

    const empty = screen.getByRole('button', { name: 'Prompt one' });
    expect(empty).toHaveAttribute('tabindex', '0');
    expect(within(empty).queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Prompt two' })).toBeInTheDocument();
  });

  it('place the selection with Enter, Space or a click on the empty area', () => {
    const onPlacementClick = vi.fn();
    renderAnswerArea({ selectedAnswer: { type: 'answer', id: 3, instanceId: '1' }, onPlacementClick });
    const empty = screen.getByRole('button', { name: 'Prompt one' });

    fireEvent.keyDown(empty, { code: 'Enter' });
    fireEvent.keyDown(empty, { code: 'Space' });
    fireEvent.click(empty);

    expect(onPlacementClick).toHaveBeenCalledTimes(3);
    expect(onPlacementClick).toHaveBeenCalledWith({ type: 'drop-zone', promptId: 1, instanceId: '1' });
  });

  it('keep a placed answer selectable by click', () => {
    const onChoiceClick = vi.fn();
    renderAnswerArea({ onChoiceClick });

    fireEvent.click(screen.getByRole('group', { name: 'Prompt two' }));

    expect(onChoiceClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'target', id: 4, promptId: 2 }));
  });

  it('take label ids from the element uid, so two instances do not share them', () => {
    const { container } = renderAnswerArea();
    const ids = [...container.querySelectorAll('[aria-labelledby]')].map((node) => node.getAttribute('aria-labelledby'));

    expect(ids).toEqual(['match-list-42-prompt-label-1', 'match-list-42-prompt-label-2']);
  });
});
