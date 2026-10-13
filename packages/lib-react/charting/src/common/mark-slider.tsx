import React from 'react';
import { styled } from '@mui/material/styles';
import { keyboard } from '@pie-lib/plot';
import { color } from '@pie-lib/render-ui';
import Translator from '@pie-lib/translator';

import { textOf } from '../utils.js';

const { translator } = Translator;

type SliderGraphProps = {
  range: { min: number; max: number; step?: number; labelStep?: number };
  snap: { y: (value: number) => number };
};

export type FocusBox = { x: number; y: number; width: number; height: number };

export type MarkSliderProps = Omit<React.SVGProps<SVGGElement>, 'onChange' | 'ref'> & {
  /** False for a read-only or disabled mark, which is no slider and takes no focus. */
  enabled: boolean;
  label?: string;
  index: number;
  value: number;
  graphProps: SliderGraphProps;
  language?: string;
  /** The box around the mark that the focus ring is drawn inside. */
  focusBox: FocusBox;
  /** The callback a drag of the mark commits through. */
  onChange: (value: number) => void;
};

// The ring shows on keyboard focus only. A focus-outline ring around one in the scheme background
// keeps it visible over a bar's fill and over the plane.
const StyledSlider = styled('g')({
  outline: 'none',
  '& > .focus-ring': { display: 'none', pointerEvents: 'none', fill: 'none', strokeWidth: 2 },
  '&:focus-visible > .focus-ring': { display: 'inline' },
  '& > .focus-ring > .outer': { stroke: color.focusOutline() },
  '& > .focus-ring > .inner': { stroke: color.v('pie')('background', color.defaults.WHITE) },
});

const isMultipleOf = (value: number, step: number): boolean =>
  Math.abs(value / step - Math.round(value / step)) < 1e-9;

// The labelled ticks are the natural Page Up and Page Down step when they lie several steps apart.
const largeStepOf = (step: number, labelStep?: number): number | undefined =>
  labelStep && labelStep > step && isMultipleOf(labelStep, step) ? labelStep : undefined;

const FocusRing = ({ x, y, width, height }: FocusBox) => (
  <g className="focus-ring">
    <rect className="outer" x={x + 1} y={y + 1} width={Math.max(0, width - 2)} height={Math.max(0, height - 2)} />
    <rect className="inner" x={x + 3} y={y + 3} width={Math.max(0, width - 6)} height={Math.max(0, height - 6)} />
  </g>
);

/**
 * The group a chart mark is drawn in. An enabled mark is an APG slider over the value axis, named
 * by its category: a key moves its value by the step a drag snaps to and commits it through
 * `onChange`. Other props go to the group.
 */
export const MarkSlider = React.forwardRef<SVGGElement, MarkSliderProps>(
  ({ enabled, label, index, value, graphProps, language, focusBox, onChange, children, ...rest }, ref) => {
    if (!enabled) {
      return (
        <g ref={ref} {...rest}>
          {children}
        </g>
      );
    }

    const { range, snap } = graphProps;
    const step = range.step || 1;
    const slider = {
      min: range.min,
      max: range.max,
      step,
      largeStep: largeStepOf(step, range.labelStep),
      snap: snap.y,
    };
    const min = keyboard.fitToRange(range.min, slider);
    const max = keyboard.fitToRange(range.max, slider);
    const now = Number.isFinite(value) ? value : min;
    const name = textOf(label) || translator.t('charting.category', { lng: language, index: index + 1 });

    const onKeyDown = (event: React.KeyboardEvent<SVGGElement>) => {
      const next = keyboard.sliderKeyValue(event.key, now, slider);

      if (next === undefined) {
        return;
      }

      event.preventDefault();

      if (next !== now) {
        onChange(next);
      }
    };

    return (
      <StyledSlider
        ref={ref}
        {...rest}
        role="slider"
        tabIndex={0}
        aria-label={name}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={now}
        aria-orientation="vertical"
        onKeyDown={onKeyDown}
      >
        {children}
        <FocusRing {...focusBox} />
      </StyledSlider>
    );
  },
);

MarkSlider.displayName = 'MarkSlider';

export default MarkSlider;
