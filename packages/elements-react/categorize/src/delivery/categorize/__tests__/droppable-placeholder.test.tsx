import React from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import DroppablePlaceholder from '../droppable-placeholder';

vi.mock('../grid-content', () => ({
  GridContent: (props: any) => <div {...props} />,
}));

// What dnd-kit reports for this droppable; `active` is the choice being dragged, if a drag is live.
const droppable = vi.hoisted(() => ({ isOver: false, active: null as any }));

vi.mock('@dnd-kit/core', () => ({
  useDroppable: () => ({
    setNodeRef: vi.fn(),
    isOver: droppable.isOver,
    active: droppable.active,
  }),
}));

vi.mock('@pie-lib/drag', () => ({
  PlaceHolder: ({ children, isOver, disabled, extraStyles }: any) => (
    <div data-testid="placeholder" data-is-over={isOver} data-disabled={disabled} style={extraStyles}>
      {children}
    </div>
  ),
}));

const theme = createTheme();

describe('DroppablePlaceholder', () => {
  beforeEach(() => {
    droppable.isOver = false;
    droppable.active = null;
  });

  const renderPlaceholder = (extras?: any) => {
    const defaults = {
      id: 'test-placeholder',
      classes: {},
    };
    const props = { ...defaults, ...extras };
    return render(
      <ThemeProvider theme={theme}>
        <DroppablePlaceholder {...props}>
          <span>Child Content</span>
        </DroppablePlaceholder>
      </ThemeProvider>,
    );
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderPlaceholder();
      expect(container).toBeInTheDocument();
    });

    it('renders children content', () => {
      renderPlaceholder();
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('renders the placeholder wrapper', () => {
      renderPlaceholder();
      expect(screen.getByTestId('placeholder')).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('passes disabled prop to placeholder', () => {
      renderPlaceholder({ disabled: true });
      const placeholder = screen.getByTestId('placeholder');
      expect(placeholder).toHaveAttribute('data-disabled', 'true');
    });

    it('passes disabled=false when not disabled', () => {
      renderPlaceholder({ disabled: false });
      const placeholder = screen.getByTestId('placeholder');
      expect(placeholder).toHaveAttribute('data-disabled', 'false');
    });
  });

  describe('layout', () => {
    it('lays out a category from the top', () => {
      renderPlaceholder();
      expect(screen.getByTestId('placeholder')).toHaveStyle({ alignContent: 'flex-start' });
    });

    it('leaves the choice board to its own board styles', () => {
      renderPlaceholder({ choiceBoard: true, correct: false });
      expect(screen.getByTestId('placeholder').getAttribute('style')).toBeNull();
    });
  });

  describe('minRowHeight', () => {
    it('renders with default min height', () => {
      const { container } = renderPlaceholder();
      expect(container.firstChild).toHaveStyle({ minHeight: '80px' });
    });

    it('applies custom minRowHeight', () => {
      const { container } = renderPlaceholder({ minRowHeight: '120px' });
      expect(container.firstChild).toHaveStyle({ minHeight: '120px' });
    });
  });

  describe('click-to-place and keyboard activation', () => {
    const selection = { id: 'c1', categoryId: undefined, choiceIndex: undefined, type: 'choice' };

    it('is a native tab stop when not disabled', () => {
      const { container } = renderPlaceholder();
      const outer = container.firstChild as Element;

      expect(outer.getAttribute('role')).toBe('group');
      expect(outer.getAttribute('tabindex')).toBe('0');
    });

    it('is not a tab stop when disabled', () => {
      const { container } = renderPlaceholder({ disabled: true });
      const outer = container.firstChild as Element;

      expect(outer.getAttribute('role')).toBe('group');
      expect(outer.getAttribute('tabindex')).toBe('-1');
    });

    it('is a group named by its label, so the choices inside it stay exposed', () => {
      render(
        <ThemeProvider theme={theme}>
          <div id="cat-1-label">Rational</div>
          <DroppablePlaceholder id="cat-1" labelId="cat-1-label">
            <div role="button">choice</div>
          </DroppablePlaceholder>
        </ThemeProvider>,
      );

      const group = screen.getByRole('group', { name: 'Rational' });
      expect(group).toContainElement(screen.getByRole('button', { name: 'choice' }));
      expect(screen.queryByRole('button', { name: /Rational/ })).not.toBeInTheDocument();
    });

    it('places the current selection into this target on click', () => {
      const onPlacementClick = vi.fn();
      const { container } = renderPlaceholder({ id: 'cat-1', selectedItem: selection, onPlacementClick });

      fireEvent.click(container.firstChild as Element);

      expect(onPlacementClick).toHaveBeenCalledWith('cat-1');
    });

    it('places the current selection into this target on Space and on Enter', () => {
      const onPlacementClick = vi.fn();
      const { container } = renderPlaceholder({ id: 'cat-1', selectedItem: selection, onPlacementClick });

      fireEvent.keyDown(container.firstChild as Element, { code: 'Space' });
      fireEvent.keyDown(container.firstChild as Element, { code: 'Enter' });

      expect(onPlacementClick).toHaveBeenCalledTimes(2);
      expect(onPlacementClick).toHaveBeenNthCalledWith(1, 'cat-1');
      expect(onPlacementClick).toHaveBeenNthCalledWith(2, 'cat-1');
    });

    it('reports its own id, so the choices pool returns the selection to the pool', () => {
      const onPlacementClick = vi.fn();
      const { container } = renderPlaceholder({
        id: 'choices-board',
        choiceBoard: true,
        selectedItem: selection,
        onPlacementClick,
      });

      fireEvent.click(container.firstChild as Element);

      expect(onPlacementClick).toHaveBeenCalledWith('choices-board');
    });

    it('does nothing on click when nothing is selected', () => {
      const onPlacementClick = vi.fn();
      const { container } = renderPlaceholder({ id: 'cat-1', selectedItem: null, onPlacementClick });

      fireEvent.click(container.firstChild as Element);

      expect(onPlacementClick).not.toHaveBeenCalled();
    });

    it('does nothing on click when disabled, even with something selected', () => {
      const onPlacementClick = vi.fn();
      const { container } = renderPlaceholder({
        id: 'cat-1',
        disabled: true,
        selectedItem: selection,
        onPlacementClick,
      });

      fireEvent.click(container.firstChild as Element);

      expect(onPlacementClick).not.toHaveBeenCalled();
    });

    it('does not respond to other keys', () => {
      const onPlacementClick = vi.fn();
      const { container } = renderPlaceholder({ id: 'cat-1', selectedItem: selection, onPlacementClick });

      fireEvent.keyDown(container.firstChild as Element, { code: 'KeyQ' });

      expect(onPlacementClick).not.toHaveBeenCalled();
    });

    it('ignores a keydown that bubbles up from a descendant instead of originating on itself', () => {
      // A choice card placed inside this droppable (a category, or the choices pool) never
      // moves DOM focus during a real dnd-kit keyboard drag, so the Enter/Space that ends that
      // drag fires on the descendant choice node and bubbles up here. This must NOT be treated
      // as "place the current selection into me" — only a keydown that originates directly on
      // this container's own node (e.target === e.currentTarget) should do that.
      const onPlacementClick = vi.fn();
      const { container } = renderPlaceholder({ id: 'cat-1', selectedItem: selection, onPlacementClick });
      const child = screen.getByText('Child Content');

      fireEvent.keyDown(child, { code: 'Enter' });
      fireEvent.keyDown(child, { code: 'Space' });

      expect(onPlacementClick).not.toHaveBeenCalled();

      // Sanity check: the same node's own keydown still works, proving the guard isn't
      // accidentally disabling the feature entirely.
      fireEvent.keyDown(container.firstChild as Element, { code: 'Enter' });
      expect(onPlacementClick).toHaveBeenCalledWith('cat-1');
    });
  });

  describe('hover affordances while a selection is active', () => {
    const selection = { id: 'c1', type: 'choice' };

    it('folds click-selection hover into the same isOver highlight a real drag-over uses', () => {
      const { container } = renderPlaceholder({ selectedItem: selection });
      const outer = container.firstChild as Element;

      expect(screen.getByTestId('placeholder').getAttribute('data-is-over')).toBe('false');

      fireEvent.mouseEnter(outer);
      expect(screen.getByTestId('placeholder').getAttribute('data-is-over')).toBe('true');

      fireEvent.mouseLeave(outer);
      expect(screen.getByTestId('placeholder').getAttribute('data-is-over')).toBe('false');
    });

    it('does not highlight on hover when nothing is selected', () => {
      const { container } = renderPlaceholder({ selectedItem: null });

      fireEvent.mouseEnter(container.firstChild as Element);

      expect(screen.getByTestId('placeholder').getAttribute('data-is-over')).toBe('false');
    });

    it('does not highlight on hover when disabled', () => {
      const { container } = renderPlaceholder({ selectedItem: selection, disabled: true });

      fireEvent.mouseEnter(container.firstChild as Element);

      expect(screen.getByTestId('placeholder').getAttribute('data-is-over')).toBe('false');
    });

    it('shows a pointer cursor while a selection is active', () => {
      const { container } = renderPlaceholder({ selectedItem: selection });

      expect((container.firstChild as HTMLElement).style.cursor).toBe('pointer');
    });

    it('keeps the default cursor when nothing is selected', () => {
      const { container } = renderPlaceholder({ selectedItem: null });

      expect((container.firstChild as HTMLElement).style.cursor).toBe('');
    });

    it('keeps the default cursor when disabled, even with something selected', () => {
      const { container } = renderPlaceholder({ selectedItem: selection, disabled: true });

      expect((container.firstChild as HTMLElement).style.cursor).toBe('');
    });
  });
  // A drag also sets a selection (see CategorizeProvider.onDragStart), so the click-to-place hover
  // above must not apply: the category under the pointer is not necessarily the one dnd-kit will
  // drop into, and lighting both makes the drop target impossible to tell.
  describe('while a choice is being dragged', () => {
    const dragged = (categoryId?: string) => ({ data: { current: { type: 'choice', categoryId } } });
    const isOver = () => screen.getByTestId('placeholder').getAttribute('data-is-over');

    it('does not light up because the pointer is over it', () => {
      droppable.active = dragged('other-category');
      const { container } = renderPlaceholder({ id: 'cat-1', selectedItem: { id: 'c1', type: 'choice' } });

      fireEvent.mouseEnter(container.firstChild as Element);

      expect(isOver()).toBe('false');
    });

    it('lights up when dnd-kit says it is the drop target', () => {
      droppable.active = dragged('other-category');
      droppable.isOver = true;
      renderPlaceholder({ id: 'cat-1', selectedItem: { id: 'c1', type: 'choice' } });

      expect(isOver()).toBe('true');
    });

    // Releasing there keeps the choice where it is, so dnd-kit only reports it as the target while the
    // choice touches nothing else (see categoriesFirst) — and then it should show as the target.
    it('lights up the category the choice was picked up from while it is still the drop target', () => {
      droppable.active = dragged('cat-1');
      droppable.isOver = true;
      renderPlaceholder({ id: 'cat-1', selectedItem: { id: 'c1', type: 'choice' } });

      expect(isOver()).toBe('true');
    });

    it('does not light up the category the choice was picked up from once something else is the target', () => {
      droppable.active = dragged('cat-1');
      droppable.isOver = false;
      const { container } = renderPlaceholder({ id: 'cat-1', selectedItem: { id: 'c1', type: 'choice' } });

      fireEvent.mouseEnter(container.firstChild as Element);

      expect(isOver()).toBe('false');
    });

    it('lights up for a choice picked up from the pool', () => {
      droppable.active = dragged(undefined);
      droppable.isOver = true;
      renderPlaceholder({ id: 'cat-1', selectedItem: { id: 'c1', type: 'choice' } });

      expect(isOver()).toBe('true');
    });
  });
});
