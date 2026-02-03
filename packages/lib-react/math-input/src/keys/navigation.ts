// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/navigation.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { LEFT_ARROW, RIGHT_ARROW } from './chars';
import { mkSet } from './utils';

const set = mkSet('navigation');

export const left = set({ label: LEFT_ARROW, keystroke: 'Left', ariaLabel: 'Move cursor left' });

export const right = set({ label: RIGHT_ARROW, keystroke: 'Right', ariaLabel: 'Move cursor right' });
