// @ts-nocheck
/**
 * @synced-from pie-elements/packages/math-inline/configure/src/configure.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { styled } from '@mui/material/styles';
import { FeedbackConfig, settings, layout, InputContainer } from '@pie-lib/config-ui';
import PropTypes from 'prop-types';
import debug from 'debug';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import GeneralConfigBlock from './general-config-block';
import { getPluginProps, ResponseTypes } from './utils';

const log = debug('@pie-element:math-inline:configure');
const { Panel, toggle, radio, dropdown } = settings;

const PromptHolder: any = styled(InputContainer)(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingTop: theme.spacing(1),
}));

export class Configure extends React.Component {
  static propTypes = {
    onModelChanged: PropTypes.func,
    onConfigurationChanged: PropTypes.func,
    model: PropTypes.object.isRequired,
    configuration: PropTypes.object.isRequired,
    imageSupport: PropTypes.object,
    uploadSoundSupport: PropTypes.object,
  };

  onChange: any = (model) => {
    this.props.onModelChanged(model);
  };

  changeTeacherInstructions: any = (teacherInstructions) => {
    this.props.onModelChanged({
      ...this.props.model,
      teacherInstructions,
    });
  };

  onFeedbackChange: any = (feedback) => {
    const { model, onModelChanged } = this.props;
    model.feedback = feedback;
    onModelChanged(model);
  };

  render() {
    const { model, imageSupport, onModelChanged, configuration, onConfigurationChanged, uploadSoundSupport } =
      this.props;
    const {
      allowTrailingZeros = {},
      baseInputConfiguration = {},
      contentDimensions = {},
      feedback = {},
      ignoreOrder = {},
      maxImageWidth = {},
      maxImageHeight = {},
      prompt = {},
      rationale = {},
      responseType = {},
      scoringType = {},
      settingsPanelDisabled,
      spellCheck = {},
      studentInstructions = {},
      teacherInstructions = {},
      withRubric = {},
      mathMlOptions = {},
      language = {},
      languageChoices = {},
    } = configuration || {};
    const {
      errors = {},
      extraCSSRules,
      feedbackEnabled,
      promptEnabled,
      rationaleEnabled,
      spellCheckEnabled,
      teacherInstructionsEnabled,
      toolbarEditorPosition,
    } = model || {};

    const { teacherInstructions: teacherInstructionsError } = errors;

    log('[render] model', model);

    const toolbarOpts = {
      position: toolbarEditorPosition === 'top' ? 'top' : 'bottom',
    };

    const defaultImageMaxWidth = maxImageWidth && maxImageWidth.prompt;
    const defaultImageMaxHeight = maxImageHeight && maxImageHeight.prompt;

    const panelSettings = {
      responseType: responseType.settings && radio(responseType.label, [ResponseTypes.simple, ResponseTypes.advanced]),
      feedbackEnabled: feedback.settings && toggle(feedback.label),
      promptEnabled: prompt.settings && toggle(prompt.label),
      'language.enabled': language.settings && toggle(language.label, true),
      language: language.settings && language.enabled && dropdown(languageChoices.label, languageChoices.options),
    };
    const panelProperties = {
      teacherInstructionsEnabled: teacherInstructions.settings && toggle(teacherInstructions.label),
      studentInstructionsEnabled: studentInstructions.settings && toggle(studentInstructions.label),
      rationaleEnabled: rationale.settings && toggle(rationale.label),
      spellCheckEnabled: spellCheck.settings && toggle(spellCheck.label),
      scoringType: scoringType.settings && radio(scoringType.label, ['auto', 'rubric']),
      'ignoreOrder.enabled': ignoreOrder.settings && toggle(ignoreOrder.label),
      'allowTrailingZeros.enabled': allowTrailingZeros.settings && toggle(allowTrailingZeros.label),
      rubricEnabled: withRubric?.settings && toggle(withRubric?.label),
    };

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
              Settings: panelSettings,
              Properties: panelProperties,
            }}
          />
        }
      >
        {teacherInstructionsEnabled && (
          <PromptHolder label={teacherInstructions.label}>
            <EditableHtml
              markup={model.teacherInstructions || ''}
              onChange={this.changeTeacherInstructions}
              imageSupport={imageSupport}
              nonEmpty={false}
              error={teacherInstructionsError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(teacherInstructions?.inputConfiguration, baseInputConfiguration)}
              spellCheck={spellCheckEnabled}
              maxImageWidth={(maxImageWidth && maxImageWidth.teacherInstructions) || defaultImageMaxWidth}
              maxImageHeight={(maxImageHeight && maxImageHeight.teacherInstructions) || defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
            {teacherInstructionsError && <ErrorText>{teacherInstructionsError}</ErrorText>}
          </PromptHolder>
        )}

        <GeneralConfigBlock
          imageSupport={imageSupport}
          uploadSoundSupport={uploadSoundSupport}
          model={model}
          configuration={configuration}
          onChange={this.onChange}
          rationaleEnabled={rationaleEnabled}
          promptEnabled={promptEnabled}
          toolbarOpts={toolbarOpts}
          spellCheck={spellCheckEnabled}
        />

        {feedbackEnabled && (
          <FeedbackConfig feedback={model.feedback} onChange={this.onFeedbackChange} toolbarOpts={toolbarOpts} />
        )}
      </layout.ConfigLayout>
    );
  }
}

export default Configure;
