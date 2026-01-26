<script lang="ts">
/**
 * Media Component
 *
 * WCAG 2.2 Level AA compliant media player
 * Maps to QTI mediaInteraction
 */

import { formatTime, recordEvent, updatePlaybackTime } from './media.controller.js';
import type { MediaComponentProps, PlaybackEvent } from './media.types.js';

let {
  model,
  session = $bindable(),
  evaluation,
  env,
  onSessionChange,
  onDurationChange,
}: MediaComponentProps = $props();

// Media element reference
let mediaElement: HTMLVideoElement | HTMLAudioElement | undefined = $state();

// Playback state
let currentTime = $state(0);
let duration = $state(0);
let _isPlaying = $state(false);
let playbackRate = $state(1);

// Reactive computed values
const isDisabled = $derived(env.mode === 'view');
const _showRationale = $derived(
  env.mode === 'evaluate' && env.role === 'instructor' && model.rationaleEnabled && model.rationale
);
const _showEvaluation = $derived(env.mode === 'evaluate' && evaluation);

// Initialize session if needed
$effect(() => {
  if (!session.played && !session.events) {
    session = {
      played: false,
      completed: false,
      totalTimePlayed: 0,
      highestTimeReached: 0,
      playCount: 0,
      pauseCount: 0,
      seekCount: 0,
      events: model.trackPlayback ? [] : undefined,
    };
  }
});

// Unique IDs for accessibility
const _mediaId = $derived(`media-${model.id}`);
const _promptId = $derived(`media-prompt-${model.id}`);
const _statusId = $derived(`media-status-${model.id}`);

/**
 * Records an event and updates session
 */
function handleEvent(type: PlaybackEvent['type']) {
  if (isDisabled) return;

  const currentMediaTime = mediaElement?.currentTime || 0;

  const event: PlaybackEvent = {
    type,
    timestamp: Date.now(),
    currentTime: currentMediaTime,
  };

  let updatedSession = recordEvent(session, event);

  // Update playback time with current media element time
  if (mediaElement && duration > 0) {
    updatedSession = updatePlaybackTime(updatedSession, currentMediaTime, duration);
  }

  session = updatedSession;
  onSessionChange(session);
}

/**
 * Handle play event
 */
function _handlePlay() {
  _isPlaying = true;
  handleEvent('play');
}

/**
 * Handle pause event
 */
function _handlePause() {
  _isPlaying = false;
  handleEvent('pause');
}

/**
 * Handle ended event
 */
function _handleEnded() {
  _isPlaying = false;
  handleEvent('ended');
}

/**
 * Handle seeked event
 */
function _handleSeeked() {
  handleEvent('seeked');
}

/**
 * Handle time update
 */
function _handleTimeUpdate() {
  if (!mediaElement) return;

  currentTime = mediaElement.currentTime;

  // Update session with playback time
  const updatedSession = updatePlaybackTime(session, currentTime, duration);
  session = updatedSession;
  onSessionChange(session);
}

/**
 * Handle duration change
 */
function _handleDurationChange() {
  if (!mediaElement) return;
  duration = mediaElement.duration;
  onDurationChange?.(duration);
}

/**
 * Handle playback rate change
 */
function _handleRateChange() {
  if (!mediaElement) return;
  playbackRate = mediaElement.playbackRate;

  // Enforce max playback rate
  if (model.maxPlaybackRate && playbackRate > model.maxPlaybackRate) {
    mediaElement.playbackRate = model.maxPlaybackRate;
    playbackRate = model.maxPlaybackRate;
  }
}

/**
 * Handle seeking (prevent if disabled)
 */
function _handleSeeking() {
  if (model.disableSeeking && mediaElement) {
    // Prevent seeking by resetting to last valid position
    mediaElement.currentTime = session.highestTimeReached || 0;
  }
}

// Progress percentage
const _progressPercentage = $derived(() => {
  if (duration === 0) return 0;
  return (currentTime / duration) * 100;
});

// Formatted times
const _formattedCurrentTime = $derived(formatTime(currentTime));
const _formattedDuration = $derived(formatTime(duration));

// Evaluation status class
const _evaluationClass = $derived(() => {
  if (!evaluation) return '';
  return evaluation.complete ? 'complete' : 'incomplete';
});
</script>

<div
	class="pie-media"
	class:audio={model.mediaType === 'audio'}
	class:video={model.mediaType === 'video'}
	class:disabled={isDisabled}
	class:evaluated={_showEvaluation}
