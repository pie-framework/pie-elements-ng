// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/form-section.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

const StyledFormSection: any = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledTypography: any = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const FormSection = ({ className, label, children, labelExtraStyle }) => (
  <StyledFormSection className={className}>
    <StyledTypography variant="subtitle1" style={labelExtraStyle}>
      {label}
    </StyledTypography>
    {children}
  </StyledFormSection>
);

FormSection.propTypes = {
  className: PropTypes.string,
  label: PropTypes.string,
  children: PropTypes.node,
  labelExtraStyle: PropTypes.object,
};

export default FormSection;
