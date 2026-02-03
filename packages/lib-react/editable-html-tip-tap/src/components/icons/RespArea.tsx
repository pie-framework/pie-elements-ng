// @ts-nocheck
/**
 * @synced-from pie-lib/packages/editable-html-tip-tap/src/components/icons/RespArea.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ChevronRight from '@mui/icons-material/ChevronRight';
import MoreVert from '@mui/icons-material/MoreVert';
import { styled } from '@mui/material/styles';

const getRotate = (direction) => {
  switch (direction) {
    case 'down':
      return 90;

    case 'up':
      return -90;

    case 'left':
      return 180;

    default:
      return 0;
  }
};

export const Chevron = (props) => {
  const { direction, style } = props;
  const rotate = getRotate(direction);

  return (
    <ChevronRight
      style={{
        transform: `rotate(${rotate}deg)`,
        ...style,
      }}
    />
  );
};

Chevron.propTypes = {
  direction: PropTypes.string,
  style: PropTypes.object,
};

export const GripIcon = ({ style }) => {
  return (
    <span style={style}>
      <MoreVert
        style={{
          margin: '0 -16px',
        }}
      />
      <MoreVert />
    </span>
  );
};

GripIcon.propTypes = {
  style: PropTypes.object,
};

const StyledToolbarIcon: any = styled('div')(({ theme }) => ({
  fontFamily: 'Cerebri Sans !important',
  fontSize: theme.typography.fontSize,
  fontWeight: 'bold',
  lineHeight: '14px',
  position: 'relative',
  top: '7px',
  width: '110px',
  height: '28px',
  whiteSpace: 'nowrap',
}));

export const ToolbarIcon = () => <StyledToolbarIcon>+ Response Area</StyledToolbarIcon>;
