// @ts-nocheck
/**
 * InlineMenu - A wrapper around MUI's Menu component for inline contexts
 *
 * MUI's Menu renders inside a modal root that covers the viewport, and
 * `styled(Menu)` puts its class on that root, so a background styled onto the
 * menu paints over the whole page. InlineMenu keeps the page visible under an
 * open menu. It's designed for use in inline contexts like dropdowns within
 * text or other UI elements.
 *
 * Key differences from standard MUI Menu:
 * - Transparent modal root, whatever background the menu is styled with
 * - No scroll locking (disableScrollLock)
 */

import React from 'react';
import Menu, { MenuProps } from '@mui/material/Menu';

/**
 * InlineMenu component that wraps MUI Menu without painting over the page
 *
 * @example
 * ```tsx
 * <InlineMenu
 *   anchorEl={anchorEl}
 *   open={Boolean(anchorEl)}
 *   onClose={handleClose}
 * >
 *   <MenuItem onClick={handleOption1}>Option 1</MenuItem>
 *   <MenuItem onClick={handleOption2}>Option 2</MenuItem>
 * </InlineMenu>
 * ```
 */
export const InlineMenu: React.FC<MenuProps> = ({ slotProps, ...props }) => {
  return (
    <Menu
      {...props}
      disableScrollLock
      slotProps={{
        ...slotProps,
        root: {
          ...slotProps?.root,
          style: {
            backgroundColor: 'transparent',
            ...slotProps?.root?.style,
          },
        },
        // MUI closes a menu on an outside click only through its backdrop: a click or tap on it
        // calls onClose(event, 'backdropClick') and does not reach the page underneath.
        backdrop: {
          invisible: true,
          ...slotProps?.backdrop,
        },
      }}
    />
  );
};
