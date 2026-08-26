<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
    },
  }}
/>

<script module lang="ts">
let instanceNumber = 0;
</script>

<script lang="ts">
  import { Transcript, hasTranscriptContent } from '@pie-lib/media-svelte';
  import { resolveVideoStimulusUiText } from '../i18n.js';
  import type { VideoStimulusViewModel } from '../types.js';

  type FailureKind = 'media' | 'track' | 'configuration';
  type MediaFailure = {
    kind: FailureKind;
    detail?: string;
  };


  let { model }: { model?: VideoStimulusViewModel } = $props();
  let videoElement = $state<HTMLVideoElement>();
  let retryButton = $state<HTMLButtonElement>();
  let failure = $state<MediaFailure | null>(null);
  let failedTrackLabels = $state<string[]>([]);
  let retrying = $state(false);
  let previousMediaSignature = $state<string | null>(null);

  const media = $derived(model?.media);
  const sources = $derived(media?.sources ?? []);
  const tracks = $derived(media?.tracks ?? []);
  const transcript = $derived(media?.transcript);
  const messages = $derived(resolveVideoStimulusUiText(model?.language, model?.uiText));
  const hasTranscript = $derived.by(() => {
    try {
      return hasTranscriptContent(transcript);
    } catch {
      return Boolean(transcript?.html || transcript?.plainText || transcript?.src);
    }
  });
  const label = $derived(media?.label || messages.videoLabel);
  const transcriptLabel = $derived(messages.transcriptLabel);
  const description = $derived(media?.description);
  const showLabel = $derived(model?.presentation.showLabel !== false);
  const showDescription = $derived(model?.presentation.showDescription !== false);
  const descriptionVisible = $derived(Boolean(showDescription && description));
  const mediaSignature = $derived(
    JSON.stringify({
      sources,
      tracks,
      poster: media?.poster ?? '',
    })
  );
  const displayedFailure = $derived<MediaFailure | null>(
    failure ??
      (failedTrackLabels.length > 0
        ? { kind: 'track', detail: failedTrackLabels.join(', ') }
        : sources.length === 0
          ? { kind: 'configuration' }
          : null)
  );

  const instanceId = `video-stimulus-${++instanceNumber}`;
  const labelId = `${instanceId}-label`;
  const descriptionId = `${instanceId}-description`;

  function failureTitle(currentFailure: MediaFailure): string {
    if (retrying) return messages.retrying;
    if (currentFailure.kind === 'track') return messages.trackUnavailable;
    return messages.videoUnavailable;
  }

  function failureDescription(currentFailure: MediaFailure): string {
    if (retrying) return messages.retryingDescription;
    if (currentFailure.kind === 'track') {
      return currentFailure.detail
        ? `${messages.trackErrorDescription} (${currentFailure.detail})`
        : messages.trackErrorDescription;
    }
    if (currentFailure.kind === 'configuration') return messages.missingVideoSource;
    return messages.videoErrorDescription;
  }

  function reportMediaFailure(): void {
    retrying = false;
    failure = { kind: 'media' };
  }

  function reportTrackFailure(trackLabel: string): void {
    retrying = false;
    if (!failedTrackLabels.includes(trackLabel)) {
      failedTrackLabels = [...failedTrackLabels, trackLabel];
    }
  }

  function focusVideoBeforeRemovingRetry(): void {
    if (retryButton && document.activeElement === retryButton) videoElement?.focus();
  }

  function clearMediaFailure(): void {
    retrying = false;
    if (failure && failedTrackLabels.length === 0) focusVideoBeforeRemovingRetry();
    failure = null;
  }

  function clearTrackFailure(trackLabel: string): void {
    if (!failedTrackLabels.includes(trackLabel)) return;
    const remaining = failedTrackLabels.filter((label) => label !== trackLabel);
    if (remaining.length === 0 && failure === null) focusVideoBeforeRemovingRetry();
    failedTrackLabels = remaining;
    retrying = false;
  }

  function retry(): void {
    if (!videoElement) return;
    retrying = true;
    try {
      videoElement.load();
    } catch {
      retrying = false;
      failure = { kind: 'media' };
    }
  }

  $effect(() => {
    const signature = mediaSignature;
    const currentVideo = videoElement;
    if (!currentVideo) return;
    if (previousMediaSignature !== null && previousMediaSignature !== signature) {
      failure = null;
      failedTrackLabels = [];
      retrying = false;
      try {
        currentVideo.load();
      } catch {
        failure = { kind: 'media' };
      }
    }
    previousMediaSignature = signature;
  });
</script>

