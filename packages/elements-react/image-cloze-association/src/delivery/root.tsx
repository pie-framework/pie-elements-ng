// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { DragOverlay } from '@dnd-kit/core';
import { DragProvider } from '@pie-lib/drag';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { color, createUniqueId, hasTextAlternative, Collapsible as CollapsibleImport, PreviewPrompt as PreviewPromptImport, UiLayout as UiLayoutImport, hasText, hasMedia } from '@pie-lib/render-ui';

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
const UiLayout = unwrapReactInteropSymbol(UiLayoutImport, 'UiLayout') || unwrapReactInteropSymbol(renderUi.UiLayout, 'UiLayout');
const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt') || unwrapReactInteropSymbol(renderUi.PreviewPrompt, 'PreviewPrompt');
const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible') || unwrapReactInteropSymbol(renderUi.Collapsible, 'Collapsible');
import { styled } from '@mui/material/styles';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';
import { flatMap, groupBy } from '@pie-element/shared-lodash';
import { catalogs } from '../i18n/index.js';
import Image from './image-container.js';
import InteractiveSection from './interactive-section.js';
import PossibleResponses from './possible-responses.js';
import { getUnansweredAnswers, getAnswersCorrectness } from './utils-correctness.js';
import PossibleResponse from './possible-response.js';
import { closestDroppableKeyboardCoordinates } from './keyboard-coordinates.js';
import {
  choiceText,
  hasRichContent,
  plainText,
  describeChoiceTile,
  describeDeselection,
  describeFocusTarget,
  describeIntro,
  describePlacementResult,
  describeSelection,
} from './announcements.js';
import { visuallyHidden } from './visually-hidden.js';

// What a drop came to: it took effect, nothing moved, or a full area refused it.
// How long a drop's result waits for the screen reader to finish reading the tile that takes focus.
const RESULT_DELAY_MS = 700;

// How long the result stays in the name of the tile it was spoken for.
const RESULT_NOTE_MS = 4000;

const Placement = { PLACED: 'placed', UNCHANGED: 'unchanged', AREA_FULL: 'area-full' } as const;

const generateId = () => Math.random().toString(36).substring(2) + new Date().getTime().toString(36);

// A click that lands right after a real drag gesture ends (pointer drag-and-drop, or
// the browser's own synthetic click for a keyboard Space/Enter) must be ignored by the
// click-to-select/click-to-place handlers below, or it would immediately reopen or
// re-trigger a selection for a drag that just completed.
const CLICK_AFTER_DRAG_GUARD_MS = 250;

const StyledUiLayout: any = styled(UiLayout)({
  color: color.text(),
  backgroundColor: color.background(),
  position: 'relative',
  '& img': {
    maxWidth: '100%',
    height: 'auto',
  },
});

