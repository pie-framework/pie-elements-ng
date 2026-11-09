import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import PlacementOrderingComponent from '../placement-ordering';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

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

const PlacementOrdering = PlacementOrderingComponent as unknown as React.ComponentType<{
  model: object;
  session: { value?: (string | undefined)[] };
  onSessionChange: (session: object) => void;
}>;

const model = {
  choices: [
    { id: 'c1', label: 'Blueberry' },
    { id: 'c2', label: 'Lemon' },
    { id: 'c3', label: 'Cherry' },
  ],
  config: { orientation: 'vertical', includeTargets: true, targetLabel: 'Target', choiceLabel: 'Source' },
  correctResponse: ['c1', 'c2', 'c3'],
  env: { mode: 'gather', role: 'student' },
  disabled: false,
};

const choice = (id: string, value: string) => ({ id, type: 'choice', value });
const target = (index: number, id: string, value: string) => ({ id, type: 'target', index, value });
const dragged = (data: object) => ({ id: 'tile', data: { current: data } });
const over = (data: object) => ({ id: 'slot', data: { current: data } });

// A session holds one entry per sort position, empty ones included.
const setup = (placed: (string | undefined)[] = [], props: object = {}) => {
  const onSessionChange = vi.fn();
  const value = Array.from({ length: model.choices.length }, (_, i) => placed[i]);
  const view = render(
    <PlacementOrdering model={{ ...model, ...props }} session={{ value }} onSessionChange={onSessionChange} />,
  );
  const status = () => view.container.querySelector('[aria-live="polite"]')?.textContent;

  return { ...view, onSessionChange, status };
};

