// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { uid } from '@pie-lib/drag';
import { color } from '@pie-lib/render-ui';

import GridContent from './grid-content.js';
import Category, { CategoryType } from './category.js';

export { CategoryType };

export class Categories extends React.Component {
  static propTypes = {
    categories: PropTypes.arrayOf(PropTypes.shape(CategoryType)),
    model: PropTypes.shape({
      categoriesPerRow: PropTypes.number,
    }),
    disabled: PropTypes.bool,
    onDropChoice: PropTypes.func.isRequired,
    onRemoveChoice: PropTypes.func.isRequired,
    rowLabels: PropTypes.array,
    selectedItem: PropTypes.object,
    onSelectClick: PropTypes.func,
    onPlacementClick: PropTypes.func,
    uid: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    model: {
      categoriesPerRow: 1,
    },
  };

  render() {
    const {
      categories,
      model,
      disabled,
      onDropChoice,
      onRemoveChoice,
      rowLabels,
      selectedItem,
      onSelectClick,
      onPlacementClick,
      uid: instanceId,
    } = this.props;
    const { categoriesPerRow, minRowHeight } = model;

    // split categories into an array of arrays (inner array),
    // where each inner array represents how many categories should be displayed on one row
    const chunkedCategories = [];
    const cats = categories || [];
    for (let i = 0; i < cats.length; i += categoriesPerRow) {
      chunkedCategories.push(cats.slice(i, i + categoriesPerRow));
    }

    const hasNonEmptyString = (array) => {
      let found = false;

      (array || []).forEach((element) => {
        if (typeof element === 'string' && element.trim() !== '' && element.trim() !== '<div></div>') {
          found = true;
        }
      });

      return found;
    };

    return (
      <GridContent
        columns={categoriesPerRow}
        rows={Math.ceil(categories.length / categoriesPerRow) * 2}
        extraStyle={{ flex: 1 }}
      >
        {chunkedCategories.map((cat, rowIndex) => {
          let items = [];

          // for each inner array of categories, create a row with category titles
          // first cell of row has to be the row label
          cat.forEach((c, columnIndex) => {
            const labelId = `categorize-${instanceId}-category-label-${rowIndex}-${columnIndex}`;

            items.push(
              <div style={{ display: 'flex' }}>
                {columnIndex === 0 && hasNonEmptyString(rowLabels) ? (
                  <StyledRowLabel
                    key={rowIndex}
                    dangerouslySetInnerHTML={{
                      __html: rowLabels[rowIndex] || '',
                    }}
                  />
                ) : null}
                <StyledCategoryWrapper>
                  <StyledLabel
                    key={`category-label-${rowIndex}-${columnIndex}`}
                    id={labelId}
                    dangerouslySetInnerHTML={{ __html: c.label }}
                  />

                  <Category
                    minRowHeight={minRowHeight}
                    labelId={labelId}
                    onDropChoice={(h) => onDropChoice(c.id, h)}
                    onRemoveChoice={onRemoveChoice}
                    disabled={disabled}
                    key={`category-element-${rowIndex}-${columnIndex}`}
                    selectedItem={selectedItem}
                    onSelectClick={onSelectClick}
                    onPlacementClick={onPlacementClick}
                    {...c}
                  />
                </StyledCategoryWrapper>
              </div>,
            );
          });

          // if the last row has fewer categories than max on a row, fill the spaces with divs
          items = items.concat(
            Array(categoriesPerRow - cat.length)
              .fill(<div />)
              .map((value, index) => <div key={`fill-space-final-${index}`} />),
          );

          return items;
        })}
      </GridContent>
    );
  }
}

const StyledLabel: any = styled('div')(({ theme }) => ({
  color: color.text(),
  backgroundColor: color.background(),
  textAlign: 'center',
  paddingTop: theme.spacing(1),
}));

const StyledRowLabel: any = styled('div')({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  flex: 0.5,
  marginRight: '12px',
});

const StyledCategoryWrapper: any = styled('div')({
  display: 'flex',
  flex: '2',
  flexDirection: 'column',
});

export default uid.withUid(Categories);
