// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { DragProvider } from '@pie-lib/drag';
import { DragOverlay } from '@dnd-kit/core';
import Choices from './choices/index.js';
import Choice from './choices/choice.js';
import Blank from './components/blank.js';
import { withMask } from './with-mask.js';
import { closestDroppableKeyboardCoordinates } from './keyboard-coordinates.js';
import { blanksFirst } from './collision-detection.js';
import { visuallyHidden } from './visually-hidden.js';
import {
  applyPlacement,
  describeDeselection,
  describeFocusTarget,
  describeIntro,
  describeNotOverBlank,
  describePlacementResult,
  describeSelection,
  translatorFor,
} from './announcements.js';

// A click that lands right after a real drag gesture ends (pointer drag-and-drop, or
// the browser's own synthetic click for a keyboard Space/Enter) must be ignored by the
// click-to-select/click-to-place handlers below, or it would immediately reopen or
// re-trigger a selection for a drag that just completed.
const CLICK_AFTER_DRAG_GUARD_MS = 250;

const Masked = withMask('blank', (props) => (node, data, onChange) => {
  const dataset = node.data?.dataset || {};
  if (dataset.component === 'blank') {
    // eslint-disable-next-line react/prop-types
    const {
      disabled,
      duplicates,
      correctResponse,
      feedback,
      showCorrectAnswer,
      emptyResponseAreaWidth,
      emptyResponseAreaHeight,
      instanceId,
      isDragging,
      language,
      selectedItem,
      onSelectClick,
      onPlacementClick,
    } = props;
    const choiceId = showCorrectAnswer ? correctResponse[dataset.id] : data[dataset.id];
    // eslint-disable-next-line react/prop-types
    const choice = choiceId && props.choices.find((c) => c.id === choiceId);

    return (
      <Blank
        key={`${node.type}-${dataset.id}`}
        correct={showCorrectAnswer || (feedback && feedback[dataset.id])}
        disabled={disabled}
        duplicates={duplicates}
        choice={choice}
        id={dataset.id}
        emptyResponseAreaWidth={emptyResponseAreaWidth}
        emptyResponseAreaHeight={emptyResponseAreaHeight}
        onChange={(id, choiceId) => {
          const newData = { ...data };
          if (choiceId === undefined) {
            delete newData[id];
          } else {
            newData[id] = choiceId;
          }
          onChange(newData);
        }}
        instanceId={instanceId}
        isDragging={isDragging}
        language={language}
        selectedItem={selectedItem}
        onSelectClick={onSelectClick}
        onPlacementClick={onPlacementClick}
      />
    );
  }
});

