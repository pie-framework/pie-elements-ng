import type { MediaUiText, TranscriptRef } from '@pie-element/shared-types';

export type { MediaUiText };

export interface TranscriptProps {
  transcript?: TranscriptRef;
  label: string;
  language?: string;
  contentLanguage?: string;
  initiallyExpanded?: boolean;
  uiText?: Partial<MediaUiText>;
}
