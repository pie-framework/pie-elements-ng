import React from 'react';
import { cloneDeep, isEmpty, pick, throttle } from '@pie-element/shared-lodash';
import EditableHtml, { ALL_PLUGINS } from '@pie-lib/editable-html-tip-tap';
import { InputContainer, layout, settings } from '@pie-lib/config-ui';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Info from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { ConfigureLanguageOptions, EditableHtmlConfigureProp } from '@pie-element/shared-types';

import ECRToolbar from './ecr-toolbar.js';
import AlternateResponses from './alternateResponses.js';
import { decodeHTML, getAdjustedLength } from './markupUtils.js';
import { generateValidationMessage } from './utils.js';
import type { ExplicitConstructedResponseValidationErrors } from '../controller/index.js';
import type {
  Choices,
  ExplicitConstructedResponseConfiguration,
  ExplicitConstructedResponseModel,
} from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<ExplicitConstructedResponseModel> & {
  choices: Choices;
  markup: string;
  slateMarkup: string;
  errors?: ExplicitConstructedResponseValidationErrors;
};

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type MainProps = {
  model: AuthorModel;
  configuration: ExplicitConstructedResponseConfiguration;
  disableSidePanel?: boolean;
  onModelChanged: (model: Partial<AuthorModel>, reset?: boolean) => void;
  onConfigurationChanged: (configuration: ExplicitConstructedResponseConfiguration, reset?: boolean) => void;
  imageSupport?: MediaSupport<ImageHandler>;
  uploadSoundSupport?: MediaSupport<SoundHandler>;
};

type State = {
  /** The editor markup when the author mounted */
  markup?: string;
  /** Choices of response areas removed from the markup, kept so an undo restores them */
  cachedChoices?: Choices;
};

/** A response area node in the template editor */
type ResponseAreaNode = { attrs: { index: string } };

const { toggle, Panel, dropdown } = settings;

const PromptHolder: any = styled(InputContainer)(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(1),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const MarkupContainer: any = styled(EditableHtml)(({ theme }) => ({
  minHeight: '100px',
  paddingTop: theme.spacing(1),
  width: '100%',
  '& [data-slate-editor="true"]': {
    minHeight: '100px',
  },
}));

const StyledText: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize + 2,
}));

const StyledTooltip: any = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    fontSize: theme.typography.fontSize - 2,
    whiteSpace: 'pre',
    maxWidth: '500px',
  },
}));

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingTop: theme.spacing(1),
}));

const FlexContainer: any = styled('div')({
  display: 'flex',
  alignItems: 'center',
});

const ResponseHeader: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize + 2,
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(1),
}));

const createElementFromHTML = (htmlString: string) => {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  return div;
};

export class Main extends React.Component<MainProps, State> {
  state: State = {};

  componentDidMount() {
    const {
      model: { slateMarkup, choices, maxLengthPerChoice = [] },
      onModelChanged,
    } = this.props;
    const undefinedLengths = !maxLengthPerChoice.length;

    this.setState({ markup: slateMarkup });

    // calculate maxLengthPerChoice array if it is not defined or defined incorrectly
    Object.values(choices).forEach((choice, index) => {
      const labelLengthsArr = choice.map((choice) => decodeHTML(choice.label || '').length);
      const length = Math.max(...labelLengthsArr);

      if (
        undefinedLengths ||
        !maxLengthPerChoice[index] ||
        maxLengthPerChoice[index] < length ||
        maxLengthPerChoice[index] > length + 10
      ) {
        maxLengthPerChoice[index] = getAdjustedLength(length);
      }
    });

    onModelChanged({ maxLengthPerChoice });
  }

  onModelChange = (newVal: Partial<AuthorModel>) => {
    this.props.onModelChanged({ ...newVal });
  };

  onPromptChanged = (prompt: string) => {
    this.props.onModelChanged({ prompt });
  };

  onRationaleChanged = (rationale: string) => {
    this.props.onModelChanged({ rationale });
  };

