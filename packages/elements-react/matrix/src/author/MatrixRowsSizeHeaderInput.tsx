// @ts-nocheck
/**
 * @synced-from pie-elements/packages/matrix/configure/src/MatrixRowsSizeHeaderInput.jsx
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
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import { ColumnsHeader, ColumnsWrapper, IconWrapper, NumberInputFormGroupWrapper } from './HeaderCommon';
import { MATRIX_LABEL_TYPE } from './matrixEntities';
import PropTypes from 'prop-types';

const MatrixColumnsRowInput = ({ model, onChangeModel }) => {
  const onIncrementSize = () => {
    onChangeModel({
      ...model,
      rowLabels: [...model.rowLabels, `STATEMENT ${model.rowLabels.length + 1}`],
      labelType: MATRIX_LABEL_TYPE.custom,
    });
  };

  const onDecrementSize = () => {
    const rowLabelsLength = model.rowLabels.length;
    if (rowLabelsLength <= 1) {
      return;
    }
    const rowLabelsNext = [...model.rowLabels];
    rowLabelsNext.pop();
    const matrixValuesClone = { ...model.matrixValues };
    model.columnLabels.forEach((columnLabel, columnIndex) => {
      delete matrixValuesClone[`${rowLabelsLength - 1}-${columnIndex}`];
    });
    onChangeModel({
      ...model,
      rowLabels: rowLabelsNext,
      matrixValues: matrixValuesClone,
      labelType: MATRIX_LABEL_TYPE.custom,
    });
  };

  return (
    <ColumnsWrapper>
      <ColumnsHeader>Matrix Rows</ColumnsHeader>
      <NumberInputFormGroupWrapper>
        <IconWrapper>
          <RemoveIcon onClick={onDecrementSize} />
        </IconWrapper>
        <p>{model.rowLabels.length}</p>
        <IconWrapper>
          <AddIcon onClick={onIncrementSize} />
        </IconWrapper>
      </NumberInputFormGroupWrapper>
    </ColumnsWrapper>
  );
};

MatrixColumnsRowInput.propTypes = {
  model: PropTypes.object.isRequired,
  onChangeModel: PropTypes.func.isRequired,
};

export default MatrixColumnsRowInput;
