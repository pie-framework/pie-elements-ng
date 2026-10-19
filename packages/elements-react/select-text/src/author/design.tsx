import React from 'react';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import { cloneDeep, debounce } from '@pie-element/shared-lodash';
import { Tokenizer } from '@pie-lib/text-select';
import { InputContainer, NumberTextField, FeedbackConfig, settings, layout } from '@pie-lib/config-ui';
import Chip from '@mui/material/Chip';
import Info from '@mui/icons-material/Info';
import debug from 'debug';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import Tooltip from '@mui/material/Tooltip';
import type { ConfigureLanguageOptions } from '@pie-element/shared-types';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import { generateValidationMessage } from './utils.js';
import type { SelectTextValidationErrors } from '../controller/index.js';
import type { ComplexFeedbackType, SelectTextConfiguration, SelectTextModel, TextToken } from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<SelectTextModel> & { errors?: SelectTextValidationErrors };

export type DesignProps = {
  model: AuthorModel;
  configuration: SelectTextConfiguration;
  onModelChanged: (model: AuthorModel) => void;
  onConfigurationChanged: (configuration: SelectTextConfiguration) => void;
  imageSupport?: {
    add: (handler: ImageHandler) => void;
    delete: (src: string, done: DeleteDone) => void;
  };
  uploadSoundSupport?: {
    add: (handler: SoundHandler) => void;
    delete: (src: string, done: DeleteDone) => void;
  };
};

type DesignState = { text: string };

const { Panel, toggle, radio, dropdown } = settings;

const StyledInputContainer: any = styled(InputContainer)(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledEditableHtml: any = styled(EditableHtml)({
  width: '100%',
});

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingTop: theme.spacing(1),
}));

const StyledTextField: any = styled(TextField)({
  width: '100%',
});

const TokenizerContainer: any = styled(InputContainer)(({ theme }) => ({
  paddingRight: 0,
  marginRight: 0,
  position: 'relative',
  '&:after': {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    content: '""',
    backgroundColor: theme.palette.primary.main,
  },
  marginBottom: theme.spacing(1),
}));

const StyledTooltip: any = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    fontSize: theme.typography.fontSize - 2,
    whiteSpace: 'pre',
    maxWidth: '500px',
  },
}));

const StyledTokenizer: any = styled(Tokenizer)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const StyledChip: any = styled(Chip)(({ theme }) => ({
  marginTop: theme.spacing(0.5),
  marginRight: theme.spacing(2),
}));

const TokensDetails: any = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: theme.spacing(2.5),
}));

const StyledNumberTextField: any = styled(NumberTextField)(({ theme }) => ({
  width: '180px',
  margin: `${theme.spacing(0.5)} auto 0`,
}));

const log = debug('@pie-element:select-text:configure');

export class Design extends React.Component<DesignProps, DesignState> {
  static defaultProps = {};

  constructor(props: DesignProps) {
    super(props);

    const { model } = this.props;

    this.state = {
      text: (model && model.text) || '',
    };
  }

  componentDidMount() {
    this.syncMaxSelections();
  }

  componentDidUpdate() {
    this.syncMaxSelections();
  }

  // With the selection count control hidden, maxSelections follows the correct answer, including models saved
  // before the control was hidden.
  syncMaxSelections = () => {
    const { model, onModelChanged } = this.props;

    if (!model || !this.isSelectionCountHidden()) {
      return;
    }

    const correctTokenCount = (model.tokens || []).filter((t) => t.correct).length;

    if (model.maxSelections !== correctTokenCount) {
      onModelChanged({ ...model, maxSelections: correctTokenCount });
    }
  };

  UNSAFE_componentWillReceiveProps(nProps: DesignProps) {
    const { model } = nProps;

    if (model && model.text) {
      this.setState({
        text: model.text,
      });
    }
  }

