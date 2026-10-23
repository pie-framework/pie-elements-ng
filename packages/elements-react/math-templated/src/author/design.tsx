import React from 'react';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Info from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import { cloneDeep, pick, throttle } from '@pie-element/shared-lodash';
import { InputContainer, settings, layout } from '@pie-lib/config-ui';
import EditableHtml, { ALL_PLUGINS } from '@pie-lib/editable-html-tip-tap';
const { dropdown } = settings;

import Response from './response.js';
import { processMarkup, createSlateMarkup } from './markupUtils.js';
import { generateValidationMessage } from './utils.js';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { ConfigureLanguageOptions } from '@pie-element/shared-types';
import type { MathTemplatedValidationErrors } from '../controller/index.js';
import type {
  EquationEditor,
  MathTemplatedConfiguration,
  MathTemplatedModel,
  MathTemplatedResponse,
} from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<MathTemplatedModel> & {
  errors?: MathTemplatedValidationErrors;
};

type Responses = Record<string, MathTemplatedResponse>;

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type DesignProps = {
  model: AuthorModel;
  configuration: MathTemplatedConfiguration;
  onModelChanged: (model: AuthorModel) => void;
  onConfigurationChanged: (configuration: MathTemplatedConfiguration) => void;
  /** Not read: the settings panel shows regardless */
  disableSidePanel?: boolean;
  imageSupport?: MediaSupport<ImageHandler>;
  uploadSoundSupport?: MediaSupport<SoundHandler>;
};

type DesignState = {
  markup?: string;
  cachedResponses?: Responses;
  activeAnswerBlock?: string;
};

/** A response area the editor removed, as `onHandleAreaChange` reports it */
type RemovedArea = { index: string };

const { Panel, toggle } = settings;

const StyledInputContainer: any = styled(InputContainer)(({ theme }) => ({
  width: '100%',
  paddingTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const StyledEditableHtml: any = styled(EditableHtml)({
  width: '100%',
});

const ErrorText: any = styled('div')(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: '0.75rem',
  marginTop: theme.spacing(1),
}));

const ResponseAreaError: any = styled('div')(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: '0.75rem',
  marginBottom: theme.spacing(1),
}));

const StyledMarkup: any = styled(EditableHtml)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const StyledSelectContainer: any = styled(InputContainer)(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(2),
  '& > *:not(label)': {
    marginTop: theme.spacing(1),
  },
  marginBottom: theme.spacing(2),
}));

const StyledSelect: any = styled(Select)({
  width: '100%',
});

const StyledTitle: any = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSize * 1.25,
  fontWeight: 'bold',
}));

const TooltipContainer: any = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const StyledTooltip: any = styled(Tooltip)(({ theme }) => ({
  '& .MuiTooltip-tooltip': {
    fontSize: theme.typography.fontSize - 2,
    whiteSpace: 'pre',
    maxWidth: '500px',
  },
}));

const createElementFromHTML = (htmlString: string) => {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  return div;
};

export class Design extends React.Component<DesignProps, DesignState> {
  state: DesignState = {};

  componentDidMount() {
    const {
      model: { slateMarkup },
    } = this.props;

    this.setState({ markup: slateMarkup });
  }

  handleChange = <K extends keyof AuthorModel>(key: K, value: AuthorModel[K]) => {
    const { onModelChanged, model } = this.props;
    const updatedModel = cloneDeep(model);
    updatedModel[key] = value;
    onModelChanged(updatedModel);
  };

  onResponseChange = (response: MathTemplatedResponse, index: number) => {
    const { model, onModelChanged } = this.props;
    const newModel = { ...model };

    (newModel.responses as Responses)[index] = response;
    onModelChanged(newModel);
  };

  onResponseDone = () => {
    const { model, onModelChanged } = this.props;

    onModelChanged({
      ...model,
      slateMarkup: createSlateMarkup(model.markup, model.responses),
    });
  };

