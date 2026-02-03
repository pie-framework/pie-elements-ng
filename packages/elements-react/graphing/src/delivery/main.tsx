// @ts-nocheck
/**
 * @synced-from pie-elements/packages/graphing/src/main.jsx
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { GraphContainer, KeyLegend } from '@pie-lib/graphing';
import { color, Collapsible, hasText, hasMedia, PreviewPrompt, UiLayout } from '@pie-lib/render-ui';
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';

const MainContainer: any = styled(UiLayout)({
  color: color.text(),
  backgroundColor: color.background(),
});

const TeacherInstructions: any = styled(Collapsible)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const Graph: any = styled(GraphContainer)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export class Main extends React.Component {
  static propTypes = {
    model: PropTypes.object.isRequired,
    session: PropTypes.object.isRequired,
    onAnswersChange: PropTypes.func,
  };

  state = { showingCorrect: false };

  toggleCorrect = (showingCorrect) => this.setState({ showingCorrect });

  render() {
    const { model, onAnswersChange, session } = this.props;
    const { showingCorrect } = this.state;
    const { answer } = session || {};
    const {
      answersCorrected,
      arrows,
      backgroundMarks,
      coordinatesOnHover,
      correctResponse,
      defaultTool,
      disabled,
      domain,
      extraCSSRules,
      labels,
      labelsEnabled,
      prompt,
      range,
      rationale,
      showKeyLegend,
      showToggle,
      title,
      titleEnabled,
      teacherInstructions,
      toolbarTools,
      language,
    } = model || {};
    const size = model?.size || model?.graph || {}; // need this for models that are not processed by controller
    const marks = answersCorrected || answer || [];
    const isLabelAvailable = toolbarTools?.includes('label') || false;
    const showRationale = model.rationale && (hasText(model.rationale) || hasMedia(model.rationale));
    const showTeacherInstructions =
      model.teacherInstructions && (hasText(model.teacherInstructions) || hasMedia(model.teacherInstructions));

    return (
      <MainContainer extraCSSRules={extraCSSRules}>
        {showTeacherInstructions && (
          <TeacherInstructions
            labels={{ hidden: 'Show Teacher Instructions', visible: 'Hide Teacher Instructions' }}
          >
            <PreviewPrompt prompt={teacherInstructions} />
          </TeacherInstructions>
        )}

        {prompt && <PreviewPrompt className="prompt" prompt={prompt} />}

        <CorrectAnswerToggle
          show={showToggle}
          toggled={showingCorrect}
          onToggle={this.toggleCorrect}
          language={language}
        />

        {showingCorrect && showToggle ? (
          <Graph
            axesSettings={{ includeArrows: arrows }}
            backgroundMarks={backgroundMarks.filter((mark) => !mark.building)}
            coordinatesOnHover={coordinatesOnHover}
            disabled={true}
            disabledLabels={true}
            disabledTitle={true}
            domain={domain}
            labels={labels}
            marks={correctResponse.map((i) => ({ ...i, correctness: 'correct' }))}
            onChangeMarks={onAnswersChange}
            range={range}
            showLabels={labelsEnabled}
            showTitle={titleEnabled}
            size={size}
            title={title}
            toolbarTools={toolbarTools}
            language={language}
          />
        ) : (
          <Graph
            axesSettings={{ includeArrows: arrows }}
            backgroundMarks={backgroundMarks.filter((mark) => !mark.building)}
            coordinatesOnHover={coordinatesOnHover}
            defaultTool={defaultTool}
            disabled={disabled}
            disabledLabels={true}
            disabledTitle={true}
            domain={domain}
            labels={labels}
            marks={marks}
            onChangeMarks={onAnswersChange}
            range={range}
            showLabels={labelsEnabled}
            showTitle={titleEnabled}
            size={size}
            title={title}
            toolbarTools={toolbarTools}
            language={language}
            limitLabeling={true}
          />
        )}
        {showKeyLegend && !showingCorrect && <KeyLegend isLabelAvailable={isLabelAvailable}></KeyLegend>}
        {showRationale && (
          <Collapsible labels={{ hidden: 'Show Rationale', visible: 'Hide Rationale' }}>
            <PreviewPrompt prompt={rationale} />
          </Collapsible>
        )}
      </MainContainer>
    );
  }
}

export default Main;
