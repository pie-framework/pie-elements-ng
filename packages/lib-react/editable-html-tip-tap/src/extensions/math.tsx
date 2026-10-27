// @ts-nocheck

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { Node } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { NodeSelection, Plugin, PluginKey, TextSelection } from 'prosemirror-state';
import { MathMLToLaTeX } from '@pie-framework/mathml-to-latex';
import { MathPreview, MathToolbar } from '@pie-lib/math-toolbar';
import { latexToMml, mmlToLatex, unWrapMath, wrapMath } from '@pie-element/shared-math-rendering-mathjax';
import { setToolbarOpened } from '../utils/toolbar.js';
import { TOOLBAR_BACKGROUND } from '../constants.js';

// `\left.` and `\right.` come out of the MathML converter for fences the editor cannot use.
const EMPTY_FENCE = /\\left\.\s*|\\right\.\s*/g;

// The invisible function-application operator MathJax writes after `\log` and `\sin`, which only adds space.
const EMPTY_MO = /<mo(?: [^>]*)?>&#x2061;<\/mo>/g;

const DISPLAY_WRAPPER = { open: '\\[', close: '\\]' };

// Where saved MathML keeps the LaTeX it was made from. Not `data-latex`, which marks a LaTeX span:
// the renderers rewrite the text of every element that has it, a MathML node's included.
const SOURCE_ATTRIBUTE = 'data-pie-latex';

const escapeAttribute = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const isDisplayMath = (wrapper) =>
  typeof wrapper === 'string' ? wrapper === 'double_dollar' : ['$$', '\\['].includes(wrapper?.open);

/**
 * LaTeX for a MathML string, or null when there is none to give. A converter the page installed,
 * such as the legacy renderer's, answers first; `mmlToLatex` gives the input back when there is
 * none, and then this converts, so the ESM page, which installs only `renderMath`, converts too.
 * The converter belongs here, not in the math adapter: only authoring needs it, and every
 * element's delivery bundle carries the adapter. It answers an empty string for MathML it cannot
 * read and throws on some; neither is LaTeX, and neither may become a math node.
 */
export const convertMathMlToLatex = (mathMl) => {
  const input = mathMl.replaceAll('&nbsp;', ' ');
  let converted = mmlToLatex(input);

  if (converted === input) {
    try {
      converted = MathMLToLaTeX.convert(input);
    } catch {
      return null;
    }
  }

  if (!converted || converted === input) {
    return null;
  }

  return converted.replace(EMPTY_FENCE, '') || null;
};

/**
 * MathML for LaTeX, or null when there is none to give: MathJax has not started, or cannot read the
 * LaTeX. A caller keeps the LaTeX then. The MathML carries the LaTeX it was made from, so that
 * editing it again reads that back exactly, where converting the MathML would lose some.
 */
export const convertLatexToMathMl = (latex, wrapper) => {
  const mathMl = latexToMml(latex, { display: isDisplayMath(wrapper) });

  if (!mathMl || !mathMl.startsWith('<math')) {
    return null;
  }

  return mathMl
    .replace(EMPTY_MO, '')
    // A function, as the LaTeX can hold `$&` and the like, which a replacement string would expand.
    .replace('<math', () => `<math ${SOURCE_ATTRIBUTE}="${escapeAttribute(latex)}"`);
};

/**
 * Attributes of a math node made from MathML, or false when `mmlEditing` is off or the MathML cannot
 * be edited as LaTeX. `mathElement` is the `<math>` element, when there is one.
 */
const mathMlToAttrs = (mathMl, options, mathElement) => {
  if (!options?.mathMlOptions?.mmlEditing) {
    return false;
  }

  const displayWrapper = mathElement?.getAttribute('display') === 'block' ? DISPLAY_WRAPPER : null;

  // MathML saved under `mmlOutput` carries the LaTeX it was made from. That reads back exactly,
  // where converting the MathML loses some, an exponent for one. MathJax's own `data-latex` on a
  // `<math>` holds the same, for MathML made elsewhere.
  const embedded = (
    mathElement?.getAttribute(SOURCE_ATTRIBUTE) ?? mathElement?.getAttribute('data-latex')
  )?.trim();

  if (embedded) {
    return { latex: embedded, wrapper: displayWrapper };
  }

  const latex = convertMathMlToLatex(mathMl);

  if (latex === null) {
    return false;
  }

  const { unwrapped, wrapper } = unWrapMath(latex);

  return { latex: unwrapped, wrapper: wrapper || displayWrapper };
};

