// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/src/categorize/category.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { color } from '@pie-lib/render-ui';

import Choice from './choice';
import PlaceHolder from './droppable-placeholder';

export const CategoryType = {
  id: PropTypes.string.isRequired,
  categoryId: PropTypes.string,
};

export class Category extends React.Component {
  static propTypes = {
    ...CategoryType,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    onDropChoice: PropTypes.func,
    onRemoveChoice: PropTypes.func,
    minRowHeight: PropTypes.string,
  };

  static defaultProps = {};

  render() {
    const {
      className,
      choices = [],
      disabled,
      onDropChoice,
      onRemoveChoice,
      id,
      correct,
      minRowHeight,
    } = this.props;

    return (
      <StyledDiv className={className} id={id}>
        <StyledPlaceHolder
          id={id}
          onDropChoice={onDropChoice}
          disabled={disabled}
          correct={correct}
          minRowHeight={minRowHeight}
        >
          {choices.map((c, index) => (
            <Choice
              onRemoveChoice={onRemoveChoice}
              disabled={disabled}
              key={index}
              choiceIndex={index}
              categoryId={id}
              {...c}
            />
          ))}
        </StyledPlaceHolder>
      </StyledDiv>
    );
  }
}

const StyledDiv: any = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 2,
}));

const StyledPlaceHolder: any = styled(PlaceHolder, {
  shouldForwardProp: (prop) => prop !== 'correct',
})(({ theme, correct }) => ({
  padding: theme.spacing(0.5),
  borderRadius: theme.spacing(0.5),
  gridColumnGap: 0,
  gridRowGap: 0,
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'center',
  alignContent: 'flex-start',
  ...(correct === false && {
    border: `solid 2px ${color.incorrect()}`,
  }),
  ...(correct === true && {
    border: `solid 2px ${color.correct()}`,
  }),
}));

export default Category;