>
	{#if model.promptEnabled && model.prompt}
		<div id={_promptId} class="prompt">
			{@html model.prompt}
		</div>
	{/if}

	<div class="media-container">
		{#if model.mediaType === 'video'}
			<!-- Video element -->
			<video
				bind:this={mediaElement}
				id={_mediaId}
				class="media-element"
				poster={model.poster}
				controls={model.showControls !== false}
				autoplay={model.autoplay}
				loop={model.loop}
				aria-labelledby={model.promptEnabled && model.prompt ? _promptId : undefined}
				aria-label={!model.promptEnabled || !model.prompt ? 'Video player' : undefined}
				aria-describedby={_showEvaluation ? _statusId : undefined}
				onplay={_handlePlay}
				onpause={_handlePause}
				onended={_handleEnded}
				onseeked={_handleSeeked}
				onseeking={_handleSeeking}
				ontimeupdate={_handleTimeUpdate}
				ondurationchange={_handleDurationChange}
				onratechange={_handleRateChange}
			>
				{#each model.sources as source}
					<source src={source.src} type={source.type} />
				{/each}

				{#if model.captions}
					<track
						kind="captions"
						src={model.captions}
						srclang={model.captionsLanguage || 'en'}
						label={model.captionsLabel || 'English'}
						default
					/>
				{/if}

				<p class="fallback-message">
					Your browser does not support the video element. Please use a modern browser.
				</p>
			</video>
		{:else}
			<!-- Audio element -->
			<audio
				bind:this={mediaElement}
				id={_mediaId}
				class="media-element"
				controls={model.showControls !== false}
				autoplay={model.autoplay}
				loop={model.loop}
				aria-labelledby={model.promptEnabled && model.prompt ? _promptId : undefined}
				aria-label={!model.promptEnabled || !model.prompt ? 'Audio player' : undefined}
				aria-describedby={_showEvaluation ? _statusId : undefined}
				onplay={_handlePlay}
				onpause={_handlePause}
				onended={_handleEnded}
				onseeked={_handleSeeked}
				onseeking={_handleSeeking}
				ontimeupdate={_handleTimeUpdate}
				ondurationchange={_handleDurationChange}
				onratechange={_handleRateChange}
			>
				{#each model.sources as source}
					<source src={source.src} type={source.type} />
				{/each}

				{#if model.captions}
					<track
						kind="captions"
						src={model.captions}
						srclang={model.captionsLanguage || 'en'}
						label={model.captionsLabel || 'English'}
						default
					/>
				{/if}

				<p class="fallback-message">
					Your browser does not support the audio element. Please use a modern browser.
				</p>
			</audio>
		{/if}

		<!-- Playback info -->
		<div class="playback-info" aria-live="polite" aria-atomic="true">
			<span class="time-display">
				{_formattedCurrentTime} / {_formattedDuration}
			</span>
			{#if model.requireCompletion || model.minPlayedPercentage}
				<span class="requirement-info">
					{#if model.requireCompletion}
						<span class="requirement">Must watch to completion</span>
					{/if}
					{#if model.minPlayedPercentage}
						<span class="requirement">
							Minimum {model.minPlayedPercentage}% required
						</span>
					{/if}
				</span>
			{/if}
		</div>

		<!-- Progress indicator (if requirements exist) -->
		{#if model.requireCompletion || model.minPlayedPercentage}
			<div class="progress-bar" role="progressbar" aria-label="Media playback progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={_progressPercentage()}>
				<div class="progress-fill" style="width: {_progressPercentage()}%"></div>
				{#if model.minPlayedPercentage}
					<div class="progress-threshold" style="left: {model.minPlayedPercentage}%"></div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Evaluation feedback -->
	{#if _showEvaluation && evaluation}
		<div id={_statusId} class="response-indicator {_evaluationClass()}" role="status" aria-live="polite">
			{#if evaluation.complete}
				<span class="status-icon">✓</span>
				<span class="status-text">Requirements met</span>
			{:else}
				<span class="status-icon">○</span>
				<span class="status-text">Requirements not met</span>
			{/if}

			{#if evaluation.percentagePlayed !== undefined}
				<span class="percentage">
					{evaluation.percentagePlayed.toFixed(1)}% played
				</span>
			{/if}
		</div>
	{/if}

	<!-- Rationale (instructor only) -->
	{#if _showRationale}
		<div class="rationale">
			<strong>Rationale:</strong>
			{@html model.rationale}
		</div>
	{/if}
</div>

<style>
	.pie-media {
		font-family: system-ui, -apple-system, sans-serif;
		max-width: 800px;
		margin: 0 auto;
	}

	.prompt {
		margin-bottom: 1rem;
		font-size: 1rem;
		line-height: 1.5;
	}

	.media-container {
		margin: 1rem 0;
	}

	.media-element {
		width: 100%;
		max-width: 100%;
		background-color: #000;
		border-radius: 0.5rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.media-element:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.fallback-message {
		padding: 2rem;
		text-align: center;
		color: #6b7280;
		background-color: #f3f4f6;
	}

	/* Playback info */
	.playback-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.time-display {
		font-weight: 500;
		font-variant-numeric: tabular-nums;
	}

	.requirement-info {
		display: flex;
		gap: 0.75rem;
	}

	.requirement {
		padding: 0.25rem 0.5rem;
		background-color: #fef3c7;
		color: #92400e;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
	}

	/* Progress bar */
	.progress-bar {
		position: relative;
		width: 100%;
		height: 8px;
		background-color: #e5e7eb;
		border-radius: 4px;
		margin-top: 0.75rem;
		overflow: visible;
	}

	.progress-fill {
		height: 100%;
		background-color: #3b82f6;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.progress-threshold {
		position: absolute;
		top: -4px;
		bottom: -4px;
		width: 2px;
		background-color: #f59e0b;
		transform: translateX(-1px);
	}

	.progress-threshold::before {
		content: '';
		position: absolute;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		border-top: 6px solid #f59e0b;
	}

	/* Response indicator */
	.response-indicator {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.response-indicator.complete {
		background-color: #d1fae5;
		color: #065f46;
		border: 1px solid #10b981;
	}

	.response-indicator.incomplete {
		background-color: #fef3c7;
		color: #92400e;
		border: 1px solid #f59e0b;
	}

	.status-icon {
		font-size: 1.25rem;
	}

	.percentage {
		margin-left: auto;
		font-size: 0.875rem;
		opacity: 0.8;
	}

	/* Rationale */
	.rationale {
		margin-top: 1rem;
		padding: 1rem;
		background-color: #f3f4f6;
		border-left: 4px solid #3b82f6;
		border-radius: 0.25rem;
	}

	.rationale strong {
		display: block;
		margin-bottom: 0.5rem;
		color: #1f2937;
	}

	/* Disabled state */
	.pie-media.disabled {
		opacity: 0.7;
		pointer-events: none;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.pie-media {
			max-width: 100%;
		}

		.playback-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.requirement-info {
			flex-direction: column;
			gap: 0.25rem;
		}
	}
</style>
