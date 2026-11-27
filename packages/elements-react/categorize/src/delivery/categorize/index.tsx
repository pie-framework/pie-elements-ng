// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import debug from 'debug';
import { styled } from '@mui/material/styles';
import { DragOverlay } from '@dnd-kit/core';
import {restrictToParentElement, restrictToWindowEdges} from '@dnd-kit/modifiers';
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';
import { buildState, removeChoiceFromCategory, moveChoiceToCategory } from '@pie-lib/categorize';
import { createDragCollision, DragProvider, motionSafeDropAnimation, uid } from '@pie-lib/drag';
import { color, createUniqueId, Feedback as FeedbackImport, Collapsible as CollapsibleImport, hasText, hasMedia, PreviewPrompt as PreviewPromptImport, UiLayout as UiLayoutImport } from '@pie-lib/render-ui';

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
const Feedback = unwrapReactInteropSymbol(FeedbackImport, 'Feedback') || unwrapReactInteropSymbol(renderUi.Feedback, 'Feedback');
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { AlertDialog } from '@pie-lib/config-ui';
import Choices from './choices.js';
import Choice from './choice.js';
import Categories from './categories.js';
import { categoriesFirst, CHOICES_BOARD_ID } from './collision-detection.js';
import { closestDroppableKeyboardCoordinates } from './keyboard-coordinates.js';
import { sanitizeModelHtml } from '@pie-element/shared-utils';
import { authoredOrDefault } from '@pie-element/shared-i18n';
import { catalogs } from '../../i18n/index.js';
import {
  buildConfig,
  describeChoiceTile,
  describeDeselection,
  describeFocusTarget,
  describeIntro,
  describePlacementResult,
  describeSelection,
  choiceText,
  hasRichContent,
} from './announcements.js';
import { visuallyHidden } from './visually-hidden.js';

const log = debug('@pie-ui:categorize');

// A click that lands right after a real drag gesture ends (a pointer drag-and-drop, or
// the browser's own synthetic click following a keyboard Space/Enter drop) must be ignored
// by the click-to-select/click-to-place handlers below, or it would immediately reopen or
// re-trigger a selection for a drag that just completed.
const CLICK_AFTER_DRAG_GUARD_MS = 250;

// How long a drop's result waits for the screen reader to finish reading what takes focus.
const RESULT_DELAY_MS = 700;

// What a drop came to: it took effect, nothing moved, or a full category refused it.
const Placement = { PLACED: 'placed', UNCHANGED: 'unchanged', AREA_FULL: 'area-full' } as const;

class DragPreviewWrapper extends React.Component {
  static propTypes = {
    children: PropTypes.node,
  };

  containerRef = React.createRef();

  componentDidMount() {
    if (this.containerRef.current) {
      renderMath(this.containerRef.current);
    }
  }

  render() {
    return <div ref={this.containerRef}>{this.props.children}</div>;
  }
}

export class Categorize extends React.Component {
  static propTypes = {
    model: PropTypes.object,
    session: PropTypes.shape({
      answers: PropTypes.arrayOf(
        PropTypes.shape({
          choice: PropTypes.string,
          category: PropTypes.string,
        }),
      ),
    }),
    onAnswersChange: PropTypes.func.isRequired,
    onShowCorrectToggle: PropTypes.func.isRequired,
    pauseMathObserver: PropTypes.func,
    resumeMathObserver: PropTypes.func,
    selectedItem: PropTypes.object,
    onSelectClick: PropTypes.func,
    onPlacementClick: PropTypes.func,
    /** Names a choice tile for a screen reader. */
    getChoiceLabel: PropTypes.func,
    /** Names a category or the pool for a screen reader while a choice is selected. */
    getTargetLabel: PropTypes.func,
    shouldFocus: PropTypes.func,
    /** Told when a tile loses focus, from `{ id, categoryId }`. */
    onChoiceBlur: PropTypes.func,
    /** Keys pressed inside the interactive region: ESC ends a click selection. */
    onRegionKeyDown: PropTypes.func,
    /** The locale the chrome follows; the item's declared language when omitted. */
    language: PropTypes.string,
  };

