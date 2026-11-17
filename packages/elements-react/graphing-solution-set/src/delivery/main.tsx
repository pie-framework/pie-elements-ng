// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { GraphContainer, KeyLegend } from '@pie-lib/graphing-solution-set';
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
import CorrectAnswerToggle from '@pie-lib/correct-answer-toggle';
import { findSectionsInSolutionSet, findSelectedSection, checkIfLinesAreAdded } from './utils.js';
import { AlertDialog } from '@pie-lib/config-ui';
import { catalogs } from '../i18n/index.js';

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
    /** The interface locale the custom element resolved; without one the chrome follows the item's language. */
    language: PropTypes.string,
  };

  state = {
    showingCorrect: false,
    dialog: {
      open: false,
    },
  };

  /*
   * Function to handle the AlertDialog
   * @param {boolean} open - open state of the dialog
   * @param {function} callback - callback function to be called after setting the state
   * */
  handleAlertDialog = (open, callback) =>
    this.setState(
      {
        dialog: { open },
      },
      callback,
    );

  /*
   * Function to toggle the correct answer
   * @param {boolean} showingCorrect - state of the correct answer
   * */
  toggleCorrect = (showingCorrect) => this.setState({ showingCorrect });

  /*
   * Reset the graph to original state
   * */
  onResetClick: any = () => {
    const { model, session, setGssData } = this.props;
    let { gssData } = model;
    this.setState({
      dialog: {
        open: true,
        text: 'resetWarning',
        onConfirm: () => {
          // Reset the graph to original state
          session.answer = [];
          gssData.selectedTool = 'lineA';
          gssData.lineA.lineType = 'Solid';
          if (gssData.lineB) gssData.lineB.lineType = 'Solid';
          // Set the gssData and session
          setGssData(gssData, session);
          this.handleAlertDialog(false);
        },
        onClose: () => this.handleAlertDialog(false),
      },
    });
  };

  /*
   * Function to handle the event of solution set selected
   * @param {object} point - point selected on the graph
   * @param {object} rawPoint - unsnapped position of the click, when known
   * */
  onSolutionSetSelected: any = (point, rawPoint) => {
    const { model, session, setGssData } = this.props;
    const { gssData, disabled } = model;
    if (disabled) {
      return;
    }
    const section = findSelectedSection(gssData.sections, point, rawPoint);
    if (section) {
      let polygon = {
        points: section,
        building: false,
        type: 'polygon',
        closed: true,
        isSolution: true,
      };
      session.answer = session.answer.filter((mark) => mark.type !== 'polygon');
      session.answer.push(polygon);
    }
    setGssData(gssData, session);
  };

  /*
   * Function to handle the event of change in GSS Line Data
   * @param {object} gssData - GSS Line Data
   * @param {string} oldSelectedTool - old selected tool
   * */
  onChangeGssLineData: any = (gssData, oldSelectedTool) => {
    const { model, session } = this.props;
    const { domain, range, disabled } = model;
    if (disabled) {
      return;
    }
    if (gssData.selectedTool === 'solutionSet') {
      let lines = session.answer.filter((mark) => mark.type !== 'polygon');
      if (!checkIfLinesAreAdded(gssData, lines)) {
        gssData.selectedTool = oldSelectedTool;
        this.setState({
          dialog: {
            open: true,
            text: 'defineLinesFirst',
            onConfirm: () => this.handleAlertDialog(false),
          },
        });
      } else {
        let lines = session.answer.filter((mark) => mark.type !== 'polygon');
        gssData = findSectionsInSolutionSet(gssData, lines, domain, range);
      }
      this.handleGssDataChange(gssData, session);
    } else {
      let polygons = session.answer.filter((mark) => mark.type === 'polygon');
      if (oldSelectedTool === 'solutionSet' && polygons.length > 0) {
        this.setState({
          dialog: {
            open: true,
            text: 'lineChangeWarning',
            onConfirm: () => {
              session.answer = session.answer.filter((mark) => mark.type !== 'polygon');
              this.handleGssDataChange(gssData, session);
              this.handleAlertDialog(false);
            },
            confirm: 'clearSolutionSet',
            onClose: () => {
              gssData.selectedTool = oldSelectedTool;
              this.handleGssDataChange(gssData, session);
              this.handleAlertDialog(false);
            },
          },
        });
      } else {
        this.handleGssDataChange(gssData, session);
      }
    }
  };

  /*
   * Function to handle the event of change in GSS Data
   * @param {object} gssData - GSS Data
   * @param {object} session - session data
   * */
  handleGssDataChange: any = (gssData, session) => {
    const { setGssData } = this.props;
    if (session.answer && session.answer.length > 0 && session.answer[0] && gssData.lineA) {
      session.answer[0].fill = gssData.lineA.lineType;
    }
    if (session.answer && session.answer.length > 1 && session.answer[1] && gssData.lineB) {
      session.answer[1].fill = gssData.lineB.lineType;
    }
    if (
      (gssData.selectedTool === 'lineB' && session.answer.length === 0) ||
      (gssData.selectedTool === 'lineB' && session.answer[0].building)
    ) {
      this.setState({
        dialog: {
          open: true,
          text: 'addLineAFirst',
          onConfirm: () => this.handleAlertDialog(false),
        },
      });
      gssData.selectedTool = 'lineA';
    }
    if (gssData.selectedTool === 'lineA' && session.answer.length > 1 && session.answer[1].building) {
      this.setState({
        dialog: {
          open: true,
          text: 'addLineBFirst',
          onConfirm: () => this.handleAlertDialog(false),
        },
      });
      gssData.selectedTool = 'lineB';
    }
    setGssData(gssData, session);
  };

  /** Re-renders once the chrome language's catalog lands, for a host that did not preload it. */
  relabel = () => this.forceUpdate();

  /*
   * Render the component
   * */
  render() {
    const { model, onAnswersChange, session } = this.props;
    const { showingCorrect, dialog } = this.state;
    const { answer } = session || {};
    const {
      answersCorrected,
      arrows,
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
      size,
      showKeyLegend,
      showToggle,
      title,
      titleEnabled,
      teacherInstructions,
      gssLineData,
      gssData,
    } = model || {};
    const language = this.props.language ?? model?.language;
    const i18n = catalogs.forLocale(language, this.relabel);
    const marks = answersCorrected || answer || [];
    const showRationale = model.rationale && (hasText(model.rationale) || hasMedia(model.rationale));
    const showTeacherInstructions =
      model.teacherInstructions && (hasText(model.teacherInstructions) || hasMedia(model.teacherInstructions));
    return (
      <MainContainer extraCSSRules={extraCSSRules}>
        {showTeacherInstructions && (
          <TeacherInstructions variant="teacherInstructions" language={language}>
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
            language={language}
            gssLineData={gssLineData}
            onChangeGssLineData={this.onChangeGssLineData}
            onSolutionSetSelected={this.onSolutionSetSelected}
            toolbarTools={['line', 'polygon']}
          />
        ) : (
          <Graph
            axesSettings={{ includeArrows: arrows }}
            coordinatesOnHover={coordinatesOnHover}
            defaultTool={defaultTool}
            disabled={disabled}
            disabledLabels={true}
            disabledTitle={true}
            domain={domain}
            labels={labels}
            marks={marks}
            onChangeMarks={onAnswersChange}
            onCustomReset={this.onResetClick}
            range={range}
            showLabels={labelsEnabled}
            showTitle={titleEnabled}
            size={size}
            title={title}
            language={language}
            gssLineData={gssData}
            onChangeGssLineData={this.onChangeGssLineData}
            onSolutionSetSelected={this.onSolutionSetSelected}
            toolbarTools={['line', 'polygon']}
          />
        )}
        {showKeyLegend && !showingCorrect && <KeyLegend language={language} />}
        {showRationale && (
          <Collapsible variant="rationale" language={language}>
            <PreviewPrompt prompt={rationale} />
          </Collapsible>
        )}
        <AlertDialog
          open={dialog.open}
          title={i18n.t('warningTitle')}
          text={dialog.text && i18n.t(dialog.text)}
          onClose={dialog.onClose}
          onConfirm={dialog.onConfirm}
          onConfirmText={i18n.t(dialog.confirm ?? 'confirm')}
          onCloseText={i18n.t('cancel')}
        />
      </MainContainer>
    );
  }
}

export default Main;
