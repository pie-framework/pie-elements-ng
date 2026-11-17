import { describe, expect, it } from 'vitest';
import { model, outcome } from '../src/controller/index.js';
import { findSectionsInSolutionSet, findSelectedSection } from '../src/delivery/utils.js';

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

const line = (from, to) => ({ type: 'line', building: false, from, to, fill: 'Solid' });
const region = (points) => ({ type: 'polygon', building: false, closed: true, isSolution: true, points });
const corners = (pairs: number[][]) => pairs.map(([x, y]) => ({ x, y }));

/** Keys and sessions as the element now builds them: the student clicks sections the current lines produce. */
const storedKey = (
  lines,
  key,
  domain,
  range,
  { alternate, stored }: { alternate?: { x: number; y: number }; stored?: { x: number; y: number }[][] } = {},
) => {
  const sections = findSectionsInSolutionSet({ numberOfLines: lines.length }, structuredClone(lines), domain, range)
    .sections;
  const section = (point) => region(findSelectedSection(sections, point));
  const answers = {
    correctAnswer: { name: 'Correct Answer', marks: [...lines, region(key)] },
    ...(alternate && { alternate1: { name: 'Alternate 1', marks: [...lines, section(alternate)] } }),
  };
  const question = {
    answers,
    domain,
    range,
    ...(stored && { gssLineData: { numberOfLines: lines.length, selectedTool: 'solutionSet', sections: stored } }),
  };
  const clicked = (point) => [...structuredClone(lines), section(point)];
  const score = async (answer) =>
    (await outcome(structuredClone(question) as any, { answer } as any, { mode: 'evaluate' })).score;
  return { question, clicked, score };
};

describe('keys stored before sections were recomputed', () => {
  // Production item c2068f40-87a8-11ef-ad1d-2339ab822be9: the key is one region spanning two of today's
  // sections, and the item stores the older element's sections, the key second and the strip last.
  // A click resolved to the first stored section containing it, so only strip clicks stored the key.
  const grid = { min: -10, max: 10 };
  const lines = [line({ x: -5, y: 5 }, { x: 4, y: 7 }), line({ x: -4, y: -3 }, { x: 7, y: 1 })];
  const spanning = corners([[10, 2.091], [-10, -5.182], [-10, 10], [10, 10]]);
  const stored = [
    corners([[10, 8.333], [-10, 3.889], [-10, 10], [10, 10]]),
    spanning,
    corners([[10, -10], [-10, -10], [-10, -5.182], [10, 2.091]]),
    corners([[10, 2.091], [-10, -5.182], [-10, 3.889], [10, 8.333]]),
  ];
  const union = storedKey(lines, spanning, grid, grid, { stored });

  it('scores the strip, whose clicks the older element resolved to the stored region', async () => {
    const answer = union.clicked({ x: 0, y: 2 });
    const evaluated = await model(structuredClone(union.question) as any, { answer } as any, { mode: 'evaluate' });

    expect(await union.score(answer)).toBe(1);
    expect(evaluated.answersCorrected?.every((mark) => mark.correctness === 'correct')).toBe(true);
  });

  it('scores the section above both lines as wrong, as the older element did', async () => {
    expect(await union.score(union.clicked({ x: 0, y: 9 }))).toBe(0);
  });

  it('scores the section below both lines as wrong', async () => {
    expect(await union.score(union.clicked({ x: 0, y: -8 }))).toBe(0);
  });

  it('scores neither section of a spanning region without the stored sections', async () => {
    const bare = storedKey(lines, spanning, grid, grid);

    expect(await bare.score(bare.clicked({ x: 0, y: 9 }))).toBe(0);
    expect(await bare.score(bare.clicked({ x: 0, y: 2 }))).toBe(0);
  });

  it('keeps scoring a session that holds the stored region itself', async () => {
    expect(await union.score([...structuredClone(lines), region(spanning)])).toBe(1);
  });

  it('scores the section an alternate names, and only that one', async () => {
    const keyed = storedKey(lines, spanning, grid, grid, { alternate: { x: 0, y: 2 } });
    const evaluated = await model(structuredClone(keyed.question) as any, { answer: keyed.clicked({ x: 0, y: 2 }) } as any, {
      mode: 'evaluate',
    });

    expect(await keyed.score(keyed.clicked({ x: 0, y: 2 }))).toBe(1);
    expect(await keyed.score(keyed.clicked({ x: 0, y: 9 }))).toBe(0);
    expect(evaluated.answersCorrected?.some((mark) => mark.correctness === 'missing')).toBe(false);
  });

  // Production item 487d4b80-90a1-11ef-a7e8-93e4253dd632: the line runs through a corner, and the older
  // element stored the whole grid as the region, which every click selected.
  it('scores every section of a stored whole-grid region', async () => {
    const corner = storedKey(
      [line({ x: 0, y: 80 }, { x: 10, y: 30 })],
      corners([[80, 0], [16, 0], [0, 0], [0, 80], [80, 80]]),
      { min: 0, max: 80 },
      { min: 0, max: 80 },
    );

    expect(await corner.score(corner.clicked({ x: 2, y: 2 }))).toBe(1);
    expect(await corner.score(corner.clicked({ x: 60, y: 60 }))).toBe(1);
  });

  // As on production items 1fa35e40, b0a388c0 and 498a7d90, whose keys were drawn on a larger grid.
  it('scores the one section a region drawn past the grid covers', async () => {
    const larger = storedKey(
      [line({ x: 0, y: 1 }, { x: 2, y: 2 })],
      corners([[-20, -9], [20, 11], [20, -20], [-20, -20]]),
      grid,
      grid,
    );

    expect(await larger.score(larger.clicked({ x: 0, y: -5 }))).toBe(1);
    expect(await larger.score(larger.clicked({ x: 0, y: 8 }))).toBe(0);
  });
});