  static defaultProps = {
    disabled: false,
  };

  // The delivery element finds the container by its class, which authored CSS may also target.
  mainContainerId = createUniqueId('main-container');

  constructor(props) {
    super(props);

    this.state = {
      showCorrect: false,
      showMaxChoiceAlert: false,
    };
  }

  removeChoice: any = (c) => {
    log('[removeChoice]: ', c);
    const { onAnswersChange, session } = this.props;
    const answers = removeChoiceFromCategory(c.id, c.categoryId, c.choiceIndex, session.answers);
    onAnswersChange(answers);

    return Placement.PLACED;
  };

  dropChoice: any = (categoryId, draggedChoice) => {
    const { session, onAnswersChange, model } = this.props;
    const { maxChoicesPerCategory = 0 } = model || {};
    const { answers = [] } = session || {};
    // The answers are changed in place by some of the moves below, so the comparison needs a copy.
    const before = JSON.stringify(answers);
    let newAnswers;
    let full = false;
    if (draggedChoice) {
      log('[dropChoice] category: ', draggedChoice.categoryId, 'choice: ', draggedChoice);
    } else {
      log('[dropChoice] category: ', undefined, 'choice: ', undefined);
    }

    const answer = answers.find((answer) => answer.category === categoryId);

    // treat special case to replace the existing choice with the new one when maxChoicesPerCategory = 1
    if (draggedChoice && maxChoicesPerCategory === 1 && answer && answer.choices && answer.choices.length === 1) {
      // First, move the dragged choice to the target category (this will also remove it from source if allowMultiplePlacements is disabled)
      newAnswers = moveChoiceToCategory(
        draggedChoice.id,
        draggedChoice.categoryId,
        categoryId,
        draggedChoice.choiceIndex,
        answers,
      );
      // Then, remove the existing choice from the target category (use newAnswers, not answers)
      newAnswers = removeChoiceFromCategory(answer.choices[0], categoryId, 0, newAnswers);
    }

    // treat special case when there are as many choices as maxChoicesPerCategory is
    else if (
      draggedChoice &&
      maxChoicesPerCategory > 1 &&
      answer &&
      answer.choices &&
      answer.choices.length === maxChoicesPerCategory
    ) {
      newAnswers = draggedChoice.categoryId
        ? moveChoiceToCategory(
            draggedChoice.id,
            draggedChoice.categoryId,
            draggedChoice.categoryId,
            draggedChoice.choiceIndex,
            answers,
          )
        : removeChoiceFromCategory(draggedChoice.id, draggedChoice.categoryId, draggedChoice.choiceIndex, answers);
      this.setState({ showMaxChoiceAlert: true });
      full = true;
    }

    // treat special case when there are more choices that maxChoicesPerCategory is (testing purpose in pits)
    else if (maxChoicesPerCategory !== 0 && answer && answer.choices && answer.choices.length > maxChoicesPerCategory) {
      newAnswers = answers;
      this.setState({ showMaxChoiceAlert: true });
      full = true;
    } else {
      newAnswers = draggedChoice
        ? moveChoiceToCategory(
            draggedChoice.id,
            draggedChoice.categoryId,
            categoryId,
            draggedChoice.choiceIndex,
            answers,
          )
        : this.removeChoice(categoryId);
    }

    if (draggedChoice) {
      onAnswersChange(newAnswers);
    }

    // A full category shows its warning; any other drop that left the answers as they were moved nothing.
    if (full) {
      return Placement.AREA_FULL;
    }

    return JSON.stringify(newAnswers) === before ? Placement.UNCHANGED : Placement.PLACED;
  };

  UNSAFE_componentWillReceiveProps() {
    this.setState({ showCorrect: false });
  }

  toggleShowCorrect = () =>
    this.setState({ showCorrect: !this.state.showCorrect }, () => {
      this.props.onShowCorrectToggle();
    });

  getPositionDirection: any = (choicePosition) =>
    choicePosition === 'left' || choicePosition === 'right' ? 'row' : 'column';

