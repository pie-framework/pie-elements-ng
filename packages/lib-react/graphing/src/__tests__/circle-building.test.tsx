import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createGraphProps } from '@pie-lib/plot';

import { BaseCircle } from '../tools/circle/component';

const axis = { min: -5, max: 5, step: 1, labelStep: 1 };
const graphProps = createGraphProps(axis, axis, { width: 300, height: 300 }, () => null);

const outline = (building: boolean) => {
  const { container } = render(
    <svg>
      <BaseCircle building={building} from={{ x: 0, y: 0 }} to={{ x: 2, y: 0 }} graphProps={graphProps} onChange={() => {}} />
    </svg>,
  );

  return getComputedStyle(container.querySelector('ellipse') as SVGElement);
};

describe('a circle being drawn', () => {
  // Reduced motion stops the pulse, which leaves the outline at its static opacity.
  it('rests at the peak of its pulse, fainter than a finished circle', () => {
    const drawing = outline(true);

    expect(drawing.animation).toMatch(/ infinite$/);
    expect(drawing.opacity).toBe('0.3');
    expect(outline(false).opacity).not.toBe('0.3');
  });
});
