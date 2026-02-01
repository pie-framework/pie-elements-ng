// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/configure/src/card-bar.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import HelpIcon from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import PropTypes from 'prop-types';
import React from 'react';
import Typography from '@mui/material/Typography';

const CardBarContainer: any = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
});

const FlexContainer: any = styled('div')({
  display: 'flex',
  alignItems: 'center',
});

const StyledIconButton: any = styled(IconButton)({
  margin: 0,
  padding: 0,
});

const CardBar = (props) => {
  const { header, children, mini, info } = props;

  return (
    <CardBarContainer>
      <FlexContainer>
        <Typography variant={mini ? 'subheading' : 'h5'}>{header}</Typography>
        {info}
      </FlexContainer>
      {children && (
        <Tooltip
          title={children}
          slotProps={{
            tooltip: {
              sx: (theme) => ({
                fontSize: theme.typography.fontSize - 2,
              }),
            },
          }}
        >
          <StyledIconButton aria-label="Delete" size="large">
            <HelpIcon />
          </StyledIconButton>
        </Tooltip>
      )}
    </CardBarContainer>
  );
};

CardBar.propTypes = {
  mini: PropTypes.bool,
  header: PropTypes.string,
  children: PropTypes.node,
  info: PropTypes.any,
};

export default CardBar;
