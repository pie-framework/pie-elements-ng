// @ts-nocheck
/**
 * @synced-from pie-lib/packages/tools/src/protractor/index.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import Graphic from './graphic';
import Anchor from '../anchor';
import Rotatable from '../rotatable';

const StyledProtractor: any = styled('div')(() => ({
  position: 'relative',
}));

const StyledLeftAnchor: any = styled(Anchor)(() => ({
  position: 'absolute',
  left: 0,
  bottom: 0,
}));

const StyledRightAnchor: any = styled(Anchor)(() => ({
  position: 'absolute',
  right: 0,
  bottom: 0,
}));

export class Protractor extends React.Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    className: PropTypes.string,
    startPosition: PropTypes.shape({
      left: PropTypes.number,
      top: PropTypes.number,
    }),
  };

  static defaultProps = {
    width: 450,
    startPosition: { left: 0, top: 0 },
  };

  render() {
    const { width, startPosition } = this.props;

    return (
      <Rotatable
        startPosition={startPosition}
        handle={[
          {
            class: 'leftAnchor',
            origin: `${width * 0.495}px ${width * 0.49}px`,
          },
          {
            class: 'rightAnchor',
            origin: `${width * 0.495}px ${width * 0.49}px`,
          },
        ]}
      >
        <StyledProtractor style={{ width: `${width}px` }}>
          <Graphic />

          <StyledLeftAnchor className="leftAnchor" />
          <StyledRightAnchor className="rightAnchor" />
        </StyledProtractor>
      </Rotatable>
    );
  }
}

export default Protractor;
