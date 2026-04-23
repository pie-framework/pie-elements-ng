// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/container/reducer.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { combineReducers } from 'redux';
import marks from './marks.js';
import undoable from 'redux-undo';

export default () => combineReducers({ marks: undoable(marks, { debug: false }) });
