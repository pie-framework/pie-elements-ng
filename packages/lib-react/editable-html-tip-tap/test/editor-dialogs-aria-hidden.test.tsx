import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImageToolbar } from '../src/components/image/ImageToolbar';
import { insertDialog } from '../src/extensions/media';

// MUI's modal marks every other child of <body> aria-hidden while it is open and lifts that when it
// closes or unmounts. Its modal manager is a module singleton that restores only once the last open
// modal closes, so every test closes the dialog it opens.
const hiddenBodyChildren = () =>
  Array.from(document.body.children).filter((el) => el.getAttribute('aria-hidden') === 'true');

const openDialog = async () => {
  const dialog = await screen.findByRole('dialog', { hidden: true });
  expect(dialog.closest('[aria-hidden="true"]')).toBeNull();
  return dialog;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('alt-text dialog', () => {
  const openAltDialog = async (onChange = vi.fn()) => {
    render(<ImageToolbar onChange={onChange} imageLoaded alt="" />);
    fireEvent.mouseDown(screen.getByText('Alt text'));
    return openDialog();
  };

  it('stays in the accessibility tree while open and leaves nothing aria-hidden after Done', async () => {
    const onChange = vi.fn();
    await openAltDialog(onChange);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Alt Text description/), { target: { value: 'A cat' } });
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(onChange).toHaveBeenCalledWith({ alt: 'A cat' }, true);
    expect(screen.queryByRole('dialog', { hidden: true })).toBeNull();
    expect(hiddenBodyChildren()).toEqual([]);
    expect(document.body.children).toHaveLength(1);
  });

  it('leaves nothing aria-hidden after Escape', async () => {
    const dialog = await openAltDialog();

    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { hidden: true })).toBeNull();
    expect(hiddenBodyChildren()).toEqual([]);
    expect(document.body.children).toHaveLength(1);
  });
});

describe('media dialog', () => {
  it('stays in the accessibility tree while open and leaves nothing aria-hidden after Cancel', async () => {
    const page = document.createElement('main');
    document.body.appendChild(page);
    const callback = vi.fn();

    act(() => insertDialog({ type: 'video', callback, options: {} }));
    await openDialog();
    expect(page).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(callback).toHaveBeenCalledWith(false, undefined);
    await waitFor(() => expect(screen.queryByRole('dialog', { hidden: true })).toBeNull());
    expect(hiddenBodyChildren()).toEqual([]);
    expect(document.body.children).toHaveLength(1);
  });
});