  updateText = debounce((val: string) => {
    this.apply((u) => {
      u.text = val;
      u.tokens = [];

      if (this.isSelectionCountHidden()) {
        u.maxSelections = 0;
      }
    });
  }, 200);

  changeText = (event: React.ChangeEvent<HTMLInputElement>) => this.updateText(event.target.value);

  changeTokens = (tokens: TextToken[], mode: SelectTextModel['mode']) => {
    this.apply((u) => {
      u.tokens = tokens;
      u.mode = mode;

      const correctTokenCount = tokens.filter((t) => t.correct).length;

      if (this.isSelectionCountHidden()) {
        // the control is not available to the author, so keep it in sync with the correct answer
        u.maxSelections = correctTokenCount;
        return;
      }

      const max = isFinite(u.maxSelections as number) ? (u.maxSelections as number) : 0;

      u.maxSelections = Math.max(max, correctTokenCount);
    });
  };

  isSelectionCountHidden = () => !this.props.configuration?.selectionCount?.settings;

  
  changeMaxSelections = (_event: unknown, max: number) => {
    this.apply((u) => (u.maxSelections = max));
  };

  apply = (fn: (update: AuthorModel) => void) => {
    const { onModelChanged, model } = this.props;
    const update = cloneDeep(model);

    fn(update);
    onModelChanged(update);
  };

  changeFeedback = (feedback: ComplexFeedbackType) => {
    this.apply((u) => (u.feedback = feedback));
  };

  changePartialScoring = (partialScoring: boolean) => {
    const { onModelChanged, model } = this.props;
    const update = cloneDeep(model);
    update.partialScoring = partialScoring;

    onModelChanged(update);
  };

  onPromptChanged = (prompt: string) => {
    const { onModelChanged, model } = this.props;
    const update = cloneDeep(model);

    update.prompt = prompt;
    onModelChanged(update);
  };

  onTeacherInstructionsChanged = (teacherInstructions: string) => {
    const { onModelChanged, model } = this.props;
    const update = cloneDeep(model);

    update.teacherInstructions = teacherInstructions;
    onModelChanged(update);
  };

  onRationaleChanged = (rationale: string) => {
    const { onModelChanged, model } = this.props;

    onModelChanged({ ...model, rationale });
  };

