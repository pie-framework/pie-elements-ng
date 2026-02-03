// @ts-nocheck
/**
 * @synced-from pie-elements/packages/inline-dropdown/src/inline-dropdown.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { isEmpty } from 'lodash-es';
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';
import { InlineDropdown as DropDown } from '@pie-lib/mask-markup';
import { color, Collapsible, hasText, hasMedia, PreviewPrompt, UiLayout } from '@pie-lib/render-ui';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { styled } from '@mui/material/styles';

const StyledUiLayout: any = styled(UiLayout)({
  color: color.text(),
  backgroundColor: color.background(),
});

const StyledCollapsible: any = styled(Collapsible)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const ChoiceRationaleWrapper: any = styled('div')(({ theme }) => ({
  '&:not(:last-child)': {
    marginBottom: theme.spacing(2),
  },
}));

const ChoiceRationale: any = styled('div')({
  display: 'flex',
  whiteSpace: 'break-spaces',
});

const ChoiceRationaleLabel: any = styled('div')(({ correct }) => ({
  display: 'flex',
  ...(correct
    ? {
        color: color.correct(),
      }
    : {
        color: color.incorrectWithIcon(),
      }),
}));

const SrOnly: any = styled('h2')({
  position: 'absolute',
  left: '-10000px',
  top: 'auto',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
});

export class InlineDropdown extends React.Component {
  static propTypes = {
    prompt: PropTypes.string,
    disabled: PropTypes.bool,
    markup: PropTypes.string,
    mode: PropTypes.string,
    displayType: PropTypes.string,
    rationale: PropTypes.string,
    teacherInstructions: PropTypes.string,
    model: PropTypes.object.isRequired,
    choices: PropTypes.object,
    value: PropTypes.object,
    feedback: PropTypes.object,
    onChange: PropTypes.func,
    language: PropTypes.string,
  };

  static defaultProps = {
    value: {},
  };

  state = {
    showCorrectAnswer: false,
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (isEmpty(nextProps.feedback)) {
      this.setState({ showCorrectAnswer: false });
    }
  }

  componentDidUpdate() {
    // eslint-disable-next-line
    const domNode = ReactDOM.findDOMNode(this);

    renderMath(domNode);
  }

  toggleShowCorrect: any = () => {
    this.setState({ showCorrectAnswer: !this.state.showCorrectAnswer });
  };

  render() {
    const { showCorrectAnswer } = this.state;
    const { prompt, mode, model, rationale, teacherInstructions, choices, displayType, language } = this.props;
    const { extraCSSRules } = model || {};
    const showCorrectAnswerToggle = mode === 'evaluate';
    let choiceRationalesHaveText = false;
    const showRationale = rationale && (hasText(rationale) || hasMedia(rationale));
    const showTeacherInstructions =
      teacherInstructions && (hasText(teacherInstructions) || hasMedia(teacherInstructions));

    const choiceRationales = (Object.keys(choices) || []).map((key) =>
      (choices[key] || []).reduce((acc, currentValue) => {
        if (currentValue.rationale && hasText(currentValue.rationale)) {
          choiceRationalesHaveText = true;

          acc.push(currentValue);
        }

        return acc;
      }, []),
    );

    return (
      <StyledUiLayout extraCSSRules={extraCSSRules} style={{ display: `${displayType}` }}>
        {mode === 'gather' && <SrOnly>Inline Dropdown Question</SrOnly>}

        {showTeacherInstructions && (
          <StyledCollapsible
            labels={{ hidden: 'Show Teacher Instructions', visible: 'Hide Teacher Instructions' }}
          >
            <PreviewPrompt prompt={teacherInstructions} />
          </StyledCollapsible>
        )}

        {prompt && <PreviewPrompt prompt={prompt} />}

        <CorrectAnswerToggle
          show={showCorrectAnswerToggle}
          toggled={showCorrectAnswer}
          onToggle={this.toggleShowCorrect}
          language={language}
        />

        <DropDown {...this.props} showCorrectAnswer={showCorrectAnswer} />

        {choiceRationalesHaveText && (
          <StyledCollapsible
            labels={{ hidden: 'Show Rationale for choices', visible: 'Hide Rationale for choices' }}
          >
            {choiceRationales.map((choices, index) => (
              <ChoiceRationaleWrapper key={index}>
                {choices?.length > 0 &&
                  choices.map((choice) => (
                    <ChoiceRationale key={choice.label}>
                      <ChoiceRationaleLabel
                        correct={choice.correct}
                        dangerouslySetInnerHTML={{ __html: `${choice.label}: ` }}
                      />
                      <PreviewPrompt prompt={choice.rationale} />
                    </ChoiceRationale>
                  ))}
              </ChoiceRationaleWrapper>
            ))}
          </StyledCollapsible>
        )}

        {showRationale && (
          <Collapsible labels={{ hidden: 'Show Rationale', visible: 'Hide Rationale' }}>
            <PreviewPrompt prompt={rationale} />
          </Collapsible>
        )}
      </StyledUiLayout>
    );
  }
}

export default InlineDropdown;
