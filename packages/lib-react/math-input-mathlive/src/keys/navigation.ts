// @ts-nocheck

import { LEFT_ARROW, RIGHT_ARROW } from './chars.js';
import { mkSet } from './utils.js';

const set = mkSet('navigation');

export const left = set({ label: LEFT_ARROW, keystroke: 'Left', ariaLabel: 'Move cursor left' });

export const right = set({ label: RIGHT_ARROW, keystroke: 'Right', ariaLabel: 'Move cursor right' });
