// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/container/index.jsx
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { connect } from 'react-redux';
import React from 'react';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import reducer from './reducer';
import { changeMarks } from './actions';
import PropTypes from 'prop-types';
import { isEqual } from 'lodash-es';
import { ActionCreators } from 'redux-undo';
import GraphWithControls from '../graph-with-controls';
import { lastActionMiddleware } from './middleware';

const mapStateToProps = (s) => ({
  marks: s.marks.present,
});

const mapDispatchToProps = (dispatch) => ({
  onChangeMarks: (m) => dispatch(changeMarks(m)),
  onUndo: () => dispatch(ActionCreators.undo()),
  onRedo: () => dispatch(ActionCreators.redo()),
  onReset: () => dispatch(changeMarks([])),
});

export const GraphContainer = connect(mapStateToProps, mapDispatchToProps)(GraphWithControls);

/**
 * The graph component entry point with undo/redo
 * Redux is an implementation detail, hide it in the react component.
 */
class Root extends React.Component {
  static propTypes = {
    onChangeMarks: PropTypes.func,
    marks: PropTypes.array,
  };

  constructor(props) {
    super(props);

    const r = reducer();
    this.store = createStore(r, { marks: props.marks }, applyMiddleware(lastActionMiddleware));

    this.store.subscribe(this.onStoreChange);
  }

  componentDidUpdate(prevProps) {
    const { marks } = this.props;
    const storeState = this.store.getState();

    if (isEqual(storeState.marks.present, marks)) {
      return;
    }

    if (!isEqual(prevProps.marks, marks)) {
      this.store.dispatch(changeMarks(marks));
    }
  }

  onStoreChange: any = () => {
    const { marks, onChangeMarks } = this.props;
    const storeState = this.store.getState();

    if (!isEqual(storeState.marks.present, marks)) {
      onChangeMarks(storeState.marks.present);
    }
  };

  render() {
    // eslint-disable-next-line no-unused-vars
    const { onChangeMarks, marks, ...rest } = this.props;
    const correctnessSet = marks && marks.find((m) => m.correctness);

    if (correctnessSet) {
      return <GraphWithControls {...rest} marks={marks} disabled={correctnessSet} />;
    }

    return (
      <Provider store={this.store}>
        <GraphContainer {...rest} />
      </Provider>
    );
  }
}

export default Root;
