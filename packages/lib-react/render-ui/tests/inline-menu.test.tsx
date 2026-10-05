/**
 * InlineMenu leaves the page visible under an open menu and closes it on a click or tap
 * outside it. MUI reports that click only from the menu's backdrop, so the backdrop has to
 * render and the modal root has to take pointer events.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot, type Root } from 'react-dom/client';
import userEvent from '@testing-library/user-event';
import type { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { InlineMenu } from '../src/inline-menu';

let root: Root | undefined;
let host: HTMLElement | undefined;
let anchor: HTMLElement | undefined;

function renderMenu(props: Partial<MenuProps> = {}) {
  const onClose = vi.fn();
  const onSelect = vi.fn();
  anchor = document.createElement('button');
  document.body.appendChild(anchor);
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root?.render(
      <InlineMenu anchorEl={anchor} open onClose={onClose} {...props}>
        <MenuItem onClick={onSelect}>Option</MenuItem>
      </InlineMenu>
    )
  );
  const modalRoot = document.querySelector('.MuiMenu-root') as HTMLElement;
  return {
    onClose,
    onSelect,
    modalRoot,
    backdrop: modalRoot.querySelector('.MuiBackdrop-root') as HTMLElement,
    paper: modalRoot.querySelector('.MuiMenu-paper') as HTMLElement,
    item: modalRoot.querySelector('[role="menuitem"]') as HTMLElement,
  };
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  anchor?.remove();
  root = undefined;
  host = undefined;
  anchor = undefined;
});

describe('InlineMenu', () => {
  it('closes on a click on the backdrop, and a click inside the menu reaches its item', async () => {
    const { onClose, onSelect, backdrop, item } = renderMenu();
    const user = userEvent.setup();

    await user.click(item);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    await user.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'backdropClick');
  });

  it('closes on Escape', async () => {
    const { onClose } = renderMenu();

    await userEvent.setup().keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(expect.anything(), 'escapeKeyDown');
  });

  it('covers the page with a transparent root that takes pointer events and an invisible backdrop', () => {
    const { modalRoot, backdrop } = renderMenu();

    expect(modalRoot.style.pointerEvents).toBe('');
    expect(getComputedStyle(modalRoot).pointerEvents).not.toBe('none');
    expect(modalRoot.style.backgroundColor).toBe('transparent');
    expect(backdrop).toHaveClass('MuiBackdrop-invisible');
  });

  it('merges caller slotProps into the root, paper and backdrop', () => {
    const { modalRoot, paper, backdrop } = renderMenu({
      slotProps: {
        root: { className: 'caller-root', style: { zIndex: 5 } },
        paper: { style: { minWidth: 200 } },
        backdrop: { className: 'caller-backdrop' },
      },
    });

    expect(modalRoot).toHaveClass('caller-root');
    expect(modalRoot.style.zIndex).toBe('5');
    expect(modalRoot.style.backgroundColor).toBe('transparent');
    expect(paper.style.minWidth).toBe('200px');
    expect(backdrop).toHaveClass('caller-backdrop', 'MuiBackdrop-invisible');
  });
});
