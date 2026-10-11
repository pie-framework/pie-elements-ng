import React from 'react';
import { settings, layout, InputContainer } from '@pie-lib/config-ui';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import { styled } from '@mui/material/styles';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { ConfigureLanguageOptions } from '@pie-element/shared-types';
import type { ImageClozeAssociationValidationErrors } from '../controller/index.js';
import type { ImageClozeAssociationConfiguration, ImageClozeAssociationModel } from '../types.js';

const { Panel, toggle, dropdown } = settings;

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<ImageClozeAssociationModel> & {
  errors?: ImageClozeAssociationValidationErrors;
};

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type RootProps = {
  model: AuthorModel;
  configuration: ImageClozeAssociationConfiguration;
  onModelChanged: (model: AuthorModel, reset?: boolean) => void;
  onConfigurationChanged: (configuration: ImageClozeAssociationConfiguration) => void;
  /** Not read: the settings panel shows regardless */
  disableSidePanel?: boolean;
  imageSupport?: MediaSupport<ImageHandler>;
  uploadSoundSupport?: MediaSupport<SoundHandler>;
};

const StyledInputContainer: any = styled(InputContainer)(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingTop: theme.spacing(1),
}));

export class Root extends React.Component<RootProps> {
  onTeacherInstructionsChanged = (teacherInstructions: string) => {
    this.props.onModelChanged({ ...this.props.model, teacherInstructions });
  };

  render() {
    const { model, configuration, onModelChanged, onConfigurationChanged, imageSupport, uploadSoundSupport } =
      this.props;
    const {
      baseInputConfiguration = {},
      contentDimensions = {},
      maxImageWidth = {},
      maxImageHeight = {},
      settingsPanelDisabled,
      spellCheck = {},
      teacherInstructions = {},
      withRubric = {},
      mathMlOptions = {},
      language = {},
      languageChoices = {} as Partial<ConfigureLanguageOptions>,
    } = configuration || {};
    const { errors = {}, extraCSSRules, spellCheckEnabled } = model || {};
    const { teacherInstructions: teacherInstructionsError } = errors;

    const panelProperties = {
      teacherInstructionsEnabled: teacherInstructions.settings && toggle(teacherInstructions.label),
      spellCheckEnabled: spellCheck.settings && toggle(spellCheck.label),
      rubricEnabled: withRubric?.settings && toggle(withRubric?.label),
      'language.enabled': language.settings && toggle(language.label, true),
      language: language.settings && language.enabled && dropdown(languageChoices.label, languageChoices.options),
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
            configuration={configuration}
            onChangeModel={(model: AuthorModel) => onModelChanged(model)}
            onChangeConfiguration={(config: ImageClozeAssociationConfiguration) => onConfigurationChanged(config)}
            groups={{
              Properties: panelProperties,
            }}
          />
        }
      >
        {model && model.teacherInstructionsEnabled && (
          <StyledInputContainer label={teacherInstructions.label}>
            <EditableHtml
              markup={model.teacherInstructions || ''}
              onChange={this.onTeacherInstructionsChanged}
              imageSupport={imageSupport}
              nonEmpty={false}
              error={teacherInstructionsError}
              spellCheck={spellCheckEnabled}
              pluginProps={getPluginProps(teacherInstructions?.inputConfiguration)}
              maxImageWidth={maxImageWidth && maxImageWidth.teacherInstructions}
              maxImageHeight={maxImageHeight && maxImageHeight.teacherInstructions}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
            {teacherInstructionsError && <ErrorText>{teacherInstructionsError}</ErrorText>}
          </StyledInputContainer>
        )}

        <div>Image cloze association</div>
      </layout.ConfigLayout>
    );
  }
}

export default Root;
