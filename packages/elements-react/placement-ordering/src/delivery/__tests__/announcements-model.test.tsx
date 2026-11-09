import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import PlacementOrderingComponent from '../placement-ordering';
import { model as buildModel } from '../../controller/index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const PlacementOrdering = PlacementOrderingComponent as unknown as React.ComponentType<{
  model: object;
  session: { value?: (string | undefined)[] };
  onSessionChange: (session: object) => void;
}>;

// The model the screen reader spec's table was written against (Antigone), as authored.
const question = {
  partialScoring: true,
  correctResponse: [{ id: '2' }, { id: '4' }, { id: '1' }, { id: '0' }, { id: '3' }],
  targetLabel: 'Target',
  id: '4028e4a24866740201488a409aa27b95',
  choices: [
    { label: 'Antigone tells Creon that she is ready to die and that the citizens agree with what she did.', id: '0' },
    { label: "Creon intends to punish Antigone's sister as well, believing that they acted together.", id: '1' },
    { label: 'Antigone freely admits to Creon that she buried her brother.', id: '2' },
    { label: "Creon denies that others agree with Antigone, but Antigone says they just won't say it aloud.", id: '3' },
    { label: 'Creon is angry that Antigone disobeyed him and angrier still that she is proud of her actions.', id: '4' },
  ],
  removeTilesAfterPlacing: true,
  prompt: '<p>Place the events in the correct order.</p>',
  placementArea: true,
  choiceLabel: 'Source',
  element: 'placement-ordering',
};

const renderItem = async (mode: string, value: (string | undefined)[]) => {
  const model = await buildModel(question as any, { value } as any, { mode, role: 'student' } as any);

  return render(<PlacementOrdering model={model} session={{ value }} onSessionChange={() => {}} />);
};

describe('PlacementOrdering announcements for the Antigone item', () => {
  it('reads as the spec’s example does', async () => {
    const { container } = await renderItem('gather', ['2', undefined, undefined, '3', undefined]);
    const text = container.textContent ?? '';

    expect(text).toContain('2 of 5 objects are on the sorted list.');
    expect(text).toContain('Source');
    expect(text).toContain('3 unsorted objects');
    expect(text).toContain('Target 2 sorted objects');
    expect(text).toContain('Sort position 1:Antigone freely admits to Creon that she buried her brother.');
  });

  it('labels each tile on focus, and leaves the gaps of placed objects out', async () => {
    const { container } = await renderItem('gather', ['2', undefined, undefined, '3', undefined]);
    const labels = [...container.querySelectorAll('[data-tile-id]')].map((el) => el.getAttribute('aria-label'));

    expect(labels.filter(Boolean)).toHaveLength(5);
    expect(labels).toContain(
      'Sorted object Antigone freely admits to Creon that she buried her brother. In position 1 of 5. Press ENTER to select or TAB to move to a different object',
    );
    expect(labels).toContain(
      'Unsorted object Antigone tells Creon that she is ready to die and that the citizens agree with what she did. Press ENTER to select or TAB to move to a different object.',
    );
  });

  it('does not tell a student of a view-only item to press keys', async () => {
    const { container } = await renderItem('view', ['2', undefined, undefined, undefined, undefined]);
    const text = container.textContent ?? '';

    expect(text).not.toContain('Build a sorted list');
    expect(text).not.toContain('Press ENTER');
    expect(text).toContain('1 of 5 objects are on the sorted list.');
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
    // tiles of a disabled item have no role, which a label needs
    expect(container.querySelectorAll('[data-tile-id][aria-label]')).toHaveLength(0);
  });
});
