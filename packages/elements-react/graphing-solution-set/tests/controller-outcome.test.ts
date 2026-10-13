import { describe, expect, it } from 'vitest';
import { outcome } from '../src/controller/index.js';

// Production item 32b936c3-2b19-4756-81ae-5e91c41e9a1d.
const question = {
  answers: {
    correctAnswer: {
      name: 'Correct Answer',
      marks: [
        { type: 'line', building: false, from: { x: 4, y: 50 }, to: { x: 4, y: 30 }, fill: 'Dashed' },
        { type: 'line', building: false, from: { x: 10, y: 60 }, to: { x: 24, y: 50 }, fill: 'Solid' },
        {
          type: 'polygon',
          building: false,
          closed: true,
          isSolution: true,
          points: [
            { x: 30, y: 0 },
            { x: 4, y: 0 },
            { x: 4, y: 64.286 },
            { x: 30, y: 45.714 },
          ],
        },
      ],
    },
  },
};

// The same two lines drawn through other points. The delivery element rounds the region's
// vertices with toFixed, which turns the intercept of x = 4 with y = 0 into -0.
const session = {
  answer: [
    { type: 'line', building: false, from: { x: 4, y: 55 }, to: { x: 4, y: 5 }, fill: 'Dashed' },
    { type: 'line', building: false, from: { x: 3, y: 65 }, to: { x: 10, y: 60 }, fill: 'Solid' },
    {
      type: 'polygon',
      building: false,
      closed: true,
      isSolution: true,
      points: [
        { x: 30, y: 0 },
        { x: 4, y: -0 },
        { x: 4, y: 64.286 },
        { x: 30, y: 45.714 },
      ],
    },
  ],
};

describe('graphing-solution-set outcome', () => {
  it('scores a correct region with a -0 vertex as correct', async () => {
    const result = await outcome(structuredClone(question), structuredClone(session), {
      mode: 'evaluate',
    });

    expect(result).toEqual({ score: 1 });
  });

  it('scores the region the same once storage has turned -0 into 0', async () => {
    const stored = JSON.parse(JSON.stringify(session));
    const result = await outcome(structuredClone(question), stored, { mode: 'evaluate' });

    expect(result).toEqual({ score: 1 });
  });
});
