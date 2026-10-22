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

describe('PlacementOrdering drag collision', () => {
  const rect = (left: number, top: number, width = 100, height = 50) => ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  });

  const droppable = (id: string, type: string, tileId: string, index: number) => ({
    id,
    data: { current: { id: tileId, type, index } },
  });

  it('hands a choice dragged toward a response area to it, not to the source slot beside it', () => {
    render(<PlacementOrdering model={model} session={{}} onSessionChange={vi.fn()} />);

    // c1 picked up from the first source slot (its own droppable is off) and dragged 30 right and
    // down to the second row: 70x50 over c2's source slot, 10x50 over the second response area.
    const { collisionDetection } = provider.props;
    const found = collisionDetection({
      active: { id: 'tile', data: { current: { id: 'c1', type: 'choice', index: 0 } } },
      collisionRect: rect(30, 60),
      droppableRects: new Map([
        ['source-c2', rect(0, 60)],
        ['target-0', rect(120, 0)],
        ['target-1', rect(120, 60)],
      ]),
      droppableContainers: [
        droppable('source-c2', 'choice', 'c2', 1),
        droppable('target-0', 'target', 'c1', 0),
        droppable('target-1', 'target', 'c2', 1),
      ],
      pointerCoordinates: null,
    });

    expect(found.map(({ id }: { id: string }) => id)).toEqual(['target-1']);
  });
});

describe('PlacementOrdering click to return a placed choice', () => {
  // Both choices are placed, so both source slots are vacated; Blueberry (c1) is the one picked up.
  const setup = () => {
    const onSessionChange = vi.fn();
    const { container } = render(
      <PlacementOrdering model={model} session={{ value: ['c1', 'c2'] }} onSessionChange={onSessionChange} />,
    );
    const tile = (slot: string) => container.querySelector<HTMLElement>(`[data-tile-id$=":${slot}"]`) as HTMLElement;
    const isOver = (slot: string) => !!tile(slot).querySelector('.over');

    fireEvent.click(tile('target-0'));

    return { onSessionChange, tile, isOver };
  };

  it('lights up the source slot the picked-up choice belongs to, as a response area, on hover', () => {
    const { tile, isOver } = setup();

    expect(isOver('choice-c1')).toBe(false);

    fireEvent.mouseEnter(tile('choice-c1'));

    expect(isOver('choice-c1')).toBe(true);

    fireEvent.mouseLeave(tile('choice-c1'));

    expect(isOver('choice-c1')).toBe(false);
  });

  it('does not light up the source slot of another choice on hover', () => {
    const { tile, isOver } = setup();

    fireEvent.mouseEnter(tile('choice-c2'));

    expect(isOver('choice-c2')).toBe(false);
  });

  it('returns the choice when its own source slot is clicked', () => {
    const { tile, onSessionChange } = setup();

    fireEvent.click(tile('choice-c1'));

    expect(onSessionChange).toHaveBeenCalledWith({ value: [undefined, 'c2'] });
  });

  it('does nothing when the source slot of another choice is clicked', () => {
    const { tile, onSessionChange, isOver } = setup();

    fireEvent.click(tile('choice-c2'));

    expect(onSessionChange).not.toHaveBeenCalled();

    // Still picked up: its own slot takes it afterwards.
    fireEvent.mouseEnter(tile('choice-c1'));
    expect(isOver('choice-c1')).toBe(true);
  });

  it('does nothing when a choice still in the source column is clicked', () => {
    const onSessionChange = vi.fn();
    const { container } = render(
      <PlacementOrdering model={model} session={{ value: ['c1'] }} onSessionChange={onSessionChange} />,
    );
    const tile = (slot: string) => container.querySelector<HTMLElement>(`[data-tile-id$=":${slot}"]`) as HTMLElement;

    // The component pads a short session on mount; only what the clicks do is under test.
    onSessionChange.mockClear();

    fireEvent.click(tile('target-0'));
    fireEvent.click(tile('choice-c2'));

    expect(onSessionChange).not.toHaveBeenCalled();
  });
});