/**
 * A span of saved MathML. A DOM node, because an array spec can only set attributes, and the span
 * must hold markup. It is made in an inert document: an element made in the page's own would load
 * and run what the markup holds the moment it is parsed.
 */
const mathMlSpan = (html) => {
  const span = document.implementation.createHTMLDocument('').createElement('span');

  span.setAttribute('data-type', 'mathml');
  span.innerHTML = html;

  return span;
};

const MATHML_ELEMENTS = new Set(
  (
    'math maction maligngroup malignmark menclose merror mfenced mfrac mglyph mi mlabeledtr mlongdiv mmultiscripts ' +
    'mn mo mover mpadded mphantom mprescripts mroot mrow ms mscarries mscarry msgroup msline mspace msqrt msrow ' +
    'mstack mstyle msub msubsup msup mtable mtd mtext mtr munder munderover semantics'
  ).split(' ')
);

/**
 * MathML that is safe to put in the live page: only MathML presentation elements, with no event
 * handlers and no script URLs. `mathMlSpan` parses in an inert document, but markup shown in the page runs.
 */
export const sanitizeMathMl = (html) => {
  const span = mathMlSpan(html);

  const clean = (parent) => {
    for (const child of Array.from(parent.children)) {
      if (!MATHML_ELEMENTS.has(child.localName)) {
        child.remove();
        continue;
      }

      for (const { name, value } of Array.from(child.attributes)) {
        if (/^on/i.test(name) || /^\s*javascript:/i.test(value)) {
          child.removeAttribute(name);
        }
      }

      clean(child);
    }
  };

  clean(span);

  return span.innerHTML;
};

const ensureTextAfterMathPluginKey = new PluginKey('ensureTextAfterMath');

const generateAdditionalKeys = (keyData = []) => {
  return keyData.map((key) => ({
    name: key,
    latex: key,
    write: key,
    label: key,
  }));
};

export const EnsureTextAfterMathPlugin = (mathNodeName) =>
  new Plugin({
    key: ensureTextAfterMathPluginKey,
    appendTransaction: (transactions, oldState, newState) => {
      // Only act when the doc actually changed
      if (!transactions.some((tr) => tr.docChanged)) {
        return null;
      }

      const tr = newState.tr;
      let changed = false;

      newState.doc.descendants((node, pos) => {
        if (node.type.name === mathNodeName) {
          const nextPos = pos + node.nodeSize;
          const nextNode = newState.doc.nodeAt(nextPos);

          // If there's no node after, or the next node isn't text, insert a space
          if (!nextNode || nextNode.type.name !== 'text') {
            tr.insert(nextPos, newState.schema.text('\u200b'));
            changed = true;
          }
        }
      });

      return changed ? tr : null;
    },
  });

const nodeBeforeZeroWidthSpace = (doc, from) => {
  let i;

  // finding if previous to the cursor there's a zero-width space
  // and a non-text element, and deleting everything until the space
  for (i = from; i > 0; i--) {
    const currentDoc = doc.nodeAt(i);

    if (currentDoc?.type?.name === 'text' && currentDoc.textContent !== '\u200b') {
      return -1;
    }

    if (currentDoc && currentDoc?.type?.name !== 'text') {
      break;
    }
  }

  return i;
};

export const ZeroWidthSpaceHandlingPlugin = new Plugin({
  key: new PluginKey('zeroWidthSpaceHandling'),
  props: {
    handleKeyDown(view, event) {
      const { state, dispatch } = view;
      const { selection, doc } = state;
      const { from, empty } = selection;

      if (empty && event.key === 'Backspace' && from > 0) {
        const start = nodeBeforeZeroWidthSpace(doc, from);

        if (start === -1) {
          return false;
        }

        const tr = state.tr.delete(start, from);
        dispatch(tr);
        return true; // handled
      }

      if (empty && event.key === 'ArrowLeft' && from > 0) {
        const start = nodeBeforeZeroWidthSpace(doc, from);

        if (start === -1) {
          return false;
        }

        const resolved = state.doc.resolve(start);
        const maybeNode = resolved.nodeAfter || resolved.nodeBefore;

        // Check if there's an inline selectable node (e.g., your math node)
        if (maybeNode) {
          const nodeResolved = state.doc.resolve(start);
          const tr = state.tr.setSelection(NodeSelection.create(state.doc, nodeResolved.pos));
          dispatch(tr);
          return true;
        } else {
          // Just move the text cursor before the zwsp
          const tr = state.tr.setSelection(TextSelection.create(state.doc, from - 2));
          dispatch(tr);
          return true;
        }
      }

      return false;
    },
  },
});

