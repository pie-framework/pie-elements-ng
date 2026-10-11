import type { MediaSource } from '@pie-element/shared-types';
import type {
  VideoStimulusAccessibilityProfile,
  VideoStimulusConfiguration,
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

export const model = {
  element: 'video-stimulus',
  media: {
    version: 1,
    id: '',
    kind: 'video',
    sources: [] as MediaSource[],
    label: '',
    lang: '',
  },
  language: 'en',
  presentation,
  accessibilityProfile,
} satisfies Omit<VideoStimulusModel, 'id'>;

export const configuration = {
  media: { label: 'Video media', settings: true },
  presentation: { label: 'Presentation', settings: true },
  accessibilityProfile: { label: 'Accessibility review', settings: true },
} satisfies VideoStimulusConfiguration;

export default { model, configuration };
