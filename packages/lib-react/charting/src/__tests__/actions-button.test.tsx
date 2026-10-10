import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ActionsButton from '../actions-button';

const deletable = [
  { label: 'Apples', deletable: true },
  { label: 'Pears', deletable: true },
];

const renderActions = ({ language = undefined as string | undefined, categories = [] as object[] } = {}) => {
  const addCategory = vi.fn();
  const deleteCategory = vi.fn();
  render(
    <ActionsButton categories={categories} addCategory={addCategory} deleteCategory={deleteCategory} language={language} />,
  );

  return { addCategory, deleteCategory, trigger: screen.getByRole('button', { name: language ? 'Acciones' : 'Actions' }) };
};

const openWithKeyboard = async (user: ReturnType<typeof userEvent.setup>, keys = '{Enter}') => {
  await user.tab();
  await user.keyboard(keys);
};

describe('charting Actions trigger', () => {
  it('is a named button that advertises a closed menu', () => {
    const { trigger } = renderActions();

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('names the trigger in the item language', () => {
    renderActions({ language: 'es_ES' });

    expect(screen.getByRole('button', { name: 'Acciones' })).toBeInTheDocument();
  });

  it.each([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('opens the menu on %s with focus on the first option', async (_key, keys) => {
    const user = userEvent.setup();
    const { trigger } = renderActions({ categories: deletable });

    await openWithKeyboard(user, keys);

    expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: '+ Add' })).toHaveFocus();
  });

  it('moves between the options with the arrow keys', async () => {
    const user = userEvent.setup();
    renderActions({ categories: deletable });

    await openWithKeyboard(user);
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Delete <Apples>' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Delete <Pears>' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');

    expect(screen.getByRole('menuitem', { name: 'Delete <Apples>' })).toHaveFocus();
  });

  it('keeps the options out of the tab order', async () => {
    renderActions({ categories: deletable });
    const user = userEvent.setup();

    await openWithKeyboard(user);

    screen.getAllByRole('menuitem').forEach((option) => {
      expect(option).toHaveAttribute('tabindex', '-1');
    });
  });

  it('runs the focused option on Enter', async () => {
    const user = userEvent.setup();
    const { deleteCategory } = renderActions({ categories: deletable });

    await openWithKeyboard(user);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(deleteCategory).toHaveBeenCalledWith(1);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const { trigger } = renderActions({ categories: deletable });

    await openWithKeyboard(user);
    await user.keyboard('{Escape}');

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveFocus();
  });
});
