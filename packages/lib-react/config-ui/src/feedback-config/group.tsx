// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/feedback-config/group.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import PropTypes from 'prop-types';
import RadioWithLabel from '../radio-with-label.js';
import React from 'react';
import { styled } from '@mui/material/styles';

const StyledChoiceHolder: any = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
}));

const StyledChoice: any = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
}));

const StyledRadioWithLabel: any = styled(RadioWithLabel)(({ theme }) => ({
  '& .MuiFormControlLabel-label': {
    fontSize: theme.typography.fontSize - 2,
  },
}));

const Group = (props) => {
  const { feedbackLabels, value, className, onChange, keys } = props;

  return (
    <StyledChoiceHolder className={className}>
      {keys.map((key) => {
        return (
          <StyledChoice key={key}>
            <StyledRadioWithLabel
              value={key}
              checked={value === key}
              onChange={(e) => onChange(e.currentTarget.value)}
              label={feedbackLabels[key]}
            />
          </StyledChoice>
        );
      })}
    </StyledChoiceHolder>
  );
};

Group.propTypes = {
  className: PropTypes.string,
  feedbackLabels: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired,
  keys: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
};

export default Group;
