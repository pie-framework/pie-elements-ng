// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';
import { mq, HorizontalKeypad, updateSpans, answerBlockLatex, fieldIds } from '@pie-lib/math-input-mathlive';
import { Feedback as FeedbackImport, Collapsible as CollapsibleImport, Readable as ReadableImport, hasText, hasMedia, PreviewPrompt as PreviewPromptImport, UiLayout as UiLayoutImport } from '@pie-lib/render-ui';

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
const Readable = unwrapReactInteropSymbol(ReadableImport, 'Readable') || unwrapReactInteropSymbol(renderUi.Readable, 'Readable');
const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible') || unwrapReactInteropSymbol(renderUi.Collapsible, 'Collapsible');
const Feedback = unwrapReactInteropSymbol(FeedbackImport, 'Feedback') || unwrapReactInteropSymbol(renderUi.Feedback, 'Feedback');
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { styled } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { ResponseTypes } from './utils.js';
import { isEmpty, isEqual } from '@pie-element/shared-lodash';
import SimpleQuestionBlock from './simple-question-block.js';
import { color, createUniqueId } from '@pie-lib/render-ui';
import Translator from '@pie-lib/translator';
import { isComposingKeyEvent, sanitizeModelHtml } from '@pie-element/shared-utils';
const { translator } = Translator;

const NEWLINE_LATEX = /\\newline/g;
const REGEX = /{{response}}/gm;
const DEFAULT_KEYPAD_VARIANT = 6;

// !!! If you're using Chrome but have selected the "iPad" device in Chrome Developer Tools, the navigator.userAgent string may still report as
//  Safari because Chrome on iOS actually uses the Safari rendering engine under the hood due to Apple's restrictions on third-party browser engines.
// When you select the "iPad" device in Chrome Developer Tools, you're essentially emulating the behavior of Safari on an iPad, including the user agent string.
//  Therefore, even though you're using Chrome, the user agent string will resemble that of Safari on an iPad.
// Since the regular expression /^((?!chrome|android).)*safari/i checks for the presence of "safari" in the user agent string while excluding "chrome" and "android",
//  it will return true in this case because "safari" is present in the user agent string emulated by Chrome when in iPad mode.
const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

function generateAdditionalKeys(keyData = []) {
  return keyData.map((key) => ({
    name: key,
    latex: key,
    write: key,
    label: key,
  }));
}

