// @ts-nocheck
/**
 * @synced-from pie-elements/packages/image-cloze-association/src/evaluation-icon.jsx
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
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import { color } from '@pie-lib/render-ui';

const StyledIcon: any = styled('svg')(() => ({
  '&.correctEmpty': {
    color: color.correct(),
  },
  '&.correctFilled': {
    color: color.background(),
    backgroundColor: color.correct(),
  },
  '&.incorrectEmpty': {
    color: color.incorrect(),
  },
  '&.incorrectFilled': {
    color: color.background(),
    backgroundColor: color.incorrect(),
  },
}));

const getCorrectnessClass = (isCorrect, filled) => {
  const correctness = isCorrect ? 'correct' : 'incorrect';
  const fillState = filled ? 'Filled' : 'Empty';

  return `${correctness}${fillState}`;
};

const EvaluationIcon = ({ containerStyle, isCorrect, filled }) => {
  const Icon = isCorrect ? Check : Close;
  const showCorrectness = isCorrect !== undefined;
  const correctness = showCorrectness ? getCorrectnessClass(isCorrect, filled) : '';

  return showCorrectness ? (
    <Icon component={StyledIcon} className={correctness} style={containerStyle} />
  ) : null;
};

EvaluationIcon.propTypes = {
  containerStyle: PropTypes.object,
  filled: PropTypes.bool,
  isCorrect: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
};

EvaluationIcon.defaultProps = {
  containerStyle: {},
  filled: false,
  isCorrect: undefined,
};

export default EvaluationIcon;
