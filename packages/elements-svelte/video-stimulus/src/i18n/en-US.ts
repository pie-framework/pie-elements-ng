/** The interface strings `@pie-element/video-stimulus` renders; the source for every other locale. */
export default {
  /** Caption of a video the author gave no label. */
  videoLabel: 'Video',
  /** Accessible name of the transcript region. */
  transcriptLabel: 'Video transcript',
  /** Status shown while the video loads again after a failure. */
  retrying: 'Trying again…',
  retryingDescription: 'The browser is loading the video again.',
  /** Status shown when a caption or subtitle track fails to load. */
  trackUnavailable: 'Text track unavailable',
  trackErrorDescription: 'A text track could not be loaded. You can retry the video.',
  /** Status shown when the video cannot play. */
  videoUnavailable: 'Video unavailable',
  missingVideoSource:
    'No playable video source is available. The transcript remains available when provided.',
  videoErrorDescription:
    'Check your connection and try again. The transcript remains available when provided.',
  /** Button that loads the video again. */
  retry: 'Try again',
};
