// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/src/categorize/index.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import debug from 'debug';
import { styled } from '@mui/material/styles';
import { DragOverlay } from '@dnd-kit/core';
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';
import { buildState, removeChoiceFromCategory, moveChoiceToCategory } from '@pie-lib/categorize';
import { DragProvider, uid } from '@pie-lib/drag';
import { color, Feedback as FeedbackImport, Collapsible as CollapsibleImport, hasText, hasMedia, PreviewPrompt as PreviewPromptImport, UiLayout as UiLayoutImport } from '@pie-lib/render-ui';

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
const UiLayout = unwrapReactInteropSymbol(UiLayoutImport, 'UiLayout') || unwrapReactInteropSymbol(renderUi.UiLayout, 'UiLayout');
const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt') || unwrapReactInteropSymbol(renderUi.PreviewPrompt, 'PreviewPrompt');
const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible') || unwrapReactInteropSymbol(renderUi.Collapsible, 'Collapsible');
const Feedback = unwrapReactInteropSymbol(FeedbackImport, 'Feedback') || unwrapReactInteropSymbol(renderUi.Feedback, 'Feedback');
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import Translator from '@pie-lib/translator';
import { AlertDialog } from '@pie-lib/config-ui';
import Choices from './choices.js';
import Choice from './choice.js';
import Categories from './categories.js';
import { closestDroppableKeyboardCoordinates } from './keyboard-coordinates.js';

const { translator } = Translator;
const log = debug('@pie-ui:categorize');

// Matches the id `choices.jsx` gives the choice pool's DroppablePlaceholder.
const CHOICES_BOARD_ID = 'choices-board';

