import { getPluginProps } from './utils.js';
import React from 'react';
import { styled } from '@mui/material/styles';
import { FeedbackConfig, settings, layout, InputContainer, AlertDialog } from '@pie-lib/config-ui';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import debug from 'debug';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { ConfigureLanguageOptions } from '@pie-element/shared-types';
import GeneralConfigBlock from './general-config-block.js';
import AnswerConfigBlock from './answer-config-block.js';
import type { MatchValidationErrors } from '../controller/index.js';
import type { MatchConfiguration, MatchFeedback, MatchModel, MatchRow } from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<MatchModel> & {
  headers: string[];
  layout: number;
  rows: MatchRow[];
  errors?: MatchValidationErrors;
};

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type ConfigureProps = {
  model: AuthorModel;
  configuration: MatchConfiguration;
  onModelChanged: (model: AuthorModel) => void;
  onConfigurationChanged: (configuration: MatchConfiguration) => void;
  imageSupport?: MediaSupport<ImageHandler>;
  uploadSoundSupport?: MediaSupport<SoundHandler>;
};

type ConfigureState = {
  activeTab: number;
  dialog: { open: boolean; text?: string };
};

const log = debug('@pie-element:match:configure');
const { Panel, toggle, radio, dropdown } = settings;

const MainLayout: any = styled('div')(() => ({
  '& .promptHolder': {
    width: '100%',
  },
}));

const PromptHolder: any = styled('div')(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingTop: theme.spacing(1),
}));

class Configure extends React.Component<ConfigureProps, ConfigureState> {
  rowIdCounter: number;

  constructor(props: ConfigureProps) {
    super(props);

    let maxId = 0;

    if (props.model.rows && props.model.rows.length > 0) {
      // `Math.max` coerces string ids to numbers
      maxId = Math.max(...props.model.rows.map((row) => row.id as number));
    }

    this.rowIdCounter = maxId + 1;

    this.state = {
      activeTab: 0,
      dialog: {
        open: false,
        text: '',
      },
    };
  }

  componentDidMount() {
    const { updatedRows, wasChanged } = this.validateRowsID(this.props.model.rows);

    if (wasChanged) {
      const newModel = { ...this.props.model, rows: updatedRows };
      this.props.onModelChanged(newModel);
    }
  }

  validateRowsID(rows: MatchRow[] | undefined) {
    let wasChanged = false;

    const updatedRows = (rows || []).map((row, index) => {
      if (row.id !== index + 1) {
        wasChanged = true;

        return { ...row, id: index + 1 };
      }

      return row;
    });

    return { updatedRows, wasChanged };
  }

  onTabChange = (_event: unknown, value: number) => {
    this.setState({ activeTab: value });
  };

  onChangeTabIndex = (index: number) => {
    this.setState({ activeTab: index });
  };

  onChange = (model: AuthorModel) => {
    this.props.onModelChanged(model);
  };

  onFeedbackChange = (feedback: MatchFeedback) => {
    const { model, onModelChanged } = this.props;
    model.feedback = feedback;

    onModelChanged(model);
  };

  onDeleteRow = (rowIndex: number) => {
    const { model } = this.props;
    const newModel = { ...model };

    newModel.rows.splice(rowIndex, 1);

    this.onChange(newModel);
  };

  onAddRow = () => {
    const { model, configuration } = this.props;
    const newModel = { ...model };
    const { maxQuestions } = configuration || {};

    if (maxQuestions && (newModel.rows || []).length >= maxQuestions) {
      this.setState({
        dialog: {
          open: true,
          text: `There can be maximum ${maxQuestions} question row` + (maxQuestions > 1 ? 's' : '') + '.',
        },
      });
      return;
    }

    newModel.rows = newModel.rows.concat({
      id: this.rowIdCounter + 1,
      title: `Question Text ${(newModel.rows || []).length + 1}`,
      values: new Array(model.layout - 1).fill(false),
    });

    this.rowIdCounter += 1;

    this.onChange(newModel);
  };

