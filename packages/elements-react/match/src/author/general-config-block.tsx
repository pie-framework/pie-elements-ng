// @ts-nocheck
/**
 * @synced-from pie-elements/packages/match/configure/src/general-config-block.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import * as React from 'react';
import { InputContainer, NumberTextField } from '@pie-lib/config-ui';
import PropTypes from 'prop-types';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Info from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';

import { generateValidationMessage } from './utils';

const Container: any = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
  display: 'flex',
}));

const Input: any = styled('div')({
  flex: 1,
});

const NumberTextFieldStyled: any = styled(NumberTextField)({
  flexDirection: 'unset',
});

const InputContainerStyled: any = styled('div')(({ theme }) => ({
  width: '65%',
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
}));

const FlexContainer: any = styled('div')({
  display: 'flex',
  alignItems: 'center',
});

const TitleText: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize + 2,
  marginRight: theme.spacing(1),
}));

const StyledTooltip: any = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    fontSize: theme.typography.fontSize - 2,
    whiteSpace: 'pre',
    maxWidth: '500px',
  },
}));

class GeneralConfigBlock extends React.Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    configuration: PropTypes.object.isRequired,
    onResponseTypeChange: PropTypes.func.isRequired,
    onLayoutChange: PropTypes.func.isRequired,
  };

  onChangeResponseType = (name) => (event) => {
    const { model, onResponseTypeChange } = this.props;
    const newModel = { ...model };

    newModel[name] = event.target.value;

    onResponseTypeChange(newModel[name]);
  };

  onChangeColumns: any = (name, value) => {
    const { model, onLayoutChange } = this.props;
    const newModel = { ...model };

    newModel[name] = value;

    onLayoutChange(newModel[name]);
  };

  render() {
    const { model, configuration } = this.props;
    const { layout = {}, choiceMode = {}, maxAnswers } = configuration || {};

    const validationMessage = generateValidationMessage(model, configuration);

    return (
      <React.Fragment>
        <FlexContainer>
          <TitleText component={'div'}>
            Define questions
          </TitleText>
          <StyledTooltip
            disableFocusListener
            disableTouchListener
            placement={'right'}
            title={validationMessage}
          >
            <Info fontSize={'small'} color={'primary'} />
          </StyledTooltip>
        </FlexContainer>

        <Container>
          <Input>
            {layout.settings && (
              <InputContainerStyled>

                <InputContainer label={layout.label} className="inputContainer">
                  <NumberTextFieldStyled
                    type="number"
                    min={3}
                    max={maxAnswers || 10}
                    value={model.layout}
                    onChange={(e, v) => this.onChangeColumns('layout', v)}
                    suffix={'Columns'}
                  />
                </InputContainer>

              </InputContainerStyled>
            )}
          </Input>

          <Input>
            {choiceMode.settings && (
              <InputContainerStyled>
                <InputContainer label={choiceMode.label} className="inputContainer">
                  <Select
                    variant="standard"
                    onChange={this.onChangeResponseType('choiceMode')}
                    value={model.choiceMode}
                    MenuProps={{ transitionDuration: { enter: 225, exit: 195 } }}
                  >
                    <MenuItem value="radio">Radio - One Answer</MenuItem>
                    <MenuItem value="checkbox">Checkbox - Multiple Answers</MenuItem>
                  </Select>
                </InputContainer>
              </InputContainerStyled>
            )}
          </Input>
        </Container>
      </React.Fragment>
    );
  }
}

export default GeneralConfigBlock;
