import type { Component } from 'svelte';
import EditableHtmlComponent from './EditableHtml.svelte';
import type { EditableHtmlProps } from './types.js';

export type { EditableHtmlProps } from './types.js';

// Typed through a `.ts` props type so the emitted declarations reference no `.svelte` file:
// `dist` ships the compiled component only.
export const EditableHtml: Component<EditableHtmlProps> = EditableHtmlComponent;
