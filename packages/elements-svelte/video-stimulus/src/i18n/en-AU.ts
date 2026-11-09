import type { MessageCatalog } from '@pie-element/shared-i18n';

export default {
  videoLabel: 'Video',
  transcriptLabel: 'Video transcript',
  retrying: 'Trying again…',
  retryingDescription: 'The browser is loading the video again.',
  trackUnavailable: 'Text track unavailable',
  trackErrorDescription: 'A text track could not be loaded. You can retry the video.',
  videoUnavailable: 'Video unavailable',
  missingVideoSource:
    'No playable video source is available. The transcript remains available when provided.',
  videoErrorDescription:
    'Check your connection and try again. The transcript remains available when provided.',
  retry: 'Try again',
} satisfies MessageCatalog;
