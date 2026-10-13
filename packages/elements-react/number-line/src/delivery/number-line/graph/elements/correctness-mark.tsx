import { color } from '@pie-lib/render-ui';
import React from 'react';

// A check or a cross in a disc drawn in the text and background colours, so the verdict reads in
// greyscale and holds contrast under every colour scheme. The element's own description carries
// the same verdict for assistive technology, so the mark is hidden from it.
const CHECK = 'M-3.5,0.5 L-1,3 L3.5,-3';
const CROSS = 'M-3,-3 L3,3 M3,-3 L-3,3';

export interface CorrectnessMarkProps {
  x: number;
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
      transform={`translate(${x}, ${y})`}
      style={{ pointerEvents: 'none' }}
    >
      <circle r="8" fill={color.background()} stroke={color.text()} strokeWidth="1.5" />
      <path
        d={correct ? CHECK : CROSS}
        fill="none"
        stroke={color.text()}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

export default CorrectnessMark;
