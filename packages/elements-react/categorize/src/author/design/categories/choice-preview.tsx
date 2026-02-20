// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/configure/src/design/categories/choice-preview.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { DraggableChoice } from '@pie-lib/drag';
import IconButton from '@mui/material/IconButton';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { HtmlAndMath as HtmlAndMathImport } from '@pie-lib/render-ui';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
const HtmlAndMath = unwrapReactInteropSymbol(HtmlAndMathImport, 'HtmlAndMath');
import { color } from '@pie-lib/render-ui';

const ChoicePreviewContainer: any = styled('div')({
  position: 'relative',
  overflow: 'auto',
});

const DeleteIconButton: any = styled(IconButton)({
  position: 'absolute',
  right: 0,
  top: 0,
  color: `${color.tertiary()} !important`,
});

export class ChoicePreview extends React.Component {
  static propTypes = {
    alternateResponseIndex: PropTypes.number,
    category: PropTypes.object,
    choice: PropTypes.object.isRequired,
    choiceIndex: PropTypes.number,
    onDelete: PropTypes.func,
  };
  static defaultProps = {
    onDelete: () => {},
  };

  delete: any = () => {
    const { onDelete, choice } = this.props;
    onDelete(choice);
  };

  render() {
    const { alternateResponseIndex, category, choice, choiceIndex } = this.props;

    // Generate unique ID for each instance to distinguish multiple instances of the same choice
    const categoryId = category && category.id;
    const uniqueId =
      alternateResponseIndex !== undefined
        ? `${choice.id}-${categoryId}-${choiceIndex}-alt-${alternateResponseIndex}`
        : `${choice.id}-${categoryId}-${choiceIndex}`;

    return (
      <ChoicePreviewContainer>
        {choice ? (
          <DraggableChoice
            alternateResponseIndex={alternateResponseIndex}
            category={category}
            choice={choice}
            choiceIndex={choiceIndex}
            onRemoveChoice={this.delete}
            type={'choice-preview'}
            id={uniqueId}
            categoryId={categoryId}
          >
            <HtmlAndMath html={choice?.content} />
          </DraggableChoice>
        ) : null}
        <DeleteIconButton aria-label="delete" onClick={this.delete} size="large">
          <RemoveCircleOutlineIcon />
        </DeleteIconButton>
      </ChoicePreviewContainer>
    );
  }
}

export default ChoicePreview;
