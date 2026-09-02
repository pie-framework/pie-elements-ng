import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Choices } from '../choices';

vi.mock('../choice', () => ({
  __esModule: true,
  default: ({ label, id, selectedItem, onSelectClick }: any) => (
    <div
      data-testid={`choice-${id}`}
      data-selected-item={selectedItem ? JSON.stringify(selectedItem) : undefined}
      data-has-onselectclick={typeof onSelectClick === 'function' ? 'true' : 'false'}
    >
      {label}
    </div>
  ),
  ChoiceType: {},
}));
vi.mock('../droppable-placeholder', () => ({
  __esModule: true,
  default: ({ children, id, selectedItem, onPlacementClick }: any) => (
    <div
      data-testid={`droppable-${id}`}
      data-selected-item={selectedItem ? JSON.stringify(selectedItem) : undefined}
      data-has-onplacementclick={typeof onPlacementClick === 'function' ? 'true' : 'false'}
    >
      {children}
    </div>
  ),
}));
vi.mock('@pie-lib/drag', () => ({
  DraggableChoice: (props: any) => <div {...props} />,
  PlaceHolder: ({ children }: any) => <div>{children}</div>,
  uid: {
    withUid: vi.fn((input) => input),
    generateUid: vi.fn().mockReturnValue('1'),
  },
}));

const theme = createTheme();

describe('Choices', () => {
  const renderChoices = (extras?: any) => {
    const defaults = {
      classes: {},
      choices: [],
      onDropChoice: vi.fn(),
      onRemoveChoice: vi.fn(),
      id: '1',
      label: 'Category Label',
      grid: { columns: 1, rows: 1 },
    };

    const props = { ...defaults, ...extras };
    return render(
      <ThemeProvider theme={theme}>
        <Choices {...props} />
      </ThemeProvider>,
    );
  };

  describe('rendering', () => {
    it('renders without crashing', () => {
      const { container } = renderChoices();
      expect(container).toBeInTheDocument();
    });

    it('renders when disabled', () => {
      const { container } = renderChoices({ disabled: true });
      expect(container).toBeInTheDocument();
    });

    it('renders choices with their labels', () => {
      renderChoices({
        choices: [
          { id: '1', label: 'Choice One' },
          { id: '2', label: 'Choice Two' },
        ],
      });
      expect(screen.getByTestId('choice-1')).toBeInTheDocument();
      expect(screen.getByTestId('choice-2')).toBeInTheDocument();
      expect(screen.getByText('Choice One')).toBeInTheDocument();
      expect(screen.getByText('Choice Two')).toBeInTheDocument();
    });

    it('does not render empty choices as visible elements', () => {
      const { container } = renderChoices({
        choices: [{ empty: true }, { id: '1', label: 'Visible Choice' }],
      });
      expect(screen.getByText('Visible Choice')).toBeInTheDocument();
      // Empty choice renders as empty div
      expect(container.querySelectorAll('[data-testid^="choice-"]').length).toBe(1);
    });
  });

  describe('choices label', () => {
    it('displays choices label when provided', () => {
      renderChoices({
        model: { choicesLabel: 'Available Choices', categoriesPerRow: 1 },
      });
      expect(screen.getByText('Available Choices')).toBeInTheDocument();
    });

    it('does not display label when choicesLabel is empty', () => {
      renderChoices({
        model: { choicesLabel: '', categoriesPerRow: 1 },
      });
      expect(screen.queryByText('Available Choices')).not.toBeInTheDocument();
    });
  });

  describe('selection props', () => {
    it('threads selectedItem, onSelectClick, and onPlacementClick to the pool droppable and each choice', () => {
      const selectedItem = { id: '1', type: 'choice' };
      const onSelectClick = vi.fn();
      const onPlacementClick = vi.fn();

      renderChoices({
        choices: [{ id: '1', label: 'Choice One' }],
        selectedItem,
        onSelectClick,
        onPlacementClick,
      });

      const droppable = screen.getByTestId('droppable-choices-board');
      expect(droppable).toHaveAttribute('data-selected-item', JSON.stringify(selectedItem));
      expect(droppable).toHaveAttribute('data-has-onplacementclick', 'true');

      const choice = screen.getByTestId('choice-1');
      expect(choice).toHaveAttribute('data-selected-item', JSON.stringify(selectedItem));
      expect(choice).toHaveAttribute('data-has-onselectclick', 'true');
    });
  });
});
