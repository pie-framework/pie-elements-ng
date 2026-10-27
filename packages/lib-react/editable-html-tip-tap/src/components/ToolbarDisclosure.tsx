// @ts-nocheck

import React, { useEffect, useId, useRef, useState } from 'react';
import classNames from 'clsx';

/**
 * A toolbar button that shows a block's or a run's current setting and opens a group of the
 * settings next to it. Opened from the keyboard, focus moves to the pressed option, or the first;
 * Escape closes the group and returns focus to the button. Opened with the pointer, focus stays
 * in the text, and moving the cursor or leaving the editor closes it.
 *
 * `options` are `{ key, label, content, pressed }`; `list` stacks them, for options that are text.
 */
export default function ToolbarDisclosure({ editor, label, trigger, options, onSelect, className, list = false }) {
  const [open, setOpen] = useState(false);
  const focusOnOpen = useRef(false);
  const triggerRef = useRef(null);
  const groupRef = useRef(null);
  const groupId = useId();

  useEffect(() => {
    if (!open || !focusOnOpen.current) return;
    const group = groupRef.current;
    (group?.querySelector('[aria-pressed="true"]') ?? group?.querySelector('button'))?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !editor) return;

    const close = () => setOpen(false);
    editor.on('selectionUpdate', close);
    editor.on('blur', close);

    return () => {
      editor.off('selectionUpdate', close);
      editor.off('blur', close);
    };
  }, [open, editor]);

  const onKeyDown = (event) => {
    if (event.key !== 'Escape' || !open) return;
    event.stopPropagation();
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onBlur = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <span className="toolbarDisclosure" onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={triggerRef}
        type="button"
        className={className}
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={groupId}
        onClick={(event) => {
          event.preventDefault();
          // A click the keyboard synthesizes (Enter or Space) has `detail` 0.
          focusOnOpen.current = event.detail === 0;
          setOpen(!open);
        }}
      >
        {trigger}
        <span className="toolbarDisclosureCaret" aria-hidden="true">
          &#9660;
        </span>
      </button>
      <span
        ref={groupRef}
        id={groupId}
        role="group"
        aria-label={label}
        className={classNames('toolbarDisclosureOptions', { toolbarDisclosureList: list })}
        hidden={!open}
      >
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={className}
            aria-label={option.content ? option.label : undefined}
            title={option.content ? option.label : undefined}
            aria-pressed={option.pressed}
            onClick={(event) => {
              event.preventDefault();
              onSelect(option.key);
              setOpen(false);
            }}
          >
            {option.content ?? option.label}
          </button>
        ))}
      </span>
    </span>
  );
}
