import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { catalogs } from '../../i18n/index.js';
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

const i18n = catalogs.forLocale('en-US');
const t = i18n.t.bind(i18n);

const renderAnswerArea = (extras?: any) =>
  render(
    <ThemeProvider theme={theme}>
      <DndContext>
        <AnswerArea
          instanceId="1"
          model={model}
          session={session}
          showCorrect={false}
          disabled={false}
          onRemoveAnswer={vi.fn()}
          t={t}
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
    // Named after the choice and where it sits (spec row 7), without dnd-kit's "draggable".
    const tile = within(filled).getByRole('button', {
      name: 'Answer choice: Answer four in drop area for Object 2 Prompt two',
    });
    expect(tile).not.toHaveAttribute('aria-roledescription');
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

  it('leave a placed answer without drag semantics while disabled', () => {
    renderAnswerArea({ disabled: true });

    const filled = screen.getByRole('group', { name: 'Prompt two' });
    expect(filled).toHaveTextContent('Answer four');
    expect(within(filled).queryByRole('button')).not.toBeInTheDocument();
    expect(filled.querySelector('[aria-roledescription]')).toBeNull();
  });

  it('keep a placed answer selectable by click', () => {
    const onChoiceClick = vi.fn();
    renderAnswerArea({ onChoiceClick });

    fireEvent.click(screen.getByRole('group', { name: 'Prompt two' }));

    expect(onChoiceClick).toHaveBeenCalledWith(expect.objectContaining({ type: 'target', id: 4, promptId: 2 }));
  });

  it('take label ids from the instance id, so two instances do not share them', () => {
    const { container } = renderAnswerArea();
    const ids = [...container.querySelectorAll('[aria-labelledby]')].map((node) => node.getAttribute('aria-labelledby'));

    expect(ids).toEqual(['1-prompt-label-1', '1-prompt-label-2']);
  });

  it('leaves a placed answer unnamed when its id is no longer in the config', () => {
    renderAnswerArea({ session: { value: { 2: 999 } } });

    expect(screen.queryByRole('button', { name: /Answer choice:/ })).not.toBeInTheDocument();
    expect(screen.getByText('Drop area 2 is empty')).toBeInTheDocument();
  });
});
