// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/configure/src/design/categories/RowLabel.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { getPluginProps } from '../utils.js';
import React from 'react';
import { styled } from '@mui/material/styles';
import EditableHtml from '@pie-lib/editable-html-tip-tap';
import { InputContainer } from '@pie-lib/render-ui';

const RowLabelContainer: any = styled(InputContainer)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  width: '100%',
}));

export const RowLabel = ({
    categoriesPerRow,
    configuration,
    disabled,
    markup,
    imageSupport,
    onChange,
    toolbarOpts,
    spellCheck,
    maxImageWidth,
    maxImageHeight,
    uploadSoundSupport,
    mathMlOptions = {},
  }) => {
    const { rowLabels, baseInputConfiguration } = configuration;

    return (
      <div
        style={{
          gridColumn: `1/${categoriesPerRow + 1}`,
          width: '100%',
        }}
      >
        <RowLabelContainer label="Row Label">
          <EditableHtml
            disabled={disabled}
            markup={markup}
            onChange={onChange}
            imageSupport={imageSupport}
            nonEmpty={false}
            toolbarOpts={toolbarOpts}
            pluginProps={getPluginProps(rowLabels?.inputConfiguration, baseInputConfiguration)}
            spellCheck={spellCheck}
            maxImageWidth={maxImageWidth}
            maxImageHeight={maxImageHeight}
            uploadSoundSupport={uploadSoundSupport}
            languageCharactersProps={[{ language: 'spanish' }, { language: 'special' }]}
            mathMlOptions={mathMlOptions}
          />
        </RowLabelContainer>
      </div>
    );
  };
