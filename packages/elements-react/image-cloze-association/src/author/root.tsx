// @ts-nocheck
/**
 * @synced-from pie-elements/packages/image-cloze-association/configure/src/root.jsx
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
import { settings, layout, InputContainer } from '@pie-lib/config-ui';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import { styled } from '@mui/material/styles';

const { Panel, toggle, dropdown } = settings;

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

export class Root extends React.Component {
  onTeacherInstructionsChanged: any = (teacherInstructions) => {
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
      languageChoices = {},
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
            onChangeModel={(model) => onModelChanged(model)}
            onChangeConfiguration={(config) => onConfigurationChanged(config)}
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

Root.propTypes = {
  onModelChanged: PropTypes.func,
  onConfigurationChanged: PropTypes.func,
  model: PropTypes.object.isRequired,
  configuration: PropTypes.object.isRequired,
  imageSupport: PropTypes.shape({
    add: PropTypes.func.isRequired,
    delete: PropTypes.func.isRequired,
  }),
  uploadSoundSupport: PropTypes.shape({
    add: PropTypes.func.isRequired,
    delete: PropTypes.func.isRequired,
  }),
};

export default Root;
