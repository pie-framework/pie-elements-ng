// @ts-nocheck

/*
 * Check if a line is complete
 * @param {Object} item - mark object
 * */
const completeFromTo = (item) => item && completeMark.point(item.from) && completeMark.point(item.to);

/*
 * Check if a point is correct and complete
 * @param {Object} point - point object
 * */
const completePoint = (point) => point && Number.isFinite(point.x) && Number.isFinite(point.y);

/*
 * Complete mark object for line and point
 * */
const completeMark = {
  line: completeFromTo,
  point: completePoint,
};

//////////////////////////////////////////////////////////////////////////////////
// BELOW FUNCTIONS ARE USED IN author/utils as well
//////////////////////////////////////////////////////////////////////////////////

// Coordinates are compared at three decimals, matching how section vertices are stored
const TOLERANCE = 1e-3;

const round = (value) => Number(value.toFixed(3));

/*
 * Signed side of a point relative to a line mark: positive on one side, negative on the other, 0 on the line
 * @param {Object} mark - line mark
 * @param {Object} point - point object
 * */
const sideOfLine = (mark, point) =>
  (mark.to.x - mark.from.x) * (point.y - mark.from.y) - (mark.to.y - mark.from.y) * (point.x - mark.from.x);

/*
 * Clip a convex polygon to one side of a line (Sutherland-Hodgman); vertices on the line belong to both sides
 * @param {Array} polygon - polygon points array
 * @param {Object} mark - line mark
 * @param {Number} sign - 1 or -1, the side to keep
 * */
const clipToSideOfLine = (polygon, mark, sign) => {
  const clipped = [];
  polygon.forEach((current, i) => {
    const next = polygon[(i + 1) % polygon.length];
    const currentSide = sign * sideOfLine(mark, current);
    const nextSide = sign * sideOfLine(mark, next);
    if (currentSide >= 0) {
      clipped.push(current);
    }
    if ((currentSide > 0 && nextSide < 0) || (currentSide < 0 && nextSide > 0)) {
      const t = currentSide / (currentSide - nextSide);
      clipped.push({ x: current.x + t * (next.x - current.x), y: current.y + t * (next.y - current.y) });
    }
  });
  return clipped;
};

const removeDuplicatePoints = (points) =>
  points.filter((point, index) => index === points.findIndex((o) => o.x === point.x && o.y === point.y));

const polygonArea = (points) =>
  Math.abs(
    points.reduce((sum, point, i) => {
      const next = points[(i + 1) % points.length];
      return sum + point.x * next.y - next.x * point.y;
    }, 0),
  ) / 2;

/*
 * Function to find sections in solution set: the graph rectangle split by each line, keeping the non-empty parts.
 * A line through a grid corner, or two parallel lines, yields fewer sections, never a section covering the whole grid.
 * @param {Object} gssLineData - graphing solution set line data
 * @param {Array} answers - answers array
 * @param {Object} domain - domain object
 * @param {Object} range - range object
 * */
export const findSectionsInSolutionSet = (gssLineData, answers, domain, range) => {
  const graph = [
    { x: domain.min, y: range.max },
    { x: domain.max, y: range.max },
    { x: domain.max, y: range.min },
    { x: domain.min, y: range.min },
  ];
  const lines = answers.slice(0, gssLineData.numberOfLines === 1 ? 1 : 2);
  const sections = lines.reduce(
    (parts, mark) => parts.flatMap((part) => [clipToSideOfLine(part, mark, 1), clipToSideOfLine(part, mark, -1)]),
    [graph],
  );
  gssLineData.sections = sections
    .map((section) => removeDuplicatePoints(section.map(({ x, y }) => ({ x: round(x), y: round(y) }))))
    .filter((section) => section.length > 2 && polygonArea(section) > TOLERANCE);
  return gssLineData;
};

/*
 * Check if a point lies on a segment
 * @param {Object} point - point object
 * @param {Object} a - segment start
 * @param {Object} b - segment end
 * */
const pointOnSegment = (point, a, b) => {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const distanceToLine = Math.abs((b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)) / (length || 1);
  return (
    distanceToLine <= TOLERANCE &&
    point.x >= Math.min(a.x, b.x) - TOLERANCE &&
    point.x <= Math.max(a.x, b.x) + TOLERANCE &&
    point.y >= Math.min(a.y, b.y) - TOLERANCE &&
    point.y <= Math.max(a.y, b.y) + TOLERANCE
  );
};

/*
 * Function to check if a point is inside a polygon or on its boundary
 * @param {Object} point - point to be checked
 * @param {Array} polygon - polygon points array
 * */
export const pointInsidePolygon = (point, polygon) => {
  const { x, y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (pointOnSegment(point, a, b)) {
      return true;
    }
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
};

/*
 * Function to find the section a click selects. The unsnapped position decides, so a click that snaps onto a
 * boundary keeps the side it was made on; the snapped point covers clicks outside the grid and on a line mark.
 * @param {Array} sections - sections array
 * @param {Object} point - snapped point
 * @param {Object} rawPoint - unsnapped point, when known
 * */
export const findSelectedSection = (sections, point, rawPoint) =>
  (rawPoint && sections.find((section) => pointInsidePolygon(rawPoint, section))) ||
  sections.find((section) => pointInsidePolygon(point, section));

/*
 * Function to check if lines are added in the graph
 * @param {Object} gssLineData - graphing solution set line data
 * @param {Array} answer - answer array
 * */
export const checkIfLinesAreAdded = (gssLineData, answer) => {
  if (answer.length === 0) {
    return false;
  }
  if (gssLineData.numberOfLines === 1) {
    if (answer.length === 1) {
      return !answer[0].building;
    }
  } else {
    if (answer.length !== 2) {
      return false;
    } else {
      return !answer[1].building;
    }
  }
};

/*
 * Function to remove invalid answers
 * @param {Array} answers - answers array
 * */
export const removeInvalidAnswers = (answers) =>
  answers
    ? (answers || []).filter(({ type, ...answer }) => (completeMark[type] ? completeMark[type](answer) : false))
    : [];
