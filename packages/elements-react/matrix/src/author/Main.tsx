import React from 'react';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import { InputContainer, settings, layout } from '@pie-lib/config-ui';
import { styled } from '@mui/material/styles';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { EditableHtmlConfigureProp } from '@pie-element/shared-types';
import MatrixColumnsSizeHeaderInput from './MatrixColumnsSizeHeaderInput.js';
import MatrixRowsSizeHeaderInput from './MatrixRowsSizeHeaderInput.js';
import MatrixLabelTypeHeaderInput from './MatrixLabelTypeHeaderInput.js';
import MatrixValues from './MatrixValues.js';
import type { MatrixValidationErrors } from '../controller/index.js';
import type { MatrixConfiguration, MatrixModel } from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<MatrixModel> & {
  columnLabels: string[];
  rowLabels: string[];
  matrixValues: Record<string, number>;
  errors?: MatrixValidationErrors;
};

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type MainProps = {
  model: AuthorModel;
  configuration: MatrixConfiguration;
  disableSidePanel?: boolean;
  onModelChanged: (model: AuthorModel, reset?: boolean) => void;
  onConfigurationChanged: (configuration: MatrixConfiguration) => void;
  imageSupport?: MediaSupport<ImageHandler>;
  uploadSoundSupport?: MediaSupport<SoundHandler>;
};

type DesignProps = MainProps & {
  onChangeModel: (model: AuthorModel) => void;
  onPromptChanged: (prompt: string) => void;
  onTeacherInstructionsChanged: (teacherInstructions: string) => void;
};

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

const Design = (props: DesignProps) => {
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

  const getPluginProps = (props: EditableHtmlConfigureProp = {}) => ({
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
            ariaLabel={teacherInstructions?.label || 'Teacher Instructions'}
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
          ariaLabel={prompt?.label || 'Prompt'}
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

export class Main extends React.Component<MainProps> {
  onPromptChanged = (prompt: string) => {
    this.props.onModelChanged({ ...this.props.model, prompt });
  };

  onChangeModel = (data: Partial<AuthorModel>) => {
    this.props.onModelChanged({ ...this.props.model, ...data });
  };

  onTeacherInstructionsChanged = (teacherInstructions: string) => {
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
