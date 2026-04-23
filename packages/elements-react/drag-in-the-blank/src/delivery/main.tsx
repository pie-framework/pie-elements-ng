// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drag-in-the-blank/src/main.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';
import { DragInTheBlank } from '@pie-lib/mask-markup';
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
const UiLayout = unwrapReactInteropSymbol(UiLayoutImport, 'UiLayout') || unwrapReactInteropSymbol(renderUi.UiLayout, 'UiLayout');
const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt') || unwrapReactInteropSymbol(renderUi.PreviewPrompt, 'PreviewPrompt');
const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible') || unwrapReactInteropSymbol(renderUi.Collapsible, 'Collapsible');
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
import { styled } from '@mui/material/styles';

const StyledUiLayout: any = styled(UiLayout)({
  color: color.text(),
  backgroundColor: color.background(),
  '& tr > td': {
    color: color.text(),
  },
  position: 'relative',
});

const StyledCollapsible: any = styled(Collapsible)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledRationale: any = styled(Collapsible)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export class Main extends React.Component {
  static propTypes = {
    model: PropTypes.object,
    value: PropTypes.object,
    feedback: PropTypes.object,
    onChange: PropTypes.func,
  };

  static defaultProps = {
    value: {},
  };

  state = {
    showCorrectAnswer: false,
  };

  toggleShowCorrect: any = () => {
    this.setState({ showCorrectAnswer: !this.state.showCorrectAnswer });
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { model: nextModel } = nextProps;

    if (nextModel && !nextModel.correctResponse && this.state.showCorrectAnswer !== false) {
      this.setState({ showCorrectAnswer: false });
    }
  }

  render() {
    const { showCorrectAnswer } = this.state;
    const { model, onChange, value } = this.props;
    const { extraCSSRules, prompt, mode, language, fontSizeFactor, autoplayAudioEnabled, customAudioButton } = model;
    const modelWithValue = { ...model, value };
    const showCorrectAnswerToggle = mode === 'evaluate';

    const showRationale = model.rationale && (hasText(model.rationale) || hasMedia(model.rationale));
    const showTeacherInstructions =
      model.teacherInstructions && (hasText(model.teacherInstructions) || hasMedia(model.teacherInstructions));

    return (
      <StyledUiLayout
        extraCSSRules={extraCSSRules}
        id={'main-container'}
        fontSizeFactor={fontSizeFactor}
      >
        {showTeacherInstructions && (
          <StyledCollapsible
            labels={{ hidden: 'Show Teacher Instructions', visible: 'Hide Teacher Instructions' }}
          >
            <PreviewPrompt prompt={model.teacherInstructions} />
          </StyledCollapsible>
        )}

        {prompt && (
          <PreviewPrompt
            className="prompt"
            prompt={prompt}
            autoplayAudioEnabled={autoplayAudioEnabled}
            customAudioButton={customAudioButton}
          />
        )}

        <CorrectAnswerToggle
          show={showCorrectAnswerToggle}
          toggled={showCorrectAnswer}
          onToggle={this.toggleShowCorrect}
          language={language}
        />

        <DragInTheBlank {...modelWithValue} onChange={onChange} showCorrectAnswer={showCorrectAnswer} />

        {showRationale && (
          <StyledRationale labels={{ hidden: 'Show Rationale', visible: 'Hide Rationale' }}>
            <PreviewPrompt prompt={model.rationale} />
          </StyledRationale>
        )}
      </StyledUiLayout>
    );
  }
}

export default Main;
