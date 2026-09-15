import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Category } from '../category';

vi.mock('../droppable-placeholder', () => ({
  __esModule: true,
  default: ({ children, id, correct, selectedItem, onPlacementClick }: any) => (
    <div
      data-testid={`placeholder-${id}`}
      data-correct={correct !== undefined ? String(correct) : undefined}
      data-selected-item={selectedItem ? JSON.stringify(selectedItem) : undefined}
      data-has-onplacementclick={typeof onPlacementClick === 'function' ? 'true' : 'false'}
    >
      {children}
    </div>
  ),
}));
vi.mock('../choice', () => ({
  __esModule: true,
  default: ({ id, label, categoryId, selectedItem, onSelectClick }: any) => (
    <div
      data-testid={`choice-${id}`}
      data-category={categoryId}
      data-selected-item={selectedItem ? JSON.stringify(selectedItem) : undefined}
      data-has-onselectclick={typeof onSelectClick === 'function' ? 'true' : 'false'}
    >
      {label}
    </div>
  ),
}));

const theme = createTheme();

describe('Category', () => {
  const renderCategory = (extras?: any) => {
    const defaults = {
      classes: {
        label: 'label',
        incorrect: 'incorrect',
        placeholder: 'placeholder',
        category: 'category',
      },
      choices: [],
      id: 'category-1',
      label: 'Category Label',
      grid: { columns: 1, rows: 1 },
    };

    const props = { ...defaults, ...extras };
    return render(
      <ThemeProvider theme={theme}>
        <Category {...props} />
      </ThemeProvider>,
    );
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderCategory();
      expect(container).toBeInTheDocument();
    });

    it('renders the placeholder with correct id', () => {
      renderCategory({ id: 'test-category' });
      expect(screen.getByTestId('placeholder-test-category')).toBeInTheDocument();
    });

    it('renders when disabled', () => {
      const { container } = renderCategory({ disabled: true });
      expect(container).toBeInTheDocument();
    });
  });

  describe('choices rendering', () => {
    it('renders choices within the category', () => {
      renderCategory({
        id: 'cat-1',
        choices: [
          { id: 'choice-1', label: 'First Choice' },
          { id: 'choice-2', label: 'Second Choice' },
        ],
      });
      expect(screen.getByTestId('choice-choice-1')).toBeInTheDocument();
      expect(screen.getByTestId('choice-choice-2')).toBeInTheDocument();
      expect(screen.getByText('First Choice')).toBeInTheDocument();
      expect(screen.getByText('Second Choice')).toBeInTheDocument();
    });

    it('renders empty category when no choices', () => {
      renderCategory({ choices: [] });
      expect(screen.queryByTestId(/^choice-/)).not.toBeInTheDocument();
    });
  });

  describe('correctness state', () => {
    // Note: StyledPlaceHolder uses shouldForwardProp to prevent 'correct' from being
    // forwarded to the underlying component - it's only used for styling.
    // We test that rendering doesn't crash with different correctness values.
    it('renders correctly when correct=false (incorrect answer)', () => {
      const { container } = renderCategory({ id: 'cat-1', correct: false });
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-cat-1')).toBeInTheDocument();
    });

    it('renders correctly when correct=true (correct answer)', () => {
      const { container } = renderCategory({ id: 'cat-1', correct: true });
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-cat-1')).toBeInTheDocument();
    });

    it('renders correctly when correct is undefined', () => {
      const { container } = renderCategory({ id: 'cat-1' });
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-cat-1')).toBeInTheDocument();
    });
  });

  describe('selection props', () => {
    it('threads selectedItem, onSelectClick, and onPlacementClick to its droppable and to each choice', () => {
      const selectedItem = { id: 'choice-1', type: 'choice' };
      const onSelectClick = vi.fn();
      const onPlacementClick = vi.fn();

      renderCategory({
        id: 'cat-1',
        choices: [{ id: 'choice-1', label: 'First Choice' }],
        selectedItem,
        onSelectClick,
        onPlacementClick,
      });

      const placeholder = screen.getByTestId('placeholder-cat-1');
      expect(placeholder).toHaveAttribute('data-selected-item', JSON.stringify(selectedItem));
      expect(placeholder).toHaveAttribute('data-has-onplacementclick', 'true');

      const choice = screen.getByTestId('choice-choice-1');
      expect(choice).toHaveAttribute('data-selected-item', JSON.stringify(selectedItem));
      expect(choice).toHaveAttribute('data-has-onselectclick', 'true');
    });
  });
});
