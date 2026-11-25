// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, KeyboardCode } from '@dnd-kit/core';
import { restrictToWindowEdges  } from '@dnd-kit/modifiers';
import { closestResponseArea } from './collision-detection.js';
import { closestDroppableKeyboardCoordinates } from './keyboard-coordinates.js';
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';
import { motionSafeDropAnimation } from '@pie-lib/drag';
import { color, createUniqueId, Feedback as FeedbackImport, PreviewPrompt as PreviewPromptImport } from '@pie-lib/render-ui';

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
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt') || unwrapReactInteropSymbol(renderUi.PreviewPrompt, 'PreviewPrompt');
const Feedback = unwrapReactInteropSymbol(FeedbackImport, 'Feedback') || unwrapReactInteropSymbol(renderUi.Feedback, 'Feedback');
import { styled } from '@mui/material/styles';
import AnswerArea from './answer-area.js';
import ChoicesList from './choices-list.js';
import { Answer, buildDragId } from './answer.js';
import { catalogs } from '../i18n/index.js';
import { visuallyHidden } from './visually-hidden.js';
import {
  applyPlacement,
  choiceLabel,
  describeCancellation,
  describeDeselection,
  describeFocusTarget,
  describeIntro,
  describePlacementResult,
  describeSelection,
} from './announcements.js';

// A click that lands right after a real drag gesture ends (pointer drag-and-drop, or
// the browser's own synthetic click for a keyboard Space/Enter) must be ignored by the
// new click-to-select/click-to-place handlers below, or it would immediately reopen or
// re-trigger a selection for a drag that just completed.
const CLICK_AFTER_DRAG_GUARD_MS = 250;

const sensors = [
  // Without an activationConstraint, dnd-kit's PointerSensor calls its internal
  // handleStart() synchronously on pointerdown, before any movement — meaning a plain
  // click is itself "activated" as a drag. Once activated, dnd-kit adds a capture-phase
  // document click listener that calls stopPropagation() (to suppress the native
  // "ghost click" a real drag leaves behind), which also swallows the click for a
  // gesture with zero movement, before it ever reaches our own onClick handlers below.
  // Requiring 8px of movement (matching @pie-lib/drag's DragProvider convention used
  // elsewhere in this codebase) defers activation until an actual drag gesture is
  // underway, so a plain click passes through untouched.
  { sensor: PointerSensor, options: { activationConstraint: { distance: 8 } } },
  {
    sensor: KeyboardSensor,
    options: {
      coordinateGetter: closestDroppableKeyboardCoordinates,
      keyboardCodes: {
        start: [KeyboardCode.Space, KeyboardCode.Enter],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter],
      },
    },
  },
];

const MainContainer: any = styled('div')({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  color: color.text(),
  backgroundColor: color.background(),
});

const InteractiveRegion: any = styled('div')({
  width: '100%',
  overflowX: 'auto',
  overflowY: 'hidden',
});

// A block child of a scroll port is sized to the scroll port, so it has to opt out explicitly for
// the content to be able to overflow. min-content keeps the rows and the pool the same width.
const InteractiveRegionContent: any = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minWidth: 'min-content',
});

export class Main extends React.Component {
  static propTypes = {
    session: PropTypes.object.isRequired,
    onSessionChange: PropTypes.func,
    model: PropTypes.object.isRequired,
    prompt: PropTypes.string,
    /** The interface locale the custom element resolved; the chrome speaks it. */
    language: PropTypes.string,
  };

  constructor(props) {
    super(props);

    // Random rather than a counter: two versions of this element on one page each count from 1, and
    // tile focus, prompt label ids and dnd-kit's drag instructions are looked up across the whole
    // document.
    this.instanceId = createUniqueId('match-list');
    this.state = {
      showCorrectAnswer: false,
      draggingElement: null,
      selectedAnswer: null,
      // Everything announced while selecting and placing. It is the only live region the element
      // fills (dnd-kit's own is left empty): two regions compete in JAWS and cut each other off.
      resultMessage: '',
    };
    this.lastDragEndAt = 0;
    this.endingDragForPlacement = false;
    this.pointerDrag = false;
    // Whether focus has left the place the drag started from; until then dnd-kit's initial
    // "over" event must not talk over the selection announcement (row 8).
    this.movedSinceStart = false;
    this.announceFlip = false;
  }

