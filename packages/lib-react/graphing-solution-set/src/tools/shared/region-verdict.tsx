// @ts-nocheck

import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { types } from '@pie-lib/plot';
import { dynamicMessageKey } from '@pie-element/shared-i18n';
import { catalogs } from '../../i18n/index.js';
import { correct, incorrect, missing } from './styles.js';
import CorrectSVG from './icons/CorrectSVG.js';
import IncorrectSVG from './icons/IncorrectSVG.js';
import MissingSVG from './icons/MissingSVG.js';

const verdicts = {
  correct: { Icon: CorrectSVG, paint: correct },
  incorrect: { Icon: IncorrectSVG, paint: incorrect },
  missing: { Icon: MissingSVG, paint: missing },
};

/** The mean of a region's vertices, which lies inside it, since regions are convex. */
const centre = (points) => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
});

/**
 * The icon an evaluated shaded region wears at its centre, the same disc and glyph a line's ends wear, so the
 * verdict never rests on the tint alone.
 */
const RegionVerdict = ({ points, correctness, graphProps, language }) => {
  // Re-renders once the language's catalog lands, for an element that did not preload it.
  const [, relabel] = useReducer((n) => n + 1, 0);
  const verdict = verdicts[correctness];
  if (!verdict || !points || !points.length) {
    return null;
  }
  const { scale } = graphProps;
  const { x, y } = centre(points);
  const label = catalogs.forLocale(language, relabel).t(dynamicMessageKey(`regionVerdict.${correctness}`));

  return (
    <g role="img" aria-label={label} style={{ pointerEvents: 'none' }}>
      <title>{label}</title>
      <circle cx={scale.x(x)} cy={scale.y(y)} r={9} style={verdict.paint('fill')} />
      <verdict.Icon scale={scale} x={x} y={y} />
    </g>
  );
};

RegionVerdict.propTypes = {
  points: PropTypes.arrayOf(types.PointType),
  correctness: PropTypes.string,
  graphProps: types.GraphPropsType.isRequired,
  language: PropTypes.string,
};

export default RegionVerdict;