function isChildOfCurrentPieElement(child, parent) {
  let node = child;
  while (node !== null) {
    if (parent && node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function getKeyPadWidth(additionalKeys = [], equationEditor) {
  return Math.floor(additionalKeys.length / 5) * 30 + (equationEditor === 'miscellaneous' ? 600 : 500);
}

function prepareForStatic(model, state) {
  const { config, disabled } = model || {};
  const { expression, responses, printMode, alwaysShowCorrect } = config || {};

  if (config && expression) {
    const modelExpression = expression;

    if (state.showCorrect) {
      return responses && responses.length && responses[0].answer;
    }

    let answerBlocks = 1; // assume one at least
    // build out local state model using responses declared in expression

    return (modelExpression || '')
      .replace(REGEX, function () {
        const answer = state.session.answers[`r${answerBlocks}`];

        if (printMode && !alwaysShowCorrect) {
          const blankSpace = '\\ \\ '.repeat(30) + '\\newline ';

          return `\\MathQuillMathField[r${answerBlocks++}]{${blankSpace.repeat(3)}}`;
        }

        if (disabled) {
          return answerBlockLatex(`r${answerBlocks++}`, answer && answer.value);
        }

        return `\\MathQuillMathField[r${answerBlocks++}]{${(answer && answer.value) || ''}}`;
      })
      .replace(NEWLINE_LATEX, '\\embed{newLine}[]');
  }
}

function parseAnswers(session, model) {
  const answers = {};

  if (model.config && model.config.expression) {
    let answerBlocks = 1; // assume one at least
    // build out local state model using responses declared in expression

    (model.config.expression || '').replace(REGEX, () => {
      answers[`r${answerBlocks}`] = {
        value:
          (session &&
            session.answers &&
            session.answers[`r${answerBlocks}`] &&
            session.answers[`r${answerBlocks}`].value) ||
          '',
      };

      answerBlocks += 1;
    });
  }
  return answers;
}

export class Main extends React.Component {
  static propTypes = {
    session: PropTypes.object.isRequired,
    onSessionChange: PropTypes.func,
    model: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    const { model, session } = props;
    const answers = parseAnswers(session, model);

    this.state = {
      session: { ...props.session, answers },
      activeAnswerBlock: '',
      showCorrect: this.props.model.config.alwaysShowCorrect || false,
      tooltipContainerRef: React.createRef(),
    };
    this.instructionsIdPrefix = createUniqueId('math-inline-instructions');
  }

  // Answer blocks are part of the static latex (see prepareForStatic); only the prompt's MathJax
  // needs rendering after an update.
  handleAnswerBlockDomUpdate: any = () => {
    renderMath(this.root);
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { config } = this.props.model;
    const { config: nextConfig = {} } = nextProps.model || {};

    const { session } = this.props;
    const { session: nextSession = {} } = nextProps || {};

    // in case session props changed in parent, we need to catch this and update local state
    // example: when env is changing in pieoneer
    if (session && nextSession && !isEqual(session.answers, nextSession.answers)) {
      this.setState({
        session: { ...nextSession, answers: parseAnswers(nextSession, this.props.model) },
      });
    }

    // check if the note is the default one for prev language and change to the default one for new language
    // this check is necessary in order to diferanciate between default and authour defined note
    // and only change between languages for default ones
    if (
      config.note &&
      config.language &&
      config.language !== nextConfig.language &&
      config.note === translator.t('mathInline.primaryCorrectWithAlternates', { lng: config.language })
    ) {
      config.note = translator.t('mathInline.primaryCorrectWithAlternates', { lng: nextConfig.language });
    }

    if ((config.env && config.env.mode !== 'evaluate') || (nextConfig.env && nextConfig.env.mode !== 'evaluate')) {
      this.setState({ ...this.state.session, showCorrect: false });
    }

    if (nextConfig.alwaysShowCorrect) {
      this.setState({ showCorrect: true });
    }

    if (
      (config && config.responses && config.responses.length !== nextConfig.responses.length) ||
      (!config && nextConfig && nextConfig.responses) ||
      (config && nextConfig && config.expression !== nextConfig.expression)
    ) {
      const newAnswers = {};
      const answers = this.state.session.answers;

      let answerBlocks = 1; // assume one at least

      // build out local state model using responses declared in expression
      (nextConfig.expression || '').replace(REGEX, () => {
        newAnswers[`r${answerBlocks}`] = {
          value: (answers && answers[`r${answerBlocks}`] && answers[`r${answerBlocks}`].value) || '',
        };
        answerBlocks++;
      });

      this.setState(
        (state) => ({
          session: {
            ...state.session,
            completeAnswer: this.mqStatic && this.mqStatic.latex(),
            answers: newAnswers,
          },
        }),
        this.handleAnswerBlockDomUpdate,
      );
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    const sameModel = isEqual(this.props.model, nextProps.model);
    const sameState = isEqual(this.state, nextState);

    return !sameModel || !sameState;
  }

  componentDidMount() {
    this.handleAnswerBlockDomUpdate();
    setTimeout(() => renderMath(this.root), 100);
    // The first click on an answer block lands before MathLive reports its focus,
    // so the listener has to be there already.
    this.focusedAnswerBlock = 'r1';
    this.listenForKeypadOpen();
  }

  componentDidUpdate() {
    this.handleAnswerBlockDomUpdate();
  }

  // The answer field is named by @pie-lib/math-input-mathlive and described by the keypad
  // instructions, rendered next to it (see renderInstructions).
  instructionsId: any = () => `${this.instructionsIdPrefix}-advanced`;

  renderInstructions: any = () => (
    <span id={this.instructionsId()} className="sr-only">
      {translator.t('mathInline.keypadInstructions', { lng: this.props.model?.language })}
    </span>
  );

  focusFirstKeypadElement: any = () => {
    setTimeout(() => {
      const keypadElement = document.querySelector('[data-keypad]');

      if (keypadElement) {
        const firstButton = keypadElement.querySelector("button, [role='button']");

        if (firstButton) {
          firstButton.focus();
        }
      }
    }, 0);
  };

  handleKeyDown: any = (event) => {
    const id = this.focusedAnswerBlock;
    const holder = this.mqStatic?.holderRef?.current;
    const isTrigerredFromActualPieElement = isChildOfCurrentPieElement(event.target, this.root);
    const { key, type } = event;
    const isClickOrTouchEvent = type === 'click' || type === 'touchstart';
    // MathLive focuses the field after the click event, so a click is judged by
    // where it landed rather than by what has focus.
    const isAnswerInputFocused = holder
      ? holder.contains(document.activeElement) || (isClickOrTouchEvent && holder.contains(event.target))
      : document.activeElement?.tagName === 'MATH-FIELD';

    if (isAnswerInputFocused && (key === 'ArrowDown' || isClickOrTouchEvent)) {
      if (this.state.activeAnswerBlock !== id && isTrigerredFromActualPieElement) {
        this.cleanupKeyDownListener();
        this.setState({ activeAnswerBlock: id }, () => {
          this.onSubFieldFocus(id);
          if (key === 'ArrowDown') {
            this.focusFirstKeypadElement();
          }
        });
      }
    } else if (event.key === 'Escape' && !isComposingKeyEvent(event)) {
      this.setState({ activeAnswerBlock: '' });
    }
  };

  onSubFieldFocus: any = (id) => {
    // The keypad follows the block that has the caret.
    this.focusedAnswerBlock = id;
    this.listenForKeypadOpen();
  };

  listenForKeypadOpen: any = () => {
    if (!this.handleEvent) {
      this.handleEvent = (event) => {
        this.handleKeyDown(event);
      };

      document.addEventListener('keydown', this.handleEvent);
      // Captured: MathLive stops a click on the answer field inside its shadow root.
      document.addEventListener('click', this.handleEvent, true);
      document.addEventListener('touchstart', this.handleEvent, true);
    }
  };

  cleanupKeyDownListener: any = () => {
    if (this.handleEvent) {
      document.removeEventListener('keydown', this.handleEvent);
      document.removeEventListener('click', this.handleEvent, true);
      document.removeEventListener('touchstart', this.handleEvent, true);
      this.handleEvent = null;
    }
  };

  componentWillUnmount() {
    if (this.cleanupKeyDownListener) {
      this.cleanupKeyDownListener();
    }
  }

  onDone: any = () => {};

  onSimpleResponseChange: any = (response) => {
    this.setState((state) => ({ session: { ...state.session, response } }), this.callOnSessionChange);
  };

  toNodeData: any = (data) => {
    if (!data) {
      return;
    }

    const { type, value } = data;

    if (type === 'command' || type === 'cursor') {
      return data;
    } else if (type === 'answer') {
      return { type: 'answer', ...data };
    } else if (value === 'clear') {
      return { type: 'clear' };
    } else {
      return { type: 'write', value };
    }
  };

  setInput: any = (input) => {
    this.input = input;
  };

  onClick: any = (data) => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const c = this.toNodeData(data);

    if (c.type === 'clear') {
      this.input.clear();
    } else if (c.type === 'command') {
      if (Array.isArray(c.value)) {
        c.value.forEach((vv) => {
          this.input.cmd(vv);
        });
      } else {
        this.input.cmd(c.value);
      }
    } else if (c.type === 'cursor') {
      this.input.keystroke(c.value);
    } else {
      this.input.write(c.value);
    }

    this.input.focus();
    requestAnimationFrame(() => {
      window.scrollTo(scrollX, scrollY);
      requestAnimationFrame(() => window.scrollTo(scrollX, scrollY));
    });
  };

  callOnSessionChange: any = () => {
    const { onSessionChange } = this.props;

    if (onSessionChange) {
      onSessionChange(this.state.session);
    }
  };

  toggleShowCorrect: any = (show) => {
    this.setState({ showCorrect: show }, this.handleAnswerBlockDomUpdate);
  };

  subFieldChanged: any = (name, subfieldValue) => {
    updateSpans();

    if (name) {
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      this.setState(
        (state) => ({
          session: {
            ...state.session,
            completeAnswer: this.mqStatic && this.mqStatic.latex(),
            answers: {
              ...state.session.answers,
              [name]: { value: subfieldValue },
            },
          },
        }),
        () => {
          this.callOnSessionChange();
          requestAnimationFrame(() => {
            window.scrollTo(scrollX, scrollY);
          });
        },
      );
    }
  };

  getFieldName: any = (changeField, fields) => {
    const { answers } = this.state.session;

    if (Object.keys(answers || {}).length) {
      const keys = Object.keys(answers);

      return keys.find((k) => {
        const tf = fields[k];

        return tf && tf.id == changeField.id;
      });
    }
  };

  onBlur: any = (e) => {
    const { relatedTarget, currentTarget } = e || {};

    // our keypad is in tooltip
    // in this way we see if event was triggered from the keypad
    const isKeypadOpen = currentTarget && currentTarget.closest('[role=tooltip]');

    function getParentWithRoleTooltip(element, depth = 0) {
      // only run this max 16 times
      if (!element || depth >= 16) return null;

      const parent = element.offsetParent;

      if (!parent) return null;

      if (parent.getAttribute('role') === 'tooltip') {
        return parent;
      }

      return getParentWithRoleTooltip(parent, depth + 1);
    }

    function getDeepChildDataKeypad(element, depth = 0) {
      // only run this max 4 times
      if (!element || depth >= 4) return null;

      const child = element?.children?.[0];

      if (!child) return null;

      if (child.attributes && child.attributes['data-keypad']) {
        return child;
      }

      return getDeepChildDataKeypad(child, depth + 1);
    }

    const parentWithTooltipRole = getParentWithRoleTooltip(relatedTarget);
    const childWithDataKeypad = parentWithTooltipRole ? getDeepChildDataKeypad(parentWithTooltipRole) : null;

    if (!relatedTarget || !currentTarget || !childWithDataKeypad?.attributes['data-keypad']) {
      // if event was trigered from the keypad, avoid closing the keypad
      if (!isKeypadOpen) {
        this.setState({ activeAnswerBlock: '' });
      }
    }
    // else {
    //     // Just for debugging purpose:
    //     console.log('\n\nNew childWithDataKeypad', childWithDataKeypad);
    //
    //     if (IS_SAFARI) {
    //         // (IS_SAFARI && !relatedTarget?.offsetParent?.children[0]?.children[0]?.attributes?.['data-keypad'])
    //         console.log('What was being used', relatedTarget?.offsetParent?.children[0]?.children[0]);
    //     } else {
    //         // (!IS_SAFARI && !relatedTarget?.offsetParent?.children[0]?.attributes?.['data-keypad']) ||
    //         console.log('What was being used', relatedTarget?.offsetParent?.children[0]);
    //     }
    // }
  };

  setTooltipRef(ref) {
    // Safari Hack: https://stackoverflow.com/a/42764495/5757635
    setTimeout(() => {
      if (ref && IS_SAFARI) {
        const div = document.querySelector("[role='tooltip']");

        if (div) {
          const el = div.firstChild;
          el.setAttribute('tabindex', '-1');
        }
      }
    }, 1);
  }

  render() {
    const { model } = this.props;
    const { activeAnswerBlock, showCorrect, session, tooltipContainerRef } = this.state;
    const {
      config,
      correctness,
      disabled,
      extraCSSRules,
      view,
      teacherInstructions,
      rationale,
      feedback,
      animationsDisabled,
      printMode,
      alwaysShowCorrect,
      language,
    } = model || {};

    if (!config) {
      return null;
    }

    const {
      showNote,
      note,
      prompt,
      responses,
      responseType,
      equationEditor,
      customKeys,
      env: { mode, role } = {},
    } = config || {};
    const displayNote = (showCorrect || (mode === 'view' && role === 'instructor')) && showNote && note;
    const emptyResponse = isEmpty(responses);
    const showCorrectAnswerToggle = !emptyResponse && correctness && correctness.correctness !== 'correct';
    const tooltipModeEnabled = disabled && correctness;
    const additionalKeys = generateAdditionalKeys(customKeys);
    const correct = correctness && correctness.correct;
    const staticLatex = prepareForStatic(model, this.state) || '';
    const answerFieldShown = fieldIds(staticLatex).length > 0;
    const viewMode = disabled && !correctness;
    const studentPrintMode = printMode && !alwaysShowCorrect;
    const showRationale = rationale && (hasText(rationale) || hasMedia(rationale));
    const showTeacherInstructions =
      teacherInstructions && (hasText(teacherInstructions) || hasMedia(teacherInstructions));

    const printView = (
      <PrintContainer>
        <mq.Static
          className="static-math"
          ref={(mqStatic) => {
            if (mqStatic) this.mqStatic = mqStatic;
          }}
          latex={staticLatex}
          language={language}
          onSubFieldChange={this.subFieldChanged}
          getFieldName={this.getFieldName}
          setInput={this.setInput}
          onSubFieldFocus={this.onSubFieldFocus}
          onBlur={this.onBlur}
        />
      </PrintContainer>
    );

    const midContent = (
      <MainContent>
        {mode === 'gather' && (
          <SrOnly>{translator.t('mathInline.mathEquationResponseQuestion', { lng: language })}</SrOnly>
        )}

        {viewMode &&
          showTeacherInstructions &&
          (!animationsDisabled ? (
            <StyledCollapsible labels={{ hidden: translator.t('common:showTeacherInstructions', { lng: language }), visible: translator.t('common:hideTeacherInstructions', { lng: language }) }}>
              <div dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(teacherInstructions) }} />
            </StyledCollapsible>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(teacherInstructions) }} />
          ))}

        {prompt && (
          <PromptContainer>
            <PreviewPrompt prompt={prompt} />
          </PromptContainer>
        )}

        {studentPrintMode ? (
          printView
        ) : (
          <Readable false>
            <InputAndKeypadContainer>
              {responseType === ResponseTypes.simple && (
                <SimpleQuestionBlock
                  onSimpleResponseChange={this.onSimpleResponseChange}
                  showCorrect={showCorrect}
                  emptyResponse={emptyResponse}
                  model={model}
                  session={session}
                  onSubFieldFocus={this.onSubFieldFocus}
                  showKeypad={!!activeAnswerBlock}
                />
              )}

              {responseType === ResponseTypes.advanced && (
                <Expression
                  ref={tooltipContainerRef}
                  isIncorrect={!emptyResponse && !correct && !showCorrect}
                  isCorrect={!emptyResponse && (correct || showCorrect)}
                  showCorrectness={!emptyResponse && disabled && correctness && !view}
                  correctAnswerShown={showCorrect}
                  printCorrect={printMode && alwaysShowCorrect}
                >
                  <Tooltip
                    ref={(ref) => this.setTooltipRef(ref)}
                    enterTouchDelay={0}
                    interactive
                    open={!!activeAnswerBlock}
                    slotProps={{
                      popper: {
                        container: tooltipContainerRef?.current || undefined,
                        placement: 'bottom-start',
                        sx: {
                          backgroundColor: 'transparent',
                          width: '650px',
                          opacity: 1,
                          '& .MuiTooltip-arrow': {
                            display: 'none',
                          },
                        },
                        modifiers: [
                          {
                            name: 'offset',
                            options: {
                              offset: [0, 8],
                            },
                          },
                          {
                            name: 'preventOverflow',
                            enabled: true,
                            options: {
                              boundary: 'viewport',
                              padding: 8,
                            },
                          },
                          {
                            name: 'computeStyles',
                            options: {
                              adaptive: true,
                              gpuAcceleration: true,
                            },
                          },
                          {
                            name: 'flip',
                            enabled: false,
                          },
                        ],
                      },
                      tooltip: {
                        sx: {
                          fontSize: 'initial',
                          backgroundColor: 'transparent',
                          width: '600px',
                          marginTop: 0,
                          paddingTop: 0,
                          boxShadow: 'none',
                        },
                      },
                    }}
                    title={Object.keys(session.answers).map(
                      (answerId) =>
                        (answerId === activeAnswerBlock && !(showCorrect || disabled) && (
                          <ResponseContainer
                            data-keypad={true}
                            key={answerId}
                            style={{
                              // marginTop: this.mqStatic && this.mqStatic.input.offsetHeight - 20,
                              width: getKeyPadWidth(additionalKeys, equationEditor),
                            }}
                          >
                            <HorizontalKeypad
                              additionalKeys={additionalKeys}
                              mode={equationEditor || DEFAULT_KEYPAD_VARIANT}
                              onClick={this.onClick}
                            />
                          </ResponseContainer>
                        )) ||
                        null,
                    )}
                  >
                    <div>
                      {/* Instructions for the answer field, so only where there is one to type into. */}
                      {answerFieldShown && this.renderInstructions()}
                      <mq.Static
                        className="static-math"
                        ref={(mqStatic) => {
                          if (mqStatic) this.mqStatic = mqStatic;
                        }}
                        latex={staticLatex}
                        language={language}
                        ariaDescribedBy={answerFieldShown ? this.instructionsId() : undefined}
                        onSubFieldChange={this.subFieldChanged}
                        getFieldName={this.getFieldName}
                        setInput={this.setInput}
                        onSubFieldFocus={this.onSubFieldFocus}
                        onBlur={this.onBlur}
                      />
                    </div>
                  </Tooltip>
                </Expression>
              )}
            </InputAndKeypadContainer>
          </Readable>
        )}

        {viewMode && displayNote && <Note dangerouslySetInnerHTML={{ __html: `<strong>Note:</strong> ${sanitizeModelHtml(note)}` }} />}

        {viewMode &&
          showRationale &&
          (!animationsDisabled ? (
            <Collapsible labels={{ hidden: translator.t('common:showRationale', { lng: language }), visible: translator.t('common:hideRationale', { lng: language }) }}>
              <div dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(rationale) }} />
            </Collapsible>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: sanitizeModelHtml(rationale) }} />
          ))}
      </MainContent>
    );

    if (tooltipModeEnabled && (showCorrectAnswerToggle || showTeacherInstructions || showRationale || feedback)) {
      return (
        <StyledUiLayout
          extraCSSRules={extraCSSRules}
          containerRef={(node) => {
            this.root = node || this.root;
          }}
        >
          <StyledTooltip
            interactive
            enterTouchDelay={0}
            placement="bottom-start"
            slotProps={{
              tooltip: {
                sx: (theme) => ({
                  background: `${color.primaryLight()} !important`,
                  color: color.text(),
                  padding: theme.spacing(2),
                  border: `1px solid ${color.secondary()}`,
                  fontSize: '16px',
                  '& :not(.MathJax) > table tr': {
                    '&:nth-child(2n)': {
                      backgroundColor: 'unset !important',
                    },
                  },
                }),
              },
              popper: {
                sx: {
                  opacity: 1,
                },
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, 2],
                    },
                  },
                ],
              },
            }}
            title={
              <div>
                <MainContent>
                  {showCorrectAnswerToggle && (
                    <StyledCorrectAnswerToggle
                      language={language}
                      show
                      toggled={showCorrect}
                      onToggle={this.toggleShowCorrect}
                    />
                  )}
                </MainContent>

                {showTeacherInstructions && (
                  <StyledCollapsible
                    key="collapsible-teacher-instructions"
                    labels={{
                      hidden: translator.t('common:showTeacherInstructions', { lng: language }),
                      visible: translator.t('common:hideTeacherInstructions', { lng: language }),
                    }}
                  >
                    <PreviewPrompt prompt={teacherInstructions} />
                  </StyledCollapsible>
                )}
                {displayNote && hasText(note) && (
                  <StyledCollapsible
                    key="collapsible-note"
                    labels={{
                      hidden: translator.t('common:showNote', { lng: language }),
                      visible: translator.t('common:hideNote', { lng: language }),
                    }}
                  >
                    <PreviewPrompt prompt={note} />
                  </StyledCollapsible>
                )}

                {showRationale && (
                  <StyledCollapsible
                    key="collapsible-rationale"
                    labels={{
                      hidden: translator.t('common:showRationale', { lng: language }),
                      visible: translator.t('common:hideRationale', { lng: language }),
                    }}
                  >
                    <PreviewPrompt prompt={rationale} />
                  </StyledCollapsible>
                )}

                {feedback && <Feedback correctness={correctness.correctness} feedback={feedback} />}
              </div>
            }
          >
            {midContent}
          </StyledTooltip>
        </StyledUiLayout>
      );
    }

    return (
      <StyledUiLayout
        extraCSSRules={extraCSSRules}
        containerRef={(node) => {
          this.root = node || this.root;
        }}
      >
        {midContent}
      </StyledUiLayout>
    );
  }
}