  onLayoutChange = (newLayout: number) => {
    const { model } = this.props;
    const oldLayout = model.layout;
    const newModel = { ...model };

    if (newLayout > oldLayout) {
      for (let i = 0; i < newLayout - oldLayout; i++) {
        newModel.headers.push(`Column ${newModel.headers.length + 1}`);
      }

      newModel.rows.forEach((row) => {
        for (let i = 0; i < newLayout - oldLayout; i++) {
          row.values.push(false);
        }
      });
    } else if (newLayout < oldLayout) {
      newModel.headers.splice(newLayout);

      newModel.rows.forEach((row) => {
        row.values.splice(newLayout - 1);
      });
    }

    newModel.layout = newLayout;

    this.onChange(newModel);
  };

  onResponseTypeChange = (newChoiceMode: MatchModel['choiceMode']) => {
    const { model } = this.props;
    const newModel = { ...model };

    // if we're switching to radio and we have more than one true, reset
    if (newChoiceMode === 'radio') {
      newModel.rows.forEach((row) => {
        // No initial value: the first value seeds the total as a boolean, which `+` and `>` coerce to 0 or 1.
        const trueCount = (row.values as (boolean | number)[]).reduce((total, current) =>
          current === true ? Number(total) + 1 : total,
        );

        if (Number(trueCount) > 1) {
          row.values = new Array(model.layout - 1).fill(false);
        }
      });
    }

    newModel.choiceMode = newChoiceMode;

    this.onChange(newModel);
  };

  onPartialScoringChange = (partialScoring: boolean) => {
    this.props.model.partialScoring = partialScoring;

    this.props.onModelChanged(this.props.model);
  };

  onPromptChanged = (prompt: string) => {
    this.props.onModelChanged({ ...this.props.model, prompt });
  };

  onTeacherInstructionsChanged = (teacherInstructions: string) => {
    this.props.onModelChanged({ ...this.props.model, teacherInstructions });
  };

  onRationaleChanged = (rationale: string) => {
    this.props.onModelChanged({ ...this.props.model, rationale });
  };

  render() {
    const { model, imageSupport, onModelChanged, configuration, onConfigurationChanged, uploadSoundSupport } =
      this.props;
    const {
      baseInputConfiguration = {},
      contentDimensions = {},
      feedback = {},
      lockChoiceOrder = {},
      maxImageWidth = {},
      maxImageHeight = {},
      partialScoring = {},
      prompt = {},
      rationale = {},
      settingsPanelDisabled,
      scoringType = {},
      spellCheck = {},
      studentInstructions = {},
      teacherInstructions = {},
      withRubric = {},
      language = {},
      languageChoices = {} as Partial<ConfigureLanguageOptions>,
    } = configuration || {};
    const {
      errors,
      extraCSSRules,
      feedbackEnabled,
      promptEnabled,
      rationaleEnabled,
      spellCheckEnabled,
      teacherInstructionsEnabled,
      toolbarEditorPosition,
    } = model || {};
    const {
      prompt: promptError,
      rationale: rationaleError,
      teacherInstructions: teacherInstructionsError,
    } = errors || {};
    const { dialog } = this.state;

    const toolbarOpts = {
      position: toolbarEditorPosition === 'top' ? 'top' : 'bottom',
    };

    const defaultImageMaxWidth = maxImageWidth && maxImageWidth.prompt;
    const defaultImageMaxHeight = maxImageHeight && maxImageHeight.prompt;

    const panelSettings = {
      partialScoring: partialScoring.settings && toggle(partialScoring.label),
      lockChoiceOrder: lockChoiceOrder.settings && toggle(lockChoiceOrder.label),
      feedbackEnabled: feedback.settings && toggle(feedback.label),
      'language.enabled': language.settings && toggle(language.label, true),
      language: language.settings && language.enabled && dropdown(languageChoices.label, languageChoices.options),
    };
    const panelProperties = {
      teacherInstructionsEnabled: teacherInstructions.settings && toggle(teacherInstructions.label),
      studentInstructionsEnabled: studentInstructions.settings && toggle(studentInstructions.label),
      promptEnabled: prompt.settings && toggle(prompt.label),
      rationaleEnabled: rationale.settings && toggle(rationale.label),
      spellCheckEnabled: spellCheck.settings && toggle(spellCheck.label),
      scoringType: scoringType.settings && radio(scoringType.label, ['auto', 'rubric']),
      rubricEnabled: withRubric?.settings && toggle(withRubric?.label),
    };

    log('[render] model', model);

    return (
      <MainLayout>
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
          <InputContainer label={teacherInstructions.label} className="promptHolder">
            <PromptHolder>
              <EditableHtml
                className="prompt"
                markup={model.teacherInstructions || ''}
                onChange={this.onTeacherInstructionsChanged}
                imageSupport={imageSupport}
                error={teacherInstructionsError}
                nonEmpty={false}
                toolbarOpts={toolbarOpts}
                pluginProps={getPluginProps(teacherInstructions?.inputConfiguration, baseInputConfiguration)}
                spellCheck={spellCheckEnabled}
                maxImageWidth={(maxImageWidth && maxImageWidth.teacherInstructions) || defaultImageMaxWidth}
                maxImageHeight={(maxImageHeight && maxImageHeight.teacherInstructions) || defaultImageMaxHeight}
                uploadSoundSupport={uploadSoundSupport}
                languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              />
              {teacherInstructionsError && <ErrorText>{teacherInstructionsError}</ErrorText>}
            </PromptHolder>
          </InputContainer>
        )}