  // The same text twice in a row would not be read again, so every message alternates a trailing
  // no-break space.
  announce: any = (message) => {
    if (!message) {
      return;
    }

    this.announceFlip = !this.announceFlip;
    this.setState({ resultMessage: this.announceFlip ? message : `${message}\u00a0` });
  };

  onRemoveAnswer(id) {
    const { session, onSessionChange } = this.props;

    session.value[id] = undefined;

    onSessionChange(session);
  }

  onDragStart: any = (event) => {
    const { active } = event;

    // Compared by type, not instanceof: inside an iframe the event's constructor is another realm's.
    this.pointerDrag = /^(pointer|mouse|touch)/.test(event.activatorEvent?.type || '');
    this.movedSinceStart = false;

    if (active?.data?.current) {
      let rect = null;
      const node = active.node?.current;

      if (node) {
        const { width, height } = node.getBoundingClientRect();
        rect = { width, height };
      }

      this.setState({
        draggingElement: { ...active.data.current, rect },
      });
      this.selectAnswer(active.data.current);
    }
  };

  onDragCancel: any = () => {
    this.setState({ draggingElement: null });
    this.cancelSelection();
    this.lastDragEndAt = Date.now();
  };

  // Pure placement logic
  placeAnswer: any = (activeData, overData) => {
    if (!activeData || !overData) {
      return;
    }

    const { session, onSessionChange, model } = this.props;
    const {
      config: { duplicates },
    } = model;

    const next = applyPlacement(session.value, activeData, overData, duplicates);

    // A drop that changes nothing is not a change to report.
    if (next === session.value) {
      return;
    }

    session.value = next;
    onSessionChange(session);
  };

  // The i18n view and the model's slice the announcements are built from.
  getAnnouncementContext: any = () => {
    const { model, session, language } = this.props;
    const i18n = catalogs.forLocale(language);

    return { t: i18n.t.bind(i18n), config: model.config, value: session.value || {} };
  };

  // Describes the placement against the session as it is *before* the placement is applied.
  announceResult: any = (activeData, overData) => {
    const { t, config, value } = this.getAnnouncementContext();
    const resultMessage = overData
      ? describePlacementResult(t, config, value, activeData, overData)
      : describeDeselection(t, config, activeData.id);

    this.announce(resultMessage);
  };

  onPlaceAnswer: any = (event) => {
    this.setState({ draggingElement: null });
    const { active, over } = event;

    if (!active) {
      return;
    }

    const activeData = active.data.current;
    const overData = over?.data.current;

    if (!activeData) {
      return;
    }

    const destinationDragId = this.getDestinationDragId(activeData, overData);

    this.announceResult(activeData, overData);
    this.placeAnswer(activeData, overData);
    this.cancelSelection();
    this.lastDragEndAt = Date.now();
    this.focusTile(destinationDragId);
  };

  // dnd-kit's KeyboardSensor keeps/restores native DOM focus on the originally
  // picked-up node throughout and after a drag. After a target-to-target move that
  // node is the SOURCE response area, which then re-renders holding whatever the
  // destination displaced (or nothing) — so native focus (and its browser :focus
  // outline) reads as "the source area is still selected" even though the custom
  // selection border above is correctly cleared. Move focus to wherever the item
  // actually landed instead: the standard accessible pattern for keyboard drag-and-drop.
  getDestinationDragId: any = (activeData, overData) => {
    if (!activeData || !overData) {
      return null;
    }

    // Mirrors the two branches placeAnswer actually commits below — the destination
    // tile's identity is determined by overData alone, independent of duplicates/
    // swap details.
    if (overData.type === 'choices-pool' && activeData.promptId !== undefined) {
      return buildDragId({ type: 'choice', id: activeData.id });
    }

    if (overData.type === 'drop-zone' && overData.promptId != null) {
      return buildDragId({ type: 'target', promptId: overData.promptId });
    }

    return null;
  };

