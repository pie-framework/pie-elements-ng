// @ts-nocheck
/**
 * @synced-from pie-elements/packages/likert/src/choice-input.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

import { color } from '@pie-lib/render-ui';
import Radio from '@mui/material/Radio';
import { LIKERT_ORIENTATION } from './likertEntities';

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
          control={<RadioStyled checked={checked} onChange={this.onToggleChoice} disabled={disabled} />}
        />
        <LabelRoot onClick={this.onToggleChoice} dangerouslySetInnerHTML={{ __html: label }} />
      </CheckboxHolderRoot>
    );
  }
}

export default ChoiceInput;
