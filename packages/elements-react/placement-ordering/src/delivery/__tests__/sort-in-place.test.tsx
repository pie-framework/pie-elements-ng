import React from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { loadLocale } from '@pie-element/shared-i18n';
import PlacementOrderingComponent from '../placement-ordering';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Session = { value?: string[] };

const PlacementOrdering = PlacementOrderingComponent as unknown as React.ComponentType<{
  model: object;
  session: Session;
  onSessionChange: (session: Session) => void;
}>;

const choices = ['C', 'B', 'E', 'A', 'D'].map((label) => ({ id: label.toLowerCase(), label }));

const modelOf = (config: object = {}, extra: object = {}) => ({
  choices,
  config: { orientation: 'vertical', includeTargets: false, ...config },
  env: { mode: 'gather', role: 'student' },
  disabled: false,
  ...extra,
});

const Item = ({ model = modelOf(), onChange }: { model?: object; onChange?: (value?: string[]) => void }) => {
  const [session, setSession] = React.useState<Session>({ value: choices.map((c) => c.id) });

  return (
    <PlacementOrdering
      model={model}
      session={session}
      onSessionChange={(s) => {
        setSession(s);
        onChange?.(s.value);
      }}
    />
  );
};

const buttons = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>('button[data-move]')];
const names = (root: ParentNode) => buttons(root).map((b) => b.getAttribute('aria-label'));
const tile = (root: ParentNode, id: string) => root.querySelector<HTMLElement>(`[data-tile-id$=":choice-${id}"]`);
const order = (root: ParentNode) =>
  [...root.querySelectorAll<HTMLElement>('[data-tile-id]')].map((el) => el.textContent?.trim() ?? '');

beforeAll(() => loadLocale('en-US'));

describe('PlacementOrdering without response areas: move buttons', () => {
  it('gives every object a button each way, but the first none up and the last none down', () => {
    const { container } = render(<Item />);

    expect(names(container)).toEqual([
      'Move C down',
      'Move B up',
      'Move B down',
      'Move E up',
      'Move E down',
      'Move A up',
      'Move A down',
      'Move D up',
    ]);
  });

  it('names the buttons left and right in a horizontal item, in the tab order of how they are drawn: right above left', () => {
    const { container } = render(<Item model={modelOf({ orientation: 'horizontal' })} />);

    expect(names(container).slice(0, 3)).toEqual(['Move C right', 'Move B right', 'Move B left']);
  });

  it('puts the buttons, not the objects, in the tab order', () => {
    const { container } = render(<Item />);

    expect(container.querySelectorAll('[tabindex]:not(button)')).toHaveLength(0);
    expect(container.querySelectorAll('[aria-describedby]')).toHaveLength(0);
    buttons(container).forEach((b) => expect(b.tabIndex).toBe(0));
  });

  it('moves an object one position when its button is pressed', () => {
    const onChange = vi.fn();
    const { container } = render(<Item onChange={onChange} />);

    fireEvent.click(tile(container, 'a')!.querySelector('[data-move="earlier"]')!);

    expect(onChange).toHaveBeenLastCalledWith(['c', 'b', 'a', 'e', 'd']);
  });

  it('leaves a touch on a button alone, so the browser still sends it a click', () => {
    const { container } = render(<Item onChange={vi.fn()} />);

    const onButton = fireEvent.touchStart(tile(container, 'a')!.querySelector('[data-move="earlier"]')!);
    const onTile = fireEvent.touchStart(tile(container, 'a')!);

    expect(onButton).toBe(true); // not default-prevented
    expect(onTile).toBe(false); // the tile still blocks touch scrolling and long-press
  });

  it('keeps focus on the object that moved, so a button can be pressed again', async () => {
    const onChange = vi.fn();
    const { container } = render(<Item onChange={onChange} />);
    const up = () => tile(container, 'a')!.querySelector<HTMLElement>('[data-move="earlier"]');

    for (const expected of [['c', 'b', 'a', 'e', 'd'], ['c', 'a', 'b', 'e', 'd']]) {
      up()!.focus();
      fireEvent.click(up()!);
      await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(expected));
      await waitFor(() => expect(document.activeElement).toBe(up()));
    }
  });

  it('moves focus to the remaining button when the object reaches an end', async () => {
    const { container } = render(<Item />);
    const up = () => tile(container, 'a')!.querySelector<HTMLElement>('[data-move="earlier"]');

    for (let i = 0; i < 3; i++) {
      await waitFor(() => expect(up()).not.toBeNull());
      fireEvent.click(up()!);
      await waitFor(() => expect(document.activeElement).not.toBe(document.body));
    }

    await waitFor(() => expect(order(container)[0]).toContain('A'));
    expect(tile(container, 'a')!.querySelector('[data-move="earlier"]')).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(tile(container, 'a')!.querySelector('[data-move="later"]')),
    );
  });

  it('says where the object went', async () => {
    const { container } = render(<Item />);

    fireEvent.click(tile(container, 'a')!.querySelector('[data-move="earlier"]')!);

    await waitFor(() =>
      expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Moved A to position 3 of 5.'),
    );
  });

  it('has no buttons when the answer cannot be changed', () => {
    const { container } = render(<Item model={modelOf({}, { disabled: true })} />);

    expect(buttons(container)).toHaveLength(0);
  });

  it('leaves an item with response areas as it was', () => {
    const { container } = render(<Item model={modelOf({ includeTargets: true })} />);

    expect(buttons(container)).toHaveLength(0);
  });
});

describe('DragPreview of a tile with move buttons', () => {
  it('leaves the strips their room, so the label wraps as it does in the tile', async () => {
    const { DragPreview } = await import('../tile');
    const { container, rerender } = render(<DragPreview tile={{ type: 'choice', value: 'A', moveAxis: 'x' }} />);
    const box = () => container.firstElementChild as HTMLElement;

    expect([box().style.paddingLeft, box().style.paddingRight]).toEqual(['24px', '24px']);

    rerender(<DragPreview tile={{ type: 'choice', value: 'A', moveAxis: 'y' }} />);
    expect([box().style.paddingTop, box().style.paddingBottom]).toEqual(['24px', '24px']);

    rerender(<DragPreview tile={{ type: 'choice', value: 'A' }} />);
    expect(box().style.paddingLeft).toBe('');
  });
});
