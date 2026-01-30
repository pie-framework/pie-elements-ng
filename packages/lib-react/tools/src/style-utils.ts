// @ts-nocheck
/**
 * @synced-from pie-lib/packages/tools/src/style-utils.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
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
