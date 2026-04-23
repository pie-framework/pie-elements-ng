// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/drawing-response/index.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { color, Collapsible as CollapsibleImport, PreviewPrompt as PreviewPromptImport, UiLayout as UiLayoutImport } from '@pie-lib/render-ui';

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

import Container from './container.js';

const StyledUiLayout: any = styled(UiLayout)({
  color: color.text(),
  backgroundColor: color.background(),
});

const StyledCollapsible: any = styled(Collapsible)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const ErrorDiv: any = styled('div')({
  color: color.text(),
  backgroundColor: color.background(),
});

class DrawingResponseComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCorrect: false,
      hasError: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  render() {
    const {
      model: {
        extraCSSRules,
        disabled,
        imageDimensions,
        imageUrl,
        prompt,
        mode,
        teacherInstructions,
        backgroundImageEnabled,
        language,
      },
      session,
      onSessionChange,
    } = this.props;
    const { hasError, errorMessage } = this.state;
    const isEvaluateMode = mode === 'evaluate';

    return hasError ? (
      <ErrorDiv>An error occured: {errorMessage}</ErrorDiv>
    ) : (
      <StyledUiLayout extraCSSRules={extraCSSRules}>
        {teacherInstructions && (
          <StyledCollapsible
            labels={{
              hidden: 'Show Teacher Instructions',
              visible: 'Hide Teacher Instructions',
            }}
          >
            <PreviewPrompt prompt={teacherInstructions} />
          </StyledCollapsible>
        )}

        {prompt && <PreviewPrompt tagName="span" prompt={prompt} />}

        <Container
          session={session}
          onSessionChange={onSessionChange}
          isEvaluateMode={isEvaluateMode}
          imageDimensions={imageDimensions}
          imageUrl={imageUrl}
          backgroundImageEnabled={backgroundImageEnabled}
          disabled={disabled}
          language={language}
        />
      </StyledUiLayout>
    );
  }
}

DrawingResponseComponent.propTypes = {
  model: PropTypes.object.isRequired,
  onSessionChange: PropTypes.func.isRequired,
  session: PropTypes.object.isRequired,
};

export default DrawingResponseComponent;
