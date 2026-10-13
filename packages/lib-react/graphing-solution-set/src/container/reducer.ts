// @ts-nocheck

import { combineReducers } from 'redux';
import marks from './marks.js';
import undoable from 'redux-undo';

export default () => combineReducers({ marks: undoable(marks, { debug: false }) });
