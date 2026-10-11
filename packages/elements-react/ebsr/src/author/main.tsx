import React from 'react';
import { settings, layout } from '@pie-lib/config-ui';
import { styled } from '@mui/material/styles';
import type { Choice, MultipleChoiceConfiguration } from '@pie-element/multiple-choice';
import type { MultipleChoiceValidationErrors } from '@pie-element/multiple-choice/controller';
import type { ConfigureLanguageOptions } from '@pie-element/shared-types';
import { EBSR_MULTIPLE_CHOICE_CONFIGURE_TAG } from '../private-tags.js';
import type { EbsrValidationErrors } from '../controller/index.js';
import type { EbsrConfiguration, EbsrModel, EbsrPart } from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<EbsrModel> & {
  partA: EbsrPart;
  partB: EbsrPart;
  errors?: EbsrValidationErrors;
};

export type MainProps = {
  model: AuthorModel;
  configuration: EbsrConfiguration;
  multipleChoiceTagName?: string;
  onModelChanged: (model: AuthorModel, reset?: boolean) => void;
  onConfigurationChanged: (configuration: EbsrConfiguration) => void;
};

/** The multiple-choice configure element of a part, which reads the model it is handed. */
type PartConfigureElement = HTMLElement & {
  _model: EbsrPart & { errors: MultipleChoiceValidationErrors };
  configuration: MultipleChoiceConfiguration;
};

const { Panel, toggle, radio, dropdown } = settings;

const PartLabel: any = styled('div')(({ theme }) => ({
  paddingBottom: theme.spacing(2),
}));

const Divider: any = styled('div')(({ theme }) => ({
  flex: 1,
  height: theme.spacing(2.5),
}));

export class Main extends React.Component<MainProps> {
  partA?: PartConfigureElement;
  partB?: PartConfigureElement;

  removeExtraChoices = (choices: Choice[]) => {
    let correctFound = false;

    return (choices || []).map((choice) => {
      if (correctFound) {
        choice.correct = false;

        return choice;
      }

      if (choice.correct) {
        correctFound = true;
      }

      return choice;
    });
  };

  onModelChanged = (model: AuthorModel, key?: string) => {
    const { onModelChanged } = this.props;

    if (key === 'partA.choiceMode' && model.partA.choiceMode === 'radio') {
      model.partA.choices = this.removeExtraChoices(model.partA.choices);

      return onModelChanged(model, true);
    }

    if (key === 'partB.choiceMode' && model.partB.choiceMode === 'radio') {
      model.partB.choices = this.removeExtraChoices(model.partB.choices);

      return onModelChanged(model, true);
    }

    return onModelChanged(model);
  };

