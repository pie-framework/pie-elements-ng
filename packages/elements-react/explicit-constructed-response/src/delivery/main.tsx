// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { isEmpty } from '@pie-element/shared-lodash';
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';
import { ConstructedResponse } from '@pie-lib/mask-markup';
import { color, Collapsible as CollapsibleImport, hasText, hasMedia, PreviewPrompt as PreviewPromptImport, UiLayout as UiLayoutImport } from '@pie-lib/render-ui';

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
import { sanitizeModelHtml } from '@pie-element/shared-utils';
import { catalogs } from '../i18n/index.js';
import { alternatesNote } from './default-note.js';

const MainContainer: any = styled(UiLayout)(({ alwaysShowCorrect }) => ({
  color: color.text(),
  backgroundColor: color.background(),
  ...(alwaysShowCorrect && {
    '& *': {
      borderColor: `${color.text()} !important`,
    },
  }),
}));

const NoteContainer: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const CollapsibleContainer: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const SrOnly: any = styled('h2')({
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
});

export class Main extends React.Component {
  static propTypes = {
    alwaysShowCorrect: PropTypes.bool,
    animationsDisabled: PropTypes.bool,
    disabled: PropTypes.bool,
    displayType: PropTypes.string,
    feedback: PropTypes.object,
    /** The chrome language: the player's interface locale, else the declared language. */
    language: PropTypes.string,
    /** The item's declared language, which the blanks' editors take as their content language. */
    contentLanguage: PropTypes.string,
    markup: PropTypes.string,
    maxLengthPerChoice: PropTypes.array,
    maxLengthPerChoiceEnabled: PropTypes.bool,
    mode: PropTypes.string,
    note: PropTypes.string,
    onChange: PropTypes.func,
    playerSpellCheckEnabled: PropTypes.bool,
    idleSaveDelay: PropTypes.number,
    prompt: PropTypes.string,
    rationale: PropTypes.string,
    role: PropTypes.string,
    showNote: PropTypes.bool,
    teacherInstructions: PropTypes.string,
    value: PropTypes.object,
    responseAreaInputConfiguration: PropTypes.object,
    model: PropTypes.object.isRequired,
  };

  static defaultProps = {
    value: {},
  };

  state = {
    showCorrectAnswer: this.props.alwaysShowCorrect || false,
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (isEmpty(nextProps.feedback)) {
      this.setState({ showCorrectAnswer: false });
    }

    if (nextProps.alwaysShowCorrect) {
      this.setState({ showCorrectAnswer: true });
    }
  }

  toggleShowCorrect: any = () => {
    this.setState({ showCorrectAnswer: !this.state.showCorrectAnswer });
  };

  // Coalescing lives on the custom element's `session-changed` dispatch, which
  // also owns the per-model delay `maxLengthPerChoice` selects. Holding the
  // value here instead left `.session` stale until the timer fired.
  onChange: any = (value, id) => {
    this.props.onChange(value, id);
  };

  render() {
    const { showCorrectAnswer } = this.state;
    const {
      alwaysShowCorrect,
      animationsDisabled,
      mode,
      displayType,
      role,
      language,
      contentLanguage,
      maxLengthPerChoice,
      maxLengthPerChoiceEnabled,
      note,
      playerSpellCheckEnabled,
      idleSaveDelay,
      prompt,
      rationale,
      showNote,
      teacherInstructions,
      responseAreaInputConfiguration,
      model,
      value,
    } = this.props;

    const { extraCSSRules } = model || {};
    const i18n = catalogs.forLocale(language);
    const displayNote = (showCorrectAnswer || (mode === 'view' && role === 'instructor')) && showNote;

    const teacherInstructionsDiv = (
      <PreviewPrompt defaultClassName="teacher-instructions" prompt={teacherInstructions} />
    );

    const rationaleDiv = <PreviewPrompt prompt={rationale} />;

    const showRationale = rationale && (hasText(rationale) || hasMedia(rationale));
    const showTeacherInstructions =
      teacherInstructions && (hasText(teacherInstructions) || hasMedia(teacherInstructions));

    return (
      <MainContainer
        extraCSSRules={extraCSSRules}
        alwaysShowCorrect={alwaysShowCorrect}
        style={{ display: `${displayType}` }}
      >
        {mode === 'gather' && (
          <SrOnly>{i18n.t('fillInTheBlankQuestion')}</SrOnly>
        )}

        {showTeacherInstructions && (
          <CollapsibleContainer>
            {!animationsDisabled ? (
              <Collapsible variant="teacherInstructions" language={language}>
                {teacherInstructionsDiv}
              </Collapsible>
            ) : (
              teacherInstructionsDiv
            )}
          </CollapsibleContainer>
        )}

        {prompt && <PreviewPrompt prompt={prompt} />}

        {!alwaysShowCorrect && mode === 'evaluate' && (
          <CorrectAnswerToggle
            show
            toggled={showCorrectAnswer}
            onToggle={this.toggleShowCorrect}
            language={language}
          />
        )}

        <ConstructedResponse
          {...this.props}
          onChange={this.onChange}
          idleSaveDelay={idleSaveDelay}
          showCorrectAnswer={showCorrectAnswer}
          value={value}
          maxLength={maxLengthPerChoice}
          adjustedLimit={maxLengthPerChoiceEnabled}
          spellCheck={playerSpellCheckEnabled}
          pluginProps={responseAreaInputConfiguration}
          language={contentLanguage}
        />

        {displayNote && (
          <NoteContainer
            dangerouslySetInnerHTML={{
              __html: sanitizeModelHtml(alternatesNote(note, language, contentLanguage)),
            }}
          />
        )}

        {showRationale && (
          <CollapsibleContainer>
            {!animationsDisabled ? (
              <Collapsible variant="rationale" language={language}>
                {rationaleDiv}
              </Collapsible>
            ) : (
              rationaleDiv
            )}
          </CollapsibleContainer>
        )}
      </MainContainer>
    );
  }
}

export default Main;