  onChangeResponse = (index: number, newVal: string) => {
    const { model, onModelChanged } = this.props;
    // Writes an array of responses per response area, the shape `prepareModel()` repairs.
    const responses = model.responses as unknown as Record<number, Array<Partial<MathTemplatedResponse>>>;

    if (!responses[index]) {
      responses[index] = [{ answer: newVal || '', id: 'response' + index, allowSpaces: true }];
    } else {
      responses[index][0].answer = newVal || '';
    }

    onModelChanged({ ...model, responses: responses as unknown as Responses });
  };

  onResponsesChanged = (responses: Responses) => {
    this.props.onModelChanged({ ...this.props.model, responses });
  };

  onChange = (markup: string) => {
    const {
      model: { responses, validationDefault, allowTrailingZerosDefault, ignoreOrderDefault },
      onModelChanged,
    } = this.props;
    const newResponses: Responses = {};
    const domMarkup = createElementFromHTML(markup);
    const responseAreas = domMarkup.querySelectorAll<HTMLElement>('[data-type="math_templated"]');

    responseAreas.forEach((element, index) => {
      const { value, index: dataIndex } = element.dataset;

      if (!value) {
        element.dataset.value = '';
      }

      newResponses[index] = (responses as Responses)[dataIndex as string] || {
        allowSpaces: true,
        validation: validationDefault || 'symbolic',
        allowTrailingZeros: allowTrailingZerosDefault || false,
        ignoreOrder: ignoreOrderDefault || false,
        answer: '',
        alternates: {},
      };

      element.dataset.index = index.toString();
    });

    const processedMarkup = processMarkup(markup);

    const callback = () =>
      onModelChanged({
        ...this.props.model,
        slateMarkup: domMarkup.innerHTML,
        responses: newResponses,
        markup: processedMarkup,
      });

    this.setState({ cachedResponses: undefined }, callback);
  };

  onHandleAreaChange = throttle(
    (nodes: RemovedArea[] | null | undefined) => {
      const {
        model: { responses },
        onModelChanged,
      } = this.props;
      const { cachedResponses } = this.state;

      if (!nodes) {
        return;
      }

      const newChoices: Responses = responses ? cloneDeep(responses) : {};
      const newCachedResponses: Responses = cachedResponses ? cloneDeep(cachedResponses) : {};

      nodes.forEach((node) => {
        const keyForNode = node.index;

        if (!newChoices[keyForNode] && newCachedResponses[keyForNode]) {
          Object.assign(newChoices, pick(newCachedResponses, keyForNode));

          if (Object.prototype.hasOwnProperty.call(newCachedResponses, keyForNode)) {
            delete newCachedResponses[keyForNode];
          }
        } else {
          Object.assign(newCachedResponses, pick(newChoices, keyForNode));

          if (Object.prototype.hasOwnProperty.call(newChoices, keyForNode)) {
            delete newChoices[keyForNode];
          }
        }
      });

      const callback = () => onModelChanged({ ...this.props.model, responses: newChoices });

      this.setState({ cachedResponses: newCachedResponses }, callback);
    },
    500,
    { trailing: false, leading: true },
  );

  onBlur = (e: React.FocusEvent<HTMLElement> | undefined) => {
    const { relatedTarget, currentTarget } = e || ({} as Partial<React.FocusEvent<HTMLElement>>);

    function getParentWithRoleTooltip(element: HTMLElement | null | undefined, depth = 0): HTMLElement | null {
      // only run this max 16 times
      if (!element || depth >= 16) return null;

      const parent = element.offsetParent as HTMLElement | null;

      if (!parent) return null;

      if (parent.getAttribute('role') === 'tooltip') {
        return parent;
      }

      return getParentWithRoleTooltip(parent, depth + 1);
    }

    function getDeepChildDataKeypad(element: Element | null | undefined, depth = 0): Element | null {
      // only run this max 4 times
      if (!element || depth >= 4) return null;

      const child = element?.children?.[0];

      if (!child) return null;

      if (child.attributes && child.attributes.getNamedItem('data-keypad')) {
        return child;
      }

      return getDeepChildDataKeypad(child, depth + 1);
    }

    const parentWithTooltipRole = getParentWithRoleTooltip(relatedTarget as HTMLElement | null | undefined);
    const childWithDataKeypad = parentWithTooltipRole ? getDeepChildDataKeypad(parentWithTooltipRole) : null;

    if (!relatedTarget || !currentTarget || !childWithDataKeypad?.attributes.getNamedItem('data-keypad')) {
      this.setState({ activeAnswerBlock: '' });
    }
  };

