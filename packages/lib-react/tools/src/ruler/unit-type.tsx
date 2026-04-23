// @ts-nocheck
/**
 * @synced-from pie-lib/packages/tools/src/ruler/unit-type.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { noSelect, strokeColor } from '../style-utils.js';
import { styled } from '@mui/material/styles';

const StyledText: any = styled('text')(({ theme }) => ({
  ...noSelect(),
  fill: strokeColor(theme),
}));

export const UnitType = (props) => {
  const { label, x, y, textAlign, fill, fontSize, stroke } = props;

  return (
    <StyledText x={x} y={y} textAnchor={textAlign} stroke={stroke} fill={fill} fontSize={fontSize}>
      {label}
    </StyledText>
  );
};

UnitType.propTypes = {
  label: PropTypes.string.isRequired,
  x: PropTypes.number,
  y: PropTypes.number,
  textAlign: PropTypes.string,
  fill: PropTypes.string,
  fontSize: PropTypes.number,
  stroke: PropTypes.string,
};

UnitType.defaultProps = {
  textAnchor: 'start',
  fontSize: 11,
  stroke: 'none',
  x: 8,
  y: 14,
};

export default UnitType;
