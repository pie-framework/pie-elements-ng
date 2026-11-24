// @ts-nocheck

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDraggable } from '@dnd-kit/core';
import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { color } from '@pie-lib/render-ui';
import { sanitizeModelHtml } from '@pie-element/shared-utils';

export const DRAG_TYPE = 'MaskBlank';

const StyledChoice: any = styled('span')(({ theme, disabled, dragOverlay }) => ({
  border: `solid 0px ${theme.palette.primary.main}`,
  // The drag overlay is sized without this margin, so its copy takes none, or its text wraps.
  margin: dragOverlay ? 0 : theme.spacing(0.5),
  transform: 'translate(0, 0)',
  display: 'inline-flex',
  ...(disabled && {}),
}));

const StyledChip: any = styled(Chip)(({selected}) => ({
  // --pie-white stays white under a dark theme; white keeps the chip opaque when no theme is set.
  backgroundColor: color.v('pie')('background', color.defaults.WHITE),
  // The selected ring's second pixel is an outline inside the border, so selecting keeps the chip's
  // size, which a drag holds. An outline, unlike a box shadow, survives forced colours.
  border: `1px solid ${selected ? color.buttonFocusOutline() : color.text()}`,
  ...(selected && {
    outline: `1px solid ${color.buttonFocusOutline()}`,
    outlineOffset: '-2px',
  }),
  opacity: selected ? 0.7 : 1,
  color: color.text(),
  alignItems: 'center',
  display: 'inline-flex',
  height: 'initial',
  minHeight: '32px',
  fontSize: 'inherit',
  // MUI 7's Chip sets a 1.5 line height; the legacy tile inherited normal, and text tiles grew.
  lineHeight: 'normal',
  whiteSpace: 'pre-wrap',
  maxWidth: '374px',
  // Added for touch devices, for image content.
  // This will prevent the context menu from appearing and not allowing other interactions with the image.
  // If interactions with the image in the token will be requested we should handle only the context Menu.
  pointerEvents: 'none',
  borderRadius: '3px',
  paddingTop: '12px',
  paddingBottom: '12px',

  '&.Mui-disabled': {
    opacity: 1,
  },
}));

const StyledChipLabel: any = styled('span')(() => ({
  whiteSpace: 'normal',
  '& img': {
    display: 'block',
    padding: '2px 0',
  },
  // Remove default <p> margins to ensure consistent spacing across all wrapped content (p, span, div, math)
  // Padding for top and bottom will instead be controlled by the container for consistent layout
  // Ensures consistent behavior with pie-api-browser, where marginTop is already removed by a Bootstrap stylesheet
  '& p': {
    marginTop: '0',
    marginBottom: '0',
  },
  '& mjx-frac': {
    fontSize: '120% !important',
  },
  '& mjx-mn:has(~ mjx-mfrac), mjx-mfrac ~ mjx-mn': {
    fontSize: '120% !important',
  },
}));

export default function Choice({ choice, disabled, instanceId, selectedItem, onSelectClick, dragOverlay }) {
  const rootRef = useRef(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `choice-${choice.id}`,
    data: { choice, instanceId, fromChoice: true, type: DRAG_TYPE },
    disabled,
  });

  useEffect(() => {
    renderMath(rootRef.current);
  }, [choice.value]);

  const isSelected = !!selectedItem && selectedItem.fromChoice === true && selectedItem.choice.id === choice.id;

  const handleClick = (e) => {
    if (disabled) return;

    e.stopPropagation();
    onSelectClick?.({ choice, instanceId, fromChoice: true, type: DRAG_TYPE });
  };

  // A drag holds the token at its size, rounded up: `offsetWidth` can round down and wrap its text.
  const rect = isDragging ? rootRef.current?.getBoundingClientRect() : undefined;

  return (
    <StyledChoice
      ref={setNodeRef}
      style={
        isDragging
          ? {
              width: rect?.width ? Math.ceil(rect.width) : 90, // min-width of chip is 90px, so if we don't have the width, we can use 90px as a fallback
              height: rect?.height ? Math.ceil(rect.height) : 32, // min-height of chip is 32px, so if we don't have the height, we can use 32px as a fallback
            }
          : {}
      }
      disabled={disabled}
      selected={isSelected}
      dragOverlay={dragOverlay}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <StyledChip
        clickable={false}
        disabled={disabled}
        selected={isSelected}
        ref={rootRef}
        label={<StyledChipLabel dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(choice.value) }} />}
      />
    </StyledChoice>
  );
}

Choice.propTypes = {
  choice: PropTypes.object.isRequired,
  disabled: PropTypes.bool,
  instanceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedItem: PropTypes.object,
  onSelectClick: PropTypes.func,
  // The copy dnd-kit's drag overlay draws under the pointer.
  dragOverlay: PropTypes.bool,
};
