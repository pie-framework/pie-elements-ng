// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/tools/index.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { tool as polygon } from './polygon';
import { tool as line } from './line';

const allTools = ['line', 'polygon'];

const toolsArr = [line(), polygon()];

export { allTools, toolsArr, line, polygon };