// A click that lands right after a real drag gesture ends (a pointer drag-and-drop, or
// the browser's own synthetic click following a keyboard Space/Enter drop) must be ignored
// by the click-to-select/click-to-place handlers below, or it would immediately reopen or
// re-trigger a selection for a drag that just completed.
const CLICK_AFTER_DRAG_GUARD_MS = 250;

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
  };

  static defaultProps = {
    disabled: false,
  };

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
  };

  dropChoice: any = (categoryId, draggedChoice) => {
    const { session, onAnswersChange, model } = this.props;
    const { maxChoicesPerCategory = 0 } = model || {};
    const { answers = [] } = session || {};
    let newAnswers;
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
    }

    // treat special case when there are more choices that maxChoicesPerCategory is (testing purpose in pits)
    else if (maxChoicesPerCategory !== 0 && answer && answer.choices && answer.choices.length > maxChoicesPerCategory) {
      newAnswers = answers;
      this.setState({ showMaxChoiceAlert: true });
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
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { model } = this.props;
    const { model: nextModel } = nextProps;

    // check if the note is the default one for prev language and change to the default one for new language
    // this check is necessary in order to diferanciate between default and authour defined note
    // and only change between languages for default ones
    if (
      model.note &&
      model.language &&
      model.language !== nextModel.language &&
      model.note === translator.t('common:commonCorrectAnswerWithAlternates', { lng: model.language })
    ) {
      model.note = translator.t('common:commonCorrectAnswerWithAlternates', { lng: nextModel.language });
    }

    this.setState({ showCorrect: false });
  }

  toggleShowCorrect = () =>
    this.setState({ showCorrect: !this.state.showCorrect }, () => {
      this.props.onShowCorrectToggle();
    });

  getPositionDirection: any = (choicePosition) => {
    let flexDirection;

    switch (choicePosition) {
      case 'left':
        flexDirection = 'row-reverse';
        break;
      case 'right':
        flexDirection = 'row';
        break;
      case 'below':
        flexDirection = 'column';
        break;
      default:
        // above
        flexDirection = 'column-reverse';
        break;
    }

    return flexDirection;
  };

  existAlternateResponse = (correctResponse) =>
    correctResponse?.some((correctRes) => correctRes.alternateResponses?.length > 0);

  render() {
    const { model, session, selectedItem, onSelectClick, onPlacementClick } = this.props;
    const { showCorrect, showMaxChoiceAlert } = this.state;
    const {
      choicesPosition,
      extraCSSRules,
      note,
      showNote,
      env,
      language,
      maxChoicesPerCategory,
      autoplayAudioEnabled,
      customAudioButton,
    } = model;
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
      (showCorrect || (mode === 'view' && role === 'instructor')) && showNote && note && existAlternate;
    const alertMessage = translator.t('translation:categorize:limitMaxChoicesPerCategory', {
      lng: model.language,
      maxChoicesPerCategory,
    });

    const alertTitle = translator.t('common:warning', {
      lng: model.language,
    });

    const onCloseText = translator.t('common:cancel', {
      lng: model.language,
    });

    const showRationale = model.rationale && (hasText(model.rationale) || hasMedia(model.rationale));
    const showTeacherInstructions =
      model.teacherInstructions && (hasText(model.teacherInstructions) || hasMedia(model.teacherInstructions));

    return (
      <StyledUiLayout extraCSSRules={extraCSSRules} id={'main-container'} fontSizeFactor={fontSizeFactor}>
        {showTeacherInstructions && (
          <React.Fragment>
            <StyledCollapsible
              labels={{
                hidden: 'Show Teacher Instructions',
                visible: 'Hide Teacher Instructions',
              }}
            >
              <PreviewPrompt prompt={model.teacherInstructions} />
            </StyledCollapsible>
          </React.Fragment>
        )}

        {model.prompt && (
          <PreviewPrompt
            prompt={model.prompt}
            autoplayAudioEnabled={autoplayAudioEnabled}
            customAudioButton={customAudioButton}
          />
        )}

        <CorrectAnswerToggle
          show={showCorrect || correct === false}
          toggled={showCorrect}
          onToggle={this.toggleShowCorrect}
          language={language}
        />

        <StyledCategorize style={style}>
          <div style={{ display: 'flex', flex: 1 }}>
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
            />
          </div>
          <Choices
            disabled={model.disabled}
            model={model}
            choices={choices}
            choicePosition={choicePosition}
            onDropChoice={this.dropChoice}
            onRemoveChoice={this.removeChoice}
            correct={correct}
            selectedItem={selectedItem}
            onSelectClick={onSelectClick}
            onPlacementClick={onPlacementClick}
          />
        </StyledCategorize>
        {displayNote && (
          <StyledNote
            dangerouslySetInnerHTML={{
              __html: note,
            }}
          />
        )}

        {showRationale && (
          <StyledCollapsible labels={{ hidden: 'Show Rationale', visible: 'Hide Rationale' }}>
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
  };

  constructor(props) {
    super(props);
    this.uid = uid.generateId();
    this.state = {
      activeDragItem: null,
      isValidDrop: false,
      selectedItem: null,
    };
    this.lastDragEndAt = 0;
    this.isInternalDragCancel = false;
  }

  onDragStart: any = (event) => {
    const { active } = event;
    const { pauseMathObserver } = this.props;

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
    if (!this.categorizeRef) return;

    if (targetId === undefined || targetId === CHOICES_BOARD_ID) {
      if (choiceData.categoryId && this.categorizeRef.removeChoice) {
        this.categorizeRef.removeChoice(choiceData);
      }
      return;
    }

    if (this.categorizeRef.dropChoice) {
      this.categorizeRef.dropChoice(targetId, choiceData);
    }
  };

  onDragEnd: any = (event) => {
    const { active, over } = event;
    const { resumeMathObserver } = this.props;

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

    this.commitPlacement(choiceData, over ? over.id : undefined);
  };

  onDragCancel: any = () => {
    const { resumeMathObserver } = this.props;

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
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', bubbles: true, cancelable: true }));
    // dnd-kit handles Escape synchronously, so onDragCancel (which resets this flag) has
    // already run by this point under normal operation — this reset is defensive, in case
    // that assumption ever stops holding, so a stuck flag can't suppress a later genuine cancel.
    this.isInternalDragCancel = false;
  };

  placeSelectedItem: any = (targetId) => {
    const { selectedItem } = this.state;

    if (!selectedItem) return;

    this.commitPlacement(selectedItem, targetId);
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
    const dropAnimation = isValidDrop ? null : undefined;

    return (
      <DragProvider
        onDragStart={this.onDragStart}
        onDragEnd={this.onDragEnd}
        onDragCancel={this.onDragCancel}
        keyboardCoordinateGetter={closestDroppableKeyboardCoordinates}
        keyboardCodes={{ start: ['Space', 'Enter'], cancel: ['Escape'], end: ['Space', 'Enter'] }}
      >
        <uid.Provider value={this.uid}>
          <Categorize
            ref={(ref) => (this.categorizeRef = ref)}
            {...this.props}
            selectedItem={selectedItem}
            onSelectClick={this.onItemClick}
            onPlacementClick={this.onPlacementClick}
          />
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

const StyledCategorize: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(1),
  display: 'flex',
  flexDirection: 'column',
}));

const StyledCollapsible: any = styled(Collapsible)(({ theme }) => ({
  paddingBottom: theme.spacing(2),
}));

export default CategorizeProvider;
