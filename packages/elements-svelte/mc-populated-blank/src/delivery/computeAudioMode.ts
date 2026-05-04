export type AudioMode = 'feature-button' | 'controls' | 'error' | 'none';

export function computeAudioMode(params: {
  hasAudio: boolean;
  audioUrl: string | undefined;
  useFeatureButtonAudio: boolean;
}): AudioMode {
  if (!params.hasAudio) return 'none';
  if (!params.audioUrl) return 'error';
  return params.useFeatureButtonAudio ? 'feature-button' : 'controls';
}
