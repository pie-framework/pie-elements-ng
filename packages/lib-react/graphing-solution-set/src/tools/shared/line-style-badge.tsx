// @ts-nocheck

import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { types } from '@pie-lib/plot';
import { color } from '@pie-lib/render-ui';
import { dynamicMessageKey } from '@pie-element/shared-i18n';
import { catalogs } from '../../i18n/index.js';

const WIDTH = 78;
const HEIGHT = 24;
// Clear of the line, so the badge never hides the stroke it speaks for
const LIFT = 18;

const styleKey = (fill) => (fill === 'Dashed' ? 'dashed' : 'solid');

/** A short sample of a line style, for the badge and the key. */
export const StyleSample = ({ x, y, dashed }) => (
  <line
    x1={x}
    y1={y}
    x2={x + 21}
    y2={y}
    stroke={color.defaults.BLACK}
    strokeWidth={3}
    strokeDasharray={dashed ? '3,3' : undefined}
  />
);

/**
 * Whether a line's solid or dashed style is right, apart from where it lies. The line's colour and icons already
 * say whether it lies in the right place, so this badge looks nothing like them: a neutral pill, never green or red,
 * that sets the style the student drew beside the style the key has, joined by `=` when they match and `≠` when
 * they do not. A mismatch also takes a heavier outline, so the two never differ by a glyph alone.
 */
const LineStyleBadge = ({ graphProps, from, to, lineStyle, fill, expectedFill, language }) => {
  // Re-renders once the language's catalog lands, for an element that did not preload it.
  const [, relabel] = useReducer((n) => n + 1, 0);
  const i18n = catalogs.forLocale(language, relabel);
  const { scale } = graphProps;
  const right = lineStyle === 'correct';
  const drawn = i18n.t(dynamicMessageKey(styleKey(fill)));
  const label = right
    ? i18n.t('lineStyleCorrect', { style: drawn })
    : i18n.t('lineStyleIncorrect', { drawn, expected: i18n.t(dynamicMessageKey(styleKey(expectedFill))) });
  const cx = (scale.x(from.x) + scale.x(to.x)) / 2;
  const cy = (scale.y(from.y) + scale.y(to.y)) / 2 - LIFT;

  return (
    <g
      role="img"
      aria-label={label}
      transform={`translate(${cx - WIDTH / 2} ${cy - HEIGHT / 2})`}
      style={{ pointerEvents: 'none' }}
    >
      <title>{label}</title>
      <rect
        width={WIDTH}
        height={HEIGHT}
        rx={HEIGHT / 2}
        fill="white"
        stroke={color.defaults.PRIMARY_DARK}
        strokeWidth={right ? 1.5 : 3}
      />
      <StyleSample x={7} y={HEIGHT / 2} dashed={fill === 'Dashed'} />
      <text x={WIDTH / 2} y={HEIGHT / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={color.defaults.PRIMARY_DARK}>
        {right ? '=' : '≠'}
      </text>
      <StyleSample x={WIDTH - 28} y={HEIGHT / 2} dashed={(right ? fill : expectedFill) === 'Dashed'} />
    </g>
  );
};

LineStyleBadge.propTypes = {
  graphProps: types.GraphPropsType.isRequired,
  from: types.PointType,
  to: types.PointType,
  lineStyle: PropTypes.oneOf(['correct', 'incorrect']),
  fill: PropTypes.string,
  expectedFill: PropTypes.string,
  language: PropTypes.string,
};

export default LineStyleBadge;
