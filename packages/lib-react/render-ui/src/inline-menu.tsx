// @ts-nocheck
/**
 * InlineMenu - A wrapper around MUI's Menu component for inline contexts
 *
 * This component fixes the issue where MUI's Menu creates a modal overlay
 * that covers the entire screen with a white background. It's designed for
 * use in inline contexts like dropdowns within text or other UI elements.
 *
 * Key differences from standard MUI Menu:
 * - No backdrop (hideBackdrop)
 * - Transparent modal root (doesn't block UI)
 * - No scroll locking (disableScrollLock)
 * - Menu itself remains interactive
 *
 * This file is NOT synced from upstream - it's specific to pie-elements-ng.
 */

import React from 'react';
import Menu, { MenuProps } from '@mui/material/Menu';

/**
 * InlineMenu component that wraps MUI Menu without the blocking backdrop
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
      hideBackdrop
      slotProps={{
        ...slotProps,
        root: {
          ...slotProps?.root,
          style: {
            backgroundColor: 'transparent',
            pointerEvents: 'none',
            ...slotProps?.root?.style,
          },
        },
        paper: {
          ...slotProps?.paper,
          style: {
            pointerEvents: 'auto',
            ...slotProps?.paper?.style,
          },
        },
      }}
    />
  );
};
