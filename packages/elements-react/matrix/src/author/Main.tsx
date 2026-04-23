// @ts-nocheck
/**
 * @synced-from pie-elements/packages/matrix/configure/src/Main.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import { InputContainer, settings, layout } from '@pie-lib/config-ui';
import { styled } from '@mui/material/styles';
import MatrixColumnsSizeHeaderInput from './MatrixColumnsSizeHeaderInput.js';
import MatrixRowsSizeHeaderInput from './MatrixRowsSizeHeaderInput.js';
import MatrixLabelTypeHeaderInput from './MatrixLabelTypeHeaderInput.js';
import MatrixValues from './MatrixValues.js';

const { Panel, toggle, radio } = settings;

const StyledInputContainer: any = styled(InputContainer)(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(1),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const MatrixHeaderOptionsHolder: any = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%',
  paddingBottom: theme.spacing(2.5),
  justifyContent: 'space-around',
}));

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingTop: theme.spacing(1),
}));

const Design = (props) => {
  const {
    model,
    configuration,
    onPromptChanged,
    imageSupport,
    uploadSoundSupport,
    onChangeModel,
    onConfigurationChanged,
    onTeacherInstructionsChanged,
  } = props;
  const {
    baseInputConfiguration = {},
    contentDimensions = {},
    prompt = {},
    scoringType = {},
    settingsPanelDisabled,
    spellCheck = {},
    teacherInstructions = {},
  } = configuration || {};
  const { errors = {}, extraCSSRules, teacherInstructionsEnabled, spellCheckEnabled } = model || {};
  const { prompt: promptError, teacherInstructions: teacherInstructionsError } = errors;

  const panelProperties = {
    teacherInstructionsEnabled: teacherInstructions.settings && toggle(teacherInstructions.label),
    spellCheckEnabled: spellCheck.settings && toggle(spellCheck.label),
    scoringType: scoringType.settings && radio(scoringType.label, ['auto', 'rubric']),
  };

  const getPluginProps = (props = {}) => ({
    ...baseInputConfiguration,
    ...props,
  });

  return (
    <layout.ConfigLayout
      extraCSSRules={extraCSSRules}
      dimensions={contentDimensions}
      hideSettings={settingsPanelDisabled}
      settings={
        <Panel
          model={model}
          onChangeModel={onChangeModel}
          configuration={configuration}
          onChangeConfiguration={onConfigurationChanged}
          groups={{
            Properties: panelProperties,
          }}
        />
      }
    >
      {teacherInstructionsEnabled && (
        <StyledInputContainer label={teacherInstructions.label}>
          <EditableHtml
            markup={model.teacherInstructions || ''}
            onChange={onTeacherInstructionsChanged}
            imageSupport={imageSupport}
            error={teacherInstructionsError}
            pluginProps={getPluginProps(teacherInstructions?.inputConfiguration)}
            nonEmpty={false}
            spellCheck={spellCheckEnabled}
            uploadSoundSupport={uploadSoundSupport}
          />
          {teacherInstructionsError && <ErrorText>{teacherInstructionsError}</ErrorText>}
        </StyledInputContainer>
      )}

      <StyledInputContainer label={prompt.label}>
        <EditableHtml
          markup={model.prompt}
          onChange={onPromptChanged}
          imageSupport={imageSupport}
          error={promptError}
          pluginProps={getPluginProps(prompt?.inputConfiguration)}
          nonEmpty={!prompt.settings}
          spellCheck={spellCheckEnabled}
          uploadSoundSupport={uploadSoundSupport}
          disableUnderline
        />
        {promptError && <ErrorText>{promptError}</ErrorText>}
      </StyledInputContainer>

      <MatrixHeaderOptionsHolder>
        <MatrixRowsSizeHeaderInput model={model} onChangeModel={onChangeModel} />
        <MatrixColumnsSizeHeaderInput model={model} onChangeModel={onChangeModel} />
        <MatrixLabelTypeHeaderInput model={model} onChangeModel={onChangeModel} />
      </MatrixHeaderOptionsHolder>

      <MatrixValues model={model} onChangeModel={onChangeModel} />
    </layout.ConfigLayout>
  );
};

export class Main extends React.Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    disableSidePanel: PropTypes.bool,
    onModelChanged: PropTypes.func.isRequired,
    onConfigurationChanged: PropTypes.func.isRequired,
    imageSupport: PropTypes.shape({
      add: PropTypes.func.isRequired,
      delete: PropTypes.func.isRequired,
    }),
  };

  onPromptChanged: any = (prompt) => {
    this.props.onModelChanged({ ...this.props.model, prompt });
  };

  onChangeModel: any = (data) => {
    this.props.onModelChanged({ ...this.props.model, ...data });
  };

  onTeacherInstructionsChanged: any = (teacherInstructions) => {
    this.props.onModelChanged({ ...this.props.model, teacherInstructions });
  };

  render() {
    return (
      <Design
        {...this.props}
        onChangeModel={this.props.onModelChanged}
        onPromptChanged={this.onPromptChanged}
        onTeacherInstructionsChanged={this.onTeacherInstructionsChanged}
      />
    );
  }
}

export default Main;
