import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import PlacementOrderingComponent from '../placement-ordering';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// The props of the latest drag provider rendered, which the drag tests below call as dnd-kit does.
const provider = vi.hoisted(() => ({ props: {} as Record<string, any> }));

vi.mock('@pie-lib/drag', async (importOriginal) => {
  const drag = await importOriginal<typeof import('@pie-lib/drag')>();
  const { createElement } = await import('react');

  return {
    ...drag,
    DragProvider: (props: Parameters<typeof drag.DragProvider>[0]) => {
      provider.props = props;
      return createElement(drag.DragProvider, props);
    },
  };
});

// Two element versions on a page each bundle their own lodash, whose uniqueId counters both
// start at 1; a constant reproduces that within this one module graph.
vi.mock('@pie-element/shared-lodash', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@pie-element/shared-lodash')>()),
  uniqueId: (prefix = '') => `${prefix}1`,
}));

type Session = { value?: string[] };

// placement-ordering.tsx is untyped, so its class declares no props.
const PlacementOrdering = PlacementOrderingComponent as unknown as React.ComponentType<{
  model: object;
  session: Session;
  onSessionChange: (session: Session) => void;
}>;

const model = {
  choices: [
    { id: 'c1', label: 'Blueberry' },
    { id: 'c2', label: 'Lemon' },
  ],
  config: { orientation: 'vertical', includeTargets: true },
  correctResponse: ['c1', 'c2'],
  env: { mode: 'gather', role: 'student' },
  disabled: false,
};

const Item = () => {
  const [session, setSession] = React.useState<Session>({});

  return <PlacementOrdering model={model} session={session} onSessionChange={setSession} />;
};

const tileIds = (root: ParentNode = document) =>
  [...root.querySelectorAll('[data-tile-id]')].map((el) => el.getAttribute('data-tile-id'));

const describedByIds = (root: ParentNode = document) =>
  [...new Set([...root.querySelectorAll('[aria-describedby]')].map((el) => el.getAttribute('aria-describedby')))];

describe('PlacementOrdering ids', () => {
  it('stay unique when two items share a page', () => {
    const first = render(<Item />).container;
    const second = render(<Item />).container;

    expect(tileIds(first)).toHaveLength(4);
    expect(new Set(tileIds()).size).toBe(tileIds().length);
    // The drag instructions every tile references: dnd-kit's own `DndDescribedBy-<n>` counter
    // restarts in each element bundle, so the id must come from elsewhere.
    expect(describedByIds(first)).toHaveLength(1);
    expect(describedByIds(first)).not.toEqual(describedByIds(second));
    expect(describedByIds(first)[0]).not.toMatch(/^DndDescribedBy-\d+$/);
  });

  it('stay the same across re-renders', () => {
    const { container, rerender } = render(<Item />);
    const before = [...tileIds(container), ...describedByIds(container)];

    rerender(<Item />);

    expect([...tileIds(container), ...describedByIds(container)]).toEqual(before);
  });

  it('keep focus in the item where a tile was placed', async () => {
    render(<Item />);
    const { container } = render(<Item />);
    const tile = (slot: string) => container.querySelector<HTMLElement>(`[data-tile-id$=":${slot}"]`);

    fireEvent.click(tile('choice-c1') as HTMLElement);
    fireEvent.click(tile('target-0') as HTMLElement);

    await waitFor(() => expect(document.activeElement).toBe(tile('target-0')));
    expect(tile('target-0')).toHaveTextContent('Blueberry');
  });
});

describe('PlacementOrdering drag end', () => {
  type Point = { x: number; y: number };

  const rect = (left: number, top: number) => ({
    left,
    top,
    right: left + 200,
    bottom: top + 40,
    width: 200,
    height: 40,
  });

  // The first slot, holding Blueberry, whose tile is picked up at its centre.
  const slot = rect(100, 100);
  const grab = { clientX: 200, clientY: 120 };

  /**
   * Drags the first slot's tile and releases it where no slot takes it. The provider runs collision
   * detection as the drag moves, with the pointer of a pointer drag, and `translated` is the tile as
   * drawn.
   */
  function releaseFirstSlot(pointer: Point | null, drawn = slot) {
    const onSessionChange = vi.fn();
    render(<PlacementOrdering model={model} session={{ value: ['c1', 'c2'] }} onSessionChange={onSessionChange} />);

    const { onDragStart, collisionDetection, onDragEnd } = provider.props;
    const active = {
      id: 'tile',
      data: { current: { id: 'c1', type: 'target', index: 0 } },
      rect: { current: { initial: slot, translated: drawn } },
    };
    const activatorEvent = pointer ? grab : new KeyboardEvent('keydown', { code: 'Space' });

    act(() => {
      onDragStart({ active, activatorEvent });
      collisionDetection({
        active,
        collisionRect: drawn,
        droppableRects: new Map(),
        droppableContainers: [],
        pointerCoordinates: pointer,
      });
      onDragEnd({ active, activatorEvent, over: null });
    });

    return onSessionChange;
  }

  it('returns a tile released above the element to the pool, though it is drawn over its own slot', () => {
    expect(releaseFirstSlot({ x: 200, y: 40 })).toHaveBeenCalledWith({ value: [undefined, 'c2'] });
  });

  it('keeps a tile released over its own slot', () => {
    expect(releaseFirstSlot({ x: 210, y: 124 })).not.toHaveBeenCalled();
  });

  it('tests the drawn tile of a drag without a pointer', () => {
    expect(releaseFirstSlot(null)).not.toHaveBeenCalled();
    expect(releaseFirstSlot(null, rect(100, 160))).toHaveBeenCalledWith({ value: [undefined, 'c2'] });
  });
});

describe('PlacementOrdering toggles', () => {
  it.each([
    ['en_US', 'Show Teacher Instructions', 'Show Rationale'],
    ['es_ES', 'Mostrar instrucciones para el maestro', 'Mostrar justificación'],
  ])('are named in the %s item language', (language, instructions, rationale) => {
    const { getByRole } = render(
      <PlacementOrdering
        model={{ ...model, language, teacherInstructions: '<p>Read aloud.</p>', rationale: '<p>Because.</p>' }}
        session={{}}
        onSessionChange={vi.fn()}
      />,
    );

    expect(getByRole('button', { name: instructions })).toBeInTheDocument();
    expect(getByRole('button', { name: rationale })).toBeInTheDocument();
  });
});
