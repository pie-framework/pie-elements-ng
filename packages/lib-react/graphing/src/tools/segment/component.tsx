// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/segment/component.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { lineToolComponent, lineBase, styles } from '../shared/line';
import React from 'react';
import PropTypes from 'prop-types';
import { types } from '@pie-lib/plot';
import { styled } from '@mui/material/styles';

const StyledLineRoot: any = styled('line')(({ theme, disabled, correctness }) => ({
  ...styles.line(theme),
  ...(disabled && {
    ...styles.disabled(theme),
    ...styles.disabledSecondary(theme),
  }),
  ...(correctness === 'correct' && styles.correct(theme, 'stroke')),
  ...(correctness === 'incorrect' && styles.incorrect(theme, 'stroke')),
  ...(correctness === 'missing' && styles.missing(theme, 'stroke')),
}));

export const Line = (props) => {
  const { className, correctness, disabled, graphProps, from, to, ...rest } = props;
  const { scale } = graphProps;

  return (
    <StyledLineRoot
      stroke="green"
      strokeWidth={6}
      x1={scale.x(from.x)}
      y1={scale.y(from.y)}
      x2={scale.x(to.x)}
      y2={scale.y(to.y)}
      className={className}
      disabled={disabled}
      correctness={correctness}
      {...rest}
    />
  );
};

Line.propTypes = {
  className: PropTypes.string,
  correctness: PropTypes.string,
  disabled: PropTypes.bool,
  graphProps: PropTypes.any,
  from: types.PointType,
  to: types.PointType,
};

const Segment = lineBase(Line);
const Component = lineToolComponent(Segment);

export default Component;
