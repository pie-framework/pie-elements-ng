import React from 'react';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { InputContainer, settings, layout, NumberTextField } from '@pie-lib/config-ui';
import { styled } from '@mui/material/styles';
import { merge } from '@pie-element/shared-lodash';
import { LIKERT_TYPE, LIKERT_SCALE, LIKERT_ORIENTATION } from './likertEntities.js';
import generateChoices from './choiceGenerator.js';
import { color } from '@pie-lib/render-ui';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { LikertValidationErrors } from '../controller/index.js';
import type {
  LikertChoice,
  LikertConfiguration,
  LikertModel,
  LikertOrientation as LikertOrientationValue,
  LikertScale as LikertScaleValue,
  LikertType as LikertTypeValue,
} from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<LikertModel> & {
  choices: LikertChoice[];
  errors?: LikertValidationErrors;
};

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type MainProps = {
  model: AuthorModel;
  configuration: LikertConfiguration;
  disableSidePanel?: boolean;
  onModelChanged: (model: AuthorModel, reset?: boolean) => void;
  onConfigurationChanged: (configuration: LikertConfiguration) => void;
  imageSupport?: MediaSupport<ImageHandler>;
  uploadSoundSupport?: MediaSupport<SoundHandler>;
};

type ModelEditorProps = {
  model: AuthorModel;
  onChangeModel: (model: AuthorModel) => void;
};

type DesignProps = MainProps & {
  onChangeModel: (model: AuthorModel) => void;
  onChoiceChanged: (index: number, choice: LikertChoice) => void;
  onPromptChanged: (prompt: string) => void;
  onTeacherInstructionsChanged: (teacherInstructions: string) => void;
};

const { Panel, toggle, radio } = settings;

const PromptHolder: any = styled(InputContainer)(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const RadioButtonsWrapper: any = styled('div')({
  display: 'flex',
  flexDirection: 'column',
});

/*
 * A column header is text, so it needs 4.5:1 and no neutral token clears that in
 * every scheme -- `--pie-border-gray` tops out at 3.17:1. grey[400] measured 1.88:1
 * on white, so this was failing already; `--pie-text` is the only correct answer.
 */
const RadioButtonsColumnHeader: any = styled('p')(({ theme }) => ({
  color: color.text(),
  fontSize: theme.typography.fontSize - 2,
}));

const LikertLabelHolder: any = styled('div')(({ theme }) => ({
  display: 'flex',
  width: '100%',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
}));

const LikertOptionsHolder: any = styled('div')(({ theme }) => ({
  display: 'flex',
  width: '100%',
  justifyContent: 'space-around',
  marginBottom: theme.spacing(2.5),
}));

const LikertLabelInput: any = styled(InputContainer)({
  width: 'calc(100% - 200px)',
  marginRight: 0,
});

const ErrorMessage: any = styled('p')(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: theme.typography.fontSize - 2,
}));

const StyledNumberTextField: any = styled(NumberTextField)({
  width: '100%',
});

const FlexRow: any = styled('div')({
  display: 'flex',
  flexDirection: 'row',
});

const LikertValueHolder: any = styled('div')(({ theme }) => ({
  paddingLeft: theme.spacing(2.5),
  width: '150px',
}));

const StyledEditableHtml: any = styled(EditableHtml)(({ theme }) => ({
  paddingTop: theme.spacing(2),
}));

const InputFormGroupIndex: any = styled('span')(({ theme }) => ({
  width: '30px',
  paddingTop: theme.spacing(4),
}));

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingTop: theme.spacing(1),
}));

const CustomColorRadio: any = styled(Radio)({
  color: `${color.tertiary()} !important`,
});

const LikertOrientation = (props: ModelEditorProps) => {
  const { model, onChangeModel } = props;

  const onChangeLikertOrientation = (e: React.ChangeEvent<HTMLInputElement>) => {
    const likertOrientation = e.target.value as LikertOrientationValue;

    onChangeModel({ ...model, likertOrientation });
  };

  return (
    <RadioButtonsWrapper>
      <RadioButtonsColumnHeader>Likert Orientation</RadioButtonsColumnHeader>
      <RadioGroup
        aria-label="likertOrientation"
        name="likertOrientation"
        value={model.likertOrientation}
        onChange={onChangeLikertOrientation}
      >
        <FormControlLabel value={LIKERT_ORIENTATION.horizontal} control={<CustomColorRadio />} label="Horizontal" />
        <FormControlLabel value={LIKERT_ORIENTATION.vertical} control={<CustomColorRadio />} label="Vertical" />
      </RadioGroup>
    </RadioButtonsWrapper>
  );
};

