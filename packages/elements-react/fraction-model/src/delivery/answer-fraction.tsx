// @ts-nocheck

import React from 'react';
import { foldDigits } from '@pie-element/shared-controller-utils';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { TextField } from '@mui/material';
import { createUniqueId } from '@pie-lib/render-ui';

const GroupInline: any = styled('div')({
  alignItems: 'center',
  display: 'flex',
  gap: '20px',
});

const Group: any = styled('div')({
  margin: '12px 0',
});

const InputLabel: any = styled('label')({
  display: 'block',
  marginBottom: '4px',
});

const StyledTextField: any = styled(TextField)({
  width: '120px',
  maxHeight: '40px',
  '& [class^="MuiInputBase-root"]': {
    height: 40,
    fontSize: '14px',
  },
});

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export class AnswerFraction extends React.Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    disabled: PropTypes.bool.isRequired,
    showCorrect: PropTypes.bool.isRequired,
    onAnswerChange: PropTypes.func.isRequired,
    answers: PropTypes.object.isRequired,
  };

  idPrefix = createUniqueId('fraction-model');

  max = (key) => (key === 'noOfModel' ? this.props.model.maxModelSelected : 9);

  setAnswer = (key, value) => {
    const { onAnswerChange, answers } = this.props;
    onAnswerChange({ ...answers, [key]: value });
  };

  /**
   * Stores the typed count, clamped to 1 and the field's maximum; a field cleared of digits
   * stores `''`, the unanswered value.
   */
  onValueChange = (key) => (event) => {
    const value = parseInt(foldDigits(event?.target?.value ?? ''), 10);
    this.setAnswer(key, Number.isNaN(value) ? '' : clamp(value, 1, this.max(key)));
  };

  /** Up and Down step the count, as they did on the number input these fields replace. */
  onKeyDown = (key) => (event) => {
    const step = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const current = Number(this.props.answers[key]);
    this.setAnswer(key, current > 0 ? clamp(current + step, 1, this.max(key)) : 1);
  };

  /** Props a count field shares: a text spinbutton, since a number input drops native digits. */
  countInputProps = (key, value) => ({
    inputMode: 'numeric',
    role: 'spinbutton',
    'aria-valuemin': 1,
    'aria-valuemax': this.max(key),
    'aria-valuenow': Number(value) > 0 ? Number(value) : undefined,
  });

  render() {
    const { model, showCorrect, answers, disabled } = this.props;
    const noOfModel = showCorrect ? model.maxModelSelected : answers.noOfModel;
    const partsPerModel = showCorrect ? model.partsPerModel : answers.partsPerModel;

    return (
      <div>
        {model.allowedStudentConfig && (
          <GroupInline>
            <Group>
              <InputLabel htmlFor={`${this.idPrefix}-number-of-models`}>
                Number of Models
              </InputLabel>
              <StyledTextField
                id={`${this.idPrefix}-number-of-models`}
                inputProps={this.countInputProps('noOfModel', noOfModel)}
                name="preview_number-of-models"
                onChange={this.onValueChange('noOfModel')}
                onKeyDown={this.onKeyDown('noOfModel')}
                type="text"
                variant="outlined"
                disabled={disabled}
                value={noOfModel}
              />
            </Group>
            <Group>
              <InputLabel htmlFor={`${this.idPrefix}-parts-per-model`}>
                Parts per Model
              </InputLabel>
              <StyledTextField
                id={`${this.idPrefix}-parts-per-model`}
                inputProps={this.countInputProps('partsPerModel', partsPerModel)}
                name="preview_parts-per-model"
                onChange={this.onValueChange('partsPerModel')}
                onKeyDown={this.onKeyDown('partsPerModel')}
                type="text"
                variant="outlined"
                disabled={disabled}
                value={partsPerModel}
              />
            </Group>
          </GroupInline>
        )}
      </div>
    );
  }
}

export default AnswerFraction;
