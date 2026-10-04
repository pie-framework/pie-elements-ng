// @ts-nocheck

import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

import { color, createUniqueId } from '@pie-lib/render-ui';
import Radio from '@mui/material/Radio';
import { LIKERT_ORIENTATION } from './likertEntities.js';

export const RadioStyled: any = styled(Radio)({
  color: `var(--choice-input-color, ${color.text()})`,
  '&.Mui-checked': {
    color: `var(--choice-input-selected-color, ${color.primary()})`,
  },
  '&.Mui-disabled': {
    color: `var(--choice-input-disabled-color, ${color.defaults.DISABLED})`,
  },
});

const LabelRoot: any = styled('p')({
  color: color.text(),
  textAlign: 'center',
  cursor: 'pointer',
});

const CheckboxHolderRoot: any = styled('div')({
  display: 'flex',
  alignItems: 'center',
  flex: 1,
  padding: '0 5px',
  '& label': {},
});

const StyledFormControlLabel: any = styled(FormControlLabel)({
  margin: 0,
});

export class ChoiceInput extends React.Component {
  static propTypes = {
    checked: PropTypes.bool.isRequired,
    disabled: PropTypes.bool.isRequired,
    label: PropTypes.string.isRequired,
    likertOrientation: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    value: PropTypes.number.isRequired,
  };

  static defaultProps = {
    checked: false,
  };

  // The visible label is a sibling of the radio, so the radio takes its name by reference.
  labelId: string = createUniqueId('likert-choice-label');

  onToggleChoice: any = () => {
    this.props.onChange({
      value: this.props.value,
      selected: !this.props.checked,
    });
  };

  render() {
    const { disabled, label, checked, likertOrientation } = this.props;
    const flexDirection = likertOrientation === LIKERT_ORIENTATION.vertical ? 'row' : 'column';

    return (
      <CheckboxHolderRoot style={{ flexDirection }}>
        <StyledFormControlLabel
          disabled={disabled}
          control={
            <RadioStyled
              checked={checked}
              onChange={this.onToggleChoice}
              disabled={disabled}
              slotProps={{ input: { 'aria-labelledby': this.labelId } }}
            />
          }
        />
        <LabelRoot id={this.labelId} onClick={this.onToggleChoice} dangerouslySetInnerHTML={{ __html: label }} />
      </CheckboxHolderRoot>
    );
  }
}

export default ChoiceInput;
