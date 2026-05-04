<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
      session: { type: 'Object' },
      options: { type: 'Object' },
    },
  }}
/>

<script lang="ts">
import { color } from '@pie-lib/styling-svelte';
import { forwardSessionChange, resolveDeliveryHost } from '@pie-lib/delivery-events-svelte';
import AudioPlayer from './AudioPlayer.svelte';
import { computeChoiceCorrectness } from './computeChoiceCorrectness';
import { computeAudioMode } from './computeAudioMode';
import { computeLayoutStyle, DEFAULT_LAYOUT_LIMITS } from './computeLayoutStyle';
import {
  ensureVariantCssInjected,
  getVariantCssConfig,
  getVariantRootClass,
} from './variant-css-map';
const AUDIO_PLAYBACK = {
  IDLE: 'idle',
  PLAYING: 'playing',
  BLOCKED: 'blocked',
  PAUSED: 'paused',
} as const;
type AudioPlaybackState = (typeof AUDIO_PLAYBACK)[keyof typeof AUDIO_PLAYBACK];

/** Must match controller `BLANK_TOKEN` (kept local to avoid pulling controller into delivery). */
const BLANK_TOKEN = '{{blank}}';
const DEFAULT_AUDIO_BUTTON_SKINS = {
  default: {
    silentUrl:
      'https://assets.learnosity.com/organisations/844/0c9f2aa3-3cd5-4de7-93ef-541c24ca35da.svg',
    playingUrl:
      'https://assets.learnosity.com/organisations/844/231dfdc2-c113-4be5-91fb-e75a0ca5994b.svg',
  },
  es: {
    silentUrl:
      'https://assets.learnosity.com/organisations/844/27a9d5b5-d873-4bd5-b9ba-22748782d8ba.svg',
    playingUrl:
      'https://assets.learnosity.com/organisations/844/120f216d-96b7-4560-94b8-1d90710216b7.svg',
  },
} as const;
const DEFAULT_UI_TEXT = {
  answerChoices: 'Answer choices',
  selectedAnswerInSentence: 'Selected answer in sentence',
  showCorrectAnswer: 'Show correct answer',
  hideCorrectAnswer: 'Hide correct answer',
  clickToEnableAutoplay: 'Click to enable audio autoplay',
  audioResourceUnavailable: 'Audio is enabled but no playable audio URL is configured.',
  transcriptLabel: 'Transcript',
} as const;

let { model, session } = $props<{ model?: any; session?: any; options?: any }>();
let audioEl = $state<HTMLAudioElement | null>(null);
let audioPlaybackState = $state<AudioPlaybackState>(AUDIO_PLAYBACK.IDLE);
let localChoiceId = $state('');
let featureAudioButtonEl = $state<HTMLButtonElement | null>(null);
let autoplayEnableButtonEl = $state<HTMLButtonElement | null>(null);
let toggleCorrectAnswerButtonEl = $state<HTMLButtonElement | null>(null);
let choicesGroupEl = $state<HTMLDivElement | null>(null);
let rootEl = $state<HTMLDivElement | null>(null);
let ancestorHasTranscriptClass = $state(false);
const instanceId = `mc-populated-blank-${Math.random().toString(36).slice(2, 10)}`;

// ---------------------------------------------------------------------------
// Cluster: modeFlags — delivery mode, correctness, and answer-reveal state
// Feeds: shouldShowCorrectAnswerToggle, choiceState, a11y
// ---------------------------------------------------------------------------
const deliveryMode = $derived((model?.mode || model?.env?.mode || '').toString());
const isEvaluateMode = $derived(deliveryMode === 'evaluate');
const correctness = $derived(model?.correctness);
const isResponseCorrect = $derived(
  typeof model?.responseCorrect === 'boolean' ? model.responseCorrect : correctness === 'correct'
);
const isCorrect = $derived(correctness === 'correct');
const isIncorrect = $derived(correctness === 'incorrect');

let showCorrectAnswer = $state(false);
const shouldShowCorrectAnswerToggle = $derived(
  isEvaluateMode && !isResponseCorrect && !!model?.correctChoiceId
);

