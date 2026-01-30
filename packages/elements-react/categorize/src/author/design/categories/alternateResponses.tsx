// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/configure/src/design/categories/alternateResponses.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { removeChoiceFromAlternate } from '@pie-lib/categorize';

import Category from './category';

const CategoriesContainer: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2.5),
}));

const CategoriesHolder: any = styled('div')(({ theme }) => ({
  display: 'grid',
  gridRowGap: `${theme.spacing(1)}px`,
  gridColumnGap: `${theme.spacing(1)}px`,
}));

const RowLabel: any = styled('div')({
  gridColumn: '1 / 3',
});

export class AlternateResponses extends React.Component {
  static propTypes = {
    altIndex: PropTypes.number.isRequired,
    configuration: PropTypes.object,
    imageSupport: PropTypes.shape({
      add: PropTypes.func.isRequired,
      delete: PropTypes.func.isRequired,
    }),
    categories: PropTypes.array,
    onModelChanged: PropTypes.func,
    model: PropTypes.object.isRequired,
    uploadSoundSupport: PropTypes.shape({
      add: PropTypes.func.isRequired,
      delete: PropTypes.func.isRequired,
    }),
    spellCheck: PropTypes.bool,
  };


  deleteChoiceFromCategory: any = (category, choice, choiceIndex) => {
    const { model, altIndex, onModelChanged } = this.props;

    const correctResponse = removeChoiceFromAlternate(
      choice.id,
      category.id,
      choiceIndex,
      altIndex,
      model.correctResponse,
    );

    onModelChanged({ correctResponse });
  };

  render() {
    const {
      altIndex,
      model,
      configuration,
      categories,
      imageSupport,
      spellCheck,
      uploadSoundSupport,
      mathMlOptions = {},
    } = this.props;
    const { categoriesPerRow, errors, rowLabels } = model;
    const { duplicateAlternate } = errors || {};

    const holderStyle = {
      gridTemplateColumns: `repeat(${categoriesPerRow}, 1fr)`,
    };
    const isDuplicated = duplicateAlternate ? duplicateAlternate.index === altIndex : false;

    return (
      <CategoriesContainer>
        <CategoriesHolder style={holderStyle}>
          {categories.map((category, index) => {
            const hasRowLabel = index % categoriesPerRow === 0;
            const rowIndex = index / categoriesPerRow;

            return (
              <React.Fragment key={index}>
                {hasRowLabel && (
                  <RowLabel
                    style={{
                      gridColumn: `1/${categoriesPerRow + 1}`,
                      width: '100%',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: rowLabels[rowIndex] || '',
                    }}
                  />
                )}

                <Category
                  key={index}
                  alternateResponseIndex={altIndex}
                  imageSupport={imageSupport}
                  isDuplicated={isDuplicated && duplicateAlternate.category === category.id}
                  category={category}
                  spellCheck={spellCheck}
                  onDeleteChoice={(choice, choiceIndex) => this.deleteChoiceFromCategory(category, choice, choiceIndex)}
                  uploadSoundSupport={uploadSoundSupport}
                  mathMlOptions={mathMlOptions}
                  configuration={configuration}
                  isAlternate={true}
                />
              </React.Fragment>
            );
          })}
        </CategoriesHolder>
      </CategoriesContainer>
    );
  }
}

export default AlternateResponses;
