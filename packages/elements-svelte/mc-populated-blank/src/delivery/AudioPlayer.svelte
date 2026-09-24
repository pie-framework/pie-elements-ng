<script lang="ts">
import { computeAudioMode } from './computeAudioMode';
import { t } from './i18n';

interface AudioButtonSkin {
  silentUrl: string;
  playingUrl: string;
}

const AUDIO_PLAYBACK = {
  IDLE: 'idle',
  PLAYING: 'playing',
  BLOCKED: 'blocked',
  PAUSED: 'paused',
} as const;
type AudioPlaybackState = (typeof AUDIO_PLAYBACK)[keyof typeof AUDIO_PLAYBACK];

let {
  hasAudio = false,
  audioUrl,
  useFeatureButtonAudio = false,
  autoplayEnabled = false,
  featureAudioSkin,
  language,
  onaudiostarted,
  onaudioended,
}: {
  hasAudio?: boolean;
  audioUrl?: string;
  useFeatureButtonAudio?: boolean;
  autoplayEnabled?: boolean;
  featureAudioSkin: AudioButtonSkin;
  language?: string;
  onaudiostarted?: () => void;
  onaudioended?: () => void;
} = $props();

let audioEl = $state<HTMLAudioElement | null>(null);
let featureAudioButtonEl = $state<HTMLButtonElement | null>(null);
let autoplayEnableButtonEl = $state<HTMLButtonElement | null>(null);
let audioPlaybackState = $state<AudioPlaybackState>(AUDIO_PLAYBACK.IDLE);

const audioMode = $derived(computeAudioMode({ hasAudio, audioUrl, useFeatureButtonAudio }));
const isMediaPlaying = $derived(audioPlaybackState === AUDIO_PLAYBACK.PLAYING);
const autoPlayPromptOpen = $derived(audioPlaybackState === AUDIO_PLAYBACK.BLOCKED);
const audioErrorMessage = $derived(
  audioMode === 'error' ? t('audioResourceUnavailable', language) : ''
);

// Reset playback state when audioUrl changes so autoplay re-fires for a new question.
$effect(() => {
  audioUrl;
  audioPlaybackState = AUDIO_PLAYBACK.IDLE;
});

function playFeatureAudio() {
  if (audioMode !== 'none' && audioMode !== 'error' && audioEl) {
    audioEl.play().catch(() => {});
  }
}

function handleEnableAutoplayClick() {
  if (audioMode !== 'none' && audioMode !== 'error' && audioEl) {
    audioEl.play().finally(() => {
      if (audioPlaybackState === AUDIO_PLAYBACK.BLOCKED) audioPlaybackState = AUDIO_PLAYBACK.PAUSED;
    });
  }
}

function useListener<K extends keyof HTMLElementEventMap>(
  getEl: () => EventTarget | null | undefined,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void
) {
  $effect(() => {
    const el = getEl();
    if (!el) return;
    el.addEventListener(event, handler as EventListener);
    return () => el.removeEventListener(event, handler as EventListener);
  });
}

useListener(
  () => audioEl,
  'playing',
  () => {
    audioPlaybackState = AUDIO_PLAYBACK.PLAYING;
    onaudiostarted?.();
  }
);

useListener(
  () => audioEl,
  'ended',
  () => {
    audioPlaybackState = AUDIO_PLAYBACK.PAUSED;
    onaudioended?.();
  }
);

useListener(
  () => featureAudioButtonEl,
  'click',
  () => playFeatureAudio()
);
useListener(
  () => autoplayEnableButtonEl,
  'click',
  () => handleEnableAutoplayClick()
);

$effect(() => {
  if (!autoplayEnabled || audioMode === 'none' || audioMode === 'error') return;
  if (audioPlaybackState !== AUDIO_PLAYBACK.IDLE) return;
  if (audioEl && audioUrl) {
    audioPlaybackState = AUDIO_PLAYBACK.PAUSED;
    audioEl.play().catch(() => {
      audioPlaybackState = AUDIO_PLAYBACK.BLOCKED;
    });
  }
});
</script>

{#if audioMode !== 'none'}
  <div class="mb-4 audio-container pie-audio-container">
    {#if audioMode === 'feature-button'}
      <audio
        bind:this={audioEl}
        class="sr-only pie-audio-player"
        preload="metadata"
        src={audioUrl}
        aria-hidden="true"
        tabindex="-1"
      ></audio>
      <button
        bind:this={featureAudioButtonEl}
        class="listen-button pie-listen-button rli-feature-audio"
        type="button"
        aria-label={t('listen', language)}
      >
        <img
          class={`listen-feature-icon pie-listen-icon rli-feature-listen ${isMediaPlaying ? '' : 'listen-active'}`}
          src={featureAudioSkin.silentUrl}
          alt={t('listenSilentAlt', language)}
        />
        <img
          class={`listen-feature-icon pie-listen-icon rli-feature-listen ${isMediaPlaying ? 'listen-active' : ''}`}
          src={featureAudioSkin.playingUrl}
          alt={t('listenPlayingAlt', language)}
        />
      </button>
    {:else if audioMode === 'controls'}
      <audio
        bind:this={audioEl}
        controls
        class="w-full max-w-md pie-audio-player"
        preload="metadata"
        src={audioUrl}
      >
        <track kind="captions" />
      </audio>
      {#if autoPlayPromptOpen}
        <button
          bind:this={autoplayEnableButtonEl}
          class="mt-2 text-sm underline pie-audio-autoplay-enable"
          type="button"
        >
          {t('clickToEnableAutoplay', language)}
        </button>
      {/if}
    {:else if audioMode === 'error'}
      <p class="text-sm text-red-700 pie-audio-error" role="alert">{audioErrorMessage}</p>
    {/if}
  </div>
{/if}

<style>
  .listen-button {
    width: var(--mpb-listen-button-size, 128px);
    height: var(--mpb-listen-button-size, 128px);
    border: 0;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
    z-index: 1;
  }

  .listen-button:hover {
    background-color: #e2f1fe;
  }

  .listen-feature-icon {
    width: var(--mpb-listen-button-size, 128px);
    height: var(--mpb-listen-button-size, 128px);
    object-fit: contain;
    display: none;
  }

  .listen-feature-icon.listen-active {
    display: block;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