const StyledTeacherInstructions: any = styled(Collapsible)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledRationale: any = styled(Collapsible)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export class ImageClozeAssociationComponent extends React.Component {
  // The delivery element finds the container by its class, which authored CSS may also target.
  mainContainerId = createUniqueId('main-container');

  constructor(props) {
    super(props);
    const {
      model: { possibleResponses, responseContainers, duplicateResponses, maxResponsePerZone },
      session,
    } = props;
    let { answers } = session || {};
    // set id for each possible response
    const possibleResponsesWithIds = (possibleResponses || []).map((item, index) => ({
      value: item,
      id: `${index}`,
    }));

    let groupedAnswers = groupBy(answers || [], 'containerIndex');
    // keep only last maxResponsePerZone answers for each zone
    let limitedAnswers = flatMap(groupedAnswers, (grp) => grp.slice(-(maxResponsePerZone || 1)));
    answers = limitedAnswers
      // set id for each answer
      .map((answer, index) => ({ ...answer, id: `${index}` }))
      // return only answer which have a valid container index
      .filter((answer) => answer.containerIndex < responseContainers.length);

    const possibleResponsesFiltered = possibleResponsesWithIds.filter(
      (response) => !answers.find((answer) => answer.value === response.value),
    );
    this.state = {
      answers: answers || [],
      draggingElement: { id: '', value: '' },
      possibleResponses: duplicateResponses ? possibleResponsesWithIds : possibleResponsesFiltered,
      // set id for each response containers
      responseContainers: (responseContainers || []).map((item, index) => ({
        index,
        ...item,
        id: `${index}`,
      })),
      maxResponsePerZone: maxResponsePerZone || 1,
      showCorrect: false,
      isValidDrop: false,
      selectedResponse: null,
    };
    this.lastDragEndAt = 0;
    this.endingDragForPlacement = false;
    // Whether the drag in progress was started from the keyboard, which is the one announced in words for it.
    this.keyboardDrag = false;
    this.awaitingFirstOver = false;
    this.announceTimer = undefined;
    // Whether a dnd-kit drag is live, which announces the selection through its own region.
    this.dragLive = false;
    this.state.resultMessage = '';
    this.state.resultNote = null;
    this.noteTimer = undefined;
  }

  // The i18n view and the model's slice the announcements are built from.
  getAnnouncementContext: any = () => {
    const { model } = this.props;
    const { image, possibleResponses = [], duplicateResponses } = model;

    return {
      i18n: catalogs.forLocale(this.props.language ?? model.language),
      config: {
        alt: image?.alt,
        containers: this.state.responseContainers,
        possibleResponses,
        maxResponsePerZone: this.state.maxResponsePerZone,
        duplicateResponses,
      },
    };
  };

  // A live region only announces a change, so the same message twice in a row differs by a trailing space.
  announce: any = (message, delay = 0) => {
    clearTimeout(this.announceTimer);

    const show = () =>
      this.setState((state) => ({
        resultMessage: state.resultMessage === message ? `${message}\u00a0` : message,
      }));

    if (delay) {
      this.announceTimer = setTimeout(show, delay);
    } else {
      show();
    }
  };

  componentWillUnmount() {
    clearTimeout(this.announceTimer);
    clearTimeout(this.noteTimer);
  }

  // The result of a keyboard drop is read as part of the name of the tile that takes focus: a screen reader
  // reads a newly focused element for sure, but drops a live region that updates while it does.
  setResultNote: any = (note) => {
    clearTimeout(this.noteTimer);
    this.setState({ resultNote: note });

    if (note) {
      this.noteTimer = setTimeout(() => this.setState({ resultNote: null }), RESULT_NOTE_MS);
    }
  };

  // Applies the drop and announces what it did. The wording is read against the answers as they are
  // before the drop; `apply` says whether the drop took effect, so a refusal is never announced as a
  // placement, whichever rule refused it. `viaTile` is for a keyboard drop, which hands focus to a tile.
  announceResult: any = (selected, target, apply, viaTile = false) => {
    const { i18n, config } = this.getAnnouncementContext();
    const { answers, maxResponsePerZone } = this.state;
    const message = describePlacementResult(i18n, config, answers, selected, target);
    const result = apply();

    // A full area shows its warning; that is what the learner needs to hear. Any other drop that did not
    // take effect, like a drop back where the choice already was, changes nothing and reads as the end of
    // the selection.
    const text =
      result === Placement.AREA_FULL
        ? i18n.plural('reachedLimitA11y', { count: maxResponsePerZone })
        : result === Placement.PLACED || selected.containerIndex === target
          ? message
          : describeDeselection(i18n, config, selected);

    if (viaTile && result !== Placement.AREA_FULL) {
      this.setResultNote({ value: selected.value, containerIndex: target, message: text });

      return;
    }

    // After a drop focus goes back to a tile, which a screen reader then reads; said at once, the result
    // would be talked over, so it follows that.
    this.announce(text, RESULT_DELAY_MS);
  };

  onDragStart: any = (event) => {
    const { active } = event;

    // dnd-kit announces a drag to every sensor, in words for a keyboard: a pointer or touch drag is not spoken to.
    this.keyboardDrag = event?.activatorEvent?.type === 'keydown';
    this.dragLive = !!active?.data?.current;
    // dnd-kit reports where the drag starts as the first "over"; that is not a move the learner made.
    this.awaitingFirstOver = true;
    this.setResultNote(null);

    if (active?.data?.current) {
      this.setState({
        draggingElement: active.data.current,
        isValidDrop: false,
        selectedResponse: active.data.current,
      });
    }
  };

  onDragEnd: any = (event) => {
    const { active, over } = event;
    const { model } = this.props;
    const { duplicateResponses } = model || {};

    this.dragLive = false;

    const viaTile = this.keyboardDrag;

    // Check if drop is valid
    const draggedItem = active?.data?.current;
    const responseArea = over?.data?.current;
    const isValidDrop =
      over &&
      active &&
      draggedItem &&
      responseArea &&
      responseArea.containerIndex !== undefined;

    const shouldDisableAnimation = isValidDrop && duplicateResponses;

    this.setState({
      draggingElement: { id: '', value: '' },
      isValidDrop: shouldDisableAnimation,
    });

    this.cancelSelection();
    this.lastDragEndAt = Date.now();

    if (!draggedItem) {
      return;
    }

    if (!over || !active) {
      this.announceResult(draggedItem, draggedItem.containerIndex, () => Placement.UNCHANGED, viaTile);
      return;
    }

    if (over.id === 'ica-board') {
      this.announceResult(draggedItem, undefined, () => {
        if (draggedItem.containerIndex !== undefined) {
          this.handleOnAnswerRemove(draggedItem);
        }

        return Placement.PLACED;
      }, viaTile);
      return;
    }

    if (responseArea) {
      this.announceResult(
        draggedItem,
        responseArea.containerIndex,
        () => this.handleOnAnswerSelect(draggedItem, responseArea.containerIndex),
        viaTile,
      );
    }
  };

  onDragCancel: any = () => {
    this.dragLive = false;
    this.setState({ draggingElement: { id: '', value: '' } });
    this.cancelSelection();
    this.lastDragEndAt = Date.now();
  };

  isSameResponse = (a, b) => !!a && !!b && a.id === b.id && a.containerIndex === b.containerIndex;

  // Click-to-select semantics: selecting the currently-selected response again clears
  // the selection instead of re-selecting it.
  toggleResponseSelection: any = (data) => {
    const { i18n, config } = this.getAnnouncementContext();
    const deselecting = this.isSameResponse(this.state.selectedResponse, data);

    this.setResultNote(null);

    // A keyboard drag announces its own selection; saying it here too would read it twice.
    if (!this.dragLive) {
      this.announce(deselecting ? describeDeselection(i18n, config, data) : describeSelection(i18n, config, data));
    }

    this.setState((state) => ({
      selectedResponse: this.isSameResponse(state.selectedResponse, data) ? null : data,
    }));
  };

  cancelSelection: any = () => {
    this.setState({ selectedResponse: null });
  };

  // If a real dnd-kit drag (started via keyboard Space/Enter) is still live when a
  // click completes the placement below, it needs to be cleanly ended — otherwise
  // dnd-kit would still think a drag is in progress. Escape is already configured as
  // this sensor's cancel key (see the keyboardCodes passed to DragProvider below), and
  // dispatching it as a real DOM KeyboardEvent is how dnd-kit's own document-level
  // listener is reached from outside its sensor.
  //
  // Only dispatch when a drag is actually live (draggingElement.id is truthy) — this is
  // a synthetic Escape keydown on `document`, so an unconditional dispatch would also be
  // observed by any other document-level Escape listener (host player modals/dialogs,
  // or another mounted instance of this same component) even when nothing here actually
  // needed cancelling.
  endAnyLiveKeyboardDrag: any = () => {
    if (!this.state.draggingElement.id) {
      return;
    }

    // dnd-kit runs its cancel announcement synchronously, so the flag is still up when it reads it.
    this.endingDragForPlacement = true;

    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }));
    } finally {
      this.endingDragForPlacement = false;
    }
  };

  placeSelectedResponse: any = (containerIndex) => {
    const { selectedResponse } = this.state;

    if (!selectedResponse) {
      return;
    }

    this.announceResult(selectedResponse, containerIndex, () => {
      if (containerIndex === undefined) {
        // Placing into the pool = removing it from wherever it currently is
        if (selectedResponse.containerIndex !== undefined) {
          this.handleOnAnswerRemove(selectedResponse);
        }

        return Placement.PLACED;
      }

      return this.handleOnAnswerSelect(selectedResponse, containerIndex);
    }, this.dragLive);

    this.cancelSelection();
    this.endAnyLiveKeyboardDrag();
    this.lastDragEndAt = Date.now();
  };

  isClickSoonAfterDragEnd = () => Date.now() - this.lastDragEndAt < CLICK_AFTER_DRAG_GUARD_MS;

  onResponseClick: any = (data) => {
    if (this.isClickSoonAfterDragEnd()) {
      return;
    }

    // A click that selects/deselects/switches a tile must end any dnd-kit drag that's
    // still live from an earlier keyboard Space/Enter pick-up first — otherwise dnd-kit
    // keeps thinking that earlier item is being dragged (it ignores new sensor
    // activation while a drag is active) while selectedResponse visually points at
    // whatever this click just selected. Ending the stale drag first (rather than
    // after) matters: ending it also cancels the current selection as a side effect
    // (see onDragCancel above), so doing it before
    // toggleResponseSelection lets this click's own selection be the one that sticks.
    this.endAnyLiveKeyboardDrag();
    this.toggleResponseSelection(data);
  };

  onPlacementClick: any = (containerIndex) => {
    if (this.isClickSoonAfterDragEnd()) {
      return;
    }

    this.placeSelectedResponse(containerIndex);
  };

  // Names a tile for a screen reader. A choice with no text of its own is named by its position among
  // the model's choices, which holds in the pool and in an area.
  getChoiceLabel: any = (value, containerIndex) => {
    const label = this.getTileName(value, containerIndex);
    const note = this.state.resultNote;

    // The tile a keyboard drop just landed on carries what the drop did, which is what is read as it takes focus.
    if (note && note.value === value && note.containerIndex === containerIndex) {
      const { i18n, config } = this.getAnnouncementContext();

      return `${note.message} ${label ?? describeChoiceTile(i18n, config, { value, containerIndex })}`;
    }

    return label;
  };

  getTileName: any = (value, containerIndex) => {
    const { model } = this.props;
    const { possibleResponses = [] } = model;
    const { i18n, config } = this.getAnnouncementContext();

    // Math and the like are named by their own content: stripped to text they would be read wrongly.
    if (hasTextAlternative(value) && !hasRichContent(value) && plainText(value)) {
      return describeChoiceTile(i18n, config, { value, containerIndex });
    }

    // Left to its content, which names the tile.
    if (hasTextAlternative(value)) {
      return undefined;
    }

    const index = possibleResponses.indexOf(value);

    return index === -1 ? undefined : i18n.t('answerChoice', { index: index + 1, total: possibleResponses.length });
  };

  renderDragOverlay: any = () => {
    const { draggingElement } = this.state;
    const { model } = this.props;

    if (!draggingElement.id) return null;

    // check if the response contains an image
    const imgRegex = /<img[^>]+src="([^">]+)"/;
    const containsImage = imgRegex.test(draggingElement.value);

    return (
      <PossibleResponse
        key={draggingElement.id}
        canDrag={false}
        data={draggingElement}
        getChoiceLabel={this.getChoiceLabel}
        onDragBegin={() => {}}
        isOverlay
        containerStyle={{
          ...(model.answerChoiceTransparency ? { opacity: '0.8' } : {}),
          ...(!containsImage ? { padding: '0 10px', margin: '4px 6px !important' } : {}),
        }}
      />
    );
  };

  filterPossibleAnswers = (possibleResponses, answer) =>
    possibleResponses.filter((response) => response.value !== answer.value);

  handleOnAnswerSelect: any = (answer, responseContainerIndex) => {
    const {
      model: { duplicateResponses },
      updateAnswer,
    } = this.props;
    const { answers, maxResponsePerZone } = this.state;
    let { possibleResponses } = this.state;
    let answersToStore;

    const answersInThisContainer = [];
    const answersInOtherContainers = [];

    answers.forEach((a) => {
      if (a.containerIndex === responseContainerIndex) {
        answersInThisContainer.push(a);
      } else {
        answersInOtherContainers.push(a);
      }
    });

    if (maxResponsePerZone === answersInThisContainer.length) {
      const shiftedItem = answersInThisContainer[0];
      if (maxResponsePerZone === 1) {
        answersInThisContainer.shift(); // FIFO
      } else {
        this.setState({ maxResponsePerZoneWarning: true });
        return Placement.AREA_FULL;
      }

      // if duplicates are not allowed, make sure to put the shifted value back in possible responses
      if (!duplicateResponses) {
        possibleResponses = Array.isArray(possibleResponses) ? possibleResponses : [];

        possibleResponses.push({
          ...shiftedItem,
          containerIndex: undefined,
          id: shiftedItem.id || generateId(),
        });
      }

      // answers will be:
      // + shifted answers for the current container
      // + if duplicatesAllowed, all the other answers from other containers
      //   else: all the answers from other containers that are not having the same value
      // + new answer
      answersToStore = [
        ...answersInThisContainer, // shifted
        // TODO allow duplicates case Question: should we remove answer from a container if dragged to another container?
        // if yes, this should do it: add a.id !== answer.id instead of 'true'
        ...answersInOtherContainers.filter((a) => (duplicateResponses ? true : a.value !== answer.value)), // un-shifted
        {
          ...answer,
          containerIndex: responseContainerIndex,
          ...(duplicateResponses ? { id: generateId() } : {}),
        },
      ];
    } else {
      // answers will be:
      // + if duplicatesAllowed, all the other answers, except the one that was dragged
      //   else: all the answers that are not having the same value
      // + new answer
      answersToStore = [
        // TODO allow duplicates case Question: should we remove answer from a container if dragged to another container?
        // if yes, this should do it: add a.id !== answer.id instead of 'true'
        ...answers.filter((a) => (duplicateResponses ? a.id !== answer.id : a.value !== answer.value)),
        {
          ...answer,
          containerIndex: responseContainerIndex,
          ...(duplicateResponses ? { id: generateId() } : {}),
        },
      ];
    }
    this.setState({
      maxResponsePerZoneWarning: false,
      answers: answersToStore,
      possibleResponses:
        // for single response per container remove answer from possible responses
        duplicateResponses ? possibleResponses : this.filterPossibleAnswers(possibleResponses, answer),
    });
    updateAnswer(answersToStore);

    return Placement.PLACED;
  };

  handleOnAnswerRemove: any = (answer) => {
    const {
      model: { duplicateResponses },
      updateAnswer,
    } = this.props;
    const { answers, possibleResponses } = this.state;
    const answersToStore = answers.filter((a) => a.id !== answer.id);
    const shouldNotPushInPossibleResponses = answer.containerIndex === undefined; // don't duplicate possible responses

    this.setState({
      maxResponsePerZoneWarning: false,
      answers: answersToStore,
      // push back into possible responses the removed answer if responses cannot be duplicated
      possibleResponses:
        duplicateResponses || shouldNotPushInPossibleResponses
          ? possibleResponses
          : [
              ...possibleResponses,
              {
                ...answer,
                containerIndex: undefined,
              },
            ],
    });
    updateAnswer(answersToStore);
  };

  toggleCorrect = (showCorrect) => this.setState({ showCorrect });

  render() {
    const {
      model: {
        disabled,
        duplicateResponses,
        extraCSSRules,
        image,
        responseAreaFill,
        stimulus,
        responseCorrect,
        validation,
        teacherInstructions,
        prompt,
        autoplayAudioEnabled,
        autoplayAudioHeld,
        showDashedBorder,
        mode,
        rationale,
        uiStyle = {},
        answerChoiceTransparency,
        responseContainerPadding,
        imageDropTargetPadding,
        fontSizeFactor,
        customAudioButton,
      },
    } = this.props;
    const language = this.props.language ?? this.props.model.language;
    const {
      answers,
      draggingElement,
      possibleResponses,
      responseContainers,
      maxResponsePerZone,
      maxResponsePerZoneWarning,
      showCorrect,
      isValidDrop,
    } = this.state;
    const isEvaluateMode = mode === 'evaluate';
    const showToggle = isEvaluateMode && !responseCorrect;
    const { possibilityListPosition = 'bottom' } = uiStyle || {};
    const isVertical = possibilityListPosition === 'left' || possibilityListPosition === 'right';

    const { validResponse } = validation || {};
    const correctAnswers = [];
    const showRationale = rationale && (hasText(rationale) || hasMedia(rationale));
    const showTeacherInstructions =
      teacherInstructions && (hasText(teacherInstructions) || hasMedia(teacherInstructions));

    if (validResponse) {
      (validResponse.value || []).forEach((container, i) => {
        (container.images || []).forEach((v) => {
          correctAnswers.push({
            value: v,
            containerIndex: i,
            isCorrect: true,
          });
        });
      });
    }

    // The sentence the screen reader speaks for a refused drop, so the page shows what is said.
    const warningMessage = catalogs.forLocale(language).plural('reachedLimitA11y', { count: maxResponsePerZone });

    let answersToShow =
      responseCorrect !== undefined ? getAnswersCorrectness(answers, validation, duplicateResponses) : answers;

    if (responseCorrect === false && maxResponsePerZone === 1) {
      answersToShow = [...answersToShow, ...getUnansweredAnswers(answersToShow, validation)];
    }

    const sharedImageProps = {
      draggingElement,
      duplicateResponses,
      getChoiceLabel: this.getChoiceLabel,
      image,
      language,
      onAnswerSelect: this.handleOnAnswerSelect,
      onDragAnswerBegin: this.onDragStart,
      onDragAnswerEnd: this.onDragEnd,
      responseContainers,
      showDashedBorder,
      responseAreaFill,
      responseContainerPadding,
      imageDropTargetPadding,
      maxResponsePerZone,
      selectedResponse: this.state.selectedResponse,
      onSelectClick: this.onResponseClick,
      onPlacementClick: this.onPlacementClick,
    };

    const renderImage = () => (
      <Image
        {...sharedImageProps}
        canDrag={showCorrect && showToggle ? false : !disabled}
        answers={showCorrect && showToggle ? correctAnswers : answersToShow}
        answerChoiceTransparency={!(showCorrect && showToggle) ? answerChoiceTransparency : undefined}
      />
    );

    const renderPossibleResponses = () => {
      if (showCorrect && showToggle) return null;

      // A list rather than a fragment, so InteractiveSection can put the warning and the pool in
      // the order they show.
      return [
        maxResponsePerZoneWarning && <WarningInfo key="warning" message={warningMessage} />,
        <PossibleResponses
          key="pool"
          canDrag={!disabled}
          data={possibleResponses}
          getChoiceLabel={this.getChoiceLabel}
          onAnswerRemove={this.handleOnAnswerRemove}
          onDragBegin={this.onDragStart}
          answerChoiceTransparency={answerChoiceTransparency}
          customStyle={{
            minWidth: isVertical ? '130px' : image?.width || 'fit-content',
          }}
          isVertical={isVertical}
          minHeight={isVertical ? image?.height : undefined}
          selectedResponse={this.state.selectedResponse}
          onSelectClick={this.onResponseClick}
          onPlacementClick={this.onPlacementClick}
          language={language}
        />,
      ];
    };

    const { i18n, config: announcementConfig } = this.getAnnouncementContext();
    const dragData = (event) => event?.data?.current;
    const element = this;
    const introParagraphs =
      mode === 'gather' && !disabled
        ? describeIntro(i18n, announcementConfig, answers, possibleResponses)
        : [];

    // dnd-kit's own live region carries the keyboard drag as it unfolds; what a drop did is announced
    // from `resultMessage`, which knows the answers before the drop.
    const announcements = {
      onDragStart({ active }) {
        return !element.keyboardDrag || !dragData(active) ? undefined : describeSelection(i18n, announcementConfig, dragData(active));
      },

      onDragOver({ active, over }) {
        // The "press ENTER / TAB" wording is for the keyboard; a pointer drag has no use for it.
        if (!element.keyboardDrag || !dragData(active)) {
          return undefined;
        }

        const first = element.awaitingFirstOver;

        element.awaitingFirstOver = false;

        if (!over) {
          return i18n.t('notOverDropAreaA11y', { choice: choiceText(i18n, announcementConfig, dragData(active).value) });
        }

        const target = over.id === 'ica-board' ? undefined : dragData(over)?.containerIndex;
        // Where the choice already is, reported as the drag begins: the selection was just announced, and
        // saying where the choice sits would only talk over it. Moving there later is announced.
        if (first && target === dragData(active).containerIndex) {
          return undefined;
        }

        return describeFocusTarget(i18n, announcementConfig, dragData(active), target);
      },

      onDragEnd() {
        return undefined;
      },

      onDragCancel({ active }) {
        return element.endingDragForPlacement || !dragData(active)
          ? undefined
          : describeDeselection(i18n, announcementConfig, dragData(active));
      },
    };

    return (
      <DragProvider
        accessibility={{
          announcements,
          screenReaderInstructions: { draggable: i18n.t('dragInstructionsA11y') },
        }}
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
        onDragCancel={this.onDragCancel}
        keyboardCoordinateGetter={closestDroppableKeyboardCoordinates}
        keyboardCodes={{ start: ['Space', 'Enter'], cancel: ['Escape'], end: ['Space', 'Enter'] }}
      >
        <StyledUiLayout extraCSSRules={extraCSSRules} id={this.mainContainerId} className="main-container" fontSizeFactor={fontSizeFactor}>
          {showTeacherInstructions && (
            <StyledTeacherInstructions variant="teacherInstructions" language={language}>
              <PreviewPrompt prompt={teacherInstructions} />
            </StyledTeacherInstructions>
          )}

          <PreviewPrompt
            className="prompt"
            prompt={prompt}
            autoplayAudioEnabled={autoplayAudioEnabled}
            autoplayAudioHeld={autoplayAudioHeld}
            customAudioButton={customAudioButton}
            language={language}
          />

          <PreviewPrompt prompt={stimulus} />

          {introParagraphs.map((text, i) => (
            <div key={i} style={visuallyHidden}>
              {text}
            </div>
          ))}
          <div style={visuallyHidden} role="status" aria-live="assertive" aria-atomic="true">
            {this.state.resultMessage}
          </div>

          <CorrectAnswerToggle
            show={showToggle}
            toggled={showCorrect}
            onToggle={this.toggleCorrect}
            language={language}
          />

          <InteractiveSection responseCorrect={showCorrect && showToggle ? true : responseCorrect} uiStyle={uiStyle}>
            {renderImage()}
            {renderPossibleResponses()}
          </InteractiveSection>

          {showRationale && (
            <StyledRationale variant="rationale" language={language}>
              <PreviewPrompt prompt={rationale} />
            </StyledRationale>
          )}
        </StyledUiLayout>
        {/* Disable drop animation for valid drops to prevent visual snap-back */}
        {/* Keep default animation for invalid drops to show visual feedback */}
        <DragOverlay dropAnimation={isValidDrop ? null : undefined}>
          {this.renderDragOverlay()}
        </DragOverlay>
      </DragProvider>
    );
  }
}

