import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import KeyLegend from '../key-legend';
import LineStyleBadge from '../tools/shared/line-style-badge';
import RegionVerdict from '../tools/shared/region-verdict';

const graphProps = { scale: { x: (v: number) => v * 10, y: (v: number) => 100 - v * 10 } };

describe('graphing-solution-set evaluate marks', () => {
  it('names a correct line style by what was drawn', () => {
    render(
      <svg>
        <LineStyleBadge graphProps={graphProps as never} from={{ x: 0, y: 0 }} to={{ x: 4, y: 4 }} lineStyle="correct" fill="Dashed" />
      </svg>,
    );
    expect(screen.getByRole('img', { name: 'Line style correct: Dashed' })).toBeInTheDocument();
  });

  it('names a wrong line style by what was drawn and what the key has', () => {
    render(
      <svg>
        <LineStyleBadge
          graphProps={graphProps as never}
          from={{ x: 0, y: 0 }}
          to={{ x: 4, y: 4 }}
          lineStyle="incorrect"
          fill="Solid"
          expectedFill="Dashed"
        />
      </svg>,
    );
    expect(screen.getByRole('img', { name: 'Line style incorrect: drawn Solid, expected Dashed' })).toBeInTheDocument();
  });

  it('puts the verdict icon on a shaded region', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
    ];
    const { container } = render(
      <svg>
        <RegionVerdict points={points} correctness="incorrect" graphProps={graphProps as never} />
      </svg>,
    );
    expect(container.querySelector('circle')).not.toBeNull();
    expect(container.querySelectorAll('svg svg')).toHaveLength(1);
  });

  it('names the verdict of a shaded region for assistive technology', () => {
    render(
      <svg>
        <RegionVerdict points={[{ x: 0, y: 0 }]} correctness="missing" graphProps={graphProps as never} />
      </svg>,
    );
    expect(screen.getByRole('img', { name: 'Shaded region in the answer key, not shaded' })).toBeInTheDocument();
  });

  it('draws nothing for a region with no verdict', () => {
    const { container } = render(
      <svg>
        <RegionVerdict points={[{ x: 0, y: 0 }]} graphProps={graphProps as never} />
      </svg>,
    );
    expect(container.querySelector('circle')).toBeNull();
  });

  it('lists the line and line style rows in the key, without label or region rows', () => {
    render(<KeyLegend />);
    for (const name of [
      'Key',
      'Student Correct',
      'Student Incorrect',
      'Answer Key Correct',
      'Line Style Correct',
      'Line Style Incorrect',
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    expect(screen.queryByText(/label|region/i)).toBeNull();
  });
});