describe('PlacementOrdering screen reader announcements', () => {
  it('reads the instructions and counts, in the order of the tiles', () => {
    const { container } = setup(['c1']);
    const text = container.textContent ?? '';

    expect(text).toContain('1 of 3 objects are on the sorted list.');
    expect(text.indexOf('2 unsorted objects')).toBeLessThan(text.indexOf('Target 1 sorted objects'));
    expect(text).toContain('End of unsorted objects');
    expect(text).toContain('End of sorted objects. Use TAB to move to an object.');
    // the visible heading is left out, as the order of the tiles puts the heading read above after the unsorted ones
    expect([...container.querySelectorAll('[aria-hidden="true"]')].map((el) => el.textContent)).toContain('Target');
  });

  it('names each tile on focus', () => {
    const { container } = setup(['c1']);
    const labels = [...container.querySelectorAll('[data-tile-id]')].map((el) => el.getAttribute('aria-label'));

    expect(labels).toContain('Unsorted object Lemon Press ENTER to select or TAB to move to a different object.');
    expect(labels).toContain(
      'Sorted object Blueberry In position 1 of 3. Press ENTER to select or TAB to move to a different object',
    );
  });

  it('announces a pick-up and each sort position the object is moved over', () => {
    setup(['c1']);
    const { accessibility } = provider.props;
    const active = dragged(choice('c2', 'Lemon'));

    expect(accessibility.announcements.onDragStart({ active })).toBe(
      'Selected object Lemon Use TAB to move to a sorted position.',
    );
    expect(accessibility.announcements.onDragOver({ active, over: over(target(1, 'c1', '')) })).toBe(
      'On sort position 2 of 3, which is empty. Press ENTER to move selected object Lemon here or use TAB to move to a different position.',
    );
    expect(accessibility.announcements.onDragOver({ active, over: over(target(0, 'c1', 'Blueberry')) })).toContain(
      'On sort position 1 of 3, which contains object Blueberry.',
    );
    expect(accessibility.announcements.onDragEnd({ active })).toBeUndefined();
  });

  it('names the selected object on the unsorted list it came from, from the drop data dnd-kit gives', () => {
    setup(['c1']);
    const { announcements } = provider.props.accessibility;
    // the drop data of a slot has no `empty`: whether it is empty is for the ordering to say
    const gap = { id: 'c1', type: 'choice', instanceId: 'x', value: undefined, index: undefined };

    expect(announcements.onDragOver({ active: dragged(target(0, 'c1', 'Blueberry')), over: over(gap) })).toBe(
      'On unsorted list. Press ENTER to return selected object Blueberry to unsorted or use TAB to move to a sort position.',
    );
    // the slot of an object that is still unsorted, for that object
    expect(
      announcements.onDragOver({ active: dragged(choice('c2', 'Lemon')), over: over({ ...gap, id: 'c2', value: 'Lemon' }) }),
    ).toBe('On unsorted list. Press ENTER to leave object Lemon unsorted or use TAB to move to a sort position.');
  });

  it('announces a selection made by a click, which makes no drag', () => {
    const { container, status } = setup(['c1']);
    const lemon = () => container.querySelector('[data-tile-id$=":choice-c2"]') as HTMLElement;

    fireEvent.click(lemon());
    expect(status()).toBe('Selected object Lemon Use TAB to move to a sorted position.');

    fireEvent.click(lemon());
    expect(status()).toBe(
      'Object Lemon is no longer selected. 1 of 3 objects on sorted list. Use TAB to move to another object.',
    );
  });

  it('announces placing an object on the simple success path', () => {
    const { onSessionChange, status } = setup(['c1']);
    const active = dragged(choice('c2', 'Lemon'));

    act(() => {
      provider.props.onDragStart({ active });
      provider.props.onDragEnd({ active, over: over({ ...target(1, 'c2', ''), value: '' }) });
    });

    expect(onSessionChange).toHaveBeenCalledWith({ value: ['c1', 'c2', undefined] });
    expect(status()).toBe(
      'Placed object Lemon in sort position 2 of 3. 2 of 3 objects on sorted list. Use TAB to move to another object.',
    );
  });

  it('announces replacing an object, moving one and removing one', () => {
    const { status } = setup(['c1', 'c2']);

    act(() => {
      const active = dragged(choice('c3', 'Cherry'));
      provider.props.onDragStart({ active });
      provider.props.onDragEnd({ active, over: over(target(0, 'c1', 'Blueberry')) });
    });
    expect(status()).toBe(
      'Placed object Cherry in sort position 1 of 3. Object Blueberry has been returned to unsorted list. 2 of 3 objects on sorted list. Use TAB to move to another object.',
    );

    act(() => {
      const active = dragged(target(0, 'c1', 'Blueberry'));
      provider.props.onDragStart({ active });
      provider.props.onDragEnd({ active, over: over(target(2, 'c3', '')) });
    });
    expect(status()).toBe(
      'Moved object Blueberry from sort position 1 to sort position 3. 2 of 3 objects on sorted list. Use TAB to move to another object.',
    );

    act(() => {
      const active = dragged(target(1, 'c2', 'Lemon'));
      provider.props.onDragStart({ active });
      provider.props.onDragEnd({ active, over: over(choice('c2', '')) });
    });
    expect(status()).toBe(
      'Removed object Lemon from sort position 2. 1 of 3 objects on sorted list. Use TAB to move to another object.',
    );
  });

  it('announces cancelling a selection', () => {
    const { status } = setup(['c1']);
    const active = dragged(choice('c2', 'Lemon'));

    act(() => provider.props.onDragStart({ active }));
    act(() => provider.props.onDragCancel());

    expect(status()).toBe(
      'Object Lemon is no longer selected. 1 of 3 objects on sorted list. Use TAB to move to another object.',
    );
  });

  it('announces a cancel again when the same one is made twice', () => {
    const { status } = setup(['c1']);
    const active = dragged(choice('c2', 'Lemon'));
    const cancel = () => {
      act(() => provider.props.onDragStart({ active }));
      act(() => provider.props.onDragCancel());
    };

    cancel();
    const first = status();
    cancel();

    expect(status()).not.toBe(first);
    expect(status()?.trim()).toBe(first);
  });

  it('announces an object let go where nothing takes it', () => {
    const { status, onSessionChange } = setup(['c1']);
    const active = { ...dragged(choice('c2', 'Lemon')), rect: { current: {} } };

    act(() => provider.props.onDragStart({ active }));
    act(() => provider.props.onDragEnd({ active, over: null }));

    expect(onSessionChange).not.toHaveBeenCalled();
    expect(status()).toContain('Object Lemon is no longer selected.');
  });

  it('adds none of this without placement areas', () => {
    const { container } = setup([], { config: { orientation: 'vertical', includeTargets: false } });

    expect(container.querySelector('[aria-live="polite"]')).toBeNull();
    expect(container.textContent).not.toContain('objects are on the sorted list');
    expect(provider.props.accessibility).toBeUndefined();
  });
});
