import type { Component } from 'svelte';
import TranscriptComponent from './Transcript.svelte';
import type { TranscriptProps } from './types.js';

const Transcript: Component<TranscriptProps> = TranscriptComponent;

export default Transcript;
export { Transcript };
export { DEFAULT_MEDIA_UI_TEXT, resolveMediaUiText } from './media-ui.js';
export { hasTranscriptContent, sanitizeTranscriptHtml } from './transcript.js';
export type { MediaUiText, TranscriptProps } from './types.js';