  // The destination tile only appears in the DOM after this component (and the host's
  // session-driven re-render) commits, so wait a couple of animation frames — long
  // enough for React's DOM commit and the browser's next paint — before querying for it.
  focusTile: any = (dragId) => {
    if (!dragId) {
      return;
    }

    const selector = `[data-tile-id="${this.instanceId}:${dragId}"]`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const node = document.querySelector(selector);

        node?.focus();
      });
    });
  };

  isSameAnswer = (a, b) => !!a && !!b && a.type === b.type && a.id === b.id && a.promptId === b.promptId;

  // Unconditionally selects (used by the drag-start mirror, and internally when
  // switching from one choice to another).
  selectAnswer: any = (data) => {
    this.setState({ selectedAnswer: data });
  };

  // Click-to-select semantics: selecting the currently-selected answer again clears
  // the selection instead of re-selecting it.
  toggleAnswerSelection: any = (data) => {
    const { t, config } = this.getAnnouncementContext();
    const deselecting = this.isSameAnswer(this.state.selectedAnswer, data);

    this.setState({ selectedAnswer: deselecting ? null : data });
    this.announce(deselecting ? describeDeselection(t, config, data.id) : describeSelection(t, config, data.id));
  };

  cancelSelection: any = () => {
    this.setState({ selectedAnswer: null });
  };

  // If a real dnd-kit drag (started via keyboard Space/Enter) is still live when a
  // click completes the placement below, it needs to be cleanly ended — otherwise
  // dnd-kit would still think a drag is in progress (still listening for Tab/arrow/
  // Space/Escape, still showing the drag overlay) for a placement the click already
  // performed. Escape is already configured as this sensor's cancel key, and
  // dispatching it as a real DOM KeyboardEvent is how dnd-kit's own document-level
  // listener is reached from outside its sensor. onDragCancel is intentionally not
  // wired to redo any placement — it only resets local UI state — so this is safe to
  // call unconditionally, including when no drag is actually live (dnd-kit simply has
  // no listener attached in that case, and the dispatch is a no-op).
  endAnyLiveKeyboardDrag: any = () => {
    // dnd-kit's cancel handler runs onDragCancel and its announcement synchronously (it only awaits
    // for a drop with `cancelDrop`), so the flag is still up when they read it.
    this.endingDragForPlacement = true;

    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }));
    } finally {
      this.endingDragForPlacement = false;
    }
  };

  placeSelectedAnswer: any = (overData) => {
    const { selectedAnswer } = this.state;

    if (!selectedAnswer) {
      return;
    }

    const destinationDragId = this.getDestinationDragId(selectedAnswer, overData);

    this.announceResult(selectedAnswer, overData);
    this.placeAnswer(selectedAnswer, overData);
    this.cancelSelection();
    this.endAnyLiveKeyboardDrag();
    this.lastDragEndAt = Date.now();
    this.focusTile(destinationDragId);
  };

  isClickSoonAfterDragEnd = () => Date.now() - this.lastDragEndAt < CLICK_AFTER_DRAG_GUARD_MS;

  onChoiceClick: any = (data) => {
    if (this.isClickSoonAfterDragEnd()) {
      return;
    }

    this.toggleAnswerSelection(data);
  };

  onPlacementClick: any = (overData) => {
    if (this.isClickSoonAfterDragEnd()) {
      return;
    }

    this.placeSelectedAnswer(overData);
  };

  toggleShowCorrect: any = () => {
    this.setState({ showCorrectAnswer: !this.state.showCorrectAnswer });
  };

  renderDragOverlay: any = () => {
    const { draggingElement } = this.state;

    if (!draggingElement) return null;

    return (
      <Answer
        id={draggingElement.id}
        title={draggingElement.value}
        disabled={false}
        isDragging={false}
        style={
          draggingElement.rect
            ? { width: draggingElement.rect.width, height: draggingElement.rect.height, boxSizing: 'border-box' }
            : {}
        }
      />
    );
  };

  render() {
    const { showCorrectAnswer } = this.state;
    const { model, session, language } = this.props;
    const { config, mode } = model;
    const { prompt } = config;
    const i18n = catalogs.forLocale(language);

    const { t, config: announcementConfig, value: announcementValue } = this.getAnnouncementContext();
    const dragData = (event) => event?.data?.current;
    const element = this;

    // Every announcement goes through `element.announce` into the one live region, and dnd-kit's
    // own region gets nothing. What a drop did is announced from `resultMessage`, which knows the
    // session before and after.
    const announcements = {
      onDragStart({ active }) {
        element.announce(describeSelection(t, announcementConfig, dragData(active)?.id));

        return undefined;
      },

      onDragOver({ active, over }) {
        // The "press ENTER / TAB" wording is for the keyboard; a pointer drag has no use for it.
        if (element.pointerDrag) {
          return undefined;
        }

        // dnd-kit reports where the dragged tile already is as soon as the drag starts. That is
        // not focus arriving anywhere (row 12 is for coming back to the pool after leaving it), so
        // it must not replace the selection announcement.
        const origin = dragData(active)?.promptId == null ? 'choices-pool' : `drop-${dragData(active).promptId}`;

        if (!element.movedSinceStart && String(over?.id) === origin) {
          return undefined;
        }

        element.movedSinceStart = true;

        if (!over) {
          element.announce(
            t('notOverResponseAreaA11y', {
              choice: choiceLabel(t, announcementConfig, dragData(active)?.id),
            }),
          );

          return undefined;
        }

        // A droppable registered without data is still named by its id: "choices-pool" or "drop-{promptId}".
        const overData =
          dragData(over) ||
          (over.id === 'choices-pool'
            ? { type: 'choices-pool' }
            : { type: 'drop-zone', promptId: String(over.id).replace(/^drop-/, '') });

        element.announce(describeFocusTarget(t, announcementConfig, dragData(active), overData));

        return undefined;
      },

      onDragEnd() {
        return undefined;
      },

      onDragCancel({ active }) {
        if (element.endingDragForPlacement) {
          return undefined;
        }

        // "Use TAB" is keyboard wording; a pointer drag that is cancelled has no use for it.
        if (element.pointerDrag) {
          return undefined;
        }

        element.announce(describeCancellation(t, announcementConfig, dragData(active)?.id));

        return undefined;
      },
    };

    return (
      <DndContext
        id={this.instanceId}
        sensors={sensors}
        collisionDetection={closestResponseArea}
        onDragStart={this.onDragStart}
        onDragEnd={this.onPlaceAnswer}
        onDragCancel={this.onDragCancel}
        modifiers={[restrictToWindowEdges]}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable: i18n.t('dragInstructionsA11y'),
          },
        }}
      >
        <MainContainer>
          <PreviewPrompt className="prompt" prompt={prompt} />

          {mode === 'gather' && <div style={visuallyHidden}>{describeIntro(t, announcementConfig, announcementValue)}</div>}
          <div style={visuallyHidden} role="status" aria-live="assertive" aria-atomic="true">
            {this.state.resultMessage}
          </div>

          <CorrectAnswerToggle
            show={mode === 'evaluate'}
            toggled={showCorrectAnswer}
            onToggle={this.toggleShowCorrect}
            language={language}
          />

          <InteractiveRegion>
            <InteractiveRegionContent>
              <AnswerArea
                instanceId={this.instanceId}
                model={model}
                session={session}
                onRemoveAnswer={(id) => this.onRemoveAnswer(id)}
                t={t}
                disabled={mode !== 'gather'}
                showCorrect={showCorrectAnswer}
                selectedAnswer={this.state.selectedAnswer}
                onChoiceClick={this.onChoiceClick}
                onPlacementClick={this.onPlacementClick}
              />

              <ChoicesList
                instanceId={this.instanceId}
                model={model}
                session={session}
                t={t}
                disabled={mode !== 'gather'}
                onRemoveAnswer={(id) => this.onRemoveAnswer(id)}
                selectedAnswer={this.state.selectedAnswer}
                onChoiceClick={this.onChoiceClick}
                onPlacementClick={this.onPlacementClick}
              />
            </InteractiveRegionContent>
          </InteractiveRegion>

          {model.correctness && model.feedback && !showCorrectAnswer && (
            <Feedback correctness={model.correctness.correctness} feedback={model.feedback} />
          )}
        </MainContainer>
        <DragOverlay dropAnimation={motionSafeDropAnimation()}>{this.renderDragOverlay()}</DragOverlay>
      </DndContext>
    );
  }
}

export default Main;
