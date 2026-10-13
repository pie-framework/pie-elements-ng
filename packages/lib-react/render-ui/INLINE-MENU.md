# InlineMenu

`InlineMenu` is MUI's `Menu` with a transparent modal root and no scroll lock, keeping MUI's invisible backdrop. It serves menus anchored inside item content: an open menu leaves the page visible under it, and a click or tap anywhere outside the menu closes it.

## Mechanism

MUI renders a `Menu` inside a `Modal`. The modal root is fixed over the whole viewport (`position: fixed; inset: 0; z-index: 1300`) and holds the backdrop and the menu paper.

### Transparent root

`styled(Menu)` and `styled(InlineMenu)` attach their class to the modal root, so a background styled onto the menu paints over the whole page. `InlineMenu` sets an inline `backgroundColor: 'transparent'` on the root, which overrides any class background. Styles meant for the menu go under `& .MuiPaper-root`.

### Invisible backdrop

The backdrop is MUI's only outside-click close path: a click or tap on it calls `onClose(event, 'backdropClick')`. `InlineMenu` passes `invisible: true`, so the backdrop does not dim the page. It covers the page behind the paper, so the click that closes the menu ends on it and the control underneath responds to the next click, as under a stock MUI `Menu`.

`hideBackdrop` with a click-through root is the alternative, and it loses: no outside click or tap closes the menu, and while the menu stays open MUI keeps focus trapped in it and the rest of the page `aria-hidden`, so typing anywhere else goes nowhere.

### Scrolling

`disableScrollLock` keeps the page scrollable while a menu is open, and MUI repositions the menu on window scroll so it stays on its anchor. A wheel over the backdrop does not reach an inner scroll container; that container scrolls again once the menu closes.

### Keyboard

Escape and Tab close the menu through MUI (`'escapeKeyDown'`, `'tabKeyDown'`), and focus returns to the element that held it when the menu opened.

## Usage

```tsx
import MenuItem from '@mui/material/MenuItem';
import { InlineMenu } from '@pie-lib/render-ui';

<InlineMenu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
>
  <MenuItem onClick={handleOption1}>Option 1</MenuItem>
  <MenuItem onClick={handleOption2}>Option 2</MenuItem>
</InlineMenu>
```

A styled menu puts its rules on the paper and the list:

```tsx
import { styled } from '@mui/material/styles';
import { color, InlineMenu } from '@pie-lib/render-ui';

const StyledMenu = styled(InlineMenu)(() => ({
  '& .MuiPaper-root': {
    border: `1px solid ${color.borderGray()}`,
  },
  '& .MuiList-root': {
    padding: 0,
  },
}));
```

## Props

`InlineMenu` takes every MUI `MenuProps` and always sets `disableScrollLock`. Caller `slotProps` merge as follows:

- `root`: the caller's props pass through, and its `style` keys override the transparent background.
- `backdrop`: the caller's props override `invisible`.
- Every other slot (`paper`, `list`, `transition`) reaches MUI unchanged.

`root` and `backdrop` take objects; the function form MUI also accepts for slot props is not supported on those two.

## Scope

`InlineMenu` fits menus anchored inside content: dropdowns within text, option pickers beside a field, action menus on authoring controls. A stock `Menu` locks page scroll while it is open, and a `Dialog` dims the page and blocks it; use those where that is the intent.

Current consumers:

- `packages/lib-react/mask-markup/src/components/dropdown.tsx`: inline dropdown choices
- `packages/lib-react/config-ui/src/choice-configuration/feedback-menu.tsx`: feedback type per choice
- `packages/lib-react/rubric/src/point-menu.tsx`: rubric point actions
- `packages/elements-react/multi-trait-rubric/src/author/traitsHeader.tsx`: remove-scale menu
- `packages/elements-react/multi-trait-rubric/src/author/trait.tsx`: remove-trait menu
- `packages/elements-react/matrix/src/author/MatrixLabelEditableButton.tsx`: row and column score actions