export const MathNode = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: '' },
      wrapper: { default: null },
      html: { default: null },
    };
  },

  addProseMirrorPlugins() {
    return [EnsureTextAfterMathPlugin(this.name), ZeroWidthSpaceHandlingPlugin];
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex]',
        getAttrs: (el) => ({
          // A span saved without `data-raw`, or with delimiters in it, holds delimited TeX, which
          // `renderHTML` would wrap a second time.
          latex: unWrapMath(el.getAttribute('data-raw') || el.textContent).unwrapped,
        }),
      },
      // With `mmlEditing` on, MathML is read as LaTeX so that it can be edited as math.
      {
        tag: 'span[data-type="mathml"]',
        priority: 60,
        getAttrs: (el) => {
          const math = el.querySelector('math');

          return mathMlToAttrs(math?.outerHTML || el.innerHTML, this.options, math);
        },
      },
      {
        tag: 'math',
        getAttrs: (el) => mathMlToAttrs(el.outerHTML, this.options, el),
      },
      {
        tag: 'span[data-type="mathml"]',
        getAttrs: (el) => ({
          html: el.innerHTML,
        }),
      },
      // MathML that is not edited as math stays as it is, as the Slate editor kept it. Without this,
      // a bare `<math>` has no node to become, and saving the field leaves only its digits.
      {
        tag: 'math',
        getAttrs: (el) => ({
          html: el.outerHTML,
        }),
      },
    ];
  },

  addCommands() {
    return {
      insertMath:
        (latex = '') =>
        ({ tr, editor, dispatch }) => {
          const { state } = editor.view;
          const node = state.schema.nodes.math.create({
            latex,
          });
          const { selection } = state;

          // The inserted node is typically just before the cursor
          const pos = selection.$from.pos;

          tr.insert(pos, node);

          if (node?.type?.name === this.name) {
            // Create a NodeSelection from the current doc
            const sel = NodeSelection.create(tr.doc, selection.$from.pos);

            // Build a fresh transaction from the current state and set the selection
            tr.setSelection(sel);
          }

          dispatch(tr);

          setToolbarOpened(editor, true);
          return true;
        },
    };
  },

  renderHTML({ HTMLAttributes }) {
    if (HTMLAttributes.html) {
      return mathMlSpan(HTMLAttributes.html);
    }

    // With `mmlOutput` on, math is saved as MathML, and as LaTeX when MathML cannot be made of it.
    if (this.options.mathMlOptions?.mmlOutput) {
      const mathMl = convertLatexToMathMl(HTMLAttributes.latex, HTMLAttributes.wrapper);

      if (mathMl) {
        return mathMlSpan(mathMl);
      }
    }

    return [
      'span',
      { 'data-latex': '', 'data-raw': HTMLAttributes.latex },
      wrapMath(HTMLAttributes.latex, HTMLAttributes.wrapper),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer((props) => <MathNodeView {...{ ...props, options: this.options }} />);
  },
});

/**
 * The math toolbar's viewport left edge. Its inline-start edge meets the anchor's, so it opens
 * rightwards in LTR text and leftwards in RTL, and it stays `margin` inside the viewport.
 */
export const mathToolbarLeft = (
  anchor: { left: number; right: number },
  toolbarWidth: number,
  rtl: boolean,
  viewportWidth: number,
  margin: number,
): number => {
  const left = rtl ? anchor.right - toolbarWidth : anchor.left;
  return Math.max(margin, Math.min(left, viewportWidth - toolbarWidth - margin));
};