const LikertScale = (props: ModelEditorProps) => {
  const { model, onChangeModel } = props;
  const onChangeLikertScale = (e: React.ChangeEvent<HTMLInputElement>) => {
    const likertScale = e.target.value as LikertScaleValue;

    onChangeModel({
      ...model,
      likertScale,
      choices: generateChoices(likertScale, model.likertType),
    });
  };

  return (
    <RadioButtonsWrapper>
      <RadioButtonsColumnHeader>Likert Scale</RadioButtonsColumnHeader>
      <RadioGroup aria-label="likertScale" name="likertScale" value={model.likertScale} onChange={onChangeLikertScale}>
        <FormControlLabel value={LIKERT_SCALE.likert3} control={<CustomColorRadio />} label="Likert 3" />
        <FormControlLabel value={LIKERT_SCALE.likert5} control={<CustomColorRadio />} label="Likert 5" />
        <FormControlLabel value={LIKERT_SCALE.likert7} control={<CustomColorRadio />} label="Likert 7" />
      </RadioGroup>
    </RadioButtonsWrapper>
  );
};

const LikertType = (props: ModelEditorProps) => {
  const { model, onChangeModel } = props;
  const onChangeLikertType = (e: React.ChangeEvent<HTMLInputElement>) => {
    const likertType = e.target.value as LikertTypeValue;

    onChangeModel({
      ...model,
      likertType,
      choices: generateChoices(model.likertScale, likertType),
    });
  };

  return (
    <RadioButtonsWrapper>
      <RadioButtonsColumnHeader>Label Type</RadioButtonsColumnHeader>

      <FlexRow>
        <RadioGroup
          aria-label="likertLabelType"
          name="likertLabelType"
          value={model.likertType}
          onChange={onChangeLikertType}
        >
          <FormControlLabel value={LIKERT_TYPE.agreement} control={<CustomColorRadio />} label="Agreement" />
          <FormControlLabel value={LIKERT_TYPE.frequency} control={<CustomColorRadio />} label="Frequency" />
          <FormControlLabel value={LIKERT_TYPE.yesNo} control={<CustomColorRadio />} label="Yes/No" />
        </RadioGroup>

        <RadioGroup
          aria-label="likertLabelType"
          name="likertLabelType"
          value={model.likertType}
          onChange={onChangeLikertType}
        >
          <FormControlLabel value={LIKERT_TYPE.importance} control={<CustomColorRadio />} label="Importance" />
          <FormControlLabel value={LIKERT_TYPE.likelihood} control={<CustomColorRadio />} label="Likelihood" />
          <FormControlLabel value={LIKERT_TYPE.like} control={<CustomColorRadio />} label="Like" />
        </RadioGroup>
      </FlexRow>
    </RadioButtonsWrapper>
  );
};

const buildValuesMap = (model: AuthorModel) =>
  model.choices.reduce<Record<string, number>>((acc, choice) => {
    const accClone = { ...acc };
    const choiceValue = parseInt(choice.value as string);

    if (!accClone[choiceValue]) {
      accClone[choiceValue] = 0;
    }

    return { ...accClone, [choiceValue]: accClone[choiceValue] + 1 };
  }, {});