        {promptEnabled && (
          <InputContainer label={prompt.label} className="promptHolder">
            <PromptHolder>
              <EditableHtml
                className="prompt"
                markup={model.prompt}
                onChange={this.onPromptChanged}
                imageSupport={imageSupport}
                error={promptError}
                nonEmpty={false}
                disableUnderline
                toolbarOpts={toolbarOpts}
                pluginProps={getPluginProps(prompt?.inputConfiguration, baseInputConfiguration)}
                spellCheck={spellCheckEnabled}
                maxImageWidth={maxImageWidth && maxImageWidth.prompt}
                maxImageHeight={maxImageHeight && maxImageHeight.prompt}
                uploadSoundSupport={uploadSoundSupport}
                languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              />
              {promptError && <ErrorText>{promptError}</ErrorText>}
            </PromptHolder>
          </InputContainer>
        )}

        <GeneralConfigBlock
          model={model}
          configuration={configuration}
          onResponseTypeChange={this.onResponseTypeChange}
          onLayoutChange={this.onLayoutChange}
        />

        <AnswerConfigBlock
          model={model}
          configuration={configuration}
          imageSupport={imageSupport}
          onChange={this.onChange}
          onAddRow={this.onAddRow}
          onDeleteRow={this.onDeleteRow}
          toolbarOpts={toolbarOpts}
          spellCheck={spellCheckEnabled}
          uploadSoundSupport={uploadSoundSupport}
        />

        {rationaleEnabled && (
          <InputContainer label={rationale.label} className="promptHolder">
            <PromptHolder>
              <EditableHtml
                className="prompt"
                markup={model.rationale || ''}
                onChange={this.onRationaleChanged}
                imageSupport={imageSupport}
                error={rationaleError}
                toolbarOpts={toolbarOpts}
                pluginProps={getPluginProps(rationale?.inputConfiguration, baseInputConfiguration)}
                spellCheck={spellCheckEnabled}
                maxImageWidth={(maxImageWidth && maxImageWidth.rationale) || defaultImageMaxWidth}
                maxImageHeight={(maxImageHeight && maxImageHeight.rationale) || defaultImageMaxHeight}
                uploadSoundSupport={uploadSoundSupport}
                languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              />
              {rationaleError && <ErrorText>{rationaleError}</ErrorText>}
            </PromptHolder>
          </InputContainer>
        )}

        {feedbackEnabled && (
          <FeedbackConfig feedback={model.feedback} onChange={this.onFeedbackChange} toolbarOpts={toolbarOpts} />
        )}
        <AlertDialog
          open={dialog.open}
          title="Warning"
          text={dialog.text}
          onConfirm={() => this.setState({ dialog: { open: false } })}
        />
      </layout.ConfigLayout>
    </MainLayout>
    );
  }
}

export const Config = Configure;

export default Configure;
