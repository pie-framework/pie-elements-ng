// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));

import { mathToolbarLeft, mathToolbarPosition, visibleBounds } from '../src/extensions/math';

const node = { left: 300, right: 360 };
const viewport = { left: 0, right: 1000 };

describe('math toolbar placement', () => {
  it('opens rightwards from the node in LTR text', () => {
    expect(mathToolbarLeft(node, 200, false, viewport, 8)).toBe(300);
  });

  it('opens leftwards from the node in RTL text', () => {
    expect(mathToolbarLeft(node, 200, true, viewport, 8)).toBe(160);
  });

  it('stays inside the viewport in either direction', () => {
    expect(mathToolbarLeft({ left: 900, right: 960 }, 200, false, viewport, 8)).toBe(792);
    expect(mathToolbarLeft({ left: 40, right: 100 }, 200, true, viewport, 8)).toBe(8);
  });

  it('stays inside a narrow visible container horizontally', () => {
    expect(mathToolbarLeft({ left: 500, right: 560 }, 200, false, { left: 100, right: 600 }, 8)).toBe(392);
    expect(mathToolbarLeft({ left: 120, right: 180 }, 200, true, { left: 100, right: 600 }, 8)).toBe(108);
  });

});

describe('mathToolbarPosition', () => {
  const bounds = { top: 80, bottom: 600, left: 0, right: 1000 };
  const toolbar = { width: 300, height: 280 };
  const at = (left: number, top: number) => ({ top, bottom: top + 20, left, right: left + 60 });

  it('opens to the right of the node in LTR text, top-aligned with it', () => {
    expect(mathToolbarPosition(at(300, 200), toolbar, false, bounds, 8)).toEqual({ top: 200, left: 360 });
  });

  it('opens to the left of the node in RTL text', () => {
    expect(mathToolbarPosition(at(600, 200), toolbar, true, bounds, 8)).toEqual({ top: 200, left: 300 });
  });

  it('switches sides when the preferred side has no room', () => {
    expect(mathToolbarPosition(at(800, 200), toolbar, false, bounds, 8)).toEqual({ top: 200, left: 500 });
    expect(mathToolbarPosition(at(100, 200), toolbar, true, bounds, 8)).toEqual({ top: 200, left: 160 });
  });

  it('shifts up beside the node to stay inside the visible container', () => {
    expect(mathToolbarPosition(at(300, 450), toolbar, false, bounds, 8)).toEqual({ top: 312, left: 360 });
  });

  it('opens below or above, kept inside the visible container, when neither side has room', () => {
    const narrow = { ...bounds, right: 400 };
    expect(mathToolbarPosition(at(80, 100), toolbar, false, narrow, 8)).toEqual({ top: 120, left: 80 });
    expect(mathToolbarPosition(at(80, 450), toolbar, false, narrow, 8)).toEqual({ top: 170, left: 80 });
    expect(mathToolbarPosition(at(80, 300), toolbar, false, narrow, 8)).toEqual({ top: 312, left: 80 });
    expect(mathToolbarPosition(at(80, 340), toolbar, false, narrow, 8)).toEqual({ top: 88, left: 80 });
  });
});

describe('visibleBounds', () => {
  const box = (style: string, rect: { top: number; bottom: number; left: number; right: number }) => {
    const el = document.createElement('div');
    el.setAttribute('style', style);
    el.getBoundingClientRect = () => ({ ...rect, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    return el;
  };

  afterEach(() => {
    document.body.innerHTML = '';
    document.body.removeAttribute('style');
  });

  it('narrows the viewport to clipping ancestors on each axis they clip', () => {
    const pane = box('overflow-y: auto', { top: 80, bottom: 500, left: 0, right: 2000 });
    const column = box('overflow-x: hidden', { top: 0, bottom: 2000, left: 100, right: 600 });
    const root = box('', { top: 0, bottom: 0, left: 0, right: 0 });
    pane.appendChild(column);
    column.appendChild(root);
    document.body.appendChild(pane);

    expect(visibleBounds(root)).toEqual({ top: 80, bottom: 500, left: 100, right: 600 });
  });

  it('ignores overflow set on <body>', () => {
    document.body.style.overflow = 'hidden';
    const root = box('', { top: 0, bottom: 0, left: 0, right: 0 });
    document.body.appendChild(root);

    expect(visibleBounds(root)).toEqual({ top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth });
  });

  it('stops at a position: fixed element', () => {
    const pane = box('overflow: hidden', { top: 300, bottom: 400, left: 300, right: 400 });
    const dialog = box('position: fixed', { top: 0, bottom: 0, left: 0, right: 0 });
    const root = box('', { top: 0, bottom: 0, left: 0, right: 0 });
    pane.appendChild(dialog);
    dialog.appendChild(root);
    document.body.appendChild(pane);

    expect(visibleBounds(root)).toEqual({ top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth });
  });
});
