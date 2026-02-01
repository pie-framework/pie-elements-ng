// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/tools/shared/point/arrow.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { types } from '@pie-lib/plot';
import { ArrowHead } from '../arrow-head';
import { thinnerShapesNeeded } from '../../../utils';

export default class Arrow extends React.Component {
  static propTypes = {
    classes: PropTypes.object,
    className: PropTypes.string,
    correctness: PropTypes.string,
    disabled: PropTypes.bool,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    angle: PropTypes.number.isRequired,
    graphProps: types.GraphPropsType.isRequired,
  };

  render() {
    const { classes, angle, className, x, y, disabled, correctness, graphProps, ...rest } = this.props;

    const size = thinnerShapesNeeded(graphProps) ? 12 : 14;
    const { scale } = graphProps;

    const scaledX = scale.x(x);
    const scaledY = scale.y(y);

    const transform = `rotate(${-angle}, ${scaledX},${scaledY})`;
    const points = `${scaledX},${scaledY}
        ${scaledX - size},${scaledY - size / 2}
        ${scaledX - size}, ${scaledY + size / 2}`;

    return (
      <g className={classNames(classes.point, disabled && classes.disabled, classes[correctness], className)} {...rest}>
        <ArrowHead size={size} transform={transform} points={points} />
      </g>
    );
  }
}
