// @ts-nocheck

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { get } from '@pie-element/shared-lodash';

import { PureToolbar } from '@pie-lib/math-toolbar';

import CustomPopper from './characters/custom-popper.js';
import { arabicConfig, spanishConfig, specialConfig } from './characters/characterUtils.js';

const CharacterIcon = ({ letter }) => (
  <div
    style={{
      fontSize: '24px',
      lineHeight: '24px',
    }}
  >
    {letter}
  </div>
);

CharacterIcon.propTypes = {
  letter: PropTypes.string,
};

const ARROW_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

const FOCUSABLE_SELECTOR = 'button, a[href], input, select, textarea, [contenteditable="true"], [tabindex]';

// True when Tab would stop on the element.
const isTabbable = (el) => {
  const inTabOrder = el.tabIndex >= 0; // excludes tabindex="-1"
  const enabled = !el.disabled;
  const insideInert = !!el.closest('[inert]'); // e.g. a hidden toolbar
  const rendered = el.getClientRects().length > 0; // excludes display: none

  return inTabOrder && enabled && !insideInert && rendered;
};

// All elements Tab would stop on inside `root`, in document order.
const getTabbables = (root) => Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isTabbable);

// Keeps an index inside 0..length-1, wrapping past either end (-1 becomes length - 1).
const wrapIndex = (index, length) => (index + length) % length;

// The button an arrow key moves to: left/right go to the previous/next button, up/down go one
// row of the character grid back/forward. Movement wraps around at both ends.
const getArrowTarget = (buttons, currentIndex, key, columns) => {
  const steps = {
    ArrowLeft: -1,
    ArrowRight: 1,
    ArrowUp: -columns,
    ArrowDown: columns,
  };

  return buttons[wrapIndex(currentIndex + steps[key], buttons.length)];
};