export default class DragInTheBlank extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeDragItem: null,
      dropAnimation: undefined,
      selectedItem: null,
      // What a placement just did, for the live region; dnd-kit's own region only knows the drag.
      resultMessage: '',
    };
    this.lastDragEndAt = 0;
    this.endingDragForPlacement = false;
    this.pointerDrag = false;
    this.awaitingFirstOver = false;
  }

  static propTypes = {
    markup: PropTypes.string,
    layout: PropTypes.object,
    choicesPosition: PropTypes.string,
    choices: PropTypes.array,
    value: PropTypes.object,
    onChange: PropTypes.func,
    duplicates: PropTypes.bool,
    disabled: PropTypes.bool,
    feedback: PropTypes.object,
    correctResponse: PropTypes.object,
    showCorrectAnswer: PropTypes.bool,
    emptyResponseAreaWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    emptyResponseAreaHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    instanceId: PropTypes.string,
    language: PropTypes.string,
  };

  static defaultProps = {
    instanceId: 'drag-in-the-blank',
  };

  handleDragStart: any = (event) => {
    const { active } = event;

    // Compared by type, not instanceof: inside an iframe the event's constructor is another realm's.
    this.pointerDrag = /^(pointer|mouse|touch)/.test(event.activatorEvent?.type || '');

    if (active?.data?.current) {
      this.setState({
        activeDragItem: active.data.current,
        dropAnimation: undefined, // default during drag
        selectedItem: active.data.current,
        resultMessage: '',
      });
    }
  };

  renderDragOverlay: any = () => {
    const { activeDragItem } = this.state;
    if (!activeDragItem) return null;

    if (activeDragItem.type === 'MaskBlank') {
      return (
        <Choice
          disabled={activeDragItem.disabled}
          choice={activeDragItem.choice}
          instanceId={activeDragItem.instanceId}
          language={this.props.language}
        />
      );
    }

    return null;
  };

  // Shared placement logic for both the drag-end path and the click-to-place path, so
  // neither reimplements the other's mutation rules.
  //
  // `targetId === undefined` means "the choice board" — placing there removes the item
  // from wherever it currently is (mirroring image-cloze-association's
  // `containerIndex === undefined` convention for its own choices pool).
  commitPlacement: any = (draggedItem, targetId) => {
    const { onChange, value } = this.props;

    if (!onChange) return;

    const next = applyPlacement(value, draggedItem, targetId);

    // A drop that changes nothing is not a change to report.
    if (next !== value) {
      onChange(next);
    }
  };

  // The i18n view, and the model's slice the announcements are built from.
  getAnnouncementContext: any = () => {
    const { markup, duplicates, choices, value, language } = this.props;

    return {
      t: translatorFor(language, () => this.forceUpdate()),
      config: { markup, duplicates, choices: choices || [] },
      value: value || {},
    };
  };

  // Describes the placement against the session as it is *before* the placement is applied.
  announceResult: any = (draggedItem, targetId, committed = true) => {
    const { t, config, value } = this.getAnnouncementContext();

    this.setState({
      resultMessage: committed
        ? describePlacementResult(t, config, value, draggedItem, targetId)
        : describeDeselection(t, config, draggedItem.choice?.id),
    });
  };

  handleDragEnd: any = (event) => {
    const { active, over } = event;

    const draggedData = active?.data?.current;
    const dropData = over?.data?.current;

    const isValidDrop =
      !!active && !!over && draggedData?.type === 'MaskBlank' && dropData?.accepts?.includes('MaskBlank');

    // Only animate back when drop is invalid
    this.setState({
      activeDragItem: null,
      dropAnimation: isValidDrop ? null : undefined,
    });

    this.cancelSelection();
    this.lastDragEndAt = Date.now();

    if (!draggedData) return;

    if (!isValidDrop) {
      this.announceResult(draggedData, undefined, false);
      return;
    }

    const targetId = dropData.toChoiceBoard === true ? undefined : dropData.id;

    this.announceResult(draggedData, targetId);
    this.commitPlacement(draggedData, targetId);
  };

  onDragCancel: any = () => {
    // A placement ended this drag itself, and has already said what it did.
    this.setState(
      this.endingDragForPlacement
        ? { activeDragItem: null, dropAnimation: undefined }
        : { activeDragItem: null, dropAnimation: undefined, resultMessage: '' },
    );
    this.cancelSelection();
    this.lastDragEndAt = Date.now();
  };

  isSameItem: any = (a, b) => {
    if (!a || !b || a.fromChoice !== b.fromChoice) return false;
    return a.fromChoice ? a.choice.id === b.choice.id : a.id === b.id;
  };

  // Click-to-select semantics: selecting the currently-selected item again clears the
  // selection instead of re-selecting it.
  toggleItemSelection: any = (data) => {
    const { t, config } = this.getAnnouncementContext();

    this.setState((state) => {
      const deselecting = this.isSameItem(state.selectedItem, data);

      return {
        selectedItem: deselecting ? null : data,
        resultMessage: deselecting
          ? describeDeselection(t, config, data.choice?.id)
          : describeSelection(t, config, data.choice?.id),
      };
    });
  };

  cancelSelection: any = () => {
    this.setState({ selectedItem: null });
  };

  // If a real dnd-kit drag (started via keyboard Space/Enter) is still live when a
  // click completes the placement below, it needs to be cleanly ended — otherwise
  // dnd-kit would still think a drag is in progress. Escape is already configured as
  // this sensor's cancel key (see the keyboardCodes passed to DragProvider below), and
  // dispatching it as a real DOM KeyboardEvent is how dnd-kit's own document-level
  // listener is reached from outside its sensor.
  //
  // Only dispatch when a drag is actually live — this is a synthetic Escape keydown on
  // `document`, so an unconditional dispatch would also be observed by any other
  // document-level Escape listener (host player modals/dialogs, or another mounted
  // instance of this same component) even when nothing here actually needed cancelling.
  endAnyLiveKeyboardDrag: any = () => {
    if (!this.state.activeDragItem) return;

    // dnd-kit's cancel handler runs onDragCancel and its announcement synchronously (it only awaits
    // for a drop with `cancelDrop`), so the flag is still up when they read it.
    this.endingDragForPlacement = true;

    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }));
    } finally {
      this.endingDragForPlacement = false;
    }
  };

  placeSelectedItem: any = (targetId) => {
    const { selectedItem } = this.state;

    if (!selectedItem) return;

    this.announceResult(selectedItem, targetId);
    this.commitPlacement(selectedItem, targetId);
    this.cancelSelection();
    this.endAnyLiveKeyboardDrag();
  };

  isClickSoonAfterDragEnd = () => Date.now() - this.lastDragEndAt < CLICK_AFTER_DRAG_GUARD_MS;

  onItemClick: any = (data) => {
    if (this.isClickSoonAfterDragEnd()) return;

    // End any still-live keyboard drag BEFORE toggling the new selection: ending it
    // also cancels the current selection as a side effect (see onDragCancel above), so
    // doing it before — not after — lets this click's own selection be the one that
    // sticks.
    this.endAnyLiveKeyboardDrag();
    this.toggleItemSelection(data);
  };

  onPlacementClick: any = (targetId) => {
    if (this.isClickSoonAfterDragEnd()) return;

    this.placeSelectedItem(targetId);
  };

  getPositionDirection: any = (choicePosition) => {
    let flexDirection;
    let justifyContent;
    let alignItems;

    switch (choicePosition) {
      case 'left':
        flexDirection = 'row';
        alignItems = 'center';
        break;
      case 'right':
        flexDirection = 'row-reverse';
        justifyContent = 'flex-end';
        alignItems = 'center';
        break;
      case 'below':
        flexDirection = 'column-reverse';
        break;
      default:
        // above
        flexDirection = 'column';
        break;
    }

    return { flexDirection, justifyContent, alignItems };
  };

  render() {
    const {
      markup,
      duplicates,
      value,
      onChange,
      choicesPosition,
      choices,
      correctResponse,
      disabled,
      feedback,
      showCorrectAnswer,
      emptyResponseAreaWidth,
      emptyResponseAreaHeight,
      layout,
      instanceId,
      language,
    } = this.props;

    const { t, config: announcementConfig, value: announcementValue } = this.getAnnouncementContext();
    const dragData = (event) => event?.data?.current;
    const element = this;

    // dnd-kit's own live region carries the drag as it unfolds; what a drop did is announced
    // from `resultMessage`, which knows the session before and after.
    const announcements = {
      onDragStart({ active }) {
        // dnd-kit's first over event reports where the choice was lifted from, which is not a move
        // and would replace the selection announcement within milliseconds.
        element.awaitingFirstOver = true;

        return describeSelection(t, announcementConfig, dragData(active)?.choice?.id);
      },

      onDragOver({ active, over }) {
        // The "press ENTER / TAB" wording is for the keyboard; a pointer drag has no use for it.
        if (element.pointerDrag) {
          return undefined;
        }

        const selected = dragData(active);
        const first = element.awaitingFirstOver;

        element.awaitingFirstOver = false;

        if (!over) {
          return describeNotOverBlank(t, announcementConfig, selected?.choice?.id);
        }

        const overData = dragData(over);

        // A choice lifted from the pool is first reported over the pool; row 12 is for Tab reaching it.
        if (first && selected?.fromChoice && overData?.toChoiceBoard) {
          return undefined;
        }

        // A filled blank is its own drop target when picked up; it is where the choice already sits.
        if (!selected || !overData || (!overData.toChoiceBoard && selected.fromChoice === false && String(overData.id) === String(selected.id))) {
          return undefined;
        }

        return describeFocusTarget(t, announcementConfig, selected, overData);
      },

      onDragEnd() {
        return undefined;
      },

      onDragCancel({ active }) {
        if (element.endingDragForPlacement) {
          return undefined;
        }

        return describeDeselection(t, announcementConfig, dragData(active)?.choice?.id);
      },
    };

    const choicePosition = choicesPosition || 'below';
    const style = { display: 'flex', minWidth: '100px', ...this.getPositionDirection(choicePosition) };

    return (
      <DragProvider
        onDragStart={this.handleDragStart}
        onDragEnd={this.handleDragEnd}
        onDragCancel={this.onDragCancel}
        collisionDetection={blanksFirst}
        keyboardCoordinateGetter={closestDroppableKeyboardCoordinates}
        keyboardCodes={{ start: ['Space', 'Enter'], cancel: ['Escape'], end: ['Space', 'Enter'] }}
        accessibility={{ announcements, screenReaderInstructions: { draggable: t('dragInstructionsA11y') } }}
      >
        <div ref={(ref) => (this.rootRef = ref)} style={style}>
          {!disabled && <div style={visuallyHidden}>{describeIntro(t, announcementConfig, announcementValue)}</div>}
          <div style={visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
            {this.state.resultMessage}
          </div>
          <Choices
            choicePosition={choicePosition}
            choices={choices}
            value={value}
            duplicates={duplicates}
            disabled={disabled}
            instanceId={instanceId}
            selectedItem={this.state.selectedItem}
            onSelectClick={this.onItemClick}
            onPlacementClick={this.onPlacementClick}
            markup={markup}
            language={language}
          />
          <Masked
            elementType="drag-in-the-blank"
            markup={markup}
            layout={layout}
            value={value}
            choices={choices}
            onChange={onChange}
            disabled={disabled}
            duplicates={duplicates}
            feedback={feedback}
            correctResponse={correctResponse}
            showCorrectAnswer={showCorrectAnswer}
            emptyResponseAreaWidth={emptyResponseAreaWidth}
            emptyResponseAreaHeight={emptyResponseAreaHeight}
            instanceId={instanceId}
            isDragging={!!this.state.activeDragItem}
            language={language}
            selectedItem={this.state.selectedItem}
            onSelectClick={this.onItemClick}
            onPlacementClick={this.onPlacementClick}
          />
          <DragOverlay style={{ pointerEvents: 'none' }} dropAnimation={this.state.dropAnimation}>
            {this.renderDragOverlay()}
          </DragOverlay>
        </div>
      </DragProvider>
    );
  }
}
