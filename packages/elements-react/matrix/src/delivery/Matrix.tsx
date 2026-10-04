// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import ChoiceInput from './ChoiceInput.js';
import { color, Collapsible as CollapsibleImport, PreviewPrompt as PreviewPromptImport, useUniqueId } from '@pie-lib/render-ui';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt') || unwrapReactInteropSymbol(renderUi.PreviewPrompt, 'PreviewPrompt');
const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible') || unwrapReactInteropSymbol(renderUi.Collapsible, 'Collapsible');
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
const MatrixWrapper = styled.div`
  color: ${color.text()};
  background-color: ${color.background()};
  font-family: Roboto, Arial, Helvetica, sans-serif;
`;

const MatrixGridWrapper = styled.div`
  display: grid;
  grid-template-columns: ${(props) => props.gridTemplateColumns};
  grid-column-gap: 30px;
  grid-row-gap: 20px;
  margin-top: 20px;
`;

const TeacherInstructions: any = styled(Collapsible)`
  margin-bottom: 16px;
`;

const MatrixGridItem = styled.div`
  align-self: center;
  justify-self: center;
  white-space: nowrap;
`;

const Matrix = (props) => {
  const { disabled, prompt, onSessionChange, columnLabels, matrixValues, rowLabels, session, teacherInstructions } =
    props;

  // The row and column labels are plain grid cells, so each radio references them by id for its name.
  const idPrefix = useUniqueId('matrix');
  const rowLabelId = (rowIndex) => `${idPrefix}-row-${rowIndex}`;
  const columnLabelId = (columnIndex) => `${idPrefix}-column-${columnIndex}`;
  const gridMatrixItems = [];

  for (let rowIndex = 0; rowIndex < rowLabels.length + 1; rowIndex++) {
    for (let columnIndex = 0; columnIndex < columnLabels.length + 1; columnIndex++) {
      let gridMatrixItem;
      let labelId;

      if (rowIndex === 0 && columnIndex === 0) {
        gridMatrixItem = null;
      } else if (rowIndex === 0) {
        gridMatrixItem = columnLabels[columnIndex - 1];
        labelId = columnLabelId(columnIndex - 1);
      } else if (columnIndex === 0) {
        gridMatrixItem = rowLabels[rowIndex - 1];
        labelId = rowLabelId(rowIndex - 1);
      } else {
        const matrixKey = `${rowIndex - 1}-${columnIndex - 1}`;
        const matrixValue = matrixValues[matrixKey];

        gridMatrixItem = (
          <ChoiceInput
            matrixKey={matrixKey}
            matrixValue={matrixValue || 0}
            disabled={disabled}
            labelledBy={`${rowLabelId(rowIndex - 1)} ${columnLabelId(columnIndex - 1)}`}
            onChange={onSessionChange}
            checked={session.value && Object.prototype.hasOwnProperty.call(session.value, matrixKey)}
          />
        );
      }

      gridMatrixItems.push({ gridMatrixItem, labelId });
    }
  }
  const gridTemplateColumns = [...columnLabels, {}].map(() => 'min-content').join(' ');

  return (
    <MatrixWrapper>
      {teacherInstructions && (
        <TeacherInstructions
          className={teacherInstructions}
          labels={{
            hidden: 'Show Teacher Instructions',
            visible: 'Hide Teacher Instructions',
          }}
        >
          <PreviewPrompt prompt={teacherInstructions} />
        </TeacherInstructions>
      )}

      <PreviewPrompt className="prompt" prompt={prompt} />

      <MatrixGridWrapper gridTemplateColumns={gridTemplateColumns}>
        {gridMatrixItems.map(({ gridMatrixItem, labelId }, gridMatrixIndex) => {
          return (
            <MatrixGridItem key={`${gridMatrixIndex}`} id={labelId}>
              {gridMatrixItem}
            </MatrixGridItem>
          );
        })}
      </MatrixGridWrapper>
    </MatrixWrapper>
  );
};

Matrix.propTypes = {
  prompt: PropTypes.string,
  teacherInstructions: PropTypes.string,
  session: PropTypes.object,
  matrixValues: PropTypes.object,
  rowLabels: PropTypes.arrayOf(PropTypes.string),
  columnLabels: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool.isRequired,
  onSessionChange: PropTypes.func.isRequired,
};

Matrix.defaultProps = {
  session: {
    value: {},
  },
};

export default Matrix;
