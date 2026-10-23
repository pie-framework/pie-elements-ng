import React from 'react';
import { styled } from '@mui/material/styles';
import { chartTypes, ConfigureChartPanel } from '@pie-lib/charting';
import { settings, layout, InputContainer } from '@pie-lib/config-ui';
import debug from 'debug';
import Typography from '@mui/material/Typography';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { ConfigureLanguageOptions, EditableHtmlConfigureProp } from '@pie-element/shared-types';

import ChartingConfig from './charting-config.js';
import CorrectResponse from './correct-response.js';
import { applyConstraints, getGridValues, getLabelValues } from './utils.js';
import type { ChartingValidationErrors } from '../controller/index.js';
import type { ChartingConfiguration, ChartingGraph, ChartingModel, ChartingRange } from '../types.js';

const log = debug('@pie-element:graphing:configure');
const { Panel, toggle, radio, dropdown, textField } = settings;

const PromptHolder: any = styled(InputContainer)(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const Description: any = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
}));

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingTop: theme.spacing(1),
}));

/** A chart type the author offers: its id, label and the component that draws it */
export type ChartDefinition = ReturnType<(typeof chartTypes)['Bar']>;

const charts: ChartDefinition[] = [
  chartTypes.Bar(),
  chartTypes.Histogram(),
  chartTypes.LineDot(),
  chartTypes.LineCross(),
  chartTypes.DotPlot(),
  chartTypes.LinePlot(),
];

/** The model the author edits; `createDefaultModel()` fills it from the defaults, and the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<ChartingModel> & {
  graph: ChartingGraph;
  errors?: ChartingValidationErrors;
};

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type ConfigureProps = {
  model: AuthorModel;
  configuration: ChartingConfiguration;
  onModelChanged: (model: AuthorModel) => void;
  onConfigurationChanged: (configuration: ChartingConfiguration) => void;
  imageSupport: MediaSupport<ImageHandler>;
  uploadSoundSupport: MediaSupport<SoundHandler>;
};

type State = {
  /** Steps the range can take at the chart's height */
  gridValues: { range: number[] };
  /** Label steps the range's step allows */
  labelValues: { range: number[] };
};

export class Configure extends React.Component<ConfigureProps, State> {
  constructor(props: ConfigureProps) {
    super(props);
    const { range = {} as ChartingRange, graph } = props.model || {};
    const gridValues = { range: getGridValues(range, graph.height, true) };
    const labelValues = { range: getLabelValues(range.step || 1) };

    this.state = { gridValues, labelValues };
  }

  onRationaleChange = (rationale: string) => this.props.onModelChanged({ ...this.props.model, rationale });

  onPromptChange = (prompt: string) => this.props.onModelChanged({ ...this.props.model, prompt });

  onTeacherInstructionsChange = (teacherInstructions: string) =>
    this.props.onModelChanged({ ...this.props.model, teacherInstructions });

  onChartTypeChange = (chartType: ChartingModel['chartType']) => this.props.onModelChanged({ ...this.props.model, chartType });

  onConfigChange = (config: Partial<AuthorModel>) => {
    const { model, onModelChanged } = this.props;
    const { gridValues: oldGridValues, labelValues: oldLabelValues } = this.state;
    const updatedModel = { ...model, ...config };
    const { graph, range } = updatedModel;

    const rangeConstraints = applyConstraints(range, graph.height, oldGridValues.range, oldLabelValues.range);

    const gridValues = { range: rangeConstraints.gridValues };
    const labelValues = { range: rangeConstraints.labelValues };

    this.setState({ gridValues, labelValues });
    onModelChanged(updatedModel);
  };

