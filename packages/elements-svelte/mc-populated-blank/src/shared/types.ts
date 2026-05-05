import type { LayoutLimits } from './layoutLimits';

export type McpbChoiceMode = 'text' | 'image';
export type McpbInteractionMode = 'populate_blank' | 'audio_mc_only';
export type McpbDeliveryMode = 'gather' | 'view' | 'evaluate' | 'authoring' | 'print';
export type McpbRole = 'student' | 'instructor';
export type McpbCorrectness = 'correct' | 'incorrect' | 'unanswered';

export interface McpbChoice {
  id: string;
  labelHtml?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface McpbAudioButtonSkin {
  silentUrl: string;
  playingUrl: string;
}

export interface McpbUiText {
  answerChoices?: string;
  selectedAnswerInSentence?: string;
  showCorrectAnswer?: string;
  hideCorrectAnswer?: string;
  clickToEnableAutoplay?: string;
  audioResourceUnavailable?: string;
  transcriptLabel?: string;
  listenLabelEn?: string;
  listenLabelEs?: string;
  listenSilentAlt?: string;
  listenPlayingAlt?: string;
  listenSilentAltEs?: string;
  listenPlayingAltEs?: string;
}

export interface McpbQuestion {
  id?: string;
  element?: string;
  prompt?: string;
  promptEnabled?: boolean;
  interactionMode?: McpbInteractionMode;
  layoutProfile?: string;
  choiceLayout?: string;
  layoutProfilePresets?: Record<string, Partial<LayoutLimits>>;
  layoutLimits?: Partial<LayoutLimits>;
  audioButtonSkin?: McpbAudioButtonSkin | null;
  audioButtonSkinsByLocale?: Record<string, McpbAudioButtonSkin>;
  uiText?: McpbUiText;
  sentenceHtml?: string;
  template?: string;
  choiceMode?: McpbChoiceMode;
  choices?: McpbChoice[];
  correctChoiceId?: string;
  hasAudio?: boolean;
  autoplayAudioEnabled?: boolean;
  completeAudioEnabled?: boolean;
  audioUrl?: string;
  audioTranscript?: string;
  showVisibleTranscript?: boolean;
  useFeatureButtonAudio?: boolean;
  locale?: string;
  shuffle?: boolean;
  lockChoiceOrder?: boolean;
  teacherInstructions?: string;
  teacherInstructionsEnabled?: boolean;
  customType?: string;
}

export interface McpbSession {
  id?: string;
  element?: string;
  choiceId?: string;
  audioStartTime?: number;
  audioEndTime?: number;
  shuffledValues?: string[];
  data?: { shuffledValues?: string[] };
}

export interface McpbEnv {
  mode?: McpbDeliveryMode;
  role?: McpbRole;
  ['@pie-element']?: { lockChoiceOrder?: boolean };
}
