import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Categorize } from '../index';
import CategorizeProvider from '../index';
import { closestDroppableKeyboardCoordinates } from '../keyboard-coordinates';

let capturedDragProviderProps: any;

vi.mock('@pie-lib/drag', () => ({
  uid: {
    withUid: vi.fn((a) => a),
    Provider: ({ children }: any) => <div>{children}</div>,
    generateId: vi.fn().mockReturnValue('1'),
  },
  withDragContext: vi.fn((n) => n),
  DragProvider: (props: any) => {
    capturedDragProviderProps = props;
    return <div>{props.children}</div>;
  },
}));

vi.mock('@dnd-kit/core', () => ({
  DragOverlay: ({ children }: any) => <div>{children}</div>,
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
}));

vi.mock('../categories', () => ({
  __esModule: true,
  default: (props: any) => <div {...props} />,
}));
vi.mock('../choices', () => ({
  __esModule: true,
  default: (props: any) => <div {...props} />,
}));
vi.mock('../choice', () => ({
  __esModule: true,
  default: (props: any) => <div {...props} />,
}));
vi.mock('@pie-lib/correct-answer-toggle', () => ({
  __esModule: true,
  default: (props: any) => <div {...props} />,
}));
vi.mock('@pie-lib/categorize', () => ({
  buildState: vi.fn(() => ({})),
  removeChoiceFromCategory: vi.fn(() => []),
  moveChoiceToCategory: vi.fn(() => []),
}));
vi.mock('@pie-lib/config-ui', () => ({
  AlertDialog: (props: any) => <div {...props} />,
}));
// `DragPreviewWrapper` (defined inside `index.tsx` itself, so it can't be mocked via
// `../categories`/`../choice`-style sibling mocks) calls `renderMath` unconditionally from
// `componentDidMount` whenever it mounts inside `<DragOverlay>` — which the "provider
// DragProvider wiring" tests below do via a real `<CategorizeProvider>` render. The jest
// source's equivalent real `@pie-lib/math-rendering` is a synchronous, jsdom-safe, locally
// bundled MathJax build, so pie-elements' test never needed to mock it. The ng package
// swaps that dependency for `@pie-element/shared-math-rendering-mathjax`, which lazily
// injects a `<script src="https://cdn.jsdelivr.net/...">` tag to load MathJax from a CDN —
// happy-dom refuses to execute injected script tags, so the resulting rejected promise
// would otherwise surface as an unhandled rejection on every real-provider render. Nothing
// in this suite asserts on math rendering, so stub it out.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({
  renderMath: vi.fn(),
}));
vi.mock('@pie-lib/render-ui', () => {
  const React = require('react');
  const UiLayout = React.forwardRef((props: any, ref: any) => <div ref={ref} {...props} />);
  UiLayout.displayName = 'UiLayout';

  // The ng `index.tsx` does its own ESM/CJS interop and unconditionally reads a `default`
  // property off this module's namespace (to cope with real @pie-lib/render-ui sometimes
  // exposing its exports under `default` depending on how it was built). Vitest's mocked
  // ESM module objects throw when an undeclared export is accessed (unlike jest, which just
  // returns `undefined`), so `default` must be present here even though nothing in these
  // tests exercises the fallback path it exists for.
  const exportsObj = {
    Collapsible: ({ children }: any) => <div>{children}</div>,
    Feedback: (props: any) => <div {...props} />,
    UiLayout,
    hasText: vi.fn(() => false),
    hasMedia: vi.fn(() => false),
    PreviewPrompt: (props: any) => <div {...props} />,
    color: {
      text: () => '#000',
      background: () => '#fff',
      white: () => '#fff',
      correct: () => '#00ff00',
      incorrect: () => '#ff0000',
    },
  };

  return { ...exportsObj, default: exportsObj };
});

const theme = createTheme();

