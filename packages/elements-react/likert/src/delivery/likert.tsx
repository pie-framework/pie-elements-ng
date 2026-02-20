// @ts-nocheck
/**
 * @synced-from pie-elements/packages/likert/src/likert.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import ChoiceInput from './choice-input.js';
import { styled } from '@mui/material/styles';
import { color, Collapsible as CollapsibleImport, PreviewPrompt as PreviewPromptImport } from '@pie-lib/render-ui';

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
const PreviewPrompt = unwrapReactInteropSymbol(PreviewPromptImport, 'PreviewPrompt');
const Collapsible = unwrapReactInteropSymbol(CollapsibleImport, 'Collapsible');
import { LIKERT_ORIENTATION } from './likertEntities.js';

const Main: any = styled('div')({
  color: color.text(),
  backgroundColor: color.background(),
  '& *': {
    '-webkit-font-smoothing': 'antialiased',
  },
});

const StyledCollapsible: any = styled(Collapsible)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const Prompt: any = styled('div')(({ theme }) => ({
  verticalAlign: 'middle',
  color: 'var(--pie-primary-text, var(--pie-text, #000000))',
  paddingBottom: theme.spacing(2),
}));

const ChoicesWrapper: any = styled('div')({
  display: 'flex',
});

export class Likert extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    choices: PropTypes.array,
    prompt: PropTypes.string,
    teacherInstructions: PropTypes.string,
    session: PropTypes.object,
    disabled: PropTypes.bool.isRequired,
    onSessionChange: PropTypes.func.isRequired,
    likertOrientation: PropTypes.string.isRequired,
  };

  UNSAFE_componentWillReceiveProps() {}

  isSelected(value) {
    return this.props.session && this.props.session.value === value;
  }

  render() {
    const {
      disabled,
      choices = [],
      prompt,
      onSessionChange,
      teacherInstructions,
      className,
      likertOrientation,
    } = this.props;

    const flexDirection = likertOrientation === LIKERT_ORIENTATION.vertical ? 'column' : 'row';

    return (
      <Main className={className}>
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

        {prompt && (
          <Prompt>
            <PreviewPrompt prompt={prompt} />
          </Prompt>
        )}

        <ChoicesWrapper style={{ flexDirection }}>
          {choices.map((choice, index) => (
            <ChoiceInput
              key={`choice-${index}`}
              label={choice.label}
              value={choice.value}
              index={index}
              disabled={disabled}
              onChange={onSessionChange}
              likertOrientation={likertOrientation}
              checked={this.isSelected(choice.value)}
            />
          ))}
        </ChoicesWrapper>
      </Main>
    );
  }
}

Likert.defaultProps = {
  session: {
    value: [],
  },
};

export default Likert;
