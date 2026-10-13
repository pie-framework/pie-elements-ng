/**
 * Keyboard stepping for a mark that moves along one axis of the grid, as an APG slider moves.
 * The pointer drag in grid-draggable snaps with `graphProps.snap`; passing that same function as
 * `snap` makes a key land where a drag would.
 */
export type SliderRange = {
  min: number;
  max: number;
  step: number;
  /** The Page Up and Page Down step. Without it the slider leaves those keys to the page. */
  largeStep?: number;
  snap?: (value: number) => number;
};

const EPSILON = 1e-9;

// the four decimals grid-draggable's deltaFn keeps
const round = (value: number): number => Number(value.toFixed(4));

const clamp = (value: number, { min, max }: SliderRange): number => Math.min(max, Math.max(min, value));

/** `value` clamped to the range, snapped as a drag snaps, and clamped again. */
export const fitToRange = (value: number, range: SliderRange): number => {
  const clamped = clamp(value, range);
  return round(clamp(range.snap ? range.snap(clamped) : clamped, range));
};

// the nearest point of the grid `min + k * step` that lies beyond `value` in `direction`
const nextOnGrid = (value: number, min: number, step: number, direction: 1 | -1): number => {
  const steps = (value - min) / step;
  const index = direction > 0 ? Math.floor(steps + EPSILON) + 1 : Math.ceil(steps - EPSILON) - 1;
  return min + index * step;
};

// One step of `step` from `value` in `direction`. A snap onto a grid of its own can pull a step back
// to where it started, so the step goes on to the next grid point until the value moves or the
// candidate passes the end of the range.
const stepFrom = (value: number, step: number, direction: 1 | -1, range: SliderRange): number => {
  if (!(step > 0)) {
    return fitToRange(value, range);
  }

  const beyondEnd = (candidate: number) => (direction > 0 ? candidate >= range.max : candidate <= range.min);
  let candidate = nextOnGrid(value, range.min, step, direction);
  let next = fitToRange(candidate, range);

  while (direction * (next - value) <= EPSILON && !beyondEnd(candidate)) {
    candidate += direction * step;
    next = fitToRange(candidate, range);
  }

  return next;
};

/**
 * The value a key moves a slider to: ArrowUp and ArrowRight go one step up, ArrowDown and
 * ArrowLeft one step down, PageUp and PageDown one large step, and Home and End to the ends of the
 * range. Undefined for a key the slider does not handle.
 */
export const sliderKeyValue = (key: string, value: number, range: SliderRange): number | undefined => {
  const { min, max, step, largeStep } = range;
  const current = Number.isFinite(value) ? value : min;

  switch (key) {
    case 'ArrowUp':
    case 'ArrowRight':
      return stepFrom(current, step, 1, range);
    case 'ArrowDown':
    case 'ArrowLeft':
      return stepFrom(current, step, -1, range);
    case 'PageUp':
      return largeStep ? stepFrom(current, largeStep, 1, range) : undefined;
    case 'PageDown':
      return largeStep ? stepFrom(current, largeStep, -1, range) : undefined;
    case 'Home':
      return fitToRange(min, range);
    case 'End':
      return fitToRange(max, range);
    default:
      return undefined;
  }
};