  render() {
    const { text: textValue } = this.state;
    const { configuration, imageSupport, model, onConfigurationChanged, onModelChanged, uploadSoundSupport } =
      this.props;
    const {
      baseInputConfiguration = {},
      correctAnswer = {},
      contentDimensions = {},
      feedback = {},
      highlightChoices = {},
      mode = {},
      partialScoring = {},
      prompt = {},
      rationale = {},
      selectionCount = {},
      selections = {},
      settingsPanelDisabled,
      scoringType = {},
      spellCheck = {},
      studentInstructions = {},
      teacherInstructions = {},
      text = {},
      tokens = {},
      maxImageWidth = {},
      maxImageHeight = {},
      withRubric = {},
      mathMlOptions = {},
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
      selectionsError,
      teacherInstructions: teacherInstructionsError,
      tokensError,
    } = errors || {};
    const validationMessage = generateValidationMessage(configuration);

    const defaultImageMaxWidth = maxImageWidth && maxImageWidth.prompt;
    const defaultImageMaxHeight = maxImageHeight && maxImageHeight.prompt;

    let { tokens: tokensModel } = model;
    tokensModel = tokensModel || [];

    const toolbarOpts = {
      position: toolbarEditorPosition === 'top' ? 'top' : 'bottom',
    };

    log('[render] maxSelections:', model.maxSelections);

    const panelSettings = {
      partialScoring: partialScoring.settings && toggle(partialScoring.label),
      highlightChoices: highlightChoices.settings && toggle(highlightChoices.label),
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
            onChangeConfiguration={onConfigurationChanged}
            groups={{
              Settings: panelSettings,
              Properties: panelProperties,
            }}
          />
        }
      >
        {teacherInstructionsEnabled && (
          <StyledInputContainer label={teacherInstructions.label}>
            <StyledEditableHtml
              markup={model.teacherInstructions || ''}
              onChange={this.onTeacherInstructionsChanged}
              imageSupport={imageSupport}
              nonEmpty={false}
              error={teacherInstructionsError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(configuration?.teacherInstructions?.inputConfiguration)}
              spellCheck={spellCheckEnabled}
              maxImageWidth={(maxImageWidth && maxImageWidth.teacherInstructions) || defaultImageMaxWidth}
              maxImageHeight={(maxImageHeight && maxImageHeight.teacherInstructions) || defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
            {teacherInstructionsError && <ErrorText>{teacherInstructionsError}</ErrorText>}
          </StyledInputContainer>
        )}

        {promptEnabled && (
          <StyledInputContainer label={prompt.label || ''}>
            <StyledEditableHtml
              markup={model.prompt}
              onChange={this.onPromptChanged}
              imageSupport={imageSupport}
              error={promptError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(configuration?.prompt?.inputConfiguration)}
              spellCheck={spellCheckEnabled}
              maxImageWidth={defaultImageMaxWidth}
              maxImageHeight={defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
            {promptError && <ErrorText>{promptError}</ErrorText>}
          </StyledInputContainer>
        )}

        {text.settings && (
          <StyledInputContainer label={text.label || ''}>
            <StyledTextField
              variant="standard"
              multiline
              defaultValue={textValue}
              onChange={this.changeText}
              spellCheck={spellCheckEnabled}
            />
          </StyledInputContainer>
        )}

        {tokens.settings && (
          <TokenizerContainer label={tokens.label || ''}>
            <StyledTooltip disableFocusListener disableTouchListener placement={'right'} title={validationMessage}>
              <Info fontSize={'small'} color={'primary'} style={{ position: 'absolute', left: '48px', top: '-3px' }} />
            </StyledTooltip>

            <StyledTokenizer text={model.text} tokens={tokensModel} onChange={this.changeTokens} />
          </TokenizerContainer>
        )}
        {tokensError && <ErrorText>{tokensError}</ErrorText>}
        {selectionsError && <ErrorText>{selectionsError}</ErrorText>}

        <TokensDetails>
          {mode.settings && <StyledChip label={`${mode.label}: ${model.mode ? model.mode : 'None'}`} />}

          {selections.settings && <StyledChip label={`${selections.label}: ${tokensModel.length}`} />}

          {correctAnswer.settings && (
            <StyledChip label={`${correctAnswer.label}: ${tokensModel.filter((t) => t.correct).length}`} />
          )}

          {selectionCount.settings && (
            <StyledNumberTextField
              min={tokensModel.filter((t) => t.correct).length || 0}
              label={`${selectionCount.label} (0:any)`}
              max={tokensModel.length}
              value={model.maxSelections}
              onChange={this.changeMaxSelections}
            />
          )}
        </TokensDetails>

        {rationaleEnabled && (
          <StyledInputContainer label={rationale.label || ''}>
            <StyledEditableHtml
              markup={model.rationale || ''}
              onChange={this.onRationaleChanged}
              imageSupport={imageSupport}
              error={rationaleError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(configuration?.rationale?.inputConfiguration)}
              spellCheck={spellCheckEnabled}
              maxImageWidth={(maxImageWidth && maxImageWidth.rationale) || defaultImageMaxWidth}
              maxImageHeight={(maxImageHeight && maxImageHeight.rationale) || defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
            {rationaleError && <ErrorText>{rationaleError}</ErrorText>}
          </StyledInputContainer>
        )}

        {feedbackEnabled && (
          <FeedbackConfig feedback={model.feedback} onChange={this.changeFeedback} toolbarOpts={toolbarOpts} />
        )}
      </layout.ConfigLayout>
    );
  }
}

export default Design;
