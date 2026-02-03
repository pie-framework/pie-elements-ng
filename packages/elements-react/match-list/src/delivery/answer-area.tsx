// @ts-nocheck
/**
 * @synced-from pie-elements/packages/match-list/src/answer-area.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { isEmpty } from 'lodash-es';
import { isUndefined } from 'lodash-es';
import { reduce } from 'lodash-es';

import Arrow from './arrow';
import DragAndDropAnswer from './answer';

const ArrowEntry: any = styled('div')({
  alignItems: 'normal',
  display: 'flex',
  height: 40,
  margin: '10px 20px',
});

const ItemList: any = styled('div')(({ theme }) => ({
  alignItems: 'flex-start',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  justifyContent: 'space-between',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const PromptEntry: any = styled('div')(({ theme }) => ({
  border: `1px solid ${theme.palette.grey[400]}`,
  boxSizing: 'border-box',
  flex: 1,
  margin: '10px 0',
  minHeight: 40,
  overflow: 'hidden',
  padding: 10,
  textAlign: 'center',
  width: '100%',
  wordBreak: 'break-word',
}));

const Row: any = styled('div')({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
  width: '100%',
});

export class AnswerArea extends React.Component {
  static propTypes = {
    session: PropTypes.object.isRequired,
    showCorrect: PropTypes.bool.isRequired,
    disabled: PropTypes.bool.isRequired,
    onSessionChange: PropTypes.func,
    onRemoveAnswer: PropTypes.func,
    instanceId: PropTypes.string.isRequired,
    model: PropTypes.object.isRequired,
    prompt: PropTypes.string,
  };

  getAnswerFromSession: any = (promptId) => {
    const { model, session, showCorrect } = this.props;
    const { config } = model;
    const answerId = showCorrect
      ? config.prompts.find((p) => p.id === promptId).relatedAnswer
      : session.value && session.value[promptId];
    const answer = config.answers.find((answer) => answer.id === answerId);

    return answer || {};
  };

  getCorrectOrIncorrectMap: any = () => {
    const { model, session, showCorrect } = this.props;
    const { config } = model;
    const sessionValue =
      session.value ||
      config.prompts.reduce((obj, prompt) => {
        obj[prompt.id] = undefined;
        return obj;
      }, {});

    if (model.mode !== 'evaluate') {
      return {};
    }

    if (showCorrect) {
      return config.prompts.reduce((obj, prompt) => {
        obj[prompt.id] = true;

        return obj;
      }, {});
    }

    const correctPromptMap = config.prompts.reduce((obj, prompt) => {
      if (!isUndefined(prompt.relatedAnswer)) {
        obj[prompt.id] = prompt.relatedAnswer;
      }

      return obj;
    }, {});

    return reduce(
      sessionValue,
      (obj, val, key) => {
        obj[key] = correctPromptMap[key] === sessionValue[key];

        return obj;
      },
      {},
    );
  };

  buildRows: any = () => {
    const { model } = this.props;
    const { config } = model;
    const prompts = config.prompts || [];

    return prompts.map((prompt) => {
      const sessionAnswer = this.getAnswerFromSession(prompt.id);

      return {
        ...prompt,
        sessionAnswer,
      };
    });
  };

  render() {
    const { disabled, instanceId, onRemoveAnswer } = this.props;
    const rows = this.buildRows();
    const correctnessMap = this.getCorrectOrIncorrectMap();

    return (
      <ItemList>
        {rows.map(({ sessionAnswer, title, id }, index) => {
          return (
            <Row key={index}>
              <PromptEntry dangerouslySetInnerHTML={{ __html: title }} />

              <ArrowEntry>
                <Arrow direction="left" />
                <Arrow />
              </ArrowEntry>

              <DragAndDropAnswer
                key={index}
                className="answer"
                index={index}
                promptId={id}
                correct={correctnessMap[id]}
                draggable={!isEmpty(sessionAnswer)}
                disabled={disabled}
                instanceId={instanceId}
                id={sessionAnswer.id}
                title={sessionAnswer.title}
                type={'target'}
                onRemoveChoice={() => onRemoveAnswer(id)}
              />
            </Row>
          );
        })}
      </ItemList>
    );
  }
}

export default AnswerArea;
