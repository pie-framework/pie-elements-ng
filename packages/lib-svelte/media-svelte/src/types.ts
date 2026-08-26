import type { TranscriptRef } from '@pie-element/shared-types';

export interface MediaUiText {
  showTranscript: string;
  hideTranscript: string;
  viewTranscript: string;
}

export interface TranscriptProps {
  transcript?: TranscriptRef;
  label: string;
  language?: string;
  contentLanguage?: string;
  initiallyExpanded?: boolean;
  uiText?: Partial<MediaUiText>;
}
