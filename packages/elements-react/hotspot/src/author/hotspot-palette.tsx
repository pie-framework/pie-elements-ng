// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/configure/src/hotspot-palette.jsx
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
import { InputContainer } from '@pie-lib/config-ui';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';

const BaseContainer: any = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: 'flex',
}));

const StyledInputContainer: any = styled(InputContainer)({
  flex: 1,
  width: '90%',
});

const StyledMenuItem: any = styled(MenuItem)(({ theme }) => ({
  borderRadius: '2px',
  height: '22px',
  marginLeft: theme.spacing(2),
  marginRight: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

class Palette extends React.Component {
  onChange = (name) => (event) => {
    const { value } = event.target;
    const { onHotspotColorChange, onOutlineColorChange } = this.props;

    if (name === 'hotspot') {
      onHotspotColorChange(value);
    } else {
      onOutlineColorChange(value);
    }
  };

  render() {
    const { hotspotColor, outlineColor, hotspotList, outlineList } = this.props;

    return (
      <BaseContainer>
        <StyledInputContainer label="Hot Spot">
          <Select 
            onChange={this.onChange('hotspot')} 
            value={hotspotColor}
            variant='standard'
            MenuProps={{ transitionDuration: { enter: 225, exit: 195 } }}
            >
            {hotspotList.map((hotspot) => (
              <StyledMenuItem key={hotspot} value={hotspot} style={{ backgroundColor: hotspot }}>
                {hotspot}
              </StyledMenuItem>
            ))}
          </Select>
        </StyledInputContainer>

        <StyledInputContainer label="Response Outline">
          <Select 
            onChange={this.onChange('outline')} 
            value={outlineColor} 
            variant='standard'
            MenuProps={{ transitionDuration: { enter: 225, exit: 195 } }}
          >
            {outlineList.map((outline) => (
              <StyledMenuItem
                key={outline}
                value={outline}
                style={{ border: `2px solid ${outline}` }}
              >
                {outline}
              </StyledMenuItem>
            ))}
          </Select>
        </StyledInputContainer>
      </BaseContainer>
    );
  }
}

Palette.propTypes = {
  hotspotColor: PropTypes.string.isRequired,
  hotspotList: PropTypes.array.isRequired,
  onHotspotColorChange: PropTypes.func.isRequired,
  onOutlineColorChange: PropTypes.func.isRequired,
  outlineColor: PropTypes.string.isRequired,
  outlineList: PropTypes.array.isRequired,
};

export default Palette;