describe('line style correctness in evaluate', () => {
  const key = {
    answers: {
      correctAnswer: {
        name: 'Correct Answer',
        marks: [{ type: 'line', building: false, from: { x: 0, y: 0 }, to: { x: 10, y: 10 }, fill: 'Dashed' }],
      },
    },
  };
  const evaluate = (answer: unknown[]) =>
    model(key as never, { answer } as never, { mode: 'evaluate' } as never).then((m) => m.answersCorrected);

  it('marks a correct line as right in style too', async () => {
    const [mark] = (await evaluate([
      { type: 'line', building: false, from: { x: 0, y: 0 }, to: { x: 10, y: 10 }, fill: 'Dashed' },
    ])) as any[];
    expect(mark).toMatchObject({ correctness: 'correct', lineStyle: 'correct' });
  });

  it('marks a line in the right place but the wrong style, and does not also report the key line missing', async () => {
    const marks = (await evaluate([
      { type: 'line', building: false, from: { x: 1, y: 1 }, to: { x: 5, y: 5 }, fill: 'Solid' },
    ])) as any[];
    expect(marks).toHaveLength(1);
    expect(marks[0]).toMatchObject({ correctness: 'incorrect', lineStyle: 'incorrect' });
  });

  it('judges a misplaced line on its style against the key line in its slot', async () => {
    const [right, wrong] = (await Promise.all([
      evaluate([{ type: 'line', building: false, from: { x: 0, y: 5 }, to: { x: 5, y: 0 }, fill: 'Dashed' }]),
      evaluate([{ type: 'line', building: false, from: { x: 0, y: 5 }, to: { x: 5, y: 0 }, fill: 'Solid' }]),
    ])) as any[][];
    expect(right[0]).toMatchObject({ correctness: 'incorrect', lineStyle: 'correct', onKeyLine: false });
    expect(wrong[0]).toMatchObject({ correctness: 'incorrect', lineStyle: 'incorrect', expectedFill: 'Dashed' });
  });

  it('reports the key line missing when the line is elsewhere', async () => {
    const marks = (await evaluate([
      { type: 'line', building: false, from: { x: 0, y: 5 }, to: { x: 5, y: 0 }, fill: 'Dashed' },
    ])) as any[];
    expect(marks[0]).toMatchObject({ correctness: 'incorrect' });
    expect(marks[1]).toMatchObject({ correctness: 'missing', fill: 'Dashed' });
  });
});

describe('shaded region in evaluate', () => {
  const domain = { min: 0, max: 10 };
  const range = { min: 0, max: 10 };
  const line = (from: object, to: object) => ({ type: 'line', building: false, from, to, fill: 'Solid' });
  const region = (points: object[]) => ({ type: 'polygon', building: false, closed: true, isSolution: true, points });
  // x = 5 splits the grid: the key shades the left half
  const left = [
    { x: 0, y: 10 },
    { x: 5, y: 10 },
    { x: 5, y: 0 },
    { x: 0, y: 0 },
  ];
  const right = [
    { x: 5, y: 10 },
    { x: 10, y: 10 },
    { x: 10, y: 0 },
    { x: 5, y: 0 },
  ];
  const key = {
    domain,
    range,
    answers: { correctAnswer: { name: 'Correct Answer', marks: [line({ x: 5, y: 0 }, { x: 5, y: 10 }), region(left)] } },
  };
  const evaluate = (answer: unknown[]) =>
    model(key as never, { answer } as never, { mode: 'evaluate' } as never).then((m) => m.answersCorrected as any[]);

  it('marks the other region incorrect and shows the key region as missing', async () => {
    const marks = await evaluate([line({ x: 5, y: 0 }, { x: 5, y: 10 }), region(right)]);
    expect(marks.map((m) => [m.type, m.correctness])).toEqual([
      ['line', 'correct'],
      ['polygon', 'incorrect'],
      ['polygon', 'missing'],
    ]);
  });

  it('matches the right region when the key outlines it with other vertices, and the lines are drawn elsewhere', async () => {
    // the key's region carries an extra vertex on its edge; the student's is the section the lines make
    const outlined = { ...key.answers.correctAnswer, marks: [key.answers.correctAnswer.marks[0], region([...left.slice(0, 2), { x: 5, y: 5 }, ...left.slice(2)])] };
    const marks = await model(
      { ...key, answers: { correctAnswer: outlined } } as never,
      { answer: [line({ x: 5, y: 2 }, { x: 5, y: 8 }), region(left)] } as never,
      { mode: 'evaluate' } as never,
    ).then((m) => m.answersCorrected as any[]);
    expect(marks.map((m) => [m.type, m.correctness])).toEqual([
      ['line', 'correct'],
      ['polygon', 'correct'],
    ]);
  });
});