  onTeacherInstructionsChanged = (teacherInstructions: string) => {
    const { onModelChanged } = this.props;

    onModelChanged({ teacherInstructions });
  };

  onMarkupChanged = (slateMarkup: string) => {
    this.props.onModelChanged({ slateMarkup });
  };

  onResponsesChanged = (choices: Choices) => {
    this.props.onModelChanged({ choices });
  };

  onLengthChanged = (maxLengthPerChoice: number[]) => {
    const { onModelChanged } = this.props;

    onModelChanged({ maxLengthPerChoice });
  };

  onChangeResponse = (index: string, newVal: string) => {
    const { model, onModelChanged } = this.props;
    const { choices } = model;
    // componentDidMount sets `maxLengthPerChoice`, so it is present here.
    let maxLengthPerChoice = model.maxLengthPerChoice as number[];
    const newValLength = decodeHTML(newVal || '').length;

    if (!choices[index] || !choices[index].length) {
      choices[index] = [{ label: newVal || '', value: '0' }];

      // add default values for missing choices up to the new index position
      const nbOfMissingChoices =
        Number(index) > maxLengthPerChoice.length ? Number(index) - maxLengthPerChoice.length : 0;

      maxLengthPerChoice = [...maxLengthPerChoice, ...Array(nbOfMissingChoices).fill(1)];

      maxLengthPerChoice.splice(Number(index), 0, getAdjustedLength(newValLength));
    } else {
      choices[index][0].label = newVal || '';

      if (
        maxLengthPerChoice &&
        (maxLengthPerChoice[Number(index)] < newValLength || maxLengthPerChoice[Number(index)] > newValLength + 10)
      ) {
        maxLengthPerChoice[Number(index)] = getAdjustedLength(newValLength);
      }
    }

    onModelChanged({ choices, maxLengthPerChoice });
  };

  onChange = (markup: string) => {
    const {
      model: { choices, maxLengthPerChoice },
      onModelChanged,
    } = this.props;
    const domMarkup = createElementFromHTML(markup);
    const allRespAreas = domMarkup.querySelectorAll<HTMLElement>('[data-type="explicit_constructed_response"]');

    const allChoices: Choices = {};
    const updatedMaxLengthPerChoice: number[] = [];

    allRespAreas.forEach((el, index) => {
      const areaIndex = el.dataset.index as string;
      const newChoices = cloneDeep(choices[areaIndex]);

      if (newChoices) {
        newChoices[0] = {
          label: el.dataset.value || '',
          value: '0',
        };

        updatedMaxLengthPerChoice[index] = (maxLengthPerChoice as number[])[Number(areaIndex)];
      }

      allChoices[index] = newChoices;
      el.dataset.index = `${index}`;
    });

    const callback = () =>
      onModelChanged({
        choices: allChoices,
        slateMarkup: domMarkup.innerHTML,
        maxLengthPerChoice: updatedMaxLengthPerChoice,
      });

    this.setState({ cachedChoices: undefined }, callback);
  };

  onHandleAreaChange = throttle(
    (nodes: { index: string }[] | undefined) => {
      const {
        model: { choices },
        onModelChanged,
      } = this.props;
      const { cachedChoices } = this.state;

      if (!nodes) {
        return;
      }

      const newChoices: Choices = choices ? cloneDeep(choices) : {};
      const newCachedChoices: Choices = cachedChoices ? cloneDeep(cachedChoices) : {};

      nodes.forEach((node) => {
        const keyForNode = node.index;

        if (!newChoices[keyForNode] && newCachedChoices[keyForNode]) {
          Object.assign(newChoices, pick(newCachedChoices, keyForNode));

          if (Object.prototype.hasOwnProperty.call(newCachedChoices, keyForNode)) {
            delete newCachedChoices[keyForNode];
          }
        } else {
          Object.assign(newCachedChoices, pick(newChoices, keyForNode));

          if (Object.prototype.hasOwnProperty.call(newChoices, keyForNode)) {
            delete newChoices[keyForNode];
          }
        }
      });

      const callback = () => onModelChanged({ choices: newChoices });

      this.setState({ cachedChoices: newCachedChoices }, callback);
    },
    500,
    { trailing: false, leading: true },
  );