  // The pool comes first in the DOM when it shows first, above or left of the categories, rather
  // than being moved there by a reversed flex direction: the tab path and the reading order follow
  // the DOM, so they then follow what is on screen.
  choicesComeFirst: any = (choicePosition) => choicePosition !== 'below' && choicePosition !== 'right';

  existAlternateResponse = (correctResponse) =>
    correctResponse?.some((correctRes) => correctRes.alternateResponses?.length > 0);

  render() {
    const {
      model,
      session,
      selectedItem,
      onSelectClick,
      onPlacementClick,
      getChoiceLabel,
      getTargetLabel,
      shouldFocus,
      onChoiceBlur,
      onRegionKeyDown,
    } = this.props;
    const { showCorrect, showMaxChoiceAlert } = this.state;
    const {
      choicesPosition,
      extraCSSRules,
      note,
      showNote,
      env,
      maxChoicesPerCategory,
      autoplayAudioEnabled,
      autoplayAudioHeld,
      customAudioButton,
    } = model;
    const language = this.props.language ?? model.language;
    const i18n = catalogs.forLocale(language);
    const { mode, role } = env || {};
    const choicePosition = choicesPosition || 'above';

    const style = {
      flexDirection: this.getPositionDirection(choicePosition),
      gap: '8px',
    };

    const { categories, choices, correct } = buildState(
      model.categories,
      model.choices,
      showCorrect ? model.correctResponse : session.answers,
      model.correctResponse,
    );

    log('[render] disabled: ', model.disabled);

    const { rowLabels, categoriesPerRow, correctResponse, fontSizeFactor } = model;
    const nbOfRows = (categories && Math.ceil(categories.length / categoriesPerRow)) || 0;
    const existAlternate = this.existAlternateResponse(correctResponse) || false;
    const displayNote =
      (showCorrect || (mode === 'view' && role === 'instructor')) && showNote && existAlternate;
    const alertMessage = i18n.t('limitMaxChoicesPerCategory', { maxChoicesPerCategory });
    const alertTitle = i18n.t('warning');
    const onCloseText = i18n.t('cancel');

    const showRationale = model.rationale && (hasText(model.rationale) || hasMedia(model.rationale));
    const showTeacherInstructions =
      model.teacherInstructions && (hasText(model.teacherInstructions) || hasMedia(model.teacherInstructions));

    const categoriesView = (
      <div key="categories" style={{ display: 'flex', flex: 1 }}>
        <Categories
          model={model}
          disabled={model.disabled}
          categories={categories}
          onDropChoice={this.dropChoice}
          onRemoveChoice={this.removeChoice}
          rowLabels={(rowLabels || []).slice(0, nbOfRows)}
          selectedItem={selectedItem}
          onSelectClick={onSelectClick}
          onPlacementClick={onPlacementClick}
          getChoiceLabel={getChoiceLabel}
          getTargetLabel={getTargetLabel}
          shouldFocus={shouldFocus}
          onChoiceBlur={onChoiceBlur}
        />
      </div>
    );
    const choicesView = (
      <Choices
        key="choices"
        disabled={model.disabled}
        model={model}
        choices={choices}
        language={language}
        choicePosition={choicePosition}
        onDropChoice={this.dropChoice}
        onRemoveChoice={this.removeChoice}
        correct={correct}
        selectedItem={selectedItem}
        onSelectClick={onSelectClick}
        onPlacementClick={onPlacementClick}
        getChoiceLabel={getChoiceLabel}
        getTargetLabel={getTargetLabel}
        shouldFocus={shouldFocus}
        onChoiceBlur={onChoiceBlur}
      />
    );

    // After the prompt a screen reader is told how the item is laid out and what each category holds.
    const introParagraphs = model.disabled
      ? []
      : describeIntro(
          i18n,
          buildConfig(model),
          session?.answers ?? [],
          (choices ?? []).filter((c) => !c.empty),
        );

    return (
      <StyledUiLayout extraCSSRules={extraCSSRules} id={this.mainContainerId} className="main-container" fontSizeFactor={fontSizeFactor}>
        {showTeacherInstructions && (
          <React.Fragment>
            <StyledCollapsible variant="teacherInstructions" language={language}>
              <PreviewPrompt prompt={model.teacherInstructions} />
            </StyledCollapsible>
          </React.Fragment>
        )}

        {model.prompt && (
          <PreviewPrompt
            prompt={model.prompt}
            autoplayAudioEnabled={autoplayAudioEnabled}
            autoplayAudioHeld={autoplayAudioHeld}
            customAudioButton={customAudioButton}
            language={language}
          />
        )}

        {introParagraphs.map((text, i) => (
          <div key={i} style={visuallyHidden} data-categorize-intro="">
            {text}
          </div>
        ))}

        <CorrectAnswerToggle
          show={showCorrect || correct === false}
          toggled={showCorrect}
          onToggle={this.toggleShowCorrect}
          language={language}
        />

        <StyledCategorize onKeyDown={onRegionKeyDown}>
          <StyledCategorizeContent style={style}>
            {this.choicesComeFirst(choicePosition) ? [choicesView, categoriesView] : [categoriesView, choicesView]}
          </StyledCategorizeContent>
        </StyledCategorize>
        {displayNote && (
          <StyledNote
            dangerouslySetInnerHTML={{
              __html: sanitizeModelHtml(authoredOrDefault(note, (locale) => catalogs.forLocale(locale).t('commonCorrectAnswerWithAlternates'), language, model.language)),
            }}
          />
        )}

        {showRationale && (
          <StyledCollapsible variant="rationale" language={language}>
            <PreviewPrompt prompt={model.rationale} />
          </StyledCollapsible>
        )}

        {model.correctness && model.feedback && !showCorrect && (
          <Feedback correctness={model.correctness} feedback={model.feedback} />
        )}
        <AlertDialog
          title={alertTitle}
          text={alertMessage}
          open={showMaxChoiceAlert}
          onCloseText={onCloseText}
          onClose={() => this.setState({ showMaxChoiceAlert: false })}
        ></AlertDialog>
      </StyledUiLayout>
    );
  }
}