// ---------------------------------------------------------------------------
// Cluster: layoutConfig — profile limits, blank sizing, choice layout, audio mode
// Feeds: layout (rootStyle, blankWidth, blankBorderWidth, legendMaxChars), audioMode, choiceState
// ---------------------------------------------------------------------------
const layoutProfile = $derived(model?.layoutProfile || '');
const isAudioOnlyMode = $derived(model?.interactionMode === 'audio_mc_only');
const isBlankOnlyTemplate = $derived.by(() => {
  const t = model?.template || '';
  if (!t) return false;
  const plain = t
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return plain === BLANK_TOKEN;
});
const choiceLayout = $derived(
  model?.choiceLayout || (isAudioOnlyMode || isBlankOnlyTemplate ? 'horizontal' : 'vertical')
);
const isHorizontalChoices = $derived(choiceLayout === 'horizontal');
const hasInlineSentenceAudioLayout = $derived(
  layoutProfile === 'inline_sentence' && !!model?.hasAudio
);
const showVisibleTranscript = $derived(
  !!model?.showVisibleTranscript || ancestorHasTranscriptClass
);
const useFeatureButtonAudio = $derived.by(() => {
  if (typeof model?.useFeatureButtonAudio === 'boolean') {
    return !!model.useFeatureButtonAudio;
  }
  const profile = layoutProfile || '';
  return (
    !!model?.hasAudio &&
    (profile === 'audio_blank_only' ||
      profile === 'stimulus_image_blank' ||
      profile === 'token_sequence')
  );
});
const audioMode = $derived(
  computeAudioMode({
    hasAudio: !!model?.hasAudio,
    audioUrl: model?.audioUrl,
    useFeatureButtonAudio,
  })
);
const correctAnswerStyleVars = $derived.by(() =>
  [
    `--pie-correct-answer-toggle-label-color:${color.text()}`,
    `--pie-correct-answer-toggle-icon-open-bg:${color.tertiaryLight()}`,
    `--pie-correct-answer-toggle-icon-closed-bg:${color.backgroundDark()}`,
    `--pie-correct-answer-toggle-icon-glyph-color:${color.tertiary()}`,
    `--pie-correct-answer-choice-hover-bg:${color.backgroundDark()}`,
    `--pie-correct-answer-choice-selected-bg:${color.secondaryBackground()}`,
    `--pie-correct-answer-choice-correct-bg:${color.correctSecondary()}`,
    `--pie-correct-answer-choice-incorrect-bg:${color.incorrectSecondary()}`,
    `--pie-correct-answer-choice-correct-border:${color.correctTertiary()}`,
    `--pie-correct-answer-choice-incorrect-border:${color.incorrectWithIcon()}`,
    `--pie-correct-answer-feedback-correct-bg:${color.correctWithIcon()}`,
    `--pie-correct-answer-feedback-incorrect-bg:${color.incorrectWithIcon()}`,
    `--pie-correct-answer-feedback-glyph-color:${color.white()}`,
  ].join(';')
);
const layout = $derived(
  computeLayoutStyle({
    layoutProfile,
    isBlankOnlyTemplate,
    configuredLimits: model?.layoutLimits,
    customProfilePresets: model?.layoutProfilePresets,
    correctAnswerStyleVars,
  })
);

// ---------------------------------------------------------------------------
// Cluster: choiceState — selection, display choice, per-choice correctness, result text
// Feeds: template blank display, choice rendering, fieldset, result sr-only text
// ---------------------------------------------------------------------------
const choices = $derived(Array.isArray(model?.choices) ? model.choices : []);
const choiceMode = $derived(model?.choiceMode || 'text');
const selectedId = $derived(session?.choiceId || localChoiceId || '');
const radioGroupName = $derived(`${instanceId}-choice-group-${model?.id || '1'}`);
const displayChoiceId = $derived.by(() => {
  if (model?.alwaysShowCorrect && model?.correctChoiceId) {
    return model.correctChoiceId;
  }
  if (isEvaluateMode && showCorrectAnswer && model?.correctChoiceId) {
    return model.correctChoiceId;
  }
  return selectedId;
});
const displayChoice = $derived.by(() => choices.find((c: any) => c.id === displayChoiceId));
const displayChoiceLabelHtml = $derived.by(() => String(displayChoice?.labelHtml || ''));
const resultText = $derived.by(() => {
  if (!isEvaluateMode || showCorrectAnswer) return '';
  if (isCorrect) return 'Correct answer selected';
  if (isIncorrect && selectedId) return 'Incorrect answer selected';
  return '';
});
const choiceCorrectnessById = $derived(
  computeChoiceCorrectness({
    isEvaluateMode,
    correctChoiceId: String(model?.correctChoiceId || ''),
    selectedId: String(selectedId || ''),
    showCorrectAnswer,
  })
);