export function CharacterPicker({ editor, opts, onClose, triggerEl, focusOnOpen }) {
  if (!opts?.characters?.length) {
    return null;
  }

  const containerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [popover, setPopover] = useState(null);

  onCloseRef.current = onClose;

  // Escape and Done close the panel and return focus to the text. The editor keeps its selection
  // while focus is in the panel, so focusing it without a position puts the cursor back where
  // characters were being inserted; after a pointer click, the cursor is already there and stays.
  // Focus moves before the panel closes, so it is never left on a button that is going away.
  const closeAndReturnToText = () => {
    editor.view.focus();
    editor.commands.focus();
    onCloseRef.current();
  };

  const configToUse = useMemo(() => {
    if (!opts) return spanishConfig;

    switch (true) {
      case opts.language === 'spanish':
        return spanishConfig;
      case opts.language === 'special':
        return specialConfig;
      case opts.language === 'arabic':
        return arabicConfig;
      default:
        return opts;
    }
  }, [opts]);

  const layoutForCharacters = useMemo(
    () =>
      configToUse.characters.reduce(
        (obj, arr) => {
          if (arr.length >= obj.columns) {
            obj.columns = arr.length;
          }

          return obj;
        },
        { rows: configToUse.characters.length, columns: 0 },
      ),
    [configToUse],
  );

  const closePopOver = () => setPopover(null);

  useEffect(
    () => () => {
      closePopOver();
    },
    [],
  );

  // Keep `onClose` out of the dependency array — parents often pass a new callback each
  // render (e.g. after each keystroke), which would re-run this effect constantly. Use a
  // ref so click-outside always calls the latest close handler.
  useEffect(() => {
    if (!editor) return;

    const editorDOM = editor.options.element;
    const editorViewDom = editor.view.dom;

    // Position is computed in viewport coordinates (the dialog uses position: fixed),
    // so coordsAtPos / getBoundingClientRect values can be used directly without
    // adding scroll offsets. The dialog is then clamped to the viewport so it does
    // not get cut off by fixed page headers/footers.
    const updatePosition = () => {
      if (!containerRef.current) return;

      const editorRect = editorDOM.getBoundingClientRect();
      const { from } = editor.state.selection;
      const start = editor.view.coordsAtPos(from);

      const dialogHeight = containerRef.current.offsetHeight;
      const dialogWidth = containerRef.current.offsetWidth;

      // prefer below the editor; flip above when there isn't room below.
      const spaceBelow = window.innerHeight - (editorRect.bottom + 60);
      let top =
        spaceBelow >= dialogHeight || editorRect.top < dialogHeight + 80
          ? editorRect.bottom + 60
          : editorRect.top - dialogHeight - 20;

      let left = start.left;

      const margin = 8;
      top = Math.max(margin, Math.min(top, window.innerHeight - dialogHeight - margin));
      left = Math.max(margin, Math.min(left, window.innerWidth - dialogWidth - margin));

      setPosition({ top, left });
    };

    updatePosition();

    let frame = null;
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        updatePosition();
      });
    };

    window.addEventListener('scroll', scheduleUpdate, true);
    window.addEventListener('resize', scheduleUpdate);

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && !editorViewDom.contains(e.target)) {
        onCloseRef.current();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    });

    return () => {
      clearTimeout(timeoutId);
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate, true);
      window.removeEventListener('resize', scheduleUpdate);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editor]);

  // The dialog stays hidden until its position has been computed (see updatePosition).
  const isPositioned = position.top !== 0 || position.left !== 0;

  // The panel's controls are its buttons. (The keypad also renders a MathQuill textarea, but it
  // is hidden, so it is left out.)
  const getPanelButtons = () => Array.from(containerRef.current?.querySelectorAll('button:not([disabled])') ?? []);

  // opened from the keyboard, focus moves to the first (top left) button. This has to
  // wait until the dialog is positioned, because a `visibility: hidden` element cannot take focus.
  const hasMovedFocusRef = useRef(false);

  useEffect(() => {
    if (!focusOnOpen || !isPositioned || hasMovedFocusRef.current) return;

    const firstButton = getPanelButtons()[0];

    if (firstButton) {
      firstButton.focus();
      hasMovedFocusRef.current = true;
    }
  }, [focusOnOpen, isPositioned]);

  // Keyboard handling. The dialog is portaled to the end of document.body, so on its own it would
  // come last in the tab order; the Tab handling below makes it behave as if it came straight
  // after the toolbar button that opened it (`triggerEl`). The listener runs in the capture phase
  // so it sees keys before the keypad's own handlers do.
  useEffect(() => {
    if (!triggerEl) return;

    const moveFocusWithArrow = (key, target, buttons) => {
      const currentIndex = Math.max(0, buttons.indexOf(target.closest('button')));
      const columns = layoutForCharacters.columns || 1;

      getArrowTarget(buttons, currentIndex, key, columns)?.focus();
    };

    // Where Tab goes from the trigger when the dialog is not in the way: the next tab stop on the
    // page, e.g. the next toolbar button.
    const focusElementAfterTrigger = () => {
      const pageTabbables = getTabbables(document.body).filter((el) => !containerRef.current.contains(el));
      const triggerIndex = pageTabbables.indexOf(triggerEl);
      const next = triggerIndex === -1 ? null : pageTabbables[triggerIndex + 1];

      // Fall back to the trigger if it is not found or nothing follows it.
      (next || triggerEl).focus();
    };

    const handleKeyDown = (e) => {
      if (!containerRef.current) return;

      const buttons = getPanelButtons();
      if (!buttons.length) return;

      const target = e.target;
      const inDialog = containerRef.current.contains(target);
      const firstButton = buttons[0];
      const lastButton = buttons[buttons.length - 1];

      // Escape closes the panel and returns focus to the text, with the cursor where it was.
      if (inDialog && e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeAndReturnToText();
        return;
      }

      // arrow keys move focus within the panel instead of reaching the keypad (which
      // used to lose focus).
      if (inDialog && ARROW_KEYS.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        moveFocusWithArrow(e.key, target, buttons);
        return;
      }

      if (e.key !== 'Tab') return;

      // Tab order is trigger -> panel buttons -> whatever follows the trigger.
      // Tab between the panel's own buttons is left to the browser.
      const tabFromTriggerIntoPanel = target === triggerEl && !e.shiftKey;
      const shiftTabFromFirstButton = target === firstButton && e.shiftKey;
      const tabFromLastButton = target === lastButton && !e.shiftKey;

      if (tabFromTriggerIntoPanel) {
        e.preventDefault();
        firstButton.focus();
      } else if (shiftTabFromFirstButton) {
        e.preventDefault();
        triggerEl.focus();
      } else if (tabFromLastButton) {
        e.preventDefault();
        focusElementAfterTrigger();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [editor, triggerEl, layoutForCharacters.columns]);

  const renderPopOver = (event, el) => setPopover({ anchorEl: event.currentTarget, el });

  // Whether the panel was last used with the pointer or the keyboard, set by the dialog's
  // onPointerDown / onKeyDown below.
  const lastInputRef = useRef('keyboard');

  const handleChange = (val) => {
    if (typeof val !== 'string') return;

    // From the keyboard, focus stays on the pressed button so more characters can be added.
    // A pointer click puts the cursor back in the text, so the user can carry on typing.
    const usedPointer = lastInputRef.current === 'pointer';

    if (usedPointer) {
      editor.chain().focus().insertContent(val).run();
    } else {
      editor.chain().insertContent(val).run();
    }
  };

  return (
    <>
      {ReactDOM.createPortal(
        <div
          ref={containerRef}
          className="insert-character-dialog"
          data-toolbar-for={editor.instanceId}
          onPointerDown={() => {
            lastInputRef.current = 'pointer';
          }}
          onKeyDown={() => {
            lastInputRef.current = 'keyboard';
          }}
          style={{
            visibility: isPositioned ? 'initial' : 'hidden',
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxWidth: '500px',
            zIndex: 1000,
          }}
        >
          <div>
            <PureToolbar
              keyPadCharacterRef={opts.keyPadCharacterRef}
              setKeypadInteraction={opts.setKeypadInteraction}
              noDecimal
              hideInput
              noLatexHandling
              hideDoneButtonBackground
              layoutForKeyPad={layoutForCharacters}
              additionalKeys={configToUse.characters.reduce((arr, n) => {
                arr = [
                  ...arr,
                  ...n.map((k) => ({
                    // The keypad names a key by `name`; a described character is named by its label.
                    name: get(k, 'name') || get(k, 'label') || k,
                    write: get(k, 'write') || k,
                    label: get(k, 'label') || k,
                    category: 'character',
                    extraClass: 'character',
                    extraProps: {
                      ...(k.extraProps || {}),
                      style: {
                        ...(k.extraProps || {}).style,
                        border: '1px solid #000',
                      },
                    },
                    ...(configToUse.hasPreview
                      ? {
                          actions: {
                            onMouseEnter: (ev) => renderPopOver(ev, k),
                            onMouseLeave: closePopOver,
                          },
                        }
                      : {}),
                  })),
                ];

                return arr;
              }, [])}
              keypadMode="language"
              onChange={handleChange}
              onDone={closeAndReturnToText}
            />
          </div>
        </div>,
        document.body,
      )}
      {popover &&
        ReactDOM.createPortal(
          <CustomPopper onClose={closePopOver} anchorEl={popover.anchorEl}>
            <div>{popover.el.label}</div>
            <div style={{ fontSize: 20, lineHeight: '20px' }}>{popover.el.description}</div>
            <div style={{ fontSize: 20, lineHeight: '20px' }}>{popover.el.unicode}</div>
          </CustomPopper>,
          document.body,
        )}
    </>
  );
}

CharacterPicker.propTypes = {
  editor: PropTypes.object,
  opts: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  triggerEl: PropTypes.object,
  focusOnOpen: PropTypes.bool,
};

export { CharacterIcon };