  render() {
    const { configuration, imageSupport, model, onConfigurationChanged, onModelChanged, uploadSoundSupport } =
      this.props;

    log('[render] model', model);

    const { graph } = model;
    const {
      baseInputConfiguration = {},
      contentDimensions = {},
      chartDimensions = {},
      authorNewCategoryDefaults = {},
      labelsPlaceholders = {},
      instruction = {},
      maxImageWidth = {},
      maxImageHeight = {},
      prompt = {},
      rationale = {},
      scoringType = {},
      settingsPanelDisabled,
      spellCheck = {},
      studentInstructions = {},
      teacherInstructions = {},
      titlePlaceholder = {},
      withRubric = {},
      chartingOptions = {},
      availableChartTypes = {},
      mathMlOptions = {},
      chartTypeLabel,
      language = {},
      languageChoices = {} as ConfigureLanguageOptions,
      labelsCharactersLimit,
    } = configuration || {};
    const {
      errors,
      extraCSSRules,
      promptEnabled,
      rationaleEnabled,
      spellCheckEnabled,
      teacherInstructionsEnabled,
      studentNewCategoryDefaultLabel,
    } = model || {};
    const {
      categoryErrors,
      correctAnswerErrors,
      prompt: promptError,
      rationale: rationaleError,
      teacherInstructions: teacherInstructionsError,
    } = errors || {};
    const { gridValues, labelValues } = this.state;
    const showPixeGuides = chartDimensions.showInConfigPanel || true;

    const defaultImageMaxWidth = maxImageWidth && maxImageWidth.prompt;
    const defaultImageMaxHeight = maxImageHeight && maxImageHeight.prompt;

    const panelItemType = {
      changeInteractiveEnabled:
        chartingOptions.changeInteractive?.settings && toggle(chartingOptions.changeInteractive.settingsLabel),
      changeEditableEnabled:
        chartingOptions.changeEditable?.settings && toggle(chartingOptions.changeEditable.settingsLabel),
      changeAddCategoryEnabled:
        chartingOptions.addCategory?.settings && toggle(chartingOptions.addCategory.settingsLabel),
    };

    const panelProperties = {
      teacherInstructionsEnabled: teacherInstructions.settings && toggle(teacherInstructions.label),
      studentInstructionsEnabled: studentInstructions.settings && toggle(studentInstructions.label),
      rationaleEnabled: rationale.settings && toggle(rationale.label),
      spellCheckEnabled: spellCheck.settings && toggle(spellCheck.label),
      promptEnabled: prompt.settings && toggle(prompt.label),
      scoringType: scoringType.settings && radio(scoringType.label, ['all or nothing', 'partial scoring']),
      rubricEnabled: withRubric?.settings && toggle(withRubric?.label),
      'language.enabled': language.settings && toggle(language.label, true),
      language: language.settings && language.enabled && dropdown(languageChoices.label, languageChoices.options),
      instruction: instruction.settings && textField(instruction.label),
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
            configuration={configuration}
            onChangeModel={onModelChanged}
            onChangeConfiguration={onConfigurationChanged}
            groups={{
              Settings: panelItemType,
              Properties: panelProperties,
            }}
          />
        }
      >
        <Description component="div" type="body1">
          {instruction?.label || ''}
        </Description>

        {teacherInstructionsEnabled && (
          <PromptHolder label={teacherInstructions.label}>
            <EditableHtml
              ariaLabel={teacherInstructions?.label || 'Teacher Instructions'}
              markup={model.teacherInstructions || ''}
              onChange={this.onTeacherInstructionsChange}
              imageSupport={imageSupport}
              nonEmpty={false}
              error={teacherInstructionsError}
              spellCheck={spellCheckEnabled}
              pluginProps={getPluginProps(teacherInstructions?.inputConfiguration)}
              maxImageWidth={(maxImageWidth && maxImageWidth.teacherInstructions) || defaultImageMaxWidth}
              maxImageHeight={(maxImageHeight && maxImageHeight.teacherInstructions) || defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
            {teacherInstructionsError && <ErrorText>{teacherInstructionsError}</ErrorText>}
          </PromptHolder>
        )}

        {promptEnabled && (
          <PromptHolder label={prompt.label}>
            <EditableHtml
              ariaLabel={prompt?.label || 'Prompt'}
              markup={model.prompt}
              onChange={this.onPromptChange}
              imageSupport={imageSupport}
              nonEmpty={false}
              error={promptError}
              spellCheck={spellCheckEnabled}
              disableUnderline
              pluginProps={getPluginProps(prompt?.inputConfiguration)}
              maxImageWidth={defaultImageMaxWidth}
              maxImageHeight={defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
            {promptError && <ErrorText>{promptError}</ErrorText>}
          </PromptHolder>
        )}

        <ConfigureChartPanel
          model={model}
          onChange={this.onConfigChange}
          gridValues={gridValues}
          labelValues={labelValues}
          chartDimensions={chartDimensions}
          // The panel declares an object and reads its `label`; the model's string reaches it unchanged.
          studentNewCategoryDefaultLabel={studentNewCategoryDefaultLabel as { label?: string } | undefined}
          availableChartTypes={availableChartTypes}
          chartTypeLabel={chartTypeLabel}
        />

        <ChartingConfig
          model={model}
          onChange={onModelChanged}
          charts={charts}
          labelsPlaceholders={labelsPlaceholders}
          titlePlaceholder={titlePlaceholder}
          showPixelGuides={showPixeGuides}
          authorNewCategoryDefaults={authorNewCategoryDefaults}
          chartingOptions={chartingOptions}
          mathMlOptions={mathMlOptions}
          labelsCharactersLimit={labelsCharactersLimit}
        />

        <CorrectResponse
          config={graph}
          model={model}
          onChange={onModelChanged}
          charts={charts}
          error={categoryErrors}
          correctAnswerErrors={correctAnswerErrors}
          studentNewCategoryDefaultLabel={studentNewCategoryDefaultLabel}
          mathMlOptions={mathMlOptions}
          labelsPlaceholders={labelsPlaceholders}
        />

        {rationaleEnabled && (
          <PromptHolder label={rationale.label || 'Rationale'}>
            <EditableHtml
              ariaLabel={rationale?.label || 'Rationale'}
              markup={model.rationale || ''}
              onChange={this.onRationaleChange}
              imageSupport={imageSupport}
              error={rationaleError}
              spellCheck={spellCheckEnabled}
              pluginProps={getPluginProps(rationale?.inputConfiguration)}
              maxImageWidth={(maxImageWidth && maxImageWidth.rationale) || defaultImageMaxWidth}
              maxImageHeight={(maxImageHeight && maxImageHeight.rationale) || defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
            {rationaleError && <ErrorText>{rationaleError}</ErrorText>}
          </PromptHolder>
        )}
      </layout.ConfigLayout>
    );
  }
}

export default Configure;