// ---------------------------------------------------------------------------
// Cluster: a11y — stable IDs, aria labelling, described-by relationships
// Feeds: fieldset legend, radiogroup labelling, template described-by
// ---------------------------------------------------------------------------
const uiText = $derived.by(() => ({
  ...DEFAULT_UI_TEXT,
  ...(model?.uiText || {}),
}));
const promptId = $derived(`${instanceId}-prompt`);
const transcriptId = $derived(`${instanceId}-transcript`);
const legendId = $derived(`${instanceId}-choices-legend`);
const resultId = $derived(`${instanceId}-result`);
const legendText = $derived.by(() => {
  const plain = (model?.prompt || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const maxChars = Math.max(8, layout.legendMaxChars);
  return plain.length > maxChars
    ? `${plain.slice(0, Math.max(1, maxChars - 1))}…`
    : plain || uiText.answerChoices;
});
const choicesGroupLabelledBy = $derived(model?.prompt ? promptId : undefined);
const choicesGroupAriaLabel = $derived.by(() => {
  if (model?.prompt) return undefined;
  const explicit = String(model?.choiceGroupLabel || '').trim();
  if (explicit) return explicit;
  return legendText;
});
const templateDescribedBy = $derived.by(() => {
  const ids: string[] = [];
  if (model?.prompt) ids.push(promptId);
  if (model?.hasAudio && model?.audioTranscript) ids.push(transcriptId);
  return ids.length ? ids.join(' ') : undefined;
});

// ---------------------------------------------------------------------------
// Misc — locale, audio error, template parsing, variant CSS, style strings
// ---------------------------------------------------------------------------
const lang = $derived.by(() => {
  const locale = model?.locale || '';
  return locale ? locale.slice(0, 2) : 'en';
});
const audioErrorMessage = $derived.by(() =>
  audioMode === 'error' ? uiText.audioResourceUnavailable : ''
);
const variantCssConfig = $derived(getVariantCssConfig(model?.customType));
const variantRootClass = $derived(getVariantRootClass(model?.customType));
const templateParts = $derived.by(() => {
  const t = model?.template || '';
  const idx = t.indexOf(BLANK_TOKEN);
  if (idx < 0) return { before: t, after: '' };
  return {
    before: t.slice(0, idx),
    after: t.slice(idx + BLANK_TOKEN.length),
  };
});

function emitSession(updatedSession: any, sourceEl?: HTMLElement | null) {
  forwardSessionChange({
    sourceEl,
    fallbackSelector: 'mc-populated-blank',
    component: 'mc-populated-blank',
    session: updatedSession,
    complete: !!updatedSession?.choiceId,
  });
}

function onRadioChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.checked) return;
  const choiceId = input.value;
  localChoiceId = choiceId;
  const updatedSession = {
    ...session,
    id: session?.id || model?.id || '1',
    element: 'mc-populated-blank',
    choiceId,
  };
  emitSession(updatedSession, input);
}

function toggleCorrectAnswer() {
  if (!shouldShowCorrectAnswerToggle) return;
  showCorrectAnswer = !showCorrectAnswer;
}

$effect(() => {
  if (!isEvaluateMode || isResponseCorrect) {
    showCorrectAnswer = false;
  }
});

function onRadioGroupKeydown(e: KeyboardEvent) {
  if (model?.disabled) return;
  const key = e.key;
  if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(key)) return;
  e.preventDefault();
  const container = e.currentTarget as HTMLElement;
  const inputs = Array.from(
    container.querySelectorAll('input[type="radio"]:not([disabled])')
  ) as HTMLInputElement[];
  if (inputs.length === 0) return;
  let idx = inputs.findIndex((i) => i.checked);
  if (key === 'ArrowDown' || key === 'ArrowRight') {
    idx = idx < 0 ? 0 : (idx + 1) % inputs.length;
  } else {
    idx = idx < 0 ? inputs.length - 1 : (idx - 1 + inputs.length) % inputs.length;
  }
  const next = inputs[idx];
  next.checked = true;
  next.dispatchEvent(new Event('change', { bubbles: true }));
  next.focus();
}

const isMediaPlaying = $derived(audioPlaybackState === AUDIO_PLAYBACK.PLAYING);
const autoPlayPromptOpen = $derived(audioPlaybackState === AUDIO_PLAYBACK.BLOCKED);

function onPlaybackStarted(e: Event) {
  const host = resolveDeliveryHost(e.currentTarget as HTMLElement, {
    fallbackSelector: 'mc-populated-blank',
  });
  audioPlaybackState = AUDIO_PLAYBACK.PLAYING;
  host?.onAudioStarted?.();
}

function onPlaybackEnded(e: Event) {
  const host = resolveDeliveryHost(e.currentTarget as HTMLElement, {
    fallbackSelector: 'mc-populated-blank',
  });
  audioPlaybackState = AUDIO_PLAYBACK.PAUSED;
  host?.onAudioEnded?.();
}

function handleEnableAutoplayClick() {
  if (audioMode !== 'none' && audioMode !== 'error' && audioEl) {
    // Clear the blocked prompt regardless of whether play succeeds — matches original behavior.
    audioEl.play().finally(() => {
      if (audioPlaybackState === AUDIO_PLAYBACK.BLOCKED) audioPlaybackState = AUDIO_PLAYBACK.PAUSED;
    });
  }
}