class CategorizeProvider extends React.Component {
  static propTypes = {
    model: PropTypes.object,
    session: PropTypes.shape({
      answers: PropTypes.arrayOf(
        PropTypes.shape({
          choice: PropTypes.string,
          category: PropTypes.string,
        }),
      ),
    }),
    onAnswersChange: PropTypes.func.isRequired,
    onShowCorrectToggle: PropTypes.func.isRequired,
    pauseMathObserver: PropTypes.func,
    resumeMathObserver: PropTypes.func,
    /** The locale the chrome follows; the item's declared language when omitted. */
    language: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.uid = uid.generateId();
    this.state = {
      activeDragItem: null,
      isValidDrop: false,
      selectedItem: null,
      // Everything announced while selecting and placing. It is the only live region the element fills
      // (dnd-kit's own is left empty): two regions compete in JAWS and cut each other off.
      resultMessage: '',
      // What the tile a keyboard drop lands on says in its name, until focus leaves it.
      resultNote: null,
    };
    this.lastDragEndAt = 0;
    this.isInternalDragCancel = false;
    // Whether the drag in progress was started from the keyboard, which is the one announced in words for it.
    this.keyboardDrag = false;
    // Whether a dnd-kit drag is live, whose announcements say the selection themselves.
    this.dragLive = false;
    this.awaitingFirstOver = false;
    this.endingDragForPlacement = false;
    this.announceTimer = undefined;
    this.announcementContext = undefined;
    // The modifier holds the dragged choice inside the window, so it can be carried past the edges of the
    // region, which scrolls. Only the parts of the categories inside the region take a drop, so a choice
    // released outside the region finds no category.
    this.dragCollision = createDragCollision({
      detect: categoriesFirst,
      modifiers: [restrictToWindowEdges],
    });
  }

  componentWillUnmount() {
    clearTimeout(this.announceTimer);
  }

