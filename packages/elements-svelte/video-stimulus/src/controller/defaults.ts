import type {
  VideoStimulusAccessibilityProfile,
  VideoStimulusModel,
  VideoStimulusPresentation,
} from '../types.js';

export const presentation: Required<VideoStimulusPresentation> = {
  showLabel: true,
  showDescription: true,
  transcriptInitiallyExpanded: false,
};

export const accessibilityProfile: Required<VideoStimulusAccessibilityProfile> = {
  audioContent: 'unknown',
  captionSupport: 'unknown',
  visualSupport: 'unknown',
};

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
  presentation,
  accessibilityProfile,
};

export const configuration = {
  media: { label: 'Video media', settings: true },
  presentation: { label: 'Presentation', settings: true },
  accessibilityProfile: { label: 'Accessibility review', settings: true },
};

export default { model, configuration };
