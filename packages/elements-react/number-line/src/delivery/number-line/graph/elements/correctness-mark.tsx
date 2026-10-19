import { color } from '@pie-lib/render-ui';
import React from 'react';

// A check or a cross in a disc drawn in the text and background colours, so the verdict reads in
// greyscale and holds contrast under every colour scheme. The element's own description carries
// the same verdict for assistive technology, so the mark is hidden from it.
//
// The mark sits above the element it judges and overlaps it slightly. Beside the element it reads
// as a point at the neighbouring tick and hides that tick on tightly spaced lines; below it would
// cover the tick labels. Its disc is smaller than a plotted point and clears the next stacked row,
// 25px up.
const RADIUS = 5;
const OFFSET = 8;
const CHECK = 'M-2.4,0.2 L-0.7,1.9 L2.4,-1.9';
const CROSS = 'M-1.9,-1.9 L1.9,1.9 M1.9,-1.9 L-1.9,1.9';

export interface CorrectnessMarkProps {
  /** Horizontal position of the judged element's anchor. */
  x: number;
  /** Vertical position of the judged element's anchor; the mark is drawn above it. */
  y?: number;
  correct?: boolean;
}

export function CorrectnessMark({ x, y = 0, correct }: CorrectnessMarkProps) {
  if (correct !== true && correct !== false) {
    return null;
  }

  return (
    <g
      aria-hidden="true"
      data-correctness={correct ? 'correct' : 'incorrect'}
      transform={`translate(${x}, ${y - OFFSET})`}
      style={{ pointerEvents: 'none' }}
    >
      <circle r={RADIUS} fill={color.background()} stroke={color.text()} strokeWidth="1" />
      <path
        d={correct ? CHECK : CROSS}
        fill="none"
        stroke={color.text()}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default CorrectnessMark;
