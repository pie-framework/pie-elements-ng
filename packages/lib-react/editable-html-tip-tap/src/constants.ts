// @ts-nocheck

import { color } from '@pie-lib/render-ui';

export const PIE_TOOLBAR__CLASS = 'pie-toolbar';

// The fill of every editing toolbar. --editable-html-toolbar-bg is the host's override.
export const TOOLBAR_BACKGROUND = `var(--editable-html-toolbar-bg, ${color.editorToolbar()})`;

export default {
  PIE_TOOLBAR__CLASS,
};
