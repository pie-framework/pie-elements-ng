// @ts-nocheck

import { tool as polygon } from './polygon/index.js';
import { tool as line } from './line/index.js';

const allTools = ['line', 'polygon'];

const toolsArr = [line(), polygon()];

export { allTools, toolsArr, line, polygon };
