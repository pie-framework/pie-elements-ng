import React from 'react';
import { Authoring } from '@pie-lib/rubric';
import { styled } from '@mui/material/styles';
import { layout, settings } from '@pie-lib/config-ui';
import type { DeleteDone, ImageHandler } from '@pie-element/shared-configure-events';
import type { EditableHtmlPluginConfigure } from '@pie-element/shared-types';
import type { RubricValidationErrors } from '../controller/index.js';
import type { RubricConfiguration, RubricModel } from '../types.js';

/** The model the author edits: the defaults supply `maxPoints`; a host sets `errors` from the controller's `validate()`. */
export type AuthorModel = Partial<RubricModel> & {
  maxPoints: number;
  errors?: RubricValidationErrors;
};

/** The configuration the author renders: the defaults supply `rubriclessInstruction`. */
export type AuthorConfiguration = RubricConfiguration & {
  rubriclessInstruction: EditableHtmlPluginConfigure;
};

export type MainProps = {
  model: AuthorModel;
  configuration: AuthorConfiguration;
  onModelChanged: (model: AuthorModel) => void;
  onConfigurationChanged: (configuration: RubricConfiguration) => void;
  imageSupport?: {
    add: (handler: ImageHandler) => void;
    delete: (src: string, done: DeleteDone) => void;
  };
};

const { Panel, toggle } = settings;

const StyledDiv: any = styled('div')<{ width?: string }>(({ theme, width }) => ({
  maxWidth: width,
  fontFamily: 'Cerebri Sans',
  fontSize: theme.typography.fontSize,
}));

class Main extends React.Component<MainProps> {
  verifyRubriclessModel = (m: AuthorModel, config: RubricConfiguration) => {
    const { rubricless = false } = config || {};
    return rubricless ? (({ points: _points, sampleAnswers: _sampleAnswers, ...rest }) => rest)(m) : m;
  };

  render() {
    const { model, configuration, onConfigurationChanged, onModelChanged, imageSupport } = this.props || {};
    const {
      baseInputConfiguration = {},
      contentDimensions = {},
      settingsPanelDisabled,
      showExcludeZero = {},
      showMaxPoint = {},
      mathMlOptions = {},
      rubricless = false,
      rubriclessInstruction,
      width,
    } = configuration || {};

    // ensure to eliminate points and sampleAnswers in case of rubricless
    const value = this.verifyRubriclessModel(model, configuration);
    const { extraCSSRules } = model;

    const panelProperties = {
      excludeZeroEnabled: showExcludeZero.settings && toggle(showExcludeZero.label),
      maxPointsEnabled: showMaxPoint.settings && toggle(showMaxPoint.label),
      rubriclessInstructionEnabled: rubricless && rubriclessInstruction.settings && toggle(rubriclessInstruction.label),
    };

    return (
      <layout.ConfigLayout
        extraCSSRules={extraCSSRules}
        dimensions={contentDimensions}
        hideSettings={settingsPanelDisabled}
        settings={
          <Panel
            model={model}
            onChangeModel={onModelChanged}
            configuration={configuration}
            onChangeConfiguration={onConfigurationChanged}
            groups={{
              Properties: panelProperties,
            }}
          />
        }        >
        <StyledDiv width={width}>
          <Authoring
            value={value}
            config={configuration}
            onChange={onModelChanged}
            mathMlOptions={mathMlOptions}
            rubricless={rubricless}
            pluginOpts={baseInputConfiguration}
            imageSupport={imageSupport}
          />
        </StyledDiv>
      </layout.ConfigLayout>
    );
  }
}

export default Main;
