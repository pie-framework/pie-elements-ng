import React from 'react';
import { settings, layout, InputContainer, NumberTextField } from '@pie-lib/config-ui';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Info from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';
import HotspotPalette from './hotspot-palette.js';
import HotspotContainer from './hotspot-container.js';
import { updateImageDimensions, generateValidationMessage, getUpdatedShapes, getAllShapes, groupShapes } from './utils.js';
import type { DeleteDone, ImageHandler, SoundHandler } from '@pie-element/shared-configure-events';
import type { HotspotValidationErrors } from '../controller/index.js';
import type { ConfigureLanguageOptions } from '@pie-element/shared-types';
import type { Dimensions, HotspotConfiguration, HotspotModel, Shapes } from '../types.js';

/** The model the author edits; the host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<HotspotModel> & {
  shapes: Shapes;
  dimensions: Dimensions;
  errors?: HotspotValidationErrors;
};

type MediaSupport<Handler> = {
  add: (handler: Handler) => void;
  delete: (src: string, done: DeleteDone) => void;
};

export type RootProps = {
  configuration: HotspotConfiguration;
  model: AuthorModel;
  imageSupport?: MediaSupport<ImageHandler>;
  uploadSoundSupport?: MediaSupport<SoundHandler>;
  onImageUpload: (imageUrl: string) => void;
  onColorChanged: (colorType: 'hotspotColor' | 'outlineColor', color: string) => void;
  onPromptChanged: (prompt: string) => void;
  onUpdateImageDimension: (dimensions: Dimensions) => void;
  onUpdateShapes: (shapes: Shapes) => void;
  onModelChangedByConfig: (model: AuthorModel, propertyType?: string) => void;
  onRationaleChanged: (rationale: string) => void;
  onConfigurationChanged: (configuration: HotspotConfiguration) => void;
  onTeacherInstructionsChanged: (teacherInstructions: string) => void;
};

const { Panel, toggle, dropdown } = settings;

const checkNullish = (value: unknown) => value !== null && value !== undefined;

const DimensionsContainer: any = styled('div')(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1.5),
}));

const FieldContainer: any = styled('div')({
  flex: 1,
  width: '90%',
});

const PromptContainer: any = styled(InputContainer)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  width: '100%',
}));

const SubHeading: any = styled(Typography)(({ theme }) => ({
  marginRight: theme.spacing(1),
}));

const FlexContainer: any = styled('div')({
  display: 'flex',
  alignItems: 'center',
});

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

export class Root extends React.Component<RootProps> {
  handleColorChange = (fieldType: 'hotspot' | 'outline', color: string) => {
    const { onColorChanged } = this.props;
    const cType = `${fieldType}Color` as const;

    onColorChanged(cType, color);
  };

  handleOnUpdateImageDimensions = (value: number, resizeType: 'width' | 'height') => {
    const {
      model: { dimensions, shapes },
      configuration: { preserveAspectRatio = {} },
      onUpdateImageDimension,
      onUpdateShapes,
    } = this.props;

    const nextImageDimensions = { ...dimensions, [resizeType]: value };

    // if preserveAspectRatio.enabled, updateImageDimensions function makes sure aspect ratio is kept
    const updatedDimensions = updateImageDimensions(
      dimensions,
      nextImageDimensions,
      preserveAspectRatio.enabled,
      resizeType,
    );
    // transform shapes map into shapes array
    const shapesArray = getAllShapes(shapes);
    // transform all the shapes to fit the re-sized image
    const updatedShapes = getUpdatedShapes(dimensions, updatedDimensions, shapesArray);
    // transform shapes array back into shapes map

    onUpdateShapes(groupShapes(updatedShapes));
    onUpdateImageDimension(updatedDimensions);
  };

  render() {
    const {
      configuration,
      model,
      imageSupport,
      uploadSoundSupport,
      onConfigurationChanged,
      onImageUpload,
      onModelChangedByConfig,
      onPromptChanged,
      onRationaleChanged,
      onUpdateImageDimension,
      onTeacherInstructionsChanged,
      onUpdateShapes,
    } = this.props;
    const {
      baseInputConfiguration = {},
      contentDimensions = {},
      maxImageWidth = {},
      maxImageHeight = {},
      multipleCorrect = {},
      partialScoring = {},
      preserveAspectRatio = {},
      prompt = {},
      rationale = {},
      settingsPanelDisabled,
      spellCheck = {},
      teacherInstructions = {},
      withRubric = {},
      mathMlOptions = {},
      language = {},
      languageChoices = {} as Partial<ConfigureLanguageOptions>,
    } = configuration || {};
    const {
      errors,
      extraCSSRules,
      promptEnabled,
      rationaleEnabled,
      spellCheckEnabled,
      teacherInstructionsEnabled,
      toolbarEditorPosition,
    } = model || {};
    const {
      prompt: promptError,
      rationale: rationaleError,
      shapes: shapesError,
      selections: selectionsError,
      teacherInstructions: teacherInstructionsError,
    } = errors || {};
    const validationMessage = generateValidationMessage(configuration);

    const defaultImageMaxWidth = maxImageWidth && maxImageWidth.prompt;
    const defaultImageMaxHeight = maxImageHeight && maxImageHeight.prompt;

    const toolbarOpts = {
      position: toolbarEditorPosition === 'top' ? 'top' : 'bottom',
    };

    const panelSettings = {
      multipleCorrect: multipleCorrect.settings && toggle(multipleCorrect.label),
      partialScoring: partialScoring.settings && toggle(partialScoring.label),
      promptEnabled: prompt.settings && toggle(prompt.label),
      'language.enabled': language.settings && toggle(language.label, true),
      language: language.settings && language.enabled && dropdown(languageChoices.label, languageChoices.options),
    };
    const panelProperties = {
      teacherInstructionsEnabled: teacherInstructions.settings && toggle(teacherInstructions.label),
      rationaleEnabled: rationale.settings && toggle(rationale.label),
      spellCheckEnabled: spellCheck.settings && toggle(spellCheck.label),
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
            onChangeModel={onModelChangedByConfig}
            configuration={configuration}
            onChangeConfiguration={onConfigurationChanged}
            groups={{
              Settings: panelSettings,
              Properties: panelProperties,
            }}
          />
        }
      >
        {teacherInstructionsEnabled && (
          <PromptContainer label={teacherInstructions.label}>
            <EditableHtml
              ariaLabel={teacherInstructions?.label || 'Teacher Instructions'}
              markup={model.teacherInstructions || ''}
              onChange={onTeacherInstructionsChanged}
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
            />
            {teacherInstructionsError && <ErrorText>{teacherInstructionsError}</ErrorText>}
          </PromptContainer>
        )}

        {promptEnabled && (
          <PromptContainer label={prompt.label}>
            <EditableHtml
              ariaLabel={prompt?.label || 'Prompt'}
              markup={model.prompt || ''}
              onChange={onPromptChanged}
              imageSupport={imageSupport}
              nonEmpty={false}
              error={promptError}
              toolbarOpts={toolbarOpts}
              pluginProps={getPluginProps(prompt?.inputConfiguration)}
              spellCheck={spellCheckEnabled}
              maxImageWidth={defaultImageMaxWidth}
              maxImageHeight={defaultImageMaxHeight}
              uploadSoundSupport={uploadSoundSupport}
              languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
              mathMlOptions={mathMlOptions}
            />
            {promptError && <ErrorText>{promptError}</ErrorText>}
          </PromptContainer>
        )}

        <FlexContainer>
          <SubHeading variant="h6">Define Hotspot</SubHeading>
          <StyledTooltip disableFocusListener disableTouchListener placement={'left'} title={validationMessage}>
            <Info fontSize={'small'} color={'primary'} style={{ float: 'right' }} />
          </StyledTooltip>
        </FlexContainer>

        <HotspotPalette
          hotspotColor={model.hotspotColor}
          hotspotList={model.hotspotList}
          outlineColor={model.outlineColor}
          outlineList={model.outlineList}
          onHotspotColorChange={(color) => this.handleColorChange('hotspot', color)}
          onOutlineColorChange={(color) => this.handleColorChange('outline', color)}
        />

        <HotspotContainer
          dimensions={model.dimensions}
          imageUrl={model.imageUrl}
          multipleCorrect={model.multipleCorrect}
          hasErrors={!!shapesError || !!selectionsError}
          hotspotColor={model.hotspotColor}
          outlineColor={model.outlineColor}
          selectedHotspotColor={model.selectedHotspotColor}
          hoverOutlineColor={checkNullish(model.hoverOutlineColor) ? model.hoverOutlineColor : 'black'}
          onUpdateImageDimension={onUpdateImageDimension}
          onUpdateShapes={onUpdateShapes}
          onImageUpload={onImageUpload}
          shapes={model.shapes}
          strokeWidth={model.strokeWidth}
          preserveAspectRatioEnabled={preserveAspectRatio.enabled}
          insertImage={imageSupport && imageSupport.add}
        />
        {shapesError && <ErrorText>{shapesError}</ErrorText>}
        {selectionsError && <ErrorText>{selectionsError}</ErrorText>}

        {model.imageUrl && (
          <React.Fragment>
            <Typography variant="h6">Image Dimensions</Typography>

            <DimensionsContainer>
              <FieldContainer>
                <NumberTextField
                  key="hotspot-manual-width"
                  label="Width"
                  value={model.dimensions.width}
                  min={0}
                  onChange={(_e, value) => this.handleOnUpdateImageDimensions(value, 'width')}
                  showErrorWhenOutsideRange
                />
              </FieldContainer>

              <FieldContainer>
                <NumberTextField
                  key="hotspot-manual-height"
                  label="Height"
                  value={model.dimensions.height}
                  min={0}
                  onChange={(_e, value) => this.handleOnUpdateImageDimensions(value, 'height')}
                  showErrorWhenOutsideRange
                />
              </FieldContainer>
            </DimensionsContainer>
          </React.Fragment>
        )}

        {rationaleEnabled && (
          <PromptContainer label={rationale.label}>
            <EditableHtml
              ariaLabel={rationale?.label || 'Rationale'}
              markup={model.rationale || ''}
              onChange={onRationaleChanged}
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
            />
            {rationaleError && <ErrorText>{rationaleError}</ErrorText>}
          </PromptContainer>
        )}
      </layout.ConfigLayout>
    );
  }
}

export default Root;
