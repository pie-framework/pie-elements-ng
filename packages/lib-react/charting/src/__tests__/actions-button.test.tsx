import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ActionsButton from '../actions-button';

// the typeset label goes through MathJax, which does not load here; record what it is asked to typeset
const typeset = vi.hoisted(() => vi.fn());
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: typeset }));

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

describe('charting Actions delete options', () => {
  const open = async (categories: object[]) => {
    const user = userEvent.setup();
    renderActions({ categories });
    await openWithKeyboard(user);
  };

  it.each([
    ['a fraction', '1/2', '\\(\\frac{1}{2}\\)'],
    ['a mixed number', '2 1/2', '\\(2\\frac{1}{2}\\)'],
    ['a negative fraction', '-3/4', '\\(-\\frac{3}{4}\\)'],
    ['an integer', '7', '\\(7\\)'],
    ['a decimal', '0.5', '\\(0.5\\)'],
  ])('typeset %s as the chart does', async (_kind, label, math) => {
    typeset.mockClear();
    await open([{ label, deletable: true }]);

    const item = screen.getByRole('menuitem', { name: `Delete <${label}>` });

    expect(item).toHaveTextContent(`Delete <${math}>`);
    expect(typeset).toHaveBeenCalledWith(item.querySelector('span'));
  });

  // MathJax's container is focusable and has a context menu of its own, so a press or right-click on the math
  // must reach the option and not the container
  it('lets pointer events on the typeset label through to the option', async () => {
    await open([{ label: '1/2', deletable: true }]);

    const item = screen.getByRole('menuitem', { name: 'Delete <1/2>' });

    expect(item.querySelector('span')).toHaveStyle({ pointerEvents: 'none' });
  });

  it('shows any other label as it is, without typesetting it', async () => {
    typeset.mockClear();
    await open([{ label: 'Apples', deletable: true }]);

    expect(screen.getByRole('menuitem', { name: 'Delete <Apples>' })).toHaveTextContent('Delete <Apples>');
    expect(typeset).not.toHaveBeenCalled();
  });
});
