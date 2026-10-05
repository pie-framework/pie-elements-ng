import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import PlacementOrderingComponent from '../placement-ordering';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

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