const Design = (props: DesignProps) => {
  const {
    configuration,
    imageSupport,
    model,
    onChangeModel,
    onChoiceChanged,
    onConfigurationChanged,
    onPromptChanged,
    onTeacherInstructionsChanged,
    uploadSoundSupport,
  } = props;
  const {
    contentDimensions = {},
    prompt = {},
    scoringType = {},
    settingsPanelDisabled,
    spellCheck = {},
    teacherInstructions = {},
    baseInputConfiguration = {},
    likertChoice = {},
  } = configuration || {};
  const { errors = {}, extraCSSRules, spellCheckEnabled, teacherInstructionsEnabled } = model || {};
  const { prompt: promptError, teacherInstructions: teacherInstructionsError } = errors;

  const valuesMap = buildValuesMap(model);
  const panelProperties = {
    teacherInstructionsEnabled: teacherInstructions.settings && toggle(teacherInstructions.label),
    spellCheckEnabled: spellCheck.settings && toggle(spellCheck.label),
    scoringType: scoringType.settings && radio(scoringType.label, ['auto', 'rubric']),
  };

  const getPluginProps = (props = {}) => {
    return Object.assign(
      {
        ...baseInputConfiguration,
      },
      props || {},
    );
  };

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
        <PromptHolder label={teacherInstructions.label}>
          <EditableHtml
            markup={model.teacherInstructions || ''}
            onChange={onTeacherInstructionsChanged}
            imageSupport={imageSupport}
            nonEmpty={false}
            error={teacherInstructionsError}
            spellCheck={spellCheckEnabled}
            uploadSoundSupport={uploadSoundSupport}
            pluginProps={getPluginProps(teacherInstructions?.inputConfiguration)}
          />
          {teacherInstructionsError && <ErrorText>{teacherInstructionsError}</ErrorText>}
        </PromptHolder>
      )}

      <PromptHolder label={prompt.label}>
        <EditableHtml
          markup={model.prompt}
          onChange={onPromptChanged}
          imageSupport={imageSupport}
          nonEmpty={false}
          error={promptError}
          spellCheck={spellCheckEnabled}
          disableUnderline
          uploadSoundSupport={uploadSoundSupport}
          pluginProps={getPluginProps(prompt?.inputConfiguration)}
        />
        {promptError && <ErrorText>{promptError}</ErrorText>}
      </PromptHolder>

      <LikertOptionsHolder>
        <LikertScale model={model} onChangeModel={onChangeModel} />
        <LikertType model={model} onChangeModel={onChangeModel} />
        <LikertOrientation model={model} onChangeModel={onChangeModel} />
      </LikertOptionsHolder>

      {model.choices.map((choice, index) => (
        <LikertLabelHolder key={`choice-${index}`}>
          <InputFormGroupIndex>{index + 1}.</InputFormGroupIndex>
          <LikertLabelInput key={`likert-label-${index}`} label={'Likert Label'}>
            <StyledEditableHtml
              markup={choice.label || ''}
              onChange={(c: string) => onChoiceChanged(index, { ...choice, label: c })}
              imageSupport={imageSupport}
              spellCheck={spellCheckEnabled}
              uploadSoundSupport={uploadSoundSupport}
              pluginProps={getPluginProps(likertChoice?.inputConfiguration)}
            />
          </LikertLabelInput>

          <LikertValueHolder>
            <StyledNumberTextField
              label={'Likert Value'}
              value={choice.value}
              max={100}
              min={-100}
              onChange={(_e: unknown, t: number) => {
                onChoiceChanged(index, { ...choice, value: t });
              }}
              imageSupport={imageSupport}
            />
            {valuesMap[choice.value] && valuesMap[choice.value] > 1 && (
              <ErrorMessage>Value should be unique</ErrorMessage>
            )}
          </LikertValueHolder>
        </LikertLabelHolder>
      ))}
    </layout.ConfigLayout>
  );
};

export class Main extends React.Component<MainProps> {
  onChoiceChanged = (index: number, choice: LikertChoice) => {
    const { model, onModelChanged } = this.props;

    model.choices = model.choices.map((choice) => merge({}, choice) as LikertChoice);
    model.choices.splice(index, 1, choice);

    onModelChanged(model);
  };

  onPromptChanged = (prompt: string) => {
    this.props.onModelChanged({ ...this.props.model, prompt });
  };

  onTeacherInstructionsChanged = (teacherInstructions: string) => {
    this.props.onModelChanged({ ...this.props.model, teacherInstructions });
  };

  render() {
    return (
      <Design
        {...this.props}
        onChangeModel={this.props.onModelChanged}
        onChoiceChanged={this.onChoiceChanged}
        onPromptChanged={this.onPromptChanged}
        onTeacherInstructionsChanged={this.onTeacherInstructionsChanged}
      />
    );
  }
}

export default Main;
