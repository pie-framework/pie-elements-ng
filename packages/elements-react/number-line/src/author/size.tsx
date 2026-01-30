// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/configure/src/size.jsx
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
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { NumberTextFieldCustom } from '@pie-lib/config-ui';

const FlexRow: any = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
});

const FlexCol: any = styled('div')({
  display: 'flex',
  flexFlow: 'column',
});

const MinMaxLabel: any = styled('label')({
  fontSize: 'small',
  color: 'gray',
});

const StyledNumberTextFieldCustom: any = styled(NumberTextFieldCustom)({
  '& input': {
    cursor: 'default',
  },
});

const Size = (props) => {
  // Setting default value if not passed in configuration properties.
  const { size = { width: 500 }, min = 150, max = 800, step = 20, onChange } = props;
  const changeWidth = (e, width) => onChange({ ...props.size, width });
  return (
    <FlexRow>
      <FlexCol>
        <label>Width (px)</label>
        <MinMaxLabel>
          Min {min}, Max {max}
        </MinMaxLabel>
      </FlexCol>
      <StyledNumberTextFieldCustom
        value={size.width}
        min={min}
        max={max}
        step={step}
        onlyIntegersAllowed={true}
        onChange={changeWidth}
        variant={'outlined'}
      />
    </FlexRow>
  );
};

Size.propTypes = {
  size: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

export default Size;
