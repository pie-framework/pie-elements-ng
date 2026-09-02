import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Layout } from '../choice';
import DraggableChoice from '../choice';

vi.mock('@pie-lib/render-ui', () => ({
  HtmlAndMath: (props: any) => <div>{props.text}</div>,
  color: {
    text: () => '#000',
    background: () => '#fff',
    white: () => '#fff',
    correct: () => '#00ff00',
    incorrect: () => '#ff0000',
    buttonFocusOutline: () => '#3B82F6',
  },
}));

vi.mock('@dnd-kit/core', () => ({
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    isDragging: false,
  })),
}));

vi.mock('@pie-lib/drag', () => ({
  uid: {
    withUid: vi.fn((a) => a),
  },
}));

const theme = createTheme();

describe('Layout', () => {
  const renderLayout = (extras?: any) => {
    const defaults = {
      classes: {},
      content: 'Choice Content',
    };
    const props = { ...defaults, ...extras };
    return render(
      <ThemeProvider theme={theme}>
        <Layout {...props} />
      </ThemeProvider>,
    );
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderLayout();
      expect(container).toBeInTheDocument();
    });

    it('renders the choice content', () => {
      renderLayout({ content: 'Test Choice Text' });
      expect(screen.getByText('Test Choice Text')).toBeInTheDocument();
    });

    it('renders HTML content', () => {
      renderLayout({ content: '<strong>Bold Text</strong>' });
      expect(screen.getByText('Bold Text')).toBeInTheDocument();
    });
  });

  describe('states', () => {
    it('renders when disabled', () => {
      const { container } = renderLayout({ disabled: true });
      expect(container).toBeInTheDocument();
    });

    it('renders when correct', () => {
      const { container } = renderLayout({ correct: true });
      expect(container).toBeInTheDocument();
    });

    it('renders when incorrect', () => {
      const { container } = renderLayout({ correct: false });
      expect(container).toBeInTheDocument();
    });

    it('renders when dragging', () => {
      const { container } = renderLayout({ isDragging: true });
      expect(container).toBeInTheDocument();
    });

    it('dims the card when selected', () => {
      const { container } = renderLayout({ isSelected: true });

      expect(container.firstChild!.firstChild).toBeInTheDocument();
      // Opacity lives on StyledCard (one level inside ChoiceContainer) so the selection
      // border on ChoiceContainer itself stays fully opaque.
      expect(getComputedStyle(container.firstChild!.firstChild as Element).opacity).toBe('0.5');
    });

    it('shows the blue selection border when selected', () => {
      const { container } = renderLayout({ isSelected: true });

      expect(getComputedStyle(container.firstChild as Element).border).toBe('2px solid #3B82F6');
    });

    it('does not show the blue selection border by default', () => {
      const { container } = renderLayout();

      expect(getComputedStyle(container.firstChild as Element).border).not.toBe('2px solid #3B82F6');
    });

    it('lets a correct/incorrect border take precedence over the selection border', () => {
      const { container } = renderLayout({ isSelected: true, correct: true });

      expect(getComputedStyle(container.firstChild as Element).border).toBe('2px solid #00ff00');
    });

    it('keeps the selection border fully opaque even when the choice is selected and dimmed', () => {
      const { container } = renderLayout({ isSelected: true });

      expect(getComputedStyle(container.firstChild as Element).border).toBe('2px solid #3B82F6');
      expect(getComputedStyle(container.firstChild as Element).opacity).not.toBe('0.5');
      expect(getComputedStyle(container.firstChild!.firstChild as Element).opacity).toBe('0.5');
    });
  });
});