describe('PlacementOrdering drag preview', () => {
  // One answer placed, and the second response area empty: an empty response area is an empty entry.
  const oneAnswerPlaced = { value: ['c1', undefined] as unknown as string[] };

  // A pointer drag as dnd-kit's sensor reads it: a press, then a move past its activation distance.
  const startDrag = (tile: HTMLElement) => {
    const pointer = { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 };

    fireEvent.pointerDown(tile, { ...pointer, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(document, { ...pointer, clientX: 40, clientY: 60 });
  };

  const setup = () => {
    const { container } = render(<Item />);
    const tile = container.querySelector<HTMLElement>('[data-tile-id$=":choice-c1"]') as HTMLElement;

    return { container, tile };
  };

  // The tile moves by a transform inside the element's scroll region, which clips it at the region's
  // edge, restricts it to the grid and, once the tile overflows the region, scrolls the region.
  it('draws the tile being dragged outside the region that scrolls the tiles', async () => {
    const { tile } = setup();
    const scrollRegion = (node: HTMLElement) => {
      for (let el = node.parentElement; el; el = el.parentElement) {
        if (getComputedStyle(el).overflowX === 'auto') return el;
      }
      return null;
    };

    startDrag(tile);

    const preview = await waitFor(() => {
      const found = document.querySelector<HTMLElement>('.placement-ordering-drag-preview');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });

    const region = scrollRegion(tile);

    expect(region).not.toBeNull();
    expect(preview).toHaveTextContent('Blueberry');
    expect(region?.contains(tile)).toBe(true);
    expect(region?.contains(preview)).toBe(false);
  });

  // The tile's own wrapper centres its label; the overlay is drawn outside of it.
  it('centres the label of the tile being dragged, as the tile in its slot does', async () => {
    const { tile } = setup();

    startDrag(tile);

    const preview = await waitFor(() => {
      const found = document.querySelector<HTMLElement>('.placement-ordering-drag-preview');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });

    expect(getComputedStyle(tile).textAlign).toBe('center');
    expect(getComputedStyle(preview).textAlign).toBe('center');
  });

  // The preview does not take pointer events, so the slot under the pointer is hovered as the tile
  // is dragged over it. Only the slot dnd-kit finds the tile over may light up, or two do at once.
  it('lights up no slot for being under the pointer while a tile is dragged', async () => {
    const onSessionChange = vi.fn();
    const { container } = render(
      <PlacementOrdering model={model} session={oneAnswerPlaced} onSessionChange={onSessionChange} />,
    );
    const slot = (name: string) => container.querySelector<HTMLElement>(`[data-tile-id$=":${name}"]`) as HTMLElement;

    startDrag(slot('target-0'));
    await waitFor(() => expect(document.querySelector('.placement-ordering-drag-preview')).not.toBeNull());
    fireEvent.mouseEnter(slot('target-1'));

    expect(slot('target-1').querySelector('.over')).toBeNull();

    fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 });
    await waitFor(() => expect(document.querySelector('.placement-ordering-drag-preview')).toBeNull());
  });

  it('still lights up a response area under the pointer when a choice is only picked up by a click', async () => {
    const { container } = render(
      <PlacementOrdering model={model} session={oneAnswerPlaced} onSessionChange={vi.fn()} />,
    );
    const slot = (name: string) => container.querySelector<HTMLElement>(`[data-tile-id$=":${name}"]`) as HTMLElement;

    // dnd-kit swallows document clicks for a moment after a drag, such as the previous test's.
    await new Promise((resolve) => setTimeout(resolve, 100));

    fireEvent.click(slot('target-0'));
    fireEvent.mouseEnter(slot('target-1'));

    expect(slot('target-1').querySelector('.over')).not.toBeNull();
  });

  it('leaves the tile being dragged where it is', async () => {
    const { tile } = setup();

    startDrag(tile);
    await waitFor(() => expect(document.querySelector('.placement-ordering-drag-preview')).not.toBeNull());

    expect(tile.style.transform).toBe('');
  });

  it('removes the preview when the drag ends', async () => {
    const { tile } = setup();

    startDrag(tile);
    await waitFor(() => expect(document.querySelector('.placement-ordering-drag-preview')).not.toBeNull());
    fireEvent.pointerUp(document, { pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0 });

    await waitFor(() => expect(document.querySelector('.placement-ordering-drag-preview')).toBeNull());
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