  render() {
    const { model, configuration, onConfigurationChanged, imageSupport, uploadSoundSupport } = this.props;

    const {
      baseInputConfiguration = {},
      contentDimensions = {},
      maxImageWidth = {},
      maxImageHeight = {},
      maxLengthPerChoice = {},
      maxResponseAreas,
      partialScoring = {},
      playerSpellCheck = {},
      prompt = {},
      rationale = {},
      template = {},
      settingsPanelDisabled,
      spellCheck = {},
      editSource = {},
      teacherInstructions = {},
      withRubric = {},
      mathMlOptions = {},
      language = {},
      languageChoices = {} as Partial<ConfigureLanguageOptions>,
      spanishButton = {},
      responseAreaInputConfiguration = {},
    } = configuration || {};
    const {
      errors,
      extraCSSRules,
      maxLengthPerChoiceEnabled,
      promptEnabled,
      rationaleEnabled,
      spellCheckEnabled,
      teacherInstructionsEnabled,
      toolbarEditorPosition,
    } = model || {};

    const {
      choices: choicesErrors = {},
      prompt: promptError,
      rationale: rationaleError,
      responseAreas: responseAreasError,
      teacherInstructions: teacherInstructionsError,
    } = errors || {};
    const validationMessage = generateValidationMessage(configuration);

    const defaultImageMaxWidth = maxImageWidth && maxImageWidth.prompt;
    const defaultImageMaxHeight = maxImageHeight && maxImageHeight.prompt;

    const toolbarOpts = {
      position: toolbarEditorPosition === 'top' ? 'top' : 'bottom',
    };

    const panelSettings = {
      partialScoring: partialScoring.settings && toggle(partialScoring.label),
      maxLengthPerChoiceEnabled: maxLengthPerChoice.settings && toggle(maxLengthPerChoice.label),
      'language.enabled': language.settings && toggle(language.label, true),
      language: language.settings && language.enabled && dropdown(languageChoices.label, languageChoices.options),
      'responseAreaInputConfiguration.inputConfiguration.characters.disabled':
        spanishButton.settings && toggle(spanishButton.label, true),
    };
    const panelProperties = {
      teacherInstructionsEnabled: teacherInstructions.settings && toggle(teacherInstructions.label),
      rationaleEnabled: rationale.settings && toggle(rationale.label),
      promptEnabled: prompt.settings && toggle(prompt.label),
      spellCheckEnabled: spellCheck.settings && toggle(spellCheck.label),
      playerSpellCheckEnabled: playerSpellCheck.settings && toggle(playerSpellCheck.label),
      rubricEnabled: withRubric?.settings && toggle(withRubric?.label),
      'editSource.enabled': editSource?.settings && toggle(editSource.label, true),
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
            onChangeModel={(model) => this.onModelChange(model)}
            onChangeConfiguration={(configuration) => onConfigurationChanged(configuration, true)}
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
              ariaLabel={teacherInstructions?.label || 'Teacher Instructions'}
              className="prompt"
              markup={model.teacherInstructions || ''}
              onChange={this.onTeacherInstructionsChanged}
              imageSupport={imageSupport}
              nonEmpty={false}
              error={teacherInstructionsError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(teacherInstructions?.inputConfiguration)}
              spellCheck={spellCheckEnabled}
              maxImageWidth={(maxImageWidth && maxImageWidth.teacherInstructions) || defaultImageMaxWidth}
              maxImageHeight={(maxImageHeight && maxImageHeight.teacherInstructions) || defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
              autoWidthToolbar
            />
            {teacherInstructionsError && <ErrorText>{teacherInstructionsError}</ErrorText>}
          </PromptHolder>
        )}

        {promptEnabled && (
          <PromptHolder label={prompt.label}>
            <EditableHtml
              ariaLabel={prompt?.label || 'Prompt'}
              className="prompt"
              markup={model.prompt}
              onChange={this.onPromptChanged}
              imageSupport={imageSupport}
              nonEmpty={false}
              disableUnderline
              error={promptError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(prompt?.inputConfiguration)}
              spellCheck={spellCheckEnabled}
              maxImageWidth={defaultImageMaxWidth}
              maxImageHeight={defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
              autoWidthToolbar
            />
            {promptError && <ErrorText>{promptError}</ErrorText>}
          </PromptHolder>
        )}

        <FlexContainer>
          <StyledText component="div">Define Template, Choices, and Correct Responses</StyledText>
          <StyledTooltip disableFocusListener disableTouchListener placement={'right'} title={validationMessage}>
            <Info fontSize={'small'} color={'primary'} style={{ marginLeft: '8px' }} />
          </StyledTooltip>
        </FlexContainer>

        <MarkupContainer
          ariaLabel="Response template"
          activePlugins={ALL_PLUGINS}
          toolbarOpts={{ position: 'top' }}
          spellCheck={spellCheckEnabled}
          pluginProps={getPluginProps(template?.inputConfiguration)}
          responseAreaProps={{
            type: 'explicit-constructed-response',
            options: {
              duplicates: true,
            },
            maxResponseAreas: maxResponseAreas,
            respAreaToolbar: (nodeInfo: [ResponseAreaNode, number], editor: object, onToolbarDone: () => void) => {
              const [node, pos] = nodeInfo;
              const { model } = this.props;
              const correctChoice = (model.choices[node.attrs.index] || [])[0];
              return () => (
                <ECRToolbar
                  onChangeResponse={(newVal: string) => this.onChangeResponse(node.attrs.index, newVal)}
                  node={node}
                  pos={pos}
                  editor={editor}
                  onToolbarDone={onToolbarDone}
                  correctChoice={correctChoice}
                  maxLengthPerChoiceEnabled={maxLengthPerChoiceEnabled}
                  pluginProps={getPluginProps(responseAreaInputConfiguration?.inputConfiguration)}
                />
              );
            },
            error: () => choicesErrors,
            onHandleAreaChange: this.onHandleAreaChange,
          }}
          markup={model.slateMarkup}
          onChange={this.onChange}
          imageSupport={imageSupport}
          disableImageAlignmentButtons={true}
          // @ts-expect-error Main has no `onBlur`, so this passes undefined.
          onBlur={this.onBlur}
          disabled={false}
          highlightShape={false}
          error={responseAreasError}
          uploadSoundSupport={uploadSoundSupport}
          languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
          mathMlOptions={mathMlOptions}
          autoWidthToolbar
        />
        {responseAreasError && <ErrorText>{responseAreasError}</ErrorText>}

        {!isEmpty(model.choices) && (
          <ResponseHeader>
            {`Define Alternates ${maxLengthPerChoiceEnabled ? 'and Character Limits' : ''}`}
          </ResponseHeader>
        )}
        <AlternateResponses
          model={model}
          onChange={this.onResponsesChanged}
          onLengthChange={this.onLengthChanged}
          maxLengthPerChoiceEnabled={maxLengthPerChoiceEnabled as boolean}
          spellCheck={spellCheckEnabled}
          choicesErrors={choicesErrors}
          pluginProps={getPluginProps(responseAreaInputConfiguration?.inputConfiguration)}
        />

        {rationaleEnabled && (
          <PromptHolder label={rationale.label}>
            <EditableHtml
              ariaLabel={rationale?.label || 'Rationale'}
              className="prompt"
              markup={model.rationale || ''}
              onChange={this.onRationaleChanged}
              imageSupport={imageSupport}
              error={rationaleError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(rationale?.inputConfiguration)}
              spellCheck={spellCheckEnabled}
              maxImageWidth={(maxImageWidth && maxImageWidth.rationale) || defaultImageMaxWidth}
              maxImageHeight={(maxImageHeight && maxImageHeight.rationale) || defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
              autoWidthToolbar
            />
            {rationaleError && <ErrorText>{rationaleError}</ErrorText>}
          </PromptHolder>
        )}
      </layout.ConfigLayout>
    );
  }
}

export default Main;