function playFeatureAudio() {
  if (audioMode !== 'none' && audioMode !== 'error' && audioEl) {
    audioEl.play().catch(() => {
      // Keep behavior resilient: if playback is blocked, user can retry.
    });
  }
}

const featureAudioSkin = $derived.by(() => {
  const locale = String(model?.locale || '').toLowerCase();
  const lang = locale.slice(0, 2);
  const byLocale =
    model?.audioButtonSkinsByLocale && typeof model.audioButtonSkinsByLocale === 'object'
      ? model.audioButtonSkinsByLocale
      : {};
  const customSingle =
    model?.audioButtonSkin && typeof model.audioButtonSkin === 'object'
      ? model.audioButtonSkin
      : null;
  const defaultSkin = locale.startsWith('es')
    ? DEFAULT_AUDIO_BUTTON_SKINS.es
    : DEFAULT_AUDIO_BUTTON_SKINS.default;
  return byLocale[locale] || byLocale[lang] || byLocale.default || customSingle || defaultSkin;
});

$effect(() => {
  if (session?.choiceId) {
    localChoiceId = session.choiceId;
  }
});

// Attach a single event listener to a reactive element ref; auto-cleans on ref change.
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
  (e) => onPlaybackStarted(e)
);
useListener(
  () => audioEl,
  'ended',
  (e) => onPlaybackEnded(e)
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
useListener(
  () => toggleCorrectAnswerButtonEl,
  'click',
  () => toggleCorrectAnswer()
);

// Delegated listeners on the choices group — two events with a radio-guard on change.
$effect(() => {
  const group = choicesGroupEl;
  if (!group) return;
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement | null;
    if (!target || target.type !== 'radio') return;
    onRadioChange(e);
  };
  const handleKeydown = (e: KeyboardEvent) => onRadioGroupKeydown(e);
  group.addEventListener('change', handleChange);
  group.addEventListener('keydown', handleKeydown);
  return () => {
    group.removeEventListener('change', handleChange);
    group.removeEventListener('keydown', handleKeydown);
  };
});

$effect(() => {
  if (!model?.hasAudio || !model?.autoplayAudioEnabled) return;
  if (audioPlaybackState !== AUDIO_PLAYBACK.IDLE) return;

  // Browser autoplay restrictions vary. Try immediate play; if blocked show click-to-enable affordance.
  if (audioEl && model?.audioUrl) {
    audioPlaybackState = AUDIO_PLAYBACK.PAUSED;
    audioEl.play().catch(() => {
      audioPlaybackState = AUDIO_PLAYBACK.BLOCKED;
    });
  }
});

$effect(() => {
  ensureVariantCssInjected(variantCssConfig);
});

$effect(() => {
  const el = rootEl;
  if (!el) return;

  const check = () => {
    ancestorHasTranscriptClass = !!el.closest('.rli-with-audio-transcript');
  };
  check();

  const observer = new MutationObserver(check);
  // Walk up and observe each ancestor for class changes
  let node: Element | null = el.parentElement;
  while (node) {
    observer.observe(node, { attributes: true, attributeFilter: ['class'] });
    node = node.parentElement;
  }
  return () => observer.disconnect();
});
</script>

<div
  bind:this={rootEl}
  class={`p-4 mc-populated-blank-root pie-element pie-element-mc-populated-blank pie-delivery-root layout-${layoutProfile} ${variantRootClass} ${hasInlineSentenceAudioLayout ? 'has-inline-audio' : ''}`}
  lang={lang}
  style={layout.rootStyle}
