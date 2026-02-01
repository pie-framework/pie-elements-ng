// @ts-nocheck
/**
 * @synced-from pie-elements/packages/rubric/configure/src/main.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { Authoring } from '@pie-lib/rubric';
import { styled } from '@mui/material/styles';
import { layout, settings } from '@pie-lib/config-ui';

const { Panel, toggle } = settings;

const StyledDiv: any = styled('div')(({ theme, width }) => ({
  maxWidth: width,
  fontFamily: 'Cerebri Sans',
  fontSize: theme.typography.fontSize,
}));

class Main extends React.Component {
  verifyRubriclessModel: any = (m, config) => {
    const { rubricless = false } = config || {};
    return rubricless ? (({ points, sampleAnswers, ...rest }) => rest)(m) : m;
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

    const getPluginProps = (props) => {
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
            onChangeModel={onModelChanged}
            configuration={configuration}
            onChangeConfiguration={onConfigurationChanged}
            pluginOpts={getPluginProps(rubriclessInstruction?.inputConfiguration)}
            groups={{
              Properties: panelProperties,
            }}
            imageSupport={imageSupport}
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
