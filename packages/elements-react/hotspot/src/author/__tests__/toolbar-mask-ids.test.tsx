import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import { PolygonButton } from '../buttons/polygon';
import { RectangleButton } from '../buttons/rectangle';

// Two hotspot configures on one page, each with its toolbar.
const Toolbars = ({ isActive = false }) => (
  <>
    {[0, 1].map((toolbar) => (
      <div key={toolbar} data-toolbar={toolbar}>
        <RectangleButton isActive={isActive} />
        <PolygonButton isActive={isActive} />
      </div>
    ))}
  </>
);

const masks = (root: ParentNode) => [...root.querySelectorAll('mask')].map((mask) => mask.id);

const maskReferences = (root: ParentNode) =>
  [...root.querySelectorAll('[mask]')].map((node) => /^url\(#(.+)\)$/.exec(node.getAttribute('mask') || '')?.[1]);

afterEach(cleanup);

describe('hotspot toolbar icon masks', () => {
  it('repeat no id across toolbars', () => {
    const { container } = render(<Toolbars />);

    expect(masks(container)).toHaveLength(4);
    expect(new Set(masks(container)).size).toBe(4);
  });

  it('resolve each mask reference inside its own icon', () => {
    const { container } = render(<Toolbars />);

    for (const svg of container.querySelectorAll('svg')) {
      const [reference] = maskReferences(svg);
      expect(reference).toBeTruthy();
      expect(svg.querySelector(`mask[id="${reference}"]`)).not.toBeNull();
    }
  });

  it('keep their ids when a button is toggled', () => {
    const { container, rerender } = render(<Toolbars />);
    const before = masks(container);

    rerender(<Toolbars isActive />);

    expect(masks(container)).toEqual(before);
  });
});
