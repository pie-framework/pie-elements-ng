// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/tools/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { tool as polygon } from './polygon/index.js';
import { tool as line } from './line/index.js';

const allTools = ['line', 'polygon'];

const toolsArr = [line(), polygon()];

export { allTools, toolsArr, line, polygon };
