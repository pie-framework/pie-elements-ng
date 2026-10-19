// @ts-nocheck

import StyledEditor, { EditableHtml } from './components/EditableHtml.js';
import { ALL_PLUGINS, DEFAULT_PLUGINS } from './extensions/index.js';
import { deleteInlineDropdownByIndex } from './components/respArea/inlineDropdownUtils.js';
import { flushPendingEditorSaves } from './pending-save.js';
export { EditableHtml, ALL_PLUGINS, DEFAULT_PLUGINS, deleteInlineDropdownByIndex, flushPendingEditorSaves };
export default StyledEditor;
