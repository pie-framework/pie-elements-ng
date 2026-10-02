import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Categories } from '../categories';

vi.mock('../category', () => ({
  __esModule: true,
  default: ({ id, label, selectedItem, onSelectClick, onPlacementClick }: any) => (
    <div
      data-testid={`category-${id}`}
      data-selected-item={selectedItem ? JSON.stringify(selectedItem) : undefined}
      data-has-onselectclick={typeof onSelectClick === 'function' ? 'true' : 'false'}
      data-has-onplacementclick={typeof onPlacementClick === 'function' ? 'true' : 'false'}
    >
      {label}
    </div>
  ),
  CategoryType: {},
}));

vi.mock('../grid-content', () => ({
  __esModule: true,
  default: ({ children, columns }: any) => (
    <div data-testid="grid-content" data-columns={columns}>
      {children}
    </div>
  ),
}));

const theme = createTheme();

describe('Categories', () => {
  const renderCategories = (extras?: any) => {
    const defaults = {
      classes: {},
      categories: [{ choices: [], id: '1', label: 'Category One' }],
      onDropChoice: vi.fn(),
      onRemoveChoice: vi.fn(),
      id: '1',
      label: 'Category Label',
      grid: { columns: 1, rows: 1 },
    };

    const props = { ...defaults, ...extras };
    return render(
      <ThemeProvider theme={theme}>
        <Categories {...props} />
      </ThemeProvider>,
    );
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderCategories();
      expect(container).toBeInTheDocument();
    });

    it('renders when disabled', () => {
      const { container } = renderCategories({ disabled: true });
      expect(container).toBeInTheDocument();
    });

    it('renders the grid content wrapper', () => {
      renderCategories();
      expect(screen.getByTestId('grid-content')).toBeInTheDocument();
    });
  });

  describe('category labels', () => {
    it('displays category labels', () => {
      renderCategories({
        categories: [
          { id: '1', label: 'First Category', choices: [] },
          { id: '2', label: 'Second Category', choices: [] },
        ],
      });
      // Multiple elements may contain the same text (label + category mock)
      expect(screen.getAllByText('First Category').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Second Category').length).toBeGreaterThan(0);
    });
  });

  describe('categories per row', () => {
    it('respects categoriesPerRow setting', () => {
      renderCategories({
        categories: [
          { id: '1', label: 'Cat 1', choices: [] },
          { id: '2', label: 'Cat 2', choices: [] },
        ],
        model: { categoriesPerRow: 2 },
      });
      const grid = screen.getByTestId('grid-content');
      expect(grid).toHaveAttribute('data-columns', '2');
    });
  });

  describe('row labels', () => {
    it('renders row labels when provided', () => {
      renderCategories({
        categories: [{ id: '1', label: 'Category', choices: [] }],
        rowLabels: ['Row 1 Label'],
      });
      expect(screen.getByText('Row 1 Label')).toBeInTheDocument();
    });

    it('does not render row labels when empty', () => {
      renderCategories({
        categories: [{ id: '1', label: 'Category', choices: [] }],
        rowLabels: [],
      });
      expect(screen.queryByText('Row 1 Label')).not.toBeInTheDocument();
    });
  });

  describe('selection props', () => {
    it('threads selectedItem, onSelectClick, and onPlacementClick to each category', () => {
      const selectedItem = { id: 'choice-1', type: 'choice' };
      const onSelectClick = vi.fn();
      const onPlacementClick = vi.fn();

      renderCategories({
        categories: [
          { id: '1', label: 'First Category', choices: [] },
          { id: '2', label: 'Second Category', choices: [] },
        ],
        selectedItem,
        onSelectClick,
        onPlacementClick,
      });

      const category1 = screen.getByTestId('category-1');
      expect(category1).toHaveAttribute('data-selected-item', JSON.stringify(selectedItem));
      expect(category1).toHaveAttribute('data-has-onselectclick', 'true');
      expect(category1).toHaveAttribute('data-has-onplacementclick', 'true');

      const category2 = screen.getByTestId('category-2');
      expect(category2).toHaveAttribute('data-selected-item', JSON.stringify(selectedItem));
      expect(category2).toHaveAttribute('data-has-onselectclick', 'true');
      expect(category2).toHaveAttribute('data-has-onplacementclick', 'true');
    });
  });
});