// CSS for the answer blocks drawn by answerBlockLatex, and for the keypad instructions
if (typeof document !== 'undefined') {
  const styleId = 'math-inline-block-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      [data-answer-block-index] {
        color: grey;
      }
      .sr-only {
        position: absolute;
        left: -10000px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
  }
}

const StyledUiLayout: any = styled(UiLayout)(() => ({
  color: color.text(),
  backgroundColor: color.background(),
  display: 'inline-block',
}));

const StyledTooltip: any = styled(Tooltip)({
  // Styles applied via slotProps.sx below
});

const PromptContainer: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const MainContent: any = styled('div')({
  width: '100%',
  position: 'relative',
  backgroundColor: color.background(),
  color: color.text(),
});

const Note: any = styled('div')(({ theme }) => ({
  paddingBottom: theme.spacing(2),
}));

const StyledCollapsible: any = styled(Collapsible)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const ResponseContainer: any = styled('div')(({ theme }) => ({
  zIndex: 10,
  minWidth: '400px',
  marginTop: theme.spacing(2),
}));

const Expression: any = styled('div', {
  shouldForwardProp: (prop) =>
    !['isIncorrect', 'isCorrect', 'showCorrectness', 'correctAnswerShown', 'printCorrect'].includes(prop),
})(({ theme, isIncorrect, isCorrect, showCorrectness, correctAnswerShown, printCorrect }) => {
  const borderColor = isIncorrect ? color.incorrect() : isCorrect ? color.correct() : undefined;

  return {
    maxWidth: 'fit-content',
    padding: theme.spacing(0.25),
    ...(showCorrectness && {
      border: borderColor ? `2px solid ${borderColor} !important` : '2px solid',
    }),
    ...(!showCorrectness &&
      borderColor && {
        borderColor: `${borderColor} !important`,
      }),
    ...(correctAnswerShown && {
      padding: theme.spacing(1),
      letterSpacing: '0.5px',
    }),
    ...(printCorrect && {
      border: `2px solid ${color.correct()} !important`,
    }),
  };
});

const InputAndKeypadContainer: any = styled('div')({
  position: 'relative',
});

const PrintContainer: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(1),
  pointerEvents: 'none',
}));

const SrOnly: any = styled('h2')({
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
});

const StyledCorrectAnswerToggle: any = styled(CorrectAnswerToggle)(({ theme }) => ({
  color: color.text(),
  marginBottom: theme.spacing(2),
}));

export default Main;
