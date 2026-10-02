// @ts-nocheck
/**
 * @synced-from pie-lib/packages/mask-markup/src/choices/choice.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDraggable } from '@dnd-kit/core';
import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { color } from '@pie-lib/render-ui';

export const DRAG_TYPE = 'MaskBlank';

const StyledChoice: any = styled('span')(({ theme, disabled }) => ({
  border: `solid 0px ${theme.palette.primary.main}`,
  margin: theme.spacing(0.5),
  transform: 'translate(0, 0)',
  display: 'inline-flex',
  ...(disabled && {}),
}));

const StyledChip: any = styled(Chip)(({selected}) => ({
  backgroundColor: color.white(),
  border: selected ? `solid 2px ${color.buttonFocusOutline()}` : `1px solid ${color.text()}`,
  opacity: selected ? 0.7 : 1,
  color: color.text(),
  alignItems: 'center',
  display: 'inline-flex',
  height: 'initial',
  minHeight: '32px',
  fontSize: 'inherit',
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
  '& mjx-frac': {
    fontSize: '120% !important',
  },
  '& mjx-mn:has(~ mjx-mfrac), mjx-mfrac ~ mjx-mn': {
    fontSize: '120% !important',
  },
}));

export default function Choice({ choice, disabled, instanceId, selectedItem, onSelectClick }) {
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

  return (
    <StyledChoice
      ref={setNodeRef}
      style={
        isDragging
          ? {
              width: rootRef.current?.offsetWidth || 90, // min-width of chip is 90px, so if we don't have the width, we can use 90px as a fallback
              height: rootRef.current?.offsetHeight || 32, // min-height of chip is 32px, so if we don't have the height, we can use 32px as a fallback
            }
          : {}
      }
      disabled={disabled}
      selected={isSelected}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      <StyledChip
        clickable={false}
        disabled={disabled}
        selected={isSelected}
        ref={rootRef}
        label={<StyledChipLabel dangerouslySetInnerHTML={{ __html: choice.value }} />}
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
};
