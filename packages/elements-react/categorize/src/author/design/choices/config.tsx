// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/configure/src/design/choices/config.jsx
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
import TextField from '@mui/material/TextField';

const ConfigContainer: any = styled('div')(({ theme }) => ({
  paddingTop: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledTextField: any = styled(TextField)({
  width: '100%',
});

export class Config extends React.Component {
  static propTypes = {
    config: PropTypes.object,
    onModelChanged: PropTypes.func,
    spellCheck: PropTypes.bool,
  };

  static defaultProps = {};

  changeLabel: any = ({ target }) => {
    this.props.onModelChanged({ choicesLabel: target.value });
  };

  render() {
    const { config, spellCheck } = this.props;

    return (
      <ConfigContainer>
        <StyledTextField
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          label="Label"
          value={config.choicesLabel}
          onChange={this.changeLabel}
          spellCheck={spellCheck}
        />
      </ConfigContainer>
    );
  }
}

export default Config;