<section class="video-stimulus" aria-labelledby={labelId} lang={model?.language}>
  <figure class="video-figure">
    <figcaption
      id={labelId}
      class:visually-hidden={!showLabel}
      class="video-caption"
      lang={media?.lang}
    >
      {label}
    </figcaption>

    {#if descriptionVisible}
      <p id={descriptionId} class="video-description" lang={media?.lang}>{description}</p>
    {/if}

    {#if hasTranscript && transcript && model}
      <div class="transcript-container">
        <Transcript
          {transcript}
          initiallyExpanded={model.presentation.transcriptInitiallyExpanded}
          uiText={model.uiText}
          label={transcriptLabel}
          language={model.language}
          contentLanguage={media?.lang}
        />
      </div>
    {/if}

    {#if sources.length > 0}
      <div class="video-frame">
        <video
          bind:this={videoElement}
          controls
          playsinline
          preload="metadata"
          poster={media?.poster}
          lang={media?.lang}
          aria-describedby={descriptionVisible ? descriptionId : undefined}
          onerror={reportMediaFailure}
          onloadeddata={clearMediaFailure}
          oncanplay={clearMediaFailure}
        >
          {#each sources as source (source.src)}
            <source src={source.src} type={source.type} />
          {/each}
          {#each tracks as track, index (`${index}:${track.src}:${track.kind}:${track.lang}:${track.label}`)}
            <track
              src={track.src}
              kind={track.kind}
              srclang={track.lang}
              label={track.label}
              default={track.default === true}
              onload={() => clearTrackFailure(track.label)}
              onerror={() => reportTrackFailure(track.label)}
            />
          {/each}
        </video>
      </div>
    {/if}

    {#if displayedFailure}
      <div class="media-status" role="alert" aria-atomic="true">
        <span class="status-icon" aria-hidden="true">!</span>
        <div class="status-copy">
          <strong>{failureTitle(displayedFailure)}</strong>
          <span>{failureDescription(displayedFailure)}</span>
        </div>
        {#if videoElement}
          <button bind:this={retryButton} class="retry-button" type="button" onclick={retry}>
            {messages.retry}
          </button>
        {/if}
      </div>
    {/if}
  </figure>
</section>

<style>
  .video-stimulus,
  .video-stimulus * {
    box-sizing: border-box;
  }

  .video-stimulus {
    width: min(100%, var(--video-stimulus-max-width, 52rem));
    margin: 0 auto;
    padding: var(--video-stimulus-padding, clamp(1rem, 4vw, 2rem));
    color: var(--pie-text);
    font-family: inherit;
  }

  .video-figure {
    margin: 0;
  }

  .video-caption {
    margin: 0 0 0.5rem;
    color: var(--pie-text);
    font-size: var(--video-stimulus-label-size, clamp(1.25rem, 2.5vw, 1.7rem));
    font-weight: 700;
    line-height: 1.25;
  }

  .video-description {
    max-width: 68ch;
    margin: 0 0 1rem;
    color: var(--pie-tertiary);
    line-height: 1.6;
  }

  .transcript-container {
    margin-bottom: 1rem;
  }

  .video-frame {
    overflow: hidden;
    border: 1px solid var(--pie-border-light);
    border-radius: var(--video-stimulus-border-radius, 0.75rem);
    background: var(--pie-background-dark);
  }

  video {
    display: block;
    width: 100%;
    max-width: 100%;
    max-height: var(--video-stimulus-max-height, 70vh);
    aspect-ratio: var(--video-stimulus-aspect-ratio, 16 / 9);
    background: var(--pie-background-dark);
    object-fit: contain;
  }

  .media-status {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-top: 0.875rem;
    padding: 0.875rem;
    border: 1px solid var(--pie-incorrect-icon);
    border-radius: var(--video-stimulus-border-radius, 0.75rem);
    background: var(--pie-incorrect-secondary);
    color: var(--pie-text);
  }

  .status-icon {
    display: grid;
    flex: 0 0 1.875rem;
    width: 1.875rem;
    height: 1.875rem;
    place-items: center;
    border-radius: 50%;
    background: var(--pie-incorrect-icon);
    color: var(--pie-white);
    font-weight: 800;
  }

  .status-copy {
    flex: 1;
    min-width: 0;
    line-height: 1.45;
  }

  .status-copy strong,
  .status-copy span {
    display: block;
  }

  .status-copy span {
    margin-top: 0.25rem;
  }

  .retry-button {
    flex: 0 0 auto;
    min-width: 44px;
    min-height: 44px;
    border: 1px solid var(--pie-incorrect-icon);
    border-radius: 0.5rem;
    background: var(--pie-white);
    color: var(--pie-text);
    padding: 0.5rem 0.875rem;
    cursor: pointer;
    font: inherit;
    font-weight: 650;
  }

  .retry-button:hover {
    background: var(--pie-background-dark);
  }

  .retry-button:focus-visible {
    outline: 3px solid
      var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border)));
    outline-offset: 3px;
  }

  .visually-hidden {
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

  @media (max-width: 32rem) {
    .media-status {
      align-items: stretch;
      flex-direction: column;
    }

    .retry-button {
      width: 100%;
    }
  }
</style>
