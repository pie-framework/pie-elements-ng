// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/configure/src/design/categories/category.jsx
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
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';

import InputHeader from '../input-header';
import { DeleteButton } from '../buttons';
import PlaceHolder from './droppable-placeholder';

const StyledCard: any = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isDuplicated',
})(({ theme, isDuplicated }) => ({
  minWidth: '196px',
  padding: theme.spacing(1),
  overflow: 'visible',
  ...(isDuplicated && {
    border: '1px solid red',
  }),
}));

const StyledCardActions: any = styled(CardActions)(({ theme }) => ({
  padding: 0,
  paddingBottom: 0,
  paddingTop: theme.spacing(1),
}));

const CategoryHeader: any = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  '& p': {
    margin: 0,
  },
}));

const ErrorText: any = styled('div')(({ theme }) => ({
  fontSize: theme.typography.fontSize - 2,
  color: theme.palette.error.main,
  paddingBottom: theme.spacing(1),
}));

export class Category extends React.Component {
  static propTypes = {
    alternateResponseIndex: PropTypes.number,
    category: PropTypes.object.isRequired,
    configuration: PropTypes.object.isRequired,
    defaultImageMaxHeight: PropTypes.number,
    defaultImageMaxWidth: PropTypes.number,
    deleteFocusedEl: PropTypes.func,
    focusedEl: PropTypes.number,
    index: PropTypes.number,
    error: PropTypes.string,
    isDuplicated: PropTypes.bool,
    maxImageWidth: PropTypes.object,
    maxImageHeight: PropTypes.object,
    onChange: PropTypes.func,
    onDelete: PropTypes.func,
    onDeleteChoice: PropTypes.func,
    imageSupport: PropTypes.shape({
      add: PropTypes.func.isRequired,
      delete: PropTypes.func.isRequired,
    }),
    toolbarOpts: PropTypes.object,
    spellCheck: PropTypes.bool,
    uploadSoundSupport: PropTypes.shape({
      add: PropTypes.func.isRequired,
      delete: PropTypes.func.isRequired,
    }),
    isAlternate: PropTypes.bool,
  };

  static defaultProps = {};

  changeLabel: any = (l) => {
    const { category, onChange } = this.props;
    category.label = l;
    onChange(category);
  };

  render() {
    const {
      alternateResponseIndex,
      category,
      configuration,
      deleteFocusedEl,
      focusedEl,
      index,
      error,
      isDuplicated,
      onDelete,
      onDeleteChoice,
      imageSupport,
      spellCheck,
      toolbarOpts,
      maxImageWidth,
      maxImageHeight,
      uploadSoundSupport,
      mathMlOptions = {},
    } = this.props;
    const isCategoryHeaderDisabled = !!alternateResponseIndex || alternateResponseIndex === 0;
    
    return (
      <StyledCard isDuplicated={isDuplicated}>
        <span>
          {!isCategoryHeaderDisabled ? (
            <InputHeader
              label={category.label}
              focusedEl={focusedEl}
              deleteFocusedEl={deleteFocusedEl}
              index={index}
              disabled={!!alternateResponseIndex || alternateResponseIndex === 0}
              error={error}
              onChange={this.changeLabel}
              onDelete={onDelete}
              imageSupport={imageSupport}
              toolbarOpts={toolbarOpts}
              spellCheck={spellCheck}
              maxImageWidth={maxImageWidth}
              maxImageHeight={maxImageHeight}
              uploadSoundSupport={uploadSoundSupport}
              mathMlOptions={mathMlOptions}
              configuration={configuration}
            />
          ) : (
            <CategoryHeader
              dangerouslySetInnerHTML={{
                __html: category.label,
              }}
            />
          )}
          {error && <ErrorText>{error}</ErrorText>}
        </span>
        <PlaceHolder
          alternateResponseIndex={alternateResponseIndex}
          category={category}
          choices={category.choices}
          onDeleteChoice={onDeleteChoice}
          categoryId={category.id}
          extraStyles={{ minHeight: '100px', }}
          isAlternate={this.props.isAlternate}
        />
        {onDelete && (
          <StyledCardActions>
            <DeleteButton label={'delete'} onClick={onDelete} />
          </StyledCardActions>
        )}
      </StyledCard>
    );
  }
}

export default Category;