describe('categorize', () => {
  const defaultProps = {
    classes: {},
    session: {
      answers: [],
    },
    model: {
      choices: [],
      categories: [],
    },
  };
  let onAnswersChange: any;
  let onShowCorrectToggle: any;

  beforeEach(() => {
    onAnswersChange = vi.fn();
    onShowCorrectToggle = vi.fn();
  });

  const renderCategorize = (extras?: any) => {
    const defaults = {
      ...defaultProps,
      onAnswersChange,
      onShowCorrectToggle,
    };
    const props = { ...defaults, ...extras };

    return render(
      <ThemeProvider theme={theme}>
        <Categorize {...props} />
      </ThemeProvider>,
    );
  };

  describe('renders', () => {
    it('renders without crashing', () => {
      const { container } = renderCategorize();
      expect(container).toBeInTheDocument();
    });

    it('renders with feedback', () => {
      const { container } = renderCategorize({
        model: {
          ...defaultProps.model,
          correctness: 'correct',
          feedback: {
            correct: {
              type: 'default',
              default: 'Correct',
            },
            incorrect: {
              type: 'default',
              default: 'Incorrect',
            },
            partial: {
              type: 'default',
              default: 'Nearly',
            },
          },
        },
      });
      expect(container).toBeInTheDocument();
    });

    it('renders when incorrect', () => {
      const { container } = renderCategorize({ incorrect: true });
      expect(container).toBeInTheDocument();
    });
  });

  describe('provider onDragEnd', () => {
    const createProvider = (extras: any = {}) => {
      const instance: any = new (CategorizeProvider as any)({
        ...defaultProps,
        onAnswersChange: vi.fn(),
        onShowCorrectToggle: vi.fn(),
        resumeMathObserver: vi.fn(),
        ...extras,
      });

      instance.setState = vi.fn();
      instance.categorizeRef = {
        removeChoice: vi.fn(),
        dropChoice: vi.fn(),
      };

      return instance;
    };

    const dndEvent = ({ activeData, overId, overData }: any) => ({
      active: activeData ? { data: { current: activeData } } : null,
      over: overId || overData ? { id: overId, data: { current: overData } } : null,
    });

    it('removes choice from source when dropped outside valid target', () => {
      const provider = createProvider();
      const event = dndEvent({
        activeData: {
          id: 'c1',
          type: 'choice',
          categoryId: 'cat-1',
          choiceIndex: 0,
          value: 'v1',
          itemType: 'categorize',
        },
      });

      provider.onDragEnd(event);

      expect(provider.categorizeRef.removeChoice).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'c1',
          categoryId: 'cat-1',
          choiceIndex: 0,
        }),
      );
      expect(provider.categorizeRef.dropChoice).not.toHaveBeenCalled();
    });

    it('removes choice from source when dropped on choices-board', () => {
      const provider = createProvider();
      const event = dndEvent({
        overId: 'choices-board',
        overData: { itemType: 'categorize' },
        activeData: {
          id: 'c2',
          type: 'choice',
          categoryId: 'cat-2',
          choiceIndex: 1,
          value: 'v2',
          itemType: 'categorize',
        },
      });

      provider.onDragEnd(event);

      expect(provider.categorizeRef.removeChoice).toHaveBeenCalled();
      expect(provider.categorizeRef.dropChoice).not.toHaveBeenCalled();
    });

    it('drops choice into category when valid category target exists', () => {
      const provider = createProvider();
      const event = dndEvent({
        overId: 'cat-target',
        overData: { itemType: 'categorize' },
        activeData: {
          id: 'c3',
          type: 'choice',
          categoryId: 'cat-source',
          choiceIndex: 2,
          value: 'v3',
          itemType: 'categorize',
        },
      });

      provider.onDragEnd(event);

      expect(provider.categorizeRef.dropChoice).toHaveBeenCalledWith(
        'cat-target',
        expect.objectContaining({
          id: 'c3',
          categoryId: 'cat-source',
          choiceIndex: 2,
        }),
      );
    });
  });

  describe('provider selection state', () => {
    const makeProvider = () => {
      const instance: any = new (CategorizeProvider as any)({
        ...defaultProps,
        onAnswersChange: vi.fn(),
        onShowCorrectToggle: vi.fn(),
        resumeMathObserver: vi.fn(),
        pauseMathObserver: vi.fn(),
      });

      instance.setState = (s: any) => Object.assign(instance.state, typeof s === 'function' ? s(instance.state) : s);
      instance.categorizeRef = { removeChoice: vi.fn(), dropChoice: vi.fn() };

      return instance;
    };

    const poolItem = {
      id: 'c1',
      categoryId: undefined,
      choiceIndex: undefined,
      value: 'v1',
      itemType: 'categorize',
      type: 'choice',
    };
    const placedItem = {
      id: 'c2',
      categoryId: 'cat-1',
      choiceIndex: 0,
      value: 'v2',
      itemType: 'categorize',
      type: 'choice',
    };

    it('mirrors an active drag into selectedItem on drag start', () => {
      const provider = makeProvider();

      provider.onDragStart({ active: { data: { current: placedItem } } });

      expect(provider.state.selectedItem).toEqual(placedItem);
    });

    it('toggleItemSelection selects, then deselects the same item', () => {
      const provider = makeProvider();

      provider.toggleItemSelection(poolItem);
      expect(provider.state.selectedItem).toEqual(poolItem);

      provider.toggleItemSelection(poolItem);
      expect(provider.state.selectedItem).toBeNull();
    });

    it('toggleItemSelection switches to a different item rather than deselecting', () => {
      const provider = makeProvider();

      provider.toggleItemSelection(poolItem);
      provider.toggleItemSelection(placedItem);

      expect(provider.state.selectedItem).toEqual(placedItem);
    });

    it('placeSelectedItem routes a category target through dropChoice', () => {
      const provider = makeProvider();

      provider.toggleItemSelection(poolItem);
      provider.placeSelectedItem('cat-2');

      expect(provider.categorizeRef.dropChoice).toHaveBeenCalledWith('cat-2', expect.objectContaining({ id: 'c1' }));
      expect(provider.state.selectedItem).toBeNull();
    });

    it('placeSelectedItem routes the choices board through removeChoice for a placed choice', () => {
      const provider = makeProvider();

      provider.toggleItemSelection(placedItem);
      provider.placeSelectedItem('choices-board');

      expect(provider.categorizeRef.removeChoice).toHaveBeenCalledWith(expect.objectContaining({ id: 'c2' }));
      expect(provider.categorizeRef.dropChoice).not.toHaveBeenCalled();
    });

    it('placeSelectedItem on the choices board is a no-op for a choice already in the pool', () => {
      const provider = makeProvider();

      provider.toggleItemSelection(poolItem);
      provider.placeSelectedItem('choices-board');

      expect(provider.categorizeRef.removeChoice).not.toHaveBeenCalled();
      expect(provider.categorizeRef.dropChoice).not.toHaveBeenCalled();
    });

    it('placeSelectedItem does nothing when nothing is selected', () => {
      const provider = makeProvider();

      provider.placeSelectedItem('cat-2');

      expect(provider.categorizeRef.dropChoice).not.toHaveBeenCalled();
    });

    it('a pure click placement does not arm the post-drag guard, so the next click still works', () => {
      const provider = makeProvider();

      provider.toggleItemSelection(poolItem);
      provider.onPlacementClick('cat-2');
      expect(provider.categorizeRef.dropChoice).toHaveBeenCalledTimes(1);

      // Immediately afterwards a second select+place must still go through.
      provider.onItemClick(placedItem);
      expect(provider.state.selectedItem).toEqual(placedItem);

      provider.onPlacementClick('cat-3');
      expect(provider.categorizeRef.dropChoice).toHaveBeenCalledTimes(2);
    });

    it('ignores onItemClick and onPlacementClick for a short window right after a real drag ends', () => {
      const provider = makeProvider();

      provider.onDragEnd({ active: null, over: null });

      provider.onItemClick(poolItem);
      expect(provider.state.selectedItem).toBeNull();

      // Seed a selection directly, then confirm the placement click is also guarded.
      provider.state.selectedItem = poolItem;
      provider.onPlacementClick('cat-2');
      expect(provider.categorizeRef.dropChoice).not.toHaveBeenCalled();
    });

    it('clears any selection when a drag is cancelled, and resumes the math observer', () => {
      const provider = makeProvider();

      provider.onDragStart({ active: { data: { current: placedItem } } });
      expect(provider.state.selectedItem).toEqual(placedItem);

      // A genuine, user-driven cancellation (e.g. the user pressed Escape themselves) is not
      // preceded by endAnyLiveKeyboardDrag, so it must still arm the post-drag click guard —
      // exactly as before this fix round. Losing this would silently reopen the original bug
      // this guard exists for (the browser's own synthetic click that follows a real
      // keyboard-driven drag end).
      provider.onDragCancel();

      expect(provider.state.selectedItem).toBeNull();
      expect(provider.state.activeDragItem).toBeNull();
      expect(provider.props.resumeMathObserver).toHaveBeenCalled();
      expect(provider.isClickSoonAfterDragEnd()).toBe(true);
    });

    it('a live keyboard drag ended via click-to-place does not arm the post-drag guard', () => {
      const provider = makeProvider();

      // dnd-kit's KeyboardSensor listens for an Escape keydown on `document` and, when a drag
      // is live, handles it completely synchronously -- which means it synchronously invokes
      // the real onDragCancel handler as a direct side effect of the dispatch. Simulate that
      // here, since the unit-level provider instance under test isn't wrapped in a real
      // <DragProvider>/dnd-kit sensor tree.
      const onEscape = (event: KeyboardEvent) => {
        if (event.code === 'Escape') {
          provider.onDragCancel();
        }
      };
      document.addEventListener('keydown', onEscape);

      try {
        // Pick up a choice via keyboard (Space) -- this is a live drag, so activeDragItem is set.
        provider.onDragStart({ active: { data: { current: poolItem } } });
        expect(provider.state.activeDragItem).toEqual(poolItem);

        // Switch to the mouse and click a category to complete the placement. Internally this
        // calls endAnyLiveKeyboardDrag, which dispatches the synthetic Escape that -- via the
        // listener above -- synchronously triggers onDragCancel, exactly as dnd-kit would.
        provider.onPlacementClick('cat-2');

        expect(provider.categorizeRef.dropChoice).toHaveBeenCalledWith('cat-2', expect.objectContaining({ id: 'c1' }));

        // This was an internal cleanup dispatch, not a real user-driven drag end -- no browser
        // synthetic click follows it, so the guard must NOT be armed by it.
        expect(provider.isClickSoonAfterDragEnd()).toBe(false);

        // End to end: the user's very next click (selecting the next choice to place) within
        // the 250ms window must go through rather than being silently swallowed.
        provider.onItemClick(placedItem);
        expect(provider.state.selectedItem).toEqual(placedItem);

        provider.onPlacementClick('cat-3');
        expect(provider.categorizeRef.dropChoice).toHaveBeenCalledWith('cat-3', expect.objectContaining({ id: 'c2' }));
      } finally {
        document.removeEventListener('keydown', onEscape);
      }
    });
  });

  describe('provider DragProvider wiring', () => {
    const renderProvider = () =>
      render(
        <ThemeProvider theme={theme}>
          <CategorizeProvider {...defaultProps} onAnswersChange={vi.fn()} onShowCorrectToggle={vi.fn()} />
        </ThemeProvider>,
      );

    it('passes the Tab/Shift+Tab coordinate getter', () => {
      renderProvider();

      expect(capturedDragProviderProps.keyboardCoordinateGetter).toBe(closestDroppableKeyboardCoordinates);
    });

    it('overrides keyboardCodes so Tab cycles instead of ending the drag', () => {
      renderProvider();

      expect(capturedDragProviderProps.keyboardCodes).toEqual({
        start: ['Space', 'Enter'],
        cancel: ['Escape'],
        end: ['Space', 'Enter'],
      });
    });

    it('passes onDragCancel', () => {
      renderProvider();

      expect(typeof capturedDragProviderProps.onDragCancel).toBe('function');
    });
  });
});
