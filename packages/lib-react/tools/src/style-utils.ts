// @ts-nocheck
/**
 * @synced-from pie-lib/packages/tools/src/style-utils.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { noSelect } from '@pie-lib/style-utils';

export { noSelect };

export const strokeColor = (theme) => `var(--ruler-stroke, ${theme.palette.primary.main})`;

export const fillColor = (theme) => `var(--ruler-bg, ${theme.palette.primary.contrastText})`;
