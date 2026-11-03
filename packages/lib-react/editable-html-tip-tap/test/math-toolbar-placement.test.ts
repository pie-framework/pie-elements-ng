// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));

import { mathToolbarLeft, mathToolbarTop, visibleBounds } from '../src/extensions/math';

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

  const bounds = { top: 80, bottom: 600 };

  it('opens below the node when it fits in the visible container', () => {
    expect(mathToolbarTop({ top: 200, bottom: 220 }, 280, bounds, 8)).toBe(220);
  });

  it('opens above the node when there is more room there', () => {
    expect(mathToolbarTop({ top: 450, bottom: 470 }, 280, bounds, 8)).toBe(170);
  });

  it('stays inside the visible container rather than the viewport', () => {
    expect(mathToolbarTop({ top: 300, bottom: 320 }, 280, bounds, 8)).toBe(312);
    expect(mathToolbarTop({ top: 340, bottom: 360 }, 280, bounds, 8)).toBe(88);
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
