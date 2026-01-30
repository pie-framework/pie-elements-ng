// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/container/reducer.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { combineReducers } from 'redux';
import marks from './marks';
import undoable from 'redux-undo';

export default () => combineReducers({ marks: undoable(marks, { debug: false }) });
