// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/configure/src/arrows.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { InputCheckbox } from '@pie-lib/config-ui';

const FlexRow: any = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
});

const ArrowsContainer: any = styled('div')(({ theme }) => ({
  paddingTop: theme.spacing(2),
  display: 'flex',
  gap: theme.spacing(2),
  alignItems: 'center',
  '& > *': {
    flexShrink: 0,
  },
  '& label': {
    whiteSpace: 'nowrap',
    overflow: 'visible',
    textOverflow: 'clip',
  },
  '& .MuiFormControlLabel-root': {
    margin: 0,
    marginRight: 0,
  },
  '& .MuiFormControlLabel-label': {
    whiteSpace: 'nowrap',
    overflow: 'visible',
    textOverflow: 'clip',
    maxWidth: 'none',
    width: 'auto',
    flexShrink: 0,
  },
}));

export class Arrows extends React.Component {
  static propTypes = {
    arrows: PropTypes.shape({ left: PropTypes.bool, right: PropTypes.bool }).isRequired,
    onChange: PropTypes.func,
  };
  static defaultProps = {
    arrows: { left: true, right: true },
  };

  constructor(props) {
    super(props);

    this.change = (key, event, value) => {
      const update = { ...this.props.arrows, [key]: value };
      this.props.onChange(update);
    };
    this.changeLeft = this.change.bind(this, 'left');
    this.changeRight = this.change.bind(this, 'right');
  }

  render() {
    const { arrows } = this.props;
    return (
      <FlexRow>
        <label>Arrows</label>
        <ArrowsContainer>
          <InputCheckbox label={'Left'} checked={arrows.left} onChange={this.changeLeft} />
          <InputCheckbox
            label={'Right'}
            checked={arrows.right}
            onChange={this.changeRight}
          />
        </ArrowsContainer>
      </FlexRow>
    );
  }
}

export default Arrows;
