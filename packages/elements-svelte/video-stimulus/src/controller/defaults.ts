import type { VideoStimulusModel } from '../types.js';

export const model: VideoStimulusModel = {
  element: 'video-stimulus',
  media: {
    version: 1,
    id: '',
    kind: 'video',
    sources: [],
    label: '',
    lang: '',
  },
  language: 'en',
  presentation: {
    showLabel: true,
    showDescription: true,
    transcriptInitiallyExpanded: false,
  },
  accessibilityProfile: {
    audioContent: 'unknown',
    captionSupport: 'unknown',
    visualSupport: 'unknown',
  },
};

export const configuration = {
  media: { label: 'Video media', settings: true },
  presentation: { label: 'Presentation', settings: true },
  accessibilityProfile: { label: 'Accessibility review', settings: true },
};

export default { model, configuration };
