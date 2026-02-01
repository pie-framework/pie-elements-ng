// @ts-nocheck
/**
 * @synced-from pie-elements/packages/matrix/configure/src/MatrixLabelTypeHeaderInput.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';

import { MATRIX_LABEL_TYPE } from './matrixEntities';
import { ColumnsWrapper, ColumnsHeader } from './HeaderCommon';
import columnLabelsGenerator from './columnLabelsGenerator';
import PropTypes from 'prop-types';
import { color } from '@pie-lib/render-ui';

const Flex: any = styled('div')({
  display: 'flex',
});

const StyledRadio: any = styled(Radio)({
  '&.MuiRadio-root': {
    color: `${color.tertiary()} !important`,
  },
});

const MatrixLabelTypeHeaderInput = ({ model, onChangeModel }) => {
  const onChangeLabelType = (e) => {
    const labelType = e.target.value;
    const modelNew = { ...model, labelType };
    if (labelType !== MATRIX_LABEL_TYPE.custom) {
      modelNew.columnLabels = columnLabelsGenerator(labelType, model.columnLabels.length);
    }
    onChangeModel(modelNew);
  };
  const isMatrixTypeSelectionEnabled = [3, 5, 7].includes(model.columnLabels.length);
  return (
    <ColumnsWrapper>
      <ColumnsHeader>Matrix Type</ColumnsHeader>

      <Flex>
        <RadioGroup
          aria-label="matrixLabelType"
          name="matrixLabelType"
          value={model.labelType}
          onChange={onChangeLabelType}
        >
          <FormControlLabel
            disabled={!isMatrixTypeSelectionEnabled}
            value={MATRIX_LABEL_TYPE.agreement}
            control={<StyledRadio />}
            label="Agreement"
          />
          <FormControlLabel
            disabled={!isMatrixTypeSelectionEnabled}
            value={MATRIX_LABEL_TYPE.frequency}
            control={<StyledRadio />}
            label="Frequency"
          />
          <FormControlLabel
            disabled={!isMatrixTypeSelectionEnabled}
            value={MATRIX_LABEL_TYPE.yesNo}
            control={<StyledRadio />}
            label="Yes/No"
          />
        </RadioGroup>

        <RadioGroup
          aria-label="matrixLabelType"
          name="matrixLabelType"
          value={model.labelType}
          onChange={onChangeLabelType}
        >
          <FormControlLabel
            disabled={!isMatrixTypeSelectionEnabled}
            value={MATRIX_LABEL_TYPE.importance}
            control={<StyledRadio />}
            label="Importance"
          />
          <FormControlLabel
            disabled={!isMatrixTypeSelectionEnabled}
            value={MATRIX_LABEL_TYPE.likelihood}
            control={<StyledRadio />}
            label="Likelihood"
          />
          <FormControlLabel
            disabled={!isMatrixTypeSelectionEnabled}
            value={MATRIX_LABEL_TYPE.like}
            control={<StyledRadio />}
            label="Like"
          />
        </RadioGroup>

        <RadioGroup
          aria-label="matrixLabelType"
          name="matrixLabelType"
          value={model.labelType}
          onChange={onChangeLabelType}
        >
          <FormControlLabel
            value={MATRIX_LABEL_TYPE.custom}
            control={<StyledRadio />}
            label="Custom"
          />
        </RadioGroup>
      </Flex>
    </ColumnsWrapper>
  );
};

MatrixLabelTypeHeaderInput.propTypes = {
  model: PropTypes.object.isRequired,
  onChangeModel: PropTypes.func.isRequired,
};

export default MatrixLabelTypeHeaderInput;
