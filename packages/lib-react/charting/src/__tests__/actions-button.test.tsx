import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ActionsButton from '../actions-button';

const renderActions = (language?: string) =>
  render(<ActionsButton categories={[]} addCategory={() => {}} deleteCategory={() => {}} language={language} />);

describe('charting Actions trigger', () => {
  it('is a named button that advertises a closed popover', () => {
    renderActions();

    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('names the trigger in the item language', () => {
    renderActions('es_ES');

    expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
  });

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('opens the popover on %s', async (_key, keys) => {
    const user = userEvent.setup();
    renderActions();
    const trigger = screen.getByRole('button', { name: 'Actions' });

    await user.tab();
    expect(trigger).toHaveFocus();

    await user.keyboard(keys);

    expect(screen.getByRole('dialog', { name: 'Actions' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