const WarningContainer: any = styled('div')(({ theme }) => ({
  margin: `0 ${theme.spacing(2)}`,
  backgroundColor: '#dddddd',
  padding: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  '& svg': {
    height: '30px',
  },
  '& h1': {
    padding: '0px',
    margin: '0px',
  },
}));

const WarningMessage: any = styled('span')(({ theme }) => ({
  paddingLeft: theme.spacing(0.5),
  userSelect: 'none',
}));

const WarningInfo = ({ message }) => {
  const nodeRef = React.useRef(null);

  return (
    <TransitionGroup>
      <CSSTransition classNames={'fb'} key="fb" timeout={300} nodeRef={nodeRef}>
        <WarningContainer ref={nodeRef} key="panel">
          <NotInterestedIcon color={'secondary'} fontSize={'small'} />
          <WarningMessage dangerouslySetInnerHTML={{ __html: message }} />
        </WarningContainer>
      </CSSTransition>
    </TransitionGroup>
  );
};

WarningInfo.propTypes = {
  message: PropTypes.string,
};

ImageClozeAssociationComponent.propTypes = {
  model: PropTypes.object.isRequired,
  session: PropTypes.object,
  updateAnswer: PropTypes.func.isRequired,
  /** The locale the chrome follows; the item's declared language when omitted. */
  language: PropTypes.string,
};

export default ImageClozeAssociationComponent;
