// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import Radio from '@mui/material/Radio';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import { color, createUniqueId } from '@pie-lib/render-ui';

const ControlsContainer: any = styled('div')(({ theme }) => ({
  marginLeft: 'auto',
  marginRight: 'auto',
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const Column: any = styled('td')({
  padding: '5px 0',
});

const EmptyTypography: any = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(2),
}));

const RowHeader: any = styled('th')({
  padding: 0,
});

const RowItem: any = styled('div')(({ theme, isQuestionText }) => ({
  padding: theme.spacing(1.5),
  textAlign: isQuestionText ? 'left' : 'center',
}));

const Separator: any = styled('tr')({
  border: 0,
  borderTop: `2.5px solid ${color.primaryLight()}`,
  width: '100%',
});

const Table: any = styled('table')({
  color: color.text(),
  backgroundColor: color.background(),
  borderCollapse: 'collapse',
  borderSpacing: 0,
  marginBottom: 0,
});

export class AnswerGrid extends React.Component {
  static propTypes = {
    correctAnswers: PropTypes.object,
    view: PropTypes.bool.isRequired,
    showCorrect: PropTypes.bool.isRequired,
    disabled: PropTypes.bool.isRequired,
    onAnswerChange: PropTypes.func.isRequired,
    choiceMode: PropTypes.string.isRequired,
    rows: PropTypes.array.isRequired,
    headers: PropTypes.array.isRequired,
    answers: PropTypes.object.isRequired,
  };

  // Ids that tie each control to its row title and column header, and each row group to its title.
  // The same prefix makes each row's radio name unique on the page, so a row is one tab stop.
  instanceId: string = createUniqueId('match-grid');

  onRowValueChange = (rowId, answerIndex) => (event) => {
    const { onAnswerChange, choiceMode, answers } = this.props;
    const newAnswers = { ...answers };

    if (choiceMode === 'radio') {
      for (let i = 0; i < newAnswers[rowId].length; i++) {
        newAnswers[rowId][i] = false;
      }
    }

    newAnswers[rowId][answerIndex] = event.target.checked;

    onAnswerChange(newAnswers);
  };

  answerIsCorrect: any = (rowId, rowValue, rowValueIndex) => {
    const { correctAnswers } = this.props;

    return correctAnswers[rowId][rowValueIndex] === rowValue && rowValue === true;
  };

  // needs a separate method because what isn't correct isn't necessarily incorrect
  answerIsIncorrect: any = (rowId, rowValue, rowValueIndex) => {
    const { correctAnswers } = this.props;

    return (
      (correctAnswers[rowId][rowValueIndex] === true && rowValue === false) ||
      (correctAnswers[rowId][rowValueIndex] === false && rowValue === true)
    );
  };

  // The colour the control paints in every state. Kept in one place because it has to
  // be applied to `.Mui-checked` and `.Mui-disabled` as well as the root.
  controlColor: any = (rowId, rowValue, rowValueIndex) => {
    const { showCorrect, disabled, view } = this.props;
    const evaluate = disabled && !view;

    if (
      (showCorrect && rowValue === true) ||
      (evaluate && this.answerIsCorrect(rowId, rowValue, rowValueIndex))
    ) {
      return color.correct();
    }

    if (evaluate && this.answerIsIncorrect(rowId, rowValue, rowValueIndex)) {
      return color.incorrect();
    }

    if (rowValue === true && !evaluate) {
      return color.primary();
    }

    return disabled ? color.disabled() : color.text();
  };

  render() {
    const { headers, rows, choiceMode, answers, disabled } = this.props;
    const Tag = choiceMode === 'radio' ? Radio : Checkbox;
    const headerId = (idx) => `${this.instanceId}-header-${idx}`;
    const rowTitleId = (idx) => `${this.instanceId}-row-${idx}`;
    const rowGroupName = (idx) => (choiceMode === 'radio' ? `${this.instanceId}-row-${idx}-choice` : undefined);

    if (!rows || rows.length === 0) {
      return (
        <ControlsContainer>
          <EmptyTypography component="div">
            There are currently no questions to show.
          </EmptyTypography>
        </ControlsContainer>
      );
    }

    return (
      <ControlsContainer>
        <Table>
          <colgroup>
            {(headers || []).map((header, idx) => (
              <col key={`col-${idx}`} />
            ))}
          </colgroup>

          <thead>
            <tr>
              {(headers || []).map((header, idx) => (
                <RowHeader key={`th-${idx}`} id={headerId(idx)} data-colno={`${idx}`} scope="col">
                  <RowItem
                    isQuestionText={idx === 0}
                    dangerouslySetInnerHTML={{ __html: header }}
                  />
                </RowHeader>
              ))}
            </tr>
          </thead>

          {(rows || []).map((row, idx) => (
            <tbody
              key={`row-${idx}`}
              role={choiceMode === 'radio' ? 'radiogroup' : 'group'}
              aria-labelledby={rowTitleId(idx)}
            >
              <Separator>
                <td key={`td-title-${idx}`} id={rowTitleId(idx)} data-colno={'0'}>
                  <RowItem
                    isQuestionText={true}
                    dangerouslySetInnerHTML={{ __html: row.title }}
                  />
                </td>

                {(answers[row.id] || []).map((rowItem, answerIndex) => {
                  const controlColor = this.controlColor(row.id, rowItem, answerIndex);

                  return (
                    <Column key={`td-${idx}-${answerIndex}`} data-colno={`${answerIndex + 1}`}>
                      <RowItem>
                        <Tag
                          sx={{
                            padding: '6px',
                            color: controlColor,
                            // MUI paints the checked state from `palette.primary.main` via
                            // `.MuiCheckbox-root.Mui-checked` / `.MuiRadio-root.Mui-checked`.
                            // That is two classes, so a bare `color` above loses to it and the
                            // control renders MUI's default blue under every PIE theme. `&&`
                            // matches the specificity so the token wins.
                            '&&.Mui-checked': {
                              color: controlColor,
                            },
                            '&&.Mui-disabled': {
                              color: controlColor,
                            },
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            pointerEvents: disabled ? 'initial' : 'auto',
                            opacity: disabled ? 0.7 : 1,
                            '& input': {
                              width: '100% !important',
                            },
                            '&&:hover:not(.Mui-disabled)': {
                              color: color.primaryLight(),
                            },
                          }}
                          slotProps={{
                            input: { 'aria-labelledby': `${rowTitleId(idx)} ${headerId(answerIndex + 1)}` },
                          }}
                          name={rowGroupName(idx)}
                          disabled={disabled}
                          onChange={this.onRowValueChange(row.id, answerIndex)}
                          checked={rowItem === true}
                        />
                      </RowItem>
                    </Column>
                  );
                })}
              </Separator>
            </tbody>
          ))}
        </Table>
      </ControlsContainer>
    );
  }
}

export default AnswerGrid;
