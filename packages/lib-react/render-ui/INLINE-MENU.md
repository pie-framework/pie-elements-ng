# InlineMenu Component

## Problem

When using MUI's `Menu` component in inline contexts (like dropdowns within text or form elements), the default behavior creates a modal overlay that covers the entire screen with a white/semi-transparent background. This blocks the rest of the UI and creates a poor user experience for inline interactions.

## Solution

The `InlineMenu` component is a drop-in replacement for MUI's `Menu` that fixes this issue by:

1. **Removing the backdrop** (`hideBackdrop`)
2. **Making the modal root transparent** and non-interactive (`pointerEvents: 'none'`)
3. **Preventing scroll locking** (`disableScrollLock`)
4. **Keeping the menu itself interactive** (`pointerEvents: 'auto'` on paper)

## Usage

### Basic Usage

Replace `Menu` imports with `InlineMenu`:

```tsx
// Before
import Menu from '@mui/material/Menu';
import { color } from '@pie-lib/render-ui';

// After
import { color, InlineMenu } from '@pie-lib/render-ui';
```

Then use it exactly like you would use `Menu`:

```tsx
<InlineMenu
  anchorEl={anchorEl}
  open={open}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
>
  <MenuItem onClick={handleOption1}>Option 1</MenuItem>
  <MenuItem onClick={handleOption2}>Option 2</MenuItem>
  <MenuItem onClick={handleOption3}>Option 3</MenuItem>
</InlineMenu>
```

### With Styled Components

You can wrap `InlineMenu` with MUI's `styled` utility:

```tsx
import { styled } from '@mui/material/styles';
import { InlineMenu } from '@pie-lib/render-ui';

const StyledMenu = styled(InlineMenu)(() => ({
  backgroundColor: color.background(),
  border: `1px solid ${color.borderGray()}`,
  '& .MuiList-root': {
    padding: 0,
  },
}));
```

## When to Use

Use `InlineMenu` for:

- ✅ **Inline dropdowns** within text or sentences
- ✅ **Form field dropdowns** where the menu should overlay content
- ✅ **Context menus** that appear on right-click
- ✅ **Small option pickers** that shouldn't block the page

**Don't use** `InlineMenu` for:

- ❌ **Full-page modals** that should block interaction
- ❌ **Dialog menus** where you want the backdrop to dim other content
- ❌ **Navigation menus** that benefit from backdrop for focus

## Migration Guide

### Existing Components Using MUI Menu

The following components in the project use MUI `Menu` and could benefit from `InlineMenu`:

1. **`packages/lib-react/mask-markup/src/components/dropdown.tsx`** ✅ Already migrated
2. `packages/lib-react/rubric/src/point-menu.tsx` - Context menu for rubric points
3. `packages/lib-react/config-ui/src/choice-configuration/feedback-menu.tsx` - Feedback options menu
4. `packages/elements-react/multi-trait-rubric/src/author/traitsHeader.tsx` - Traits header menu
5. `packages/elements-react/multi-trait-rubric/src/author/trait.tsx` - Individual trait menu
6. `packages/elements-react/matrix/src/author/MatrixLabelEditableButton.tsx` - Matrix label menu

### Migration Steps

For each component:

1. Import `InlineMenu` from `@pie-lib/render-ui`
2. Replace `<Menu` with `<InlineMenu`
3. Test that the menu appears correctly without covering the page
4. If needed, adjust `slotProps` (though `InlineMenu` already sets sensible defaults)

## Technical Details

### How It Works

The issue occurs because MUI's `Menu` component uses a `Modal` wrapper that:
- Creates a fixed-position root container (`position: fixed; inset: 0`)
- By default has a white background
- Renders with `z-index: 1300`
- Blocks pointer events across the entire viewport

`InlineMenu` fixes this by:

```tsx
<Menu
  disableScrollLock  // Don't lock page scroll
  hideBackdrop       // Remove the backdrop element
  slotProps={{
    root: {
      style: {
        backgroundColor: 'transparent',  // Make modal root transparent
        pointerEvents: 'none',           // Allow clicks to pass through
      },
    },
    paper: {
      style: {
        pointerEvents: 'auto',           // Make menu itself clickable
      },
    },
  }}
/>
```

### Props

`InlineMenu` accepts all standard `MenuProps` from MUI. You can override any of the built-in configurations by passing your own `slotProps`:

```tsx
<InlineMenu
  anchorEl={anchorEl}
  open={open}
  slotProps={{
    paper: {
      style: {
        minWidth: '200px',
        padding: '8px',
        // pointerEvents: 'auto' is already set, but you can override
      },
    },
  }}
>
  {/* menu items */}
</InlineMenu>
```

## Upstream Sync

**Note:** Since this is a pie-elements-ng specific component, it lives in a non-synced file (`inline-menu.tsx`) and is exported separately in `index.ts`. It won't be overwritten by upstream syncs from pie-lib.

The export in `index.ts` includes a comment marking it as non-synced:

```ts
// Non-synced pie-elements-ng exports
export { InlineMenu } from './inline-menu';
```

If you need to apply this fix to the upstream pie-lib repository, copy the `inline-menu.tsx` file there as well.
