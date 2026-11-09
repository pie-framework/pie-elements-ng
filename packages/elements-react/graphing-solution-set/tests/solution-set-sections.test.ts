import { describe, expect, it } from 'vitest';
import { findSectionsInSolutionSet, findSelectedSection, pointInsidePolygon } from '../src/delivery/utils.js';

const domain = { min: -10, max: 10 };
const range = { min: -10, max: 10 };
const line = (from, to) => ({ type: 'line', from, to });
const sectionsFor = (lines) =>
  findSectionsInSolutionSet({ numberOfLines: lines.length }, lines, domain, range).sections;

describe('solution set sections', () => {
  it('splits the grid in two when the boundary passes through a corner', () => {
    // y = 1.5x - 5 leaves the grid through its top-right corner
    const sections = sectionsFor([line({ x: 0, y: -5 }, { x: 2, y: -2 })]);

    expect(sections).toHaveLength(2);
    expect(findSelectedSection(sections, { x: -8, y: 8 })).not.toBe(findSelectedSection(sections, { x: 8, y: -8 }));
  });

  it('splits the grid in two along a diagonal', () => {
    expect(sectionsFor([line({ x: -10, y: -10 }, { x: 10, y: 10 })])).toHaveLength(2);
  });

  it('gives three sections for parallel lines and four for crossing ones', () => {
    expect(sectionsFor([line({ x: 0, y: 0 }, { x: 1, y: 0 }), line({ x: 0, y: 5 }, { x: 1, y: 5 })])).toHaveLength(3);
    expect(sectionsFor([line({ x: 0, y: 0 }, { x: 1, y: 0 }), line({ x: 0, y: 0 }, { x: 0, y: 1 })])).toHaveLength(4);
  });

  it('selects a section from lattice points on the bottom and left edges and the top-left corner', () => {
    const sections = sectionsFor([line({ x: 0, y: -10 }, { x: 0, y: 10 })]);

    expect(findSelectedSection(sections, { x: -4, y: -10 })).toBeDefined();
    expect(findSelectedSection(sections, { x: -10, y: 3 })).toBeDefined();
    expect(findSelectedSection(sections, { x: -10, y: 10 })).toBeDefined();
  });

  it('keeps the side the click was on when it snaps onto the boundary', () => {
    const sections = sectionsFor([line({ x: 0, y: -10 }, { x: 0, y: 10 })]);
    const right = findSelectedSection(sections, { x: 5, y: 0 });
    const left = findSelectedSection(sections, { x: -5, y: 0 });

    expect(findSelectedSection(sections, { x: 0, y: 2 }, { x: 0.3, y: 2.1 })).toBe(right);
    expect(findSelectedSection(sections, { x: 0, y: 2 }, { x: -0.3, y: 2.1 })).toBe(left);
  });

  it('treats polygon boundaries as inside', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];

    expect(pointInsidePolygon({ x: 2, y: 0 }, square)).toBe(true);
    expect(pointInsidePolygon({ x: 0, y: 4 }, square)).toBe(true);
    expect(pointInsidePolygon({ x: 5, y: 2 }, square)).toBe(false);
  });
});

describe('solution set section vertices', () => {
  it('places a crossing at the same point whichever line was drawn first', () => {
    // y = 3x - 12 and y = -13x + 61 cross at (4.5625, 1.6875)
    const first = line({ x: 4, y: 0 }, { x: 5, y: 3 });
    const second = line({ x: 4, y: 9 }, { x: 5, y: -4 });
    const crossings = (lines) =>
      new Set(sectionsFor(lines).flatMap((section) => section.filter((point) => point.x === 4.563)).map((p) => p.y));

    expect([...crossings([first, second])]).toEqual([1.688]);
    expect([...crossings([second, first])]).toEqual([1.688]);
  });
});
