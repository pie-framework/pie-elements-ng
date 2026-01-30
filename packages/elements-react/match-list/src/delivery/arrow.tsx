// @ts-nocheck
/**
 * @synced-from pie-elements/packages/match-list/src/arrow.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ArrowHead from '@mui/icons-material/ArrowDropDown';
import { styled } from '@mui/material/styles';

const ArrowContainer: any = styled('div')({
  display: 'inline-block',
  position: 'relative',
  width: '100%',
});

const Line: any = styled('span')(({ theme, isRight }) => ({
  backgroundColor: theme.palette.grey[500],
  bottom: isRight ? 20 : 19,
  content: '""',
  display: 'block',
  height: 1,
  left: 20,
  position: 'absolute',
  width: '100%',
}));

export class Arrow extends React.Component {
  static propTypes = {
    direction: PropTypes.string,
  };

  render() {
    const { direction } = this.props;

    const extraStyle =
      direction === 'left'
        ? {}
        : {
            transform: 'rotate(180deg)',
          };

    return (
      <ArrowContainer style={extraStyle}>
        <ArrowHead
          style={{
            transform: 'rotate(90deg)',
            color: '#979797',
            fontSize: 40,
          }}
        />
        <Line isRight={direction !== 'left'} />
      </ArrowContainer>
    );
  }
}

export default Arrow;
