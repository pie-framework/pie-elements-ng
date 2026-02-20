// @ts-nocheck
/**
 * @synced-from pie-elements/packages/extended-text-entry/src/main.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash-es';
import debug from 'debug';

import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import EditableHtml from '@pie-lib/editable-html-tip-tap';
import { color, Feedback as FeedbackImport, Collapsible as CollapsibleImport, PreviewPrompt as PreviewPromptImport, UiLayout as UiLayoutImport } from '@pie-lib/render-ui';

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
const UiLayout = unwrapReactInteropSymbol(UiLayoutImport, 'UiLayout');
const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt');
const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible');
const Feedback = unwrapReactInteropSymbol(FeedbackImport, 'Feedback');
import AnnotationEditor from './annotation/annotation-editor.js';

const log = debug('@pie-ui:extended-text-entry');

const MainContainer: any = styled(UiLayout)({
  backgroundColor: color.background(),
  color: color.text(),
});

const StyledPrompt: any = styled(Typography)(({ theme }) => ({
  width: '100%',
  color: color.text(),
  marginBottom: theme.spacing(2),
  fontSize: 'inherit',
}));

const TeacherInstructions: any = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const Editor: any = styled(EditableHtml)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: '4px',
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
    onValueChange: PropTypes.func.isRequired,
    onAnnotationsChange: PropTypes.func.isRequired,
    onCommentChange: PropTypes.func.isRequired,
    model: PropTypes.object,
    session: PropTypes.shape({
      value: PropTypes.string,
      annotations: PropTypes.array,
      comment: PropTypes.string,
    }).isRequired,
  };

  changeSessionValue = debounce(this.props.onValueChange, 1500);

  changeSessionComment = debounce(this.props.onCommentChange, 1500);

  render() {
    const { model, session, onAnnotationsChange } = this.props;
    const {
      animationsDisabled,
      annotatorMode,
      customKeys,
      dimensions,
      disabled,
      disabledAnnotator,
      equationEditor,
      extraCSSRules,
      feedback,
      mathInput,
      playersToolbarPosition,
      predefinedAnnotations,
      prompt,
      spanishInput,
      specialInput,
      spellCheckEnabled,
      teacherInstructions,
    } = model;
    const { annotations, comment, value } = session;
    const { width, height } = dimensions || {};
    const maxHeight = '40vh';
    const toolbarOpts = { position: playersToolbarPosition === 'top' ? 'top' : 'bottom' };

    log('[render] disabled? ', disabled);

    const teacherInstructionsDiv = (
      <PreviewPrompt defaultClassName="teacher-instructions" prompt={teacherInstructions} />
    );

    const languageCharactersProps = [];

    if (spanishInput) {
      languageCharactersProps.push({ language: 'spanish' });
    }

    if (specialInput) {
      languageCharactersProps.push({ language: 'special' });
    }

    return (
      <MainContainer
        extraCSSRules={extraCSSRules}
        ref={(ref) => {
          this.containerRef = ref;
        }}
      >
        <SrOnly>Constructed Response Question</SrOnly>

        {teacherInstructions && (
          <TeacherInstructions>
            {!animationsDisabled ? (
              <Collapsible
                labels={{ hidden: 'Show Teacher Instructions', visible: 'Hide Teacher Instructions' }}
              >
                {teacherInstructionsDiv}
              </Collapsible>
            ) : (
              teacherInstructionsDiv
            )}
          </TeacherInstructions>
        )}

        {prompt && (
          <StyledPrompt component={'span'}>
            <PreviewPrompt defaultClassName="prompt" prompt={model.prompt} />
          </StyledPrompt>
        )}

        {annotatorMode ? (
          <AnnotationEditor
            text={value || ''}
            annotations={annotations || []}
            comment={comment || ''}
            predefinedAnnotations={predefinedAnnotations || []}
            onChange={onAnnotationsChange}
            onCommentChange={this.changeSessionComment}
            width={width}
            height={height}
            maxHeight={maxHeight}
            disabled={disabledAnnotator}
            disabledMath={!mathInput}
            customKeys={customKeys}
            keypadMode={equationEditor}
          />
        ) : (
          <Editor
            className="response-area-editor"
            onChange={this.changeSessionValue}
            markup={value || ''}
            maxWidth={width && width.toString()}
            minWidth={'100px'}
            minHeight={height && height.toString()}
            maxHeight={maxHeight}
            disabled={disabled}
            highlightShape={true}
            toolbarOpts={toolbarOpts}
            spellCheck={spellCheckEnabled}
            charactersLimit={50000}
            autoWidthToolbar
            pluginProps={{
              math: {
                disabled: !mathInput,
                customKeys: this.props.model.customKeys,
                keypadMode: this.props.model.equationEditor,
                controlledKeypadMode: false,
              },
              video: {
                disabled: true,
              },
              audio: {
                disabled: true,
              },
              table: {
                disabled: true,
              },
              textAlign: {
                disabled: true,
              },
              separateParagraphs: { disabled: false },
              ul_list: { disabled: true },
              ol_list: { disabled: true },
            }}
            languageCharactersProps={languageCharactersProps}
          />
        )}

        {feedback && <Feedback correctness="correct" feedback={feedback} />}
      </MainContainer>
    );
  }
}

export default Main;
