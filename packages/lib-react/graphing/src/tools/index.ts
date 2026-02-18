// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { tool as point } from './point/index.js';
import { tool as circle } from './circle/index.js';
import { tool as polygon } from './polygon/index.js';
import { tool as sine } from './sine/index.js';
import { tool as parabola } from './parabola/index.js';
import { tool as line } from './line/index.js';
import { tool as segment } from './segment/index.js';
import { tool as ray } from './ray/index.js';
import { tool as vector } from './vector/index.js';
import { tool as absolute } from './absolute/index.js';
import { tool as exponential } from './exponential/index.js';

const allTools = [
  'circle',
  'line',
  'label',
  'parabola',
  'point',
  'polygon',
  'ray',
  'segment',
  'sine',
  'vector',
  'absolute',
  'exponential',
];

// need this because now we should treat label as other tools PD-3736
const labelTool = {
  type: 'label',
};

const toolsArr = [
  circle(),
  line(),
  parabola(),
  point(),
  polygon(),
  ray(),
  segment(),
  sine(),
  vector(),
  absolute(),
  exponential(),
  labelTool,
];

export { allTools, toolsArr, circle, line, point, parabola, polygon, ray, sine, vector, absolute, exponential };