describe('DraggableChoice click-to-select', () => {
  const renderChoice = (extras?: any) => {
    const props = { id: 'c1', content: 'Choice Content', ...extras };

    return render(
      <ThemeProvider theme={theme}>
        <DraggableChoice {...props} />
      </ThemeProvider>,
    );
  };

  const poolDragData = {
    id: 'c1',
    categoryId: undefined,
    choiceIndex: undefined,
    value: 'Choice Content',
    itemType: 'categorize',
    type: 'choice',
  };
  const placedDragData = {
    id: 'c1',
    categoryId: 'cat-1',
    choiceIndex: 0,
    value: 'Choice Content',
    itemType: 'categorize',
    type: 'choice',
  };

  it('selects a pool choice on click when nothing is selected', () => {
    const onSelectClick = vi.fn();
    const { container } = renderChoice({ selectedItem: null, onSelectClick });

    fireEvent.click(container.firstChild as Element);

    expect(onSelectClick).toHaveBeenCalledWith(poolDragData);
  });

  it('toggles off when clicking the already-selected choice', () => {
    const onSelectClick = vi.fn();
    const { container } = renderChoice({ selectedItem: poolDragData, onSelectClick });

    fireEvent.click(container.firstChild as Element);

    expect(onSelectClick).toHaveBeenCalledWith(poolDragData);
  });

  it('toggles off when clicking the already-selected PLACED choice, without letting the click bubble to the enclosing category', () => {
    // For a pool choice, the toggle-off branch and the "nothing selected / pool choice"
    // fallback branch both call onSelectClick(dragData) identically, so a pool-only test can't
    // prove the toggle-off branch exists. For a placed choice (categoryId set), the two
    // branches diverge: without toggle-off, a click on an already-selected placed choice would
    // fall through to the "let it bubble to the enclosing category" branch instead of
    // deselecting. Exercising a placed choice here is what actually makes this branch
    // load-bearing.
    const onSelectClick = vi.fn();
    const onEnclosingClick = vi.fn();
    const { getByTestId } = render(
      <ThemeProvider theme={theme}>
        <div data-testid="category-droppable" onClick={onEnclosingClick}>
          <DraggableChoice
            id="c1"
            content="Choice Content"
            categoryId="cat-1"
            choiceIndex={0}
            selectedItem={placedDragData}
            onSelectClick={onSelectClick}
          />
        </div>
      </ThemeProvider>,
    );

    fireEvent.click(getByTestId('category-droppable').firstChild as Element);

    expect(onSelectClick).toHaveBeenCalledWith(placedDragData);
    expect(onEnclosingClick).not.toHaveBeenCalled();
  });

  it('selects a pool choice even while a different item is selected (pool items are never placement targets)', () => {
    const onSelectClick = vi.fn();
    const { container } = renderChoice({ selectedItem: placedDragData, onSelectClick });

    fireEvent.click(container.firstChild as Element);

    expect(onSelectClick).toHaveBeenCalledWith(poolDragData);
  });

  it('selects a placed choice on click when nothing is selected', () => {
    const onSelectClick = vi.fn();
    const { container } = renderChoice({
      categoryId: 'cat-1',
      choiceIndex: 0,
      selectedItem: null,
      onSelectClick,
    });

    fireEvent.click(container.firstChild as Element);

    expect(onSelectClick).toHaveBeenCalledWith(placedDragData);
  });

  it('lets the click bubble (no selection call) when a different item is selected and this choice is inside a category', () => {
    const onSelectClick = vi.fn();
    const onEnclosingClick = vi.fn();
    const { getByTestId } = render(
      <ThemeProvider theme={theme}>
        <div data-testid="category-droppable" onClick={onEnclosingClick}>
          <DraggableChoice
            id="c1"
            content="Choice Content"
            categoryId="cat-1"
            choiceIndex={0}
            selectedItem={poolDragData}
            onSelectClick={onSelectClick}
          />
        </div>
      </ThemeProvider>,
    );

    fireEvent.click(getByTestId('category-droppable').firstChild as Element);

    expect(onSelectClick).not.toHaveBeenCalled();
    expect(onEnclosingClick).toHaveBeenCalledTimes(1);
  });

  it('stops propagation when it does handle the click, so the enclosing droppable does not also fire', () => {
    const onSelectClick = vi.fn();
    const onEnclosingClick = vi.fn();
    const { getByTestId } = render(
      <ThemeProvider theme={theme}>
        <div data-testid="category-droppable" onClick={onEnclosingClick}>
          <DraggableChoice
            id="c1"
            content="Choice Content"
            categoryId="cat-1"
            choiceIndex={0}
            selectedItem={null}
            onSelectClick={onSelectClick}
          />
        </div>
      </ThemeProvider>,
    );

    fireEvent.click(getByTestId('category-droppable').firstChild as Element);

    expect(onSelectClick).toHaveBeenCalledTimes(1);
    expect(onEnclosingClick).not.toHaveBeenCalled();
  });

  it('does nothing on click when disabled', () => {
    const onSelectClick = vi.fn();
    const { container } = renderChoice({ disabled: true, selectedItem: null, onSelectClick });

    fireEvent.click(container.firstChild as Element);

    expect(onSelectClick).not.toHaveBeenCalled();
  });
});