  // The i18n view and the model's slice the announcements are built from.
  getAnnouncementContext: any = () => {
    const { model, language } = this.props;
    const cached = this.announcementContext;

    // Every tile asks for it on every render, so it is built once for as long as the model and language stand.
    if (cached && cached.model === model && cached.language === language) {
      return cached.value;
    }

    const value = { i18n: catalogs.forLocale(language ?? model.language), config: buildConfig(model) };

    this.announcementContext = { model, language, value };

    return value;
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

  // The result of a keyboard drop is read as part of the name of the tile that takes focus: a screen reader
  // reads a newly focused element for sure, but drops a live region that updates while it does. It leaves
  // the name when focus leaves the tile (`onChoiceBlur`), not on a timer: a timer would rename the focused
  // tile under the learner, which a screen reader may read out again unasked, and coming back to the tile
  // later would repeat a result that is no longer news.
  setResultNote: any = (note) => {
    this.setState({ resultNote: note });
  };

  onChoiceBlur: any = ({ id, categoryId }) => {
    const note = this.state.resultNote;

    if (note && note.id === id && note.categoryId === categoryId) {
      this.setResultNote(null);
    }
  };

  // Applies the drop and announces what it did. The wording is read against the answers as they are
  // before the drop; `apply` says whether the drop took effect, so a refusal is never announced as a
  // placement. `viaTile` is for a keyboard drop, which hands focus to a tile.
  announceResult: any = (selected, targetId, apply, viaTile = false) => {
    const { i18n, config } = this.getAnnouncementContext();
    const target = targetId === CHOICES_BOARD_ID ? undefined : targetId;
    const message = describePlacementResult(i18n, config, this.props.session?.answers ?? [], selected, target);
    const result = apply();

    // A full category opens its warning dialog, which the screen reader reads by itself.
    if (result === Placement.AREA_FULL && selected.categoryId !== target) {
      return;
    }

    // Any other drop that did not take effect changes nothing and reads as the end of the selection.
    const text =
      result === Placement.PLACED || selected.categoryId === target
        ? message
        : describeDeselection(i18n, config, selected);

    if (viaTile) {
      this.setResultNote({ id: selected.id, categoryId: target, message: text });

      return;
    }

    // After a drop focus goes back to a tile, which a screen reader then reads; said at once, the result
    // would be talked over, so it follows that.
    this.announce(text, RESULT_DELAY_MS);
  };

  getTileName: any = (choice) => {
    const { i18n, config } = this.getAnnouncementContext();

    // Math and the like are named by their own content: stripped to text they would be read wrongly.
    return hasRichContent(choice.value) ? undefined : describeChoiceTile(i18n, config, choice);
  };

  // Names a tile for a screen reader, and carries the result of the drop that just landed on it.
  getChoiceLabel: any = (choice) => {
    const label = this.getTileName(choice);
    const note = this.state.resultNote;

    if (note && note.id === choice.id && note.categoryId === choice.categoryId) {
      const { i18n, config } = this.getAnnouncementContext();

      return `${note.message} ${label ?? describeChoiceTile(i18n, config, choice)}`;
    }

    return label;
  };

  // The tile a keyboard drop just landed on takes focus, so the learner keeps their place and hears its name.
  shouldFocus: any = ({ id, categoryId }) => {
    const note = this.state.resultNote;

    return !!note && note.id === id && note.categoryId === categoryId;
  };

  // Rows 9 to 11 for a target that takes real focus while a choice is click-selected: what ENTER does there.
  getTargetLabel: any = (selected, targetId) => {
    if (!selected) {
      return undefined;
    }

    const { i18n, config } = this.getAnnouncementContext();

    return describeFocusTarget(i18n, config, selected, targetId === CHOICES_BOARD_ID ? undefined : targetId);
  };

  // ESC ends a click selection (rows 8 and 15). dnd-kit cancels a live drag on ESC itself, and its
  // document listener runs after this one, so a live drag is left to it.
  onRegionKeyDown: any = (event) => {
    const { selectedItem } = this.state;

    if (event.key !== 'Escape' || this.dragLive || !selectedItem) {
      return;
    }

    // The ESC is spent ending the selection, so a host's own ESC handler (closing a dialog) does not see it.
    event.preventDefault();
    event.stopPropagation();
    this.toggleItemSelection(selectedItem);
  };

  onDragStart: any = (event) => {
    const { active } = event;
    const { pauseMathObserver } = this.props;

    // dnd-kit announces a drag to every sensor, in words for a keyboard: a pointer or touch drag is not spoken to.
    this.keyboardDrag = event?.activatorEvent?.type === 'keydown';
    this.dragLive = !!active?.data?.current;
    // dnd-kit reports where the drag starts as the first "over"; that is not a move the learner made.
    this.awaitingFirstOver = true;
    this.setResultNote(null);

    if (pauseMathObserver) {
      pauseMathObserver();
    }

    if (active?.data?.current) {
      this.setState({
        activeDragItem: active.data.current,
        isValidDrop: false,
        selectedItem: active.data.current,
      });
    }
  };

  // Shared answer-mutation routing for both the drag-end path and the click-to-place path,
  // so neither reimplements the other's rules. Reproduces the original onDragEnd routing
  // exactly: a `targetId` of undefined (dropped outside any known target) and the choices
  // pool both return the choice to the pool by removing it from its source category;
  // anything else is a category drop, which goes through dropChoice — and therefore
  // inherits all of its maxChoicesPerCategory handling unchanged.
  commitPlacement: any = (choiceData, targetId) => {
    if (!this.categorizeRef) return Placement.UNCHANGED;

    if (targetId === undefined || targetId === CHOICES_BOARD_ID) {
      if (choiceData.categoryId && this.categorizeRef.removeChoice) {
        return this.categorizeRef.removeChoice(choiceData);
      }
      return Placement.UNCHANGED;
    }

    if (this.categorizeRef.dropChoice) {
      return this.categorizeRef.dropChoice(targetId, choiceData);
    }

    return Placement.UNCHANGED;
  };

  onDragEnd: any = (event) => {
    const { active, over } = event;
    const { resumeMathObserver } = this.props;

    this.dragLive = false;

    const viaTile = this.keyboardDrag;

    // Check if drop is valid
    const draggedItem = active?.data?.current;
    const overData = over?.data?.current;
    const isValidDrop =
      over && active && draggedItem && draggedItem.type === 'choice' && overData && overData.itemType === 'categorize';

    this.setState({
      activeDragItem: null,
      isValidDrop: isValidDrop,
      selectedItem: null,
    });

    if (resumeMathObserver) {
      resumeMathObserver();
    }

    this.lastDragEndAt = Date.now();

    if (!active || !draggedItem || draggedItem.type !== 'choice') {
      return;
    }

    const choiceData = {
      id: draggedItem.id,
      categoryId: draggedItem.categoryId,
      choiceIndex: draggedItem.choiceIndex,
      value: draggedItem.value,
      itemType: draggedItem.itemType,
    };

    const targetId = over ? over.id : undefined;

    this.announceResult(choiceData, targetId, () => this.commitPlacement(choiceData, targetId), viaTile);
  };

  onDragCancel: any = () => {
    const { resumeMathObserver } = this.props;

    this.dragLive = false;

    this.setState({ activeDragItem: null, isValidDrop: false, selectedItem: null });

    // onDragStart paused the math observer, so a cancelled drag must resume it too —
    // otherwise Escape leaves the observer paused for good.
    if (resumeMathObserver) {
      resumeMathObserver();
    }

    if (this.isInternalDragCancel) {
      // This onDragCancel invocation was fired synchronously as a direct side effect of
      // endAnyLiveKeyboardDrag's own synthetic Escape dispatch below, not by a real user-driven
      // drag cancellation. No browser-generated synthetic click follows this internal cleanup
      // the way one follows a genuine Space/Enter drop or mouse drag-end, so there is nothing
      // for the post-drag click guard to protect against here — skip arming it.
      this.isInternalDragCancel = false;
    } else {
      this.lastDragEndAt = Date.now();
    }
  };

  isSameItem = (a, b) =>
    !!a && !!b && a.id === b.id && a.categoryId === b.categoryId && a.choiceIndex === b.choiceIndex;

  // Click-to-select semantics: selecting the currently-selected choice again clears the
  // selection instead of re-selecting it.
  toggleItemSelection: any = (data) => {
    const { i18n, config } = this.getAnnouncementContext();
    const deselecting = this.isSameItem(this.state.selectedItem, data);

    this.setResultNote(null);

    // A keyboard drag announces its own selection; saying it here too would read it twice.
    if (!this.dragLive) {
      this.announce(deselecting ? describeDeselection(i18n, config, data) : describeSelection(i18n, config, data));
    }

    this.setState((state) => ({
      selectedItem: this.isSameItem(state.selectedItem, data) ? null : data,
    }));
  };

  cancelSelection: any = () => {
    this.setState({ selectedItem: null });
  };

  // If a real dnd-kit drag (started via keyboard Space/Enter) is still live when a click
  // completes the placement below, it needs to be cleanly ended — otherwise dnd-kit still
  // thinks a drag is in progress. Escape is configured as this sensor's cancel key (see the
  // keyboardCodes passed to DragProvider below), and dispatching it as a real DOM
  // KeyboardEvent is how dnd-kit's own document-level listener is reached from outside its
  // sensor.
  //
  // Only dispatch when a drag is actually live — this is a synthetic Escape keydown on
  // `document`, so an unconditional dispatch would also be observed by any other
  // document-level Escape listener (host player modals, another mounted instance of this
  // same component) even when nothing here needed cancelling.
  endAnyLiveKeyboardDrag: any = () => {
    if (!this.state.activeDragItem) return;

    // The dispatch below synchronously invokes onDragCancel as a direct side effect (dnd-kit's
    // KeyboardSensor handles Escape synchronously). Mark this specific cancellation as internal
    // cleanup — not a real user-driven drag end — so onDragCancel skips arming the post-drag
    // click guard: no browser-generated synthetic click follows this dispatch the way one
    // follows a genuine Space/Enter drop or mouse drag-end, so there is nothing to guard against.
    this.isInternalDragCancel = true;
    // dnd-kit runs its cancel announcement synchronously, so the flag is still up when it reads it.
    this.endingDragForPlacement = true;
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }));
    } finally {
      this.endingDragForPlacement = false;
    }
    // dnd-kit handles Escape synchronously, so onDragCancel (which resets this flag) has
    // already run by this point under normal operation — this reset is defensive, in case
    // that assumption ever stops holding, so a stuck flag can't suppress a later genuine cancel.
    this.isInternalDragCancel = false;
  };

  placeSelectedItem: any = (targetId) => {
    const { selectedItem } = this.state;

    if (!selectedItem) return;

    this.announceResult(selectedItem, targetId, () => this.commitPlacement(selectedItem, targetId), this.dragLive);
    this.cancelSelection();
    this.endAnyLiveKeyboardDrag();
  };

  isClickSoonAfterDragEnd = () => Date.now() - this.lastDragEndAt < CLICK_AFTER_DRAG_GUARD_MS;

  onItemClick: any = (data) => {
    if (this.isClickSoonAfterDragEnd()) return;

    // End any still-live keyboard drag BEFORE toggling the new selection: ending it also
    // clears the current selection as a side effect (see onDragCancel above), so doing it
    // first lets this click's own selection be the one that sticks.
    this.endAnyLiveKeyboardDrag();
    this.toggleItemSelection(data);
  };

  onPlacementClick: any = (targetId) => {
    if (this.isClickSoonAfterDragEnd()) return;

    this.placeSelectedItem(targetId);
  };

  renderDragOverlay: any = () => {
    const { activeDragItem } = this.state;
    const { model } = this.props;

    if (!activeDragItem) return null;

    if (activeDragItem.type === 'choice') {
      const choice = model.choices?.find((c) => c.id === activeDragItem.id);
      if (choice) {
        return <Choice key={choice.id} id={choice.id} {...choice} />;
      }
    }

    return null;
  };

  render() {
    const { isValidDrop, selectedItem } = this.state;
    // Disable drop animation for valid drops to prevent visual snap-back
    // Keep default animation for invalid drops to show visual feedback
    const dropAnimation = motionSafeDropAnimation(isValidDrop ? null : undefined);

    const { i18n, config } = this.getAnnouncementContext();
    const dragData = (event) => event?.data?.current;
    const element = this;
    // Every announcement goes through `element.announce` into the element's one live region, and dnd-kit's
    // own region gets nothing, as in match-list. What a drop did is announced from `announceResult`, which
    // knows the answers before the drop.
    const announcements = {
      onDragStart({ active }) {
        if (element.keyboardDrag && dragData(active)) {
          element.announce(describeSelection(i18n, config, dragData(active)));
        }

        return undefined;
      },

      onDragOver({ active, over }) {
        // The "press ENTER / TAB" wording is for the keyboard; a pointer drag has no use for it.
        if (!element.keyboardDrag || !dragData(active)) {
          return undefined;
        }

        const first = element.awaitingFirstOver;

        element.awaitingFirstOver = false;

        if (!over) {
          element.announce(i18n.t('notOverDropAreaA11y', { choice: choiceText(i18n, config, dragData(active)) }));

          return undefined;
        }

        const target = over.id === CHOICES_BOARD_ID ? undefined : over.id;

        // Where the choice already is, reported as the drag begins: the selection was just announced, and
        // saying where the choice sits would only talk over it. Moving there later is announced.
        if (first && target === dragData(active).categoryId) {
          return undefined;
        }

        element.announce(describeFocusTarget(i18n, config, dragData(active), target));

        return undefined;
      },

      onDragEnd() {
        return undefined;
      },

      onDragCancel({ active }) {
        if (!element.endingDragForPlacement && dragData(active)) {
          element.announce(describeDeselection(i18n, config, dragData(active)));
        }

        return undefined;
      },
    };

    return (
      <DragProvider
        accessibility={{
          announcements,
          screenReaderInstructions: { draggable: i18n.t('dragInstructionsA11y') },
          // After a keyboard drop focus goes to the tile that landed (`shouldFocus`). dnd-kit would put it back
          // on the tile the drag started from, which a reusable choice leaves in the pool, so the learner
          // heard that tile and never the result.
          restoreFocus: false,
        }}
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
        onDragCancel={this.onDragCancel}
        keyboardCoordinateGetter={closestDroppableKeyboardCoordinates}
        keyboardCodes={{ start: ['Space', 'Enter'], cancel: ['Escape'], end: ['Space', 'Enter'] }}
        collisionDetection={this.dragCollision.collisionDetection}
        modifiers={this.dragCollision.modifiers}
      >
        <uid.Provider value={this.uid}>
          <Categorize
            ref={(ref) => (this.categorizeRef = ref)}
            {...this.props}
            selectedItem={selectedItem}
            onSelectClick={this.onItemClick}
            onPlacementClick={this.onPlacementClick}
            getChoiceLabel={this.getChoiceLabel}
            getTargetLabel={this.getTargetLabel}
            shouldFocus={this.shouldFocus}
            onChoiceBlur={this.onChoiceBlur}
            onRegionKeyDown={this.onRegionKeyDown}
          />
          <div style={visuallyHidden} role="status" aria-live="assertive" aria-atomic="true">
            {this.state.resultMessage}
          </div>
          <DragOverlay dropAnimation={dropAnimation}>
            <DragPreviewWrapper>{this.renderDragOverlay()}</DragPreviewWrapper>
          </DragOverlay>
        </uid.Provider>
      </DragProvider>
    );
  }
}

const StyledUiLayout: any = styled(UiLayout)({
  color: color.text(),
  backgroundColor: color.background(),
  position: 'relative',
});

const StyledNote: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

// The interactive region - the categories table and the choices pool - scrolls
// horizontally as a unit when it doesn't fit the available width (e.g. under heavy
// browser zoom), instead of being squeezed.
const StyledCategorize: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(1),
  maxWidth: '100%',
  overflowX: 'auto',
  // dragged choices move via transform, which counts toward scrollable overflow, so
  // leaving this axis scrollable would pop a vertical scrollbar mid-drag
  overflowY: 'hidden',
}));

// keeps the categories table + choices pool at their natural width so the scroll
// container above has something to scroll instead of shrinking them to fit
const StyledCategorizeContent: any = styled('div')(() => ({
  display: 'flex',
  minWidth: 'min-content',
}));

const StyledCollapsible: any = styled(Collapsible)(({ theme }) => ({
  paddingBottom: theme.spacing(2),
}));

export default CategorizeProvider;