export const MathNodeView = (props) => {
  const { node, updateAttributes, editor, selected, options, getPos } = props;
  const [showToolbar, setShowToolbar] = useState(selected);
  const toolbarRef = useRef(null);
  const nodeRef = useRef(null);
  const timestamp = useRef(Date.now());
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const { math: mathOptions = {} } = options || {};
  const {
    keypadMode,
    controlledKeypadMode = true,
    customKeys = [],
    keyPadCharacterRef,
    setKeypadInteraction,
  } = mathOptions;

  const latex = node.attrs.latex || '';

  const handleChange = (newLatex) => {
    updateAttributes({ latex: newLatex });
  };

  // moveCursorAfterNode is set explicitly by the caller (not inferred from
  // editor.state.selection: every keystroke while editing already calls
  // updateAttributes, which replaces this node's content and — per a
  // ProseMirror mapping quirk — collapses any NodeSelection on it into a
  // plain TextSelection right away, so the live selection can't be trusted
  // to still describe this node by the time handleDone runs).
  //
  // - Check icon: always move the cursor to just after this node.
  // - Clicking elsewhere in the editable content while the toolbar was
  //   open (see handleClickOutside): leave the cursor where the user
  //   actually clicked instead of overriding it.
  const handleDone = (newLatex, { moveCursorAfterNode = true } = {}) => {
    updateAttributes({ latex: newLatex });
    setShowToolbar(false);

    if (moveCursorAfterNode && typeof getPos === 'function') {
      const pos = getPos();
      const { doc } = editor.state;
      const sel = TextSelection.create(doc, pos + node.nodeSize);
      const tr = editor.state.tr.setSelection(sel);
      editor.view.dispatch(tr);
    }

    editor.commands.focus();
  };

  // Only open the toolbar when this node is *explicitly* selected
  // via a NodeSelection — not when it's merely included in a broader
  // TextSelection or AllSelection (e.g. click-drag across math, or Cmd+A).
  useEffect(() => {
    if (!selected) return;

    const { selection } = editor.state;
    const isNodeSelected = selection.node?.type?.name === 'math';

    if (isNodeSelected) {
      setShowToolbar(true);
    }
  }, [selected, editor]);

  useEffect(() => {
    setToolbarOpened(editor, selected || showToolbar);
  }, [editor, showToolbar, selected]);

  useEffect(() => {
    if (!editor || !showToolbar) {
      setPosition({ top: 0, left: 0 });
      return;
    }

    // Clamp in viewport coordinates, then convert to portal-container-relative values
    // for position: absolute (toolbar is portaled into _tiptapContainerEl or document.body).
    const updatePosition = () => {
      if (!toolbarRef.current) {
        return;
      }

      const { from } = editor.state.selection;
      const start = editor.view.coordsAtPos(from);
      const nodeRect = nodeRef.current?.getBoundingClientRect?.();

      // Anchor to the math node element when available; fall back to selection coords.
      const rtl = getComputedStyle(nodeRef.current ?? editor.view.dom).direction === 'rtl';
      const anchorTop = nodeRect?.height ? nodeRect.top : start.top;
      const anchorBottom = nodeRect?.height ? nodeRect.bottom : (start.bottom ?? start.top);

      const toolbarHeight = toolbarRef.current.offsetHeight;
      const toolbarWidth = toolbarRef.current.offsetWidth;

      const gap = 0;
      const spaceBelow = window.innerHeight - (anchorBottom + gap);

      // Place the toolbar directly below the anchor; flip above when needed.
      let top = spaceBelow >= toolbarHeight ? anchorBottom + gap : anchorTop - toolbarHeight - gap;

      const margin = 8;
      top = Math.max(margin, Math.min(top, window.innerHeight - toolbarHeight - margin));
      const left = mathToolbarLeft(
        nodeRect?.width ? nodeRect : start,
        toolbarWidth,
        rtl,
        window.innerWidth,
        margin,
      );

      const portalEl = editor._tiptapContainerEl || document.body;
      const containerRect = portalEl.getBoundingClientRect();

      setPosition({
        top: top - containerRect.top,
        left: left - containerRect.left,
      });
    };

    updatePosition();

    let frame = null;
    const scheduleUpdate = () => {
      if (frame !== null) {
        return;
      }

      frame = requestAnimationFrame(() => {
        frame = null;
        updatePosition();
      });
    };

    frame = requestAnimationFrame(() => {
      frame = null;
      updatePosition();
    });

    window.addEventListener('scroll', scheduleUpdate, true);
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frame !== null) {
        cancelAnimationFrame(frame);
      }

      window.removeEventListener('scroll', scheduleUpdate, true);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [editor, showToolbar]);

  useEffect(() => {
    // The toolbar can open from the very click that is still bubbling to `document`
    // (e.g. the toolbar's math button inserting a node). Ignore any event that
    // started before this listener was registered, or it closes the toolbar at once.
    const listenerAddedAt = performance.now();

    const handleClickOutside = (event) => {
      if (event?.timeStamp < listenerAddedAt) {
        return;
      }

      const target = event?.target;

      // MUI's `Select` renders its dropdown options in a portal attached to `document.body`.
      // Those clicks should not dismiss the math toolbar.
      const equationEditorListboxes =
        document.querySelectorAll?.(
          '[id^="equation-editor-select"][id*="listbox"], [aria-labelledby="equation-editor-label"][role="listbox"]',
        ) || [];

      const equationEditorPopoverOpen = equationEditorListboxes.length > 0;
      const clickedEquationEditorSelect =
        !!(target?.id && target.id.includes('equation-editor-select')) ||
        !!target?.closest?.('[id*="equation-editor-select"]');

      // If the click originated from the math node preview itself (the element
      // that opens the toolbar), ignore it here — the node's own onClick handler
      // will keep/re-open the toolbar. Without this guard, closing and then
      // immediately clicking the math node would fire this listener in the same
      // event cycle and close the toolbar before it could open.
      const clickedMathNode = !!target?.closest?.(`.math-node-${timestamp.current}`);

      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(target) &&
        !target?.closest?.('[data-inline-node]') &&
        !equationEditorPopoverOpen &&
        !clickedEquationEditorSelect &&
        !clickedMathNode
      ) {
        setShowToolbar(false);

        // If the click landed inside the editable content itself, respect
        // it and leave the cursor where the user clicked. If it landed
        // fully outside the editor (e.g. on other page UI), there's no
        // click position to preserve — falling back to "leave selection
        // untouched" there renders the browser's native NodeSelection
        // fallback caret at the start of the node, so explicitly move the
        // cursor after it instead, same as the check-icon path.
        const clickedInsideEditableContent = !!editor?.view?.dom?.contains(target);
        handleDone(node.attrs.latex, { moveCursorAfterNode: !clickedInsideEditableContent });
      }
    };

    if (showToolbar) {
      // Use `click` (not `mousedown`) so interacting with browser UI like the scrollbar
      // doesn't automatically dismiss the math toolbar.
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }

    return () => document.removeEventListener('click', handleClickOutside);
  }, [editor, showToolbar, node]);

  // MathML kept as MathML (mmlEditing off, or MathML that cannot be read as LaTeX) has no LaTeX to
  // edit: it is shown as it is, as Slate showed it, and has no toolbar.
  if (node.attrs.html && !latex) {
    return (
      <NodeViewWrapper
        as="span"
        data-type="mathml"
        style={{ display: 'inline-block', margin: '0 4px' }}
        contentEditable={false}
        dangerouslySetInnerHTML={{ __html: sanitizeMathMl(node.attrs.html) }}
      />
    );
  }

  return (
    <NodeViewWrapper
      className={`math-node-${timestamp.current}`}
      style={{
        display: 'inline-flex',
        cursor: 'pointer',
        margin: '0 4px',
      }}
      data-selected={selected}
    >
      <div ref={nodeRef} onClick={() => setShowToolbar(true)} contentEditable={false}>
        <MathPreview latex={latex} />
      </div>
      {showToolbar &&
        ReactDOM.createPortal(
          <div
            ref={toolbarRef}
            data-toolbar-for={editor.instanceId}
            style={{
              position: 'absolute',
              top: `${position.top}px`,
              left: `${position.left}px`,
              zIndex: 1000,
              background: TOOLBAR_BACKGROUND,
              boxShadow:
                '0px 1px 5px 0px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 3px 1px -2px rgba(0, 0, 0, 0.12)',
            }}
          >
            <MathToolbar
              latex={latex}
              autoFocus
              onChange={handleChange}
              onDone={handleDone}
              keypadMode={keypadMode}
              controlledKeypadMode={controlledKeypadMode}
              additionalKeys={generateAdditionalKeys(customKeys)}
              keyPadCharacterRef={keyPadCharacterRef}
              setKeypadInteraction={setKeypadInteraction}
            />
          </div>,
          editor?._tiptapContainerEl || document.body,
        )}
    </NodeViewWrapper>
  );
};