  render() {
    const { configuration, imageSupport, model, onConfigurationChanged, onModelChanged, uploadSoundSupport } =
      this.props;

    const {
      baseInputConfiguration = {},
      contentDimensions = {},
      prompt = {},
      rationale = {},
      settingsPanelDisabled,
      teacherInstructions = {},
      language = {},
      languageChoices = {} as Partial<ConfigureLanguageOptions>,
      spellCheck = {},
      playerSpellCheck = {},
      maxImageWidth = {},
      maxImageHeight = {},
      mathMlOptions = {},
      template = {},
      editSource = {},
      ignoreOrder: cIgnoreOrder = {},
      allowTrailingZeros: cAllowTrailingZeros = {},
      partialScoring = {},
      maxResponseAreas,
    } = configuration || {};

    const {
      errors,
      extraCSSRules,
      promptEnabled,
      rationaleEnabled,
      spellCheckEnabled,
      teacherInstructionsEnabled,
      toolbarEditorPosition,
      responses,
      equationEditor,
    } = model || {};

    const {
      prompt: promptError,
      rationale: rationaleError,
      responseAreas: responseAreasError,
      teacherInstructions: teacherInstructionsError,
      responses: responsesErrors = {},
    } = errors || {};
    const validationMessage = generateValidationMessage(configuration);

    const panelSettings = {
      'language.enabled': language.settings && toggle(language.label, true),
      language: language.settings && language.enabled && dropdown(languageChoices.label, languageChoices.options),
    };

    const panelProperties = {
      teacherInstructionsEnabled: teacherInstructions.settings && toggle(teacherInstructions.label),
      rationaleEnabled: rationale.settings && toggle(rationale.label),
      promptEnabled: prompt.settings && toggle(prompt.label),
      spellCheckEnabled: spellCheck.settings && toggle(spellCheck.label),
      playerSpellCheckEnabled: playerSpellCheck.settings && toggle(playerSpellCheck.label),
      'editSource.enabled': editSource?.settings && toggle(editSource.label, true),
      partialScoring: partialScoring.settings && toggle(partialScoring.label),
    };

    const defaultImageMaxWidth = maxImageWidth && maxImageWidth.prompt;
    const defaultImageMaxHeight = maxImageHeight && maxImageHeight.prompt;

    const toolbarOpts = {
      position: toolbarEditorPosition === 'top' ? 'top' : 'bottom',
    };

    const getPluginProps = (props = {}, baseInputConfiguration = {}) => ({
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
            onChangeModel={(updatedModel: AuthorModel) => onModelChanged(updatedModel)}
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
              ariaLabel={teacherInstructions?.label || 'Teacher Instructions'}
              markup={model.teacherInstructions || ''}
              onChange={(value: string) => this.handleChange('teacherInstructions', value)}
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
          </StyledInputContainer>
        )}

        {promptEnabled && (
          <StyledInputContainer label={prompt.label}>
            <StyledEditableHtml
              ariaLabel={prompt?.label || 'Prompt'}
              markup={model.prompt}
              onChange={(value: string) => this.handleChange('prompt', value)}
              imageSupport={imageSupport}
              nonEmpty={false}
              disableUnderline
              error={promptError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(teacherInstructions?.inputConfiguration, baseInputConfiguration)}
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
        <TooltipContainer>
          <StyledTitle component={'div'}>Response Template</StyledTitle>
          <StyledTooltip disableFocusListener disableTouchListener placement={'right'} title={validationMessage}>
            <Info fontSize={'small'} color={'primary'} />
          </StyledTooltip>
        </TooltipContainer>
        <StyledMarkup
          ariaLabel="Response template"
          activePlugins={ALL_PLUGINS}
          toolbarOpts={{ position: 'top' }}
          spellCheck={spellCheckEnabled}
          pluginProps={getPluginProps(template?.inputConfiguration, baseInputConfiguration)}
          responseAreaProps={{
            type: 'math-templated',
            respAreaToolbar: null,
            error: () => responsesErrors,
            onHandleAreaChange: this.onHandleAreaChange,
            maxResponseAreas: maxResponseAreas,
          }}
          markup={model.slateMarkup}
          onChange={this.onChange}
          imageSupport={imageSupport}
          disableImageAlignmentButtons={true}
          onBlur={this.onBlur}
          disabled={false}
          highlightShape={false}
          error={responseAreasError}
          uploadSoundSupport={uploadSoundSupport}
          languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
          mathMlOptions={mathMlOptions}
        />
        {responseAreasError && <ResponseAreaError>{responseAreasError}</ResponseAreaError>}

        <StyledTitle>Define Response</StyledTitle>

        <StyledSelectContainer label="Response Template Equation Editor">
          <StyledSelect
            MenuProps={{ transitionDuration: { enter: 225, exit: 195 } }}
            onChange={(event: SelectChangeEvent<EquationEditor>) =>
              this.handleChange('equationEditor', event.target.value as EquationEditor)
            }
            value={equationEditor}
          >
            <MenuItem value="non-negative-integers">Numeric - Non-Negative Integers</MenuItem>
            <MenuItem value="integers">Numeric - Integers</MenuItem>
            <MenuItem value="decimals">Numeric - Decimals</MenuItem>
            <MenuItem value="fractions">Numeric - Fractions</MenuItem>
            <MenuItem value={1}>Grade 1 - 2</MenuItem>
            <MenuItem value={3}>Grade 3 - 5</MenuItem>
            <MenuItem value={6}>Grade 6 - 7</MenuItem>
            <MenuItem value={8}>Grade 8 - HS</MenuItem>
            <MenuItem value={'geometry'}>Geometry</MenuItem>
            <MenuItem value={'advanced-algebra'}>Advanced Algebra</MenuItem>
            <MenuItem value={'statistics'}>Statistics</MenuItem>
            <MenuItem value={'item-authoring'}>Item Authoring</MenuItem>
          </StyledSelect>
        </StyledSelectContainer>

        {Object.keys(responses || {}).map((_responseKey, idx) => {
          const response = (responses as Responses)[idx];

          if (response) {
            return (
              <Response
                key={idx}
                responseKey={idx}
                mode={equationEditor}
                response={response}
                onResponseChange={this.onResponseChange}
                onResponseDone={this.onResponseDone}
                cIgnoreOrder={cIgnoreOrder}
                cAllowTrailingZeros={cAllowTrailingZeros}
                error={responsesErrors && responsesErrors[idx]}
              />
            );
          }

          return null;
        })}

        {rationaleEnabled && (
          <StyledInputContainer label={rationale.label}>
            <StyledEditableHtml
              ariaLabel={rationale?.label || 'Rationale'}
              markup={model.rationale || ''}
              onChange={(value: string) => this.handleChange('rationale', value)}
              imageSupport={imageSupport}
              nonEmpty={false}
              error={rationaleError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(rationale?.inputConfiguration, {
                ...baseInputConfiguration,
                math: {
                  controlledKeypadMode: false,
                },
              })}
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
      </layout.ConfigLayout>
    );
  }
}

export default Design;
