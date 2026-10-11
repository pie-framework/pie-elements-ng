import React from 'react';
import { FormSection, layout, AlertDialog } from '@pie-lib/config-ui';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { EditableHtmlConfigureProp } from '@pie-element/shared-types';
import { FractionModelChart } from '../delivery/index.js';
import Tooltip from '@mui/material/Tooltip';
import Info from '@mui/icons-material/Info';
import { styled } from '@mui/material/styles';

import CardBar from './card-bar.js';
import ModelOptions from './model-options.js';
import type { FractionModelValidationErrors } from '../controller/index.js';
import type { FractionModelConfiguration, FractionModelModel, FractionModelResponse } from '../types.js';

const StyledFormSection: any = styled(FormSection)(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

const StyledTooltip: any = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    fontSize: theme.typography.fontSize - 2,
    whiteSpace: 'pre',
    maxWidth: '500px',
  },
}));

const ErrorMessage: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  marginTop: theme.spacing(1),
}));

const ModelErrorContainer: any = styled('div')<{ hasError?: boolean }>(({ theme, hasError }) => ({
  ...(hasError && {
    border: `2px solid ${theme.palette.error.main}`,
  }),
}));

const Label: any = styled('label')(({ theme }) => ({
  marginBottom: theme.spacing(4),
}));

/** The model the author edits; `createDefaultModel()` fills it from the defaults, and the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<FractionModelModel> & {
  correctResponse: FractionModelResponse[];
  errors?: FractionModelValidationErrors;
};

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type MainProps = {
  model: AuthorModel;
  configuration: FractionModelConfiguration;
  onConfigurationChanged: (configuration: FractionModelConfiguration) => void;
  /** Merges the update into the model */
  onChange: (update: Partial<AuthorModel>) => void;
  imageSupport: MediaSupport<ImageHandler>;
  uploadSoundSupport: MediaSupport<SoundHandler>;
};

type State = {
  /** The warning shown before a change to the model options clears the correct answer */
  correctAnswerChangeDialog: {
    open: boolean;
    text?: string;
    oldModel?: AuthorModel;
    newModel?: AuthorModel;
  };
};

export class Main extends React.Component<MainProps, State> {
  constructor(props: MainProps) {
    super(props);

    this.state = {
      correctAnswerChangeDialog: {
        open: false,
        text: '',
      },
    };
  }

  /*
   * Method to handle correct answer change
   * @param {array} correctResponse - correct response
   * */
  onCorrectAnswerChange = (correctResponse: FractionModelResponse[]) => {
    const { model, onChange } = this.props;
    model.correctResponse = correctResponse;
    onChange({ ...model });
  };

  /*
   * Method to handle model options change
   * @param {object} oldModel - old model
   * @param {object} newModel - new model
   * @param {boolean} showDiag - show dialog or not
   * */
  onModelOptionsChange = (oldModel: AuthorModel, newModel: AuthorModel, showDiag: boolean) => {
    const { onChange } = this.props;
    if (showDiag && oldModel.correctResponse.length > 0) {
      this.setState({
        correctAnswerChangeDialog: {
          open: true,
          oldModel: oldModel,
          newModel: newModel,
          text: 'Changing either the Number of Models or Parts per Model will remove added correct answer. Are you sure you want to continue?',
        },
      });
    } else {
      onChange({ ...newModel });
    }
  };

  /*
   * Method to generate random key
   * */
  generateRandomKey = () => {
    return Math.floor(Math.random() * 10000);
  };

  render() {
    const { model, onChange, configuration, imageSupport, uploadSoundSupport } = this.props;
    const {
      baseInputConfiguration = {},
      contentDimensions = {},
      title = {},
      prompt = {},
      modelOptions = {},
      mathMlOptions = {},
    } = configuration || {};

    const { errors = {} as FractionModelValidationErrors, extraCSSRules, spellCheckEnabled, toolbarEditorPosition } = model || {};

    const { correctAnswerChangeDialog } = this.state;

    const toolbarOpts: { position: 'top' | 'bottom' } = {
      position: toolbarEditorPosition === 'top' ? 'top' : 'bottom',
    };

    const getPluginProps = (props: EditableHtmlConfigureProp = {}) => ({
      ...baseInputConfiguration,
      ...props,
    });

    const fractionModelChartKey = this.generateRandomKey();

    return (
      <layout.ConfigLayout extraCSSRules={extraCSSRules} dimensions={contentDimensions} hideSettings={true}>
        <CardBar header="Set Up"></CardBar>

        <StyledFormSection label={title?.label || 'Title'}>
          <EditableHtml
            markup={model.title || ''}
            onChange={(title: string) => onChange({ title })}
            toolbarOpts={toolbarOpts}
            activePlugins={[
              'bold',
              'html',
              'italic',
              'underline',
              'strikethrough',
              'image',
              'math',
              'languageCharacters',
              'responseArea',
            ]}
            pluginProps={getPluginProps(title?.inputConfiguration)}
            spellCheck={spellCheckEnabled}
            uploadSoundSupport={uploadSoundSupport}
            languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
            mathMlOptions={mathMlOptions}
          />
        </StyledFormSection>

        <StyledFormSection label={prompt?.label || 'Question'}>
          <EditableHtml
            markup={model.prompt || ''}
            minHeight={60}
            onChange={(prompt: string) => onChange({ prompt })}
            toolbarOpts={toolbarOpts}
            pluginProps={getPluginProps(prompt?.inputConfiguration)}
            spellCheck={spellCheckEnabled}
            uploadSoundSupport={uploadSoundSupport}
            imageSupport={imageSupport}
            languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
            mathMlOptions={mathMlOptions}
          />
        </StyledFormSection>

        <FormSection>
          <ModelOptions model={model} onChange={this.onModelOptionsChange} modelOptions={modelOptions} />
        </FormSection>

        <FormSection>            <CardBar
            header="Correct Answer"
            info={
              <StyledTooltip
                disableFocusListener
                disableTouchListener
                placement={'right'}
                title={'The correct answer should include no more than one partially-filled model'}
              >
                <Info fontSize={'small'} color={'primary'} style={{ marginLeft: '8px' }} />
              </StyledTooltip>
            }
          ></CardBar>

          <br />
          <Label>
            Click/touch the number of parts to represent the correct fraction model
          </Label>
          <br />

          <ModelErrorContainer hasError={!!errors.correctResponse}>
            <FractionModelChart
              key={fractionModelChartKey}
              value={model.correctResponse}
              modelType={model.modelTypeSelected}
              noOfModels={model.maxModelSelected}
              partsPerModel={model.partsPerModel}
              showLabel={model.showGraphLabels}
              onChange={this.onCorrectAnswerChange}
            ></FractionModelChart>
          </ModelErrorContainer>

          {errors.correctResponse && <ErrorMessage>{errors.correctResponse}</ErrorMessage>}
        </FormSection>

        <AlertDialog
          open={correctAnswerChangeDialog.open}
          title="Warning"
          text={correctAnswerChangeDialog.text}
          onConfirm={() => {
            // The dialog opens only with both models set.
            let newModel = this.state.correctAnswerChangeDialog.newModel!;
            newModel.correctResponse = [];
            onChange({ ...newModel });
            this.setState({
              correctAnswerChangeDialog: { open: false },
            });
          }}
          onClose={() => {
            const oldModel = this.state.correctAnswerChangeDialog.oldModel;
            onChange({ ...oldModel });
            this.setState({ correctAnswerChangeDialog: { open: false } });
          }}
          onConfirmText={'OK'}
          onCloseText={'Cancel'}
        />
      </layout.ConfigLayout>
    );
  }
}

export default Main;
