<script lang="ts">
import type { AudioMode } from './computeAudioMode';

interface AudioButtonSkin {
  silentUrl: string;
  playingUrl: string;
}

interface UiText {
  clickToEnableAutoplay: string;
  transcriptLabel: string;
  audioResourceUnavailable: string;
  listenSilentAlt?: string;
  listenPlayingAlt?: string;
  listenSilentAltEs?: string;
  listenPlayingAltEs?: string;
}

let {
  audioMode,
  audioUrl,
  audioTranscript,
  showVisibleTranscript,
  transcriptId,
  featureAudioSkin,
  autoPlayPromptOpen,
  isMediaPlaying,
  audioErrorMessage,
  uiText,
  locale = '',
  audioEl = $bindable(null),
  featureAudioButtonEl = $bindable(null),
  autoplayEnableButtonEl = $bindable(null),
}: {
  audioMode: AudioMode;
  audioUrl: string | undefined;
  audioTranscript: string | undefined;
  showVisibleTranscript: boolean;
  transcriptId: string;
  featureAudioSkin: AudioButtonSkin;
  autoPlayPromptOpen: boolean;
  isMediaPlaying: boolean;
  audioErrorMessage: string;
  uiText: UiText;
  locale?: string;
  audioEl?: HTMLAudioElement | null;
  featureAudioButtonEl?: HTMLButtonElement | null;
  autoplayEnableButtonEl?: HTMLButtonElement | null;
} = $props();

function speechButtonLabel(loc = '') {
  return loc.toLowerCase().startsWith('es') ? 'Escuchar' : 'Listen';
}

function silentAlt(loc = '') {
  return loc.toLowerCase().startsWith('es')
    ? (uiText.listenSilentAltEs ?? 'Escuchar. Repetir las instrucciones.')
    : (uiText.listenSilentAlt ?? 'Repeat instructions');
}

function playingAlt(loc = '') {
  return loc.toLowerCase().startsWith('es')
    ? (uiText.listenPlayingAltEs ?? 'Escuchar. Estas son las instrucciones.')
    : (uiText.listenPlayingAlt ?? 'Instructions are playing');
}
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
        aria-label={speechButtonLabel(locale)}
      >
        <img
          class={`listen-feature-icon pie-listen-icon rli-feature-listen ${isMediaPlaying ? '' : 'listen-active'}`}
          src={featureAudioSkin.silentUrl}
          alt={silentAlt(locale)}
        />
        <img
          class={`listen-feature-icon pie-listen-icon rli-feature-listen ${isMediaPlaying ? 'listen-active' : ''}`}
          src={featureAudioSkin.playingUrl}
          alt={playingAlt(locale)}
        />
      </button>
    {:else if audioMode === 'controls'}
      <audio
        bind:this={audioEl}
        controls
        class="w-full max-w-md pie-audio-player"
        preload="metadata"
        src={audioUrl}
        aria-describedby={audioTranscript ? transcriptId : undefined}
      >
        <track kind="captions" />
      </audio>
      {#if autoPlayPromptOpen}
        <button
          bind:this={autoplayEnableButtonEl}
          class="mt-2 text-sm underline pie-audio-autoplay-enable"
          type="button"
        >
          {uiText.clickToEnableAutoplay}
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
