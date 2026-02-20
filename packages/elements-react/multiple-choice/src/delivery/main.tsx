// @ts-nocheck
/**
 * @synced-from pie-elements/packages/multiple-choice/src/main.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { PreviewLayout as PreviewLayoutImport } from '@pie-lib/render-ui';

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
const PreviewLayout = unwrapReactInteropSymbol(PreviewLayoutImport, 'PreviewLayout') || unwrapReactInteropSymbol(renderUi.PreviewLayout, 'PreviewLayout');
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
import MultipleChoice from './multiple-choice.js';

class Main extends React.Component {
  static propTypes = {
    model: PropTypes.object,
    session: PropTypes.object,
    options: PropTypes.object,
    onChoiceChanged: PropTypes.func,
    onShowCorrectToggle: PropTypes.func,
    extraCSSRules: PropTypes.shape({
      names: PropTypes.arrayOf(PropTypes.string),
      rules: PropTypes.string,
    }),
  };

  static defaultProps = {
    model: {},
    session: {},
  };

  render() {
    const { model, onChoiceChanged, session, onShowCorrectToggle, options } = this.props;
    const { extraCSSRules, fontSizeFactor } = model;

    // model.partLabel is a property used for ebsr
    return (
      <PreviewLayout extraCSSRules={extraCSSRules} fontSizeFactor={fontSizeFactor} classes={{}}>
        <MultipleChoice
          {...model}
          options={options}
          session={session}
          onChoiceChanged={onChoiceChanged}
          onShowCorrectToggle={onShowCorrectToggle}
        />
      </PreviewLayout>
    );
  }
}

export default Main;