  render() {
    const {
      model,
      configuration,
      multipleChoiceTagName = EBSR_MULTIPLE_CHOICE_CONFIGURE_TAG,
      onConfigurationChanged,
    } = this.props;
    // A custom element tag, so JSX checks none of its attributes.
    const MultipleChoiceConfigureElement = multipleChoiceTagName as unknown as React.ElementType;
    const { partLabelType, partA: modelPartA, partB: modelPartB, extraCSSRules } = model;
    const {
      contentDimensions = {},
      partA = {},
      partB = {},
      partialScoring = {},
      settingsPanelDisabled,
      scoringType = {},
      language = {},
      languageChoices = {} as Partial<ConfigureLanguageOptions>,
      ...generalConfiguration
    } = configuration;
    const {
      feedback: feedbackA = {},
      choiceMode: choiceModeA = {},
      choicePrefix: choicePrefixA = {},
      lockChoiceOrder: lockChoiceOrderA = {},
      prompt: promptA = {},
      teacherInstructions: teacherInstructionsA = {},
      studentInstructions: studentInstructionsA = {},
      choicesLayout: choicesLayoutA = {},
      gridColumns: gridColumnsA = {},
      rationale: rationaleA = {},
      spellCheck: spellCheckA = {},
    } = partA || {};
    const {
      feedback: feedbackB = {},
      choiceMode: choiceModeB = {},
      choicePrefix: choicePrefixB = {},
      lockChoiceOrder: lockChoiceOrderB = {},
      prompt: promptB = {},
      teacherInstructions: teacherInstructionsB = {},
      studentInstructions: studentInstructionsB = {},
      choicesLayout: choicesLayoutB = {},
      gridColumns: gridColumnsB = {},
      rationale: rationaleB = {},
      spellCheck: spellCheckB = {},
    } = partB || {};

    const type = partLabelType || 'Numbers';
    const typeIsNumber = type === 'Numbers';
    const firstPart = `Part ${typeIsNumber ? '1' : 'A'}`;
    const secondPart = `Part ${typeIsNumber ? '2' : 'B'}`;
    const nrOfColumnsAvailable = {
      partA:
        modelPartA.choices && modelPartA.choices.length
          ? Array.from({ length: modelPartA.choices.length }, (_, i) => `${i + 1}`)
          : [],
      partB:
        modelPartB.choices && modelPartB.choices.length
          ? Array.from({ length: modelPartB.choices.length }, (_, i) => `${i + 1}`)
          : [],
    };

    const panelSettings = {
      partLabels: generalConfiguration.partLabels?.settings && toggle(generalConfiguration.partLabels.label),
      partLabelType: model.partLabels && dropdown('', ['Numbers', 'Letters']),
      partialScoring: partialScoring.settings && toggle(partialScoring.label),
      scoringType: scoringType.settings && radio(scoringType.label, ['auto', 'rubric']),
      'language.enabled': language.settings && toggle(language.label, true),
      language: language.settings && language.enabled && dropdown(languageChoices.label, languageChoices.options),
    };

    const panelSettingsPartA = {
      'partA.choiceMode': choiceModeA.settings && radio(choiceModeA.label, ['checkbox', 'radio']),
      'partA.choicePrefix': choicePrefixA.settings && radio(choicePrefixA.label, ['numbers', 'letters']),
      'partA.lockChoiceOrder': lockChoiceOrderA.settings && toggle(lockChoiceOrderA.label),
      'partA.choicesLayout':
        choicesLayoutA.settings && dropdown(choicesLayoutA.label, ['vertical', 'grid', 'horizontal']),
      'partA.gridColumns':
        choicesLayoutA.settings &&
        modelPartA.choicesLayout === 'grid' &&
        nrOfColumnsAvailable.partA.length > 0 &&
        dropdown(gridColumnsA.label, nrOfColumnsAvailable.partA),
    };
    const panelPropertiesPartA = {
      'partA.feedbackEnabled': feedbackA.settings && toggle(feedbackA.label),
      'partA.promptEnabled': promptA.settings && toggle(promptA.label),
      'partA.teacherInstructionsEnabled': teacherInstructionsA.settings && toggle(teacherInstructionsA.label),
      'partA.studentInstructionsEnabled': studentInstructionsA.settings && toggle(studentInstructionsA.label),
      'partA.rationaleEnabled': rationaleA.settings && toggle(rationaleA.label),
      'partA.spellCheckEnabled': spellCheckA.settings && toggle(spellCheckA.label),
    };

    const panelSettingsPartB = {
      'partB.choiceMode': choiceModeB.settings && radio(choiceModeB.label, ['checkbox', 'radio']),
      'partB.choicePrefix': choicePrefixB.settings && radio(choicePrefixB.label, ['numbers', 'letters']),
      'partB.lockChoiceOrder': lockChoiceOrderB.settings && toggle(lockChoiceOrderB.label),
      'partB.choicesLayout':
        choicesLayoutB.settings && dropdown(choicesLayoutB.label, ['vertical', 'grid', 'horizontal']),
      'partB.gridColumns':
        choicesLayoutB.settings &&
        modelPartB.choicesLayout === 'grid' &&
        nrOfColumnsAvailable.partB.length > 0 &&
        dropdown(gridColumnsB.label, nrOfColumnsAvailable.partB),
    };
    const panelPropertiesPartB = {
      'partB.feedbackEnabled': feedbackB.settings && toggle(feedbackB.label),
      'partB.promptEnabled': promptB.settings && toggle(promptB.label),
      'partB.teacherInstructionsEnabled': teacherInstructionsB.settings && toggle(teacherInstructionsB.label),
      'partB.studentInstructionsEnabled': studentInstructionsB.settings && toggle(studentInstructionsB.label),
      'partB.rationaleEnabled': rationaleB.settings && toggle(rationaleB.label),
      'partB.spellCheckEnabled': spellCheckB.settings && toggle(spellCheckB.label),
    };

    return (
      <layout.ConfigLayout
        extraCSSRules={extraCSSRules}
        dimensions={contentDimensions}
        hideSettings={settingsPanelDisabled}
        settings={
          <Panel
            model={model}
            onChangeModel={this.onModelChanged}
            configuration={configuration}
            onChangeConfiguration={onConfigurationChanged}
            groups={{
              'Settings for both': panelSettings,
              [`Settings ${firstPart}`]: panelSettingsPartA,
              [`Properties ${firstPart}`]: panelPropertiesPartA,
              [`Settings ${secondPart}`]: panelSettingsPartB,
              [`Properties ${secondPart}`]: panelPropertiesPartB,
            }}
          />
        }
      >
        {model.partLabels && <PartLabel>{firstPart}</PartLabel>}
        <MultipleChoiceConfigureElement
          data-part="A"
          key="partA"
          ref={(ref: PartConfigureElement | null) => {
            if (ref) {
              // do not use destructuring to get model from props
              this.partA = ref;
              this.partA._model = {
                ...this.props.model.partA,
                errors: (this.props.model.errors && this.props.model.errors.partA) || {},
              };
              this.partA.configuration = {
                ...partA,
                ...generalConfiguration,
              };
            }
          }}
        />

        <Divider />

        {model.partLabels && <PartLabel>{secondPart}</PartLabel>}
        <MultipleChoiceConfigureElement
          data-part="B"
          key="partB"
          ref={(ref: PartConfigureElement | null) => {
            if (ref) {
              // do not use destructuring to get model from props
              this.partB = ref;
              this.partB._model = {
                ...this.props.model.partB,
                errors: (this.props.model.errors && this.props.model.errors.partB) || {},
              };
              this.partB.configuration = {
                ...partB,
                ...generalConfiguration,
              };
            }
          }}
        />
      </layout.ConfigLayout>
    );
  }
}

export default Main;