>
  {#if model?.prompt}
    <div class="mb-4 prose pie-prompt" id={promptId}>{@html model.prompt}</div>
  {/if}

  {#if model?.audioTranscript}
    <p
      class={`text-sm mb-3 text-gray-700 text-center pie-audio-transcript ${showVisibleTranscript ? '' : 'sr-only'}`}
      id={transcriptId}
    >
      {model.audioTranscript}
    </p>
  {/if}

  {#if shouldShowCorrectAnswerToggle}
    <div class="pie-correct-answer-toggle-row">
      <button
        bind:this={toggleCorrectAnswerButtonEl}
        type="button"
        class="mb-3 pie-toggle-correct-answer"
        style="gap:var(--mpb-toggle-button-gap, 0.5rem);"
        aria-pressed={showCorrectAnswer}
        data-testid="show-correct-answer"
      >
        <span class="pie-correct-answer-toggle-content">
          <span class="pie-correct-answer-toggle-icon-holder" aria-hidden="true">
            {#if showCorrectAnswer}
              <svg
                class="pie-correct-answer-toggle-svg"
                preserveAspectRatio="xMinYMin meet"
                version="1.1"
                viewBox="-283 359 34 35"
              >
                <circle cx="-266" cy="375.9" r="14" fill="var(--pie-correct-answer-toggle-icon-open-bg, #bce2ff)" />
                <path
                  d="M-280.5,375.9c0-8,6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5s-6.5,14.5-14.5,14.5S-280.5,383.9-280.5,375.9z M-279.5,375.9c0,7.4,6.1,13.5,13.5,13.5c7.4,0,13.5-6.1,13.5-13.5s-6.1-13.5-13.5-13.5C-273.4,362.4-279.5,368.5-279.5,375.9z"
                  fill="var(--pie-correct-answer-toggle-icon-open-bg, #bce2ff)"
                />
                <polygon
                  points="-265.4,383.1 -258.6,377.2 -261.2,374.2 -264.3,376.9 -268.9,368.7 -272.4,370.6"
                  fill="var(--pie-correct-answer-toggle-icon-glyph-color, #1a9cff)"
                />
              </svg>
            {:else}
              <svg
                class="pie-correct-answer-toggle-svg"
                preserveAspectRatio="xMinYMin meet"
                version="1.1"
                viewBox="-129.5 127 34 35"
              >
                <path
                  d="M-112.9,160.4c-8.5,0-15.5-6.9-15.5-15.5c0-8.5,6.9-15.5,15.5-15.5s15.5,6.9,15.5,15.5 C-97.4,153.5-104.3,160.4-112.9,160.4z"
                  fill="#D0CAC5"
                  stroke="#E6E3E0"
                  stroke-width="0.75"
                />
                <path
                  d="M-113.2,159c-8,0-14.5-6.5-14.5-14.5s6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5S-105.2,159-113.2,159z"
                  fill="#B3ABA4"
                  stroke="#CDC7C2"
                  stroke-width="0.5"
                />
                <circle cx="-114.2" cy="143.5" r="14" fill="white" />
                <path
                  d="M-114.2,158c-8,0-14.5-6.5-14.5-14.5s6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5S-106.2,158-114.2,158z M-114.2,130c-7.4,0-13.5,6.1-13.5,13.5s6.1,13.5,13.5,13.5s13.5-6.1,13.5-13.5S-106.8,130-114.2,130z"
                  fill="var(--pie-correct-answer-toggle-icon-closed-bg, #bce2ff)"
                />
                <polygon
                  points="-114.8,150.7 -121.6,144.8 -119,141.8 -115.9,144.5 -111.3,136.3 -107.8,138.2"
                  fill="var(--pie-correct-answer-toggle-icon-glyph-color, #1a9cff)"
                />
              </svg>
            {/if}
          </span>
          <span class="pie-correct-answer-toggle-label">
            {showCorrectAnswer ? uiText.hideCorrectAnswer : uiText.showCorrectAnswer}
          </span>
        </span>
      </button>
    </div>
  {/if}

  <AudioPlayer
    {audioMode}
    audioUrl={model?.audioUrl}
    audioTranscript={model?.audioTranscript}
    {showVisibleTranscript}
    {transcriptId}
    {featureAudioSkin}
    {autoPlayPromptOpen}
    {isMediaPlaying}
    {audioErrorMessage}
    {uiText}
    locale={model?.locale}
    bind:audioEl
    bind:featureAudioButtonEl
    bind:autoplayEnableButtonEl
  />

  {#if model?.sentenceHtml}
    <div class="mb-3 prose prose-p:my-1 sentence-line pie-sentence-line" aria-describedby={templateDescribedBy}>
      {@html model.sentenceHtml}
    </div>
  {/if}

  {#if !isAudioOnlyMode}
    <div class="mb-4 template-line pie-template-line" aria-describedby={templateDescribedBy}>
      {@html templateParts.before}
      <span
        class={`inline-flex items-center min-h-[1.5em] px-2 mx-1 border-b-2 border-gray-500 align-baseline blank-slot pie-blank-slot ${isBlankOnlyTemplate ? 'blank-slot-standalone pie-blank-slot-standalone' : ''}`}
        style={`width:${layout.blankWidth};border-bottom-width:${layout.blankBorderWidth};`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={uiText.selectedAnswerInSentence}
      >
        {#if choiceMode === 'image' && displayChoice?.imageUrl}
          <img
            src={displayChoice.imageUrl}
            alt={displayChoice.imageAlt || 'Selected answer image'}
            class="w-auto object-contain pie-blank-image"
            style="max-height:var(--mpb-selected-image-max-height, 4rem);"
          />
        {:else if displayChoiceLabelHtml}
          <span class="choice-html pie-blank-value">{@html displayChoiceLabelHtml}</span>
        {:else}
          <span class="blank-inner-empty" aria-hidden="true">&nbsp;</span>
        {/if}
      </span>
      {@html templateParts.after}
    </div>
  {/if}

  {#if resultText}
    <p id={resultId} class="sr-only pie-result-feedback" role="status" aria-live="polite">{resultText}</p>
  {/if}

  <fieldset class="border-0 p-0 m-0 pie-choices-fieldset" disabled={model?.disabled}>
    <legend class="sr-only pie-choices-legend" id={legendId}>{legendText}</legend>
    <div
      bind:this={choicesGroupEl}
      class={`pie-choices ${isHorizontalChoices ? 'flex flex-row flex-wrap items-start justify-center' : 'flex flex-col'}`}
      style="gap:var(--mpb-choice-group-gap, 0.5rem);"
      role="radiogroup"
      tabindex="-1"
      aria-labelledby={choicesGroupLabelledBy}
      aria-label={choicesGroupAriaLabel}
      aria-describedby={resultText ? resultId : undefined}
    >
      {#snippet choiceContent(c: (typeof choices)[number])}
        {#if choiceMode === 'image' && c.imageUrl}
          <img
            src={c.imageUrl}
            alt={c.imageAlt || `Choice ${c.id}`}
            class="object-contain pie-choice-image"
            style="max-height:var(--mpb-choice-image-max-height, 5rem);"
          />
        {:else}
          <span class="choice-html pie-choice-label">{@html c.labelHtml || ''}</span>
        {/if}
      {/snippet}

      {#snippet choiceRow(c: (typeof choices)[number])}
        {@const choiceCorrectness = choiceCorrectnessById.get(c.id)}
        <div
          class={`flex items-start choice-row pie-choice ${isHorizontalChoices ? 'choice-row-horizontal pie-choice-horizontal' : ''} ${displayChoiceId === c.id ? 'is-selected pie-choice-selected' : ''} ${choiceCorrectness ? `choice-${choiceCorrectness} pie-choice-${choiceCorrectness}` : ''}`}
          style="gap:var(--mpb-choice-row-gap, 0.5rem);"
        >
          {#if isHorizontalChoices}
            <label
              for={`${instanceId}-opt-${c.id}`}
              class="cursor-pointer choice-tile text-center pie-choice-tile"
            >
              <span class="choice-tile-content pie-choice-tile-content">
                {@render choiceContent(c)}
              </span>
              <input
                type="radio"
                name={radioGroupName}
                id={`${instanceId}-opt-${c.id}`}
                value={c.id}
                checked={displayChoiceId === c.id}
                disabled={model?.disabled}
                class="choice-radio-bottom pie-choice-radio pie-choice-radio-bottom"
              />
            </label>
          {:else}
            <input
              type="radio"
              name={radioGroupName}
              id={`${instanceId}-opt-${c.id}`}
              value={c.id}
              checked={displayChoiceId === c.id}
              disabled={model?.disabled}
              class="choice-radio-inline pie-choice-radio pie-choice-radio-inline"
            />
            <label for={`${instanceId}-opt-${c.id}`} class="cursor-pointer flex-1 pie-choice-label-wrap">
              {@render choiceContent(c)}
            </label>
          {/if}
          {#if isEvaluateMode && choiceCorrectness}
            <span
              class={`pie-choice-feedback-badge ${choiceCorrectness === 'correct' ? 'pie-choice-feedback-correct' : 'pie-choice-feedback-incorrect'}`}
              aria-hidden="true"
            >
              {choiceCorrectness === 'correct' ? '✓' : '✕'}
            </span>
          {/if}
        </div>
      {/snippet}

      {#each choices as c (c.id)}
        {@render choiceRow(c)}
      {/each}
    </div>
  </fieldset>
</div>

<style>
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

  .mc-populated-blank-root :global(.prose) {
    max-width: none;
  }

  .blank-slot:focus-within {
    outline: 2px solid var(--pie-focus, #2563eb);
    outline-offset: 2px;
  }

  .blank-slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    vertical-align: baseline;
  }

  .pie-toggle-correct-answer {
    width: 100%;
    cursor: pointer;
    border: 0;
    background: transparent;
    padding: 0;
    display: flex;
    justify-content: center;
    text-align: center;
    color: var(--pie-correct-answer-toggle-label-color, var(--pie-text, black));
  }

  .pie-correct-answer-toggle-row {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }

  .pie-correct-answer-toggle-content {
    display: flex;
    margin: 0 auto;
    align-items: center;
  }

  .pie-correct-answer-toggle-icon-holder {
    width: 25px;
    margin-right: 5px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .pie-correct-answer-toggle-svg {
    width: 25px;
    height: 25px;
  }

  .pie-correct-answer-toggle-label {
    width: fit-content;
    min-width: 140px;
    align-self: center;
    vertical-align: middle;
    font-weight: 400;
    user-select: none;
  }

  .pie-toggle-correct-answer:hover .pie-correct-answer-toggle-label,
  .pie-toggle-correct-answer:focus-visible .pie-correct-answer-toggle-label {
    text-decoration: underline;
  }

  .template-line {
    white-space: pre-wrap;
  }

  .template-line :global(p) {
    margin: 0;
  }

  .blank-inner-empty {
    display: inline-block;
    min-width: 4ch;
  }

  .blank-slot-standalone {
    width: var(--mpb-blank-standalone-width, 7rem);
  }

  .choice-row-horizontal {
    flex-direction: column;
    align-items: center;
    width: min(var(--mpb-choice-width-px, 170px), var(--mpb-choice-width-vw, 30vw));
    min-height: var(--mpb-choice-tile-min-height, 11rem);
    gap: 0;
  }

  .choice-tile {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: var(--mpb-choice-tile-min-height, 11rem);
    padding: 0.8rem 0.65rem 0.5rem;
    border-radius: 8px;
    background: transparent;
    transition: background-color 120ms ease-in-out;
  }

  .choice-tile-content {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--mpb-choice-content-min-height, 7.5rem);
  }

  .choice-row-horizontal:hover .choice-tile {
    background: var(--mpb-choice-hover-bg, var(--pie-correct-answer-choice-hover-bg, #f2f2f2));
  }

  .pie-choice-horizontal:not(.is-selected):not(:hover) .pie-choice-tile {
    background: transparent;
  }

  .choice-row-horizontal.is-selected .choice-tile {
    background: var(--mpb-choice-selected-bg, var(--pie-correct-answer-choice-selected-bg, #fcfcd3));
  }

  .choice-row-horizontal.is-selected:hover .choice-tile {
    background: var(--mpb-choice-selected-bg, var(--pie-correct-answer-choice-selected-bg, #fcfcd3));
  }

  .pie-choice:not(.pie-choice-horizontal):hover .pie-choice-label-wrap {
    background: var(--pie-correct-answer-choice-hover-bg, #ececec);
  }

  .pie-choice:not(.pie-choice-horizontal):not(.is-selected):not(:hover) .pie-choice-label-wrap {
    background: transparent;
  }

  .pie-choice:not(.pie-choice-horizontal).is-selected .pie-choice-label-wrap {
    background: var(--pie-correct-answer-choice-selected-bg, #f1f1f1);
    border-radius: 6px;
  }

  .pie-choice:not(.pie-choice-horizontal).is-selected:hover .pie-choice-label-wrap {
    background: var(--pie-correct-answer-choice-selected-bg, #f1f1f1);
  }

  .pie-choice.choice-correct {
    border-left: 3px solid var(--pie-correct-answer-choice-correct-border, #0ea449);
  }

  .pie-choice.choice-incorrect {
    border-left: 3px solid var(--pie-correct-answer-choice-incorrect-border, #bf0d00);
  }

  .pie-choice-horizontal.choice-correct .choice-tile {
    background: var(--pie-correct-answer-choice-correct-bg, #e8f5e9);
  }

  .pie-choice-horizontal.choice-incorrect .choice-tile {
    background: var(--pie-correct-answer-choice-incorrect-bg, #ffebee);
  }

  .pie-choice-feedback-badge {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 9999px;
    font-size: 0.72rem;
    line-height: 1;
    font-weight: 700;
    color: var(--pie-correct-answer-feedback-glyph-color, #fff);
  }

  .pie-choice-feedback-correct {
    background: var(--pie-correct-answer-feedback-correct-bg, #087d38);
  }

  .pie-choice-feedback-incorrect {
    background: var(--pie-correct-answer-feedback-incorrect-bg, #bf0d00);
  }

  .choice-row-horizontal :global(p) {
    margin: 0;
    text-align: center;
  }

  .choice-html :global(p) {
    margin: 0;
  }

  .choice-html {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .choice-radio-bottom {
    margin-top: var(--mpb-horizontal-choice-radio-top-margin, 0.5rem);
    padding: var(--mpb-choice-radio-padding, 0px);
  }

  .choice-radio-inline {
    margin-top: var(--mpb-horizontal-choice-radio-top-margin, 0.5rem);
  }

  .layout-audio_blank_only .audio-container,
  .layout-stimulus_image_blank .audio-container {
    display: flex;
    width: min(100%, var(--mpb-audio-instructions-max-width, 875px));
    margin-left: auto;
    margin-right: auto;
    justify-content: flex-end;
  }

  .layout-audio_blank_only .template-line,
  .layout-stimulus_image_blank .template-line {
    text-align: center;
    margin: var(--mpb-audio-blank-template-margin-top, 0.8rem) 0
      var(--mpb-audio-blank-template-margin-bottom, 1.8rem);
  }

  .layout-audio_blank_only fieldset {
    display: flex;
    justify-content: center;
  }

  .layout-audio_blank_only .blank-slot,
  .layout-stimulus_image_blank .blank-slot {
    width: var(--mpb-blank-wide-width, 10rem);
    border-bottom-width: var(--mpb-blank-underline-wide-width, 6px);
    min-height: 160px;
    padding-bottom: 4px;
  }

  .layout-stimulus_image_blank {
    display: grid;
    grid-template-columns: minmax(var(--mpb-stimulus-min-column, 210px), 1fr) auto;
    grid-template-areas:
      'sentence audio'
      '. template'
      'choices choices';
    column-gap: var(--mpb-stimulus-grid-column-gap, 2rem);
    row-gap: var(--mpb-stimulus-grid-row-gap, 0.7rem);
    align-items: start;
  }

  .layout-stimulus_image_blank .audio-container {
    grid-area: audio;
    margin: 0;
  }

  .layout-stimulus_image_blank .sentence-line {
    grid-area: sentence;
    margin: var(--mpb-stimulus-sentence-margin-top, 0.2rem) 0 0;
  }

  .layout-stimulus_image_blank .template-line {
    grid-area: template;
    margin: 0;
    text-align: center;
    justify-self: center;
  }

  .layout-stimulus_image_blank fieldset {
    grid-area: choices;
    margin-top: var(--mpb-stimulus-choices-margin-top, 0.9rem);
  }

  .layout-token_sequence {
    display: grid;
    grid-template-columns: minmax(var(--mpb-text-min-column, 260px), 1fr) auto;
    grid-template-areas:
      'template audio'
      'choices choices';
    column-gap: var(--mpb-token-grid-column-gap, 1.5rem);
    row-gap: var(--mpb-token-grid-row-gap, 0.8rem);
    align-items: start;
  }

  .layout-token_sequence .audio-container {
    grid-area: audio;
    margin: 0;
    justify-self: end;
  }

  .layout-token_sequence .template-line {
    grid-area: template;
    margin: var(--mpb-token-template-margin-top, 0.6rem) 0 0;
    justify-self: center;
    text-align: center;
  }

  .layout-token_sequence .template-line :global(span + span) {
    margin-left: var(--mpb-token-inline-token-gap, 0.35rem);
  }

  .layout-token_sequence .blank-slot {
    width: var(--mpb-blank-standalone-width, 7rem);
    border-bottom-width: var(--mpb-blank-underline-wide-width, 4px);
    margin-left: var(--mpb-token-inline-token-gap, 0.35rem);
  }

  .layout-token_sequence fieldset {
    grid-area: choices;
    margin-top: var(--mpb-token-choices-margin-top, 0.2rem);
  }

  .layout-inline_sentence.has-inline-audio {
    display: grid;
    grid-template-columns: minmax(var(--mpb-text-min-column, 260px), 1fr) auto;
    grid-template-areas:
      'template audio'
      'choices choices';
    column-gap: var(--mpb-inline-grid-column-gap, 1.5rem);
    row-gap: var(--mpb-inline-grid-row-gap, 0.65rem);
    align-items: start;
  }

  .layout-inline_sentence.has-inline-audio .audio-container {
    grid-area: audio;
    margin: 0;
    justify-self: end;
  }

  .layout-inline_sentence.has-inline-audio .template-line {
    grid-area: template;
    margin: var(--mpb-inline-template-margin-top, 0.45rem) 0 0;
    text-align: center;
    justify-self: center;
  }

  .layout-inline_sentence.has-inline-audio fieldset {
    grid-area: choices;
    margin-top: var(--mpb-inline-choices-margin-top, 0.25rem);
  }

  /* Match Learnosity responsive behavior for CQT audio-blank layouts:
     at smaller widths, audio control shifts left and answer tiles stack. */
  @media (max-width: 760px) {
    .layout-audio_blank_only .audio-container,
    .layout-stimulus_image_blank .audio-container,
    .layout-token_sequence .audio-container,
    .layout-inline_sentence.has-inline-audio .audio-container {
      width: 100%;
      margin-left: 0;
      margin-right: 0;
      justify-content: flex-start;
      justify-self: start;
    }

    .layout-audio_blank_only .pie-choices,
    .layout-token_sequence .pie-choices,
    .layout-stimulus_image_blank .pie-choices,
    .layout-inline_sentence.has-inline-audio .pie-choices {
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
    }

    .layout-audio_blank_only .choice-row-horizontal,
    .layout-token_sequence .choice-row-horizontal,
    .layout-stimulus_image_blank .choice-row-horizontal,
    .layout-inline_sentence.has-inline-audio .choice-row-horizontal {
      width: min(100%, var(--mpb-narrow-choice-max-width, 230px));
      align-items: flex-start;
    }
  }
</style>
