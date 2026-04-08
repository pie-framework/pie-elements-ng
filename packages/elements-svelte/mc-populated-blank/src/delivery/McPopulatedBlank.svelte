<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
      session: { type: 'Object' },
      options: { type: 'Object' },
      onSessionChange: { type: 'Object' },
      onAudioStarted: { type: 'Object' },
      onAudioEnded: { type: 'Object' },
    },
  }}
/>

<script lang="ts">
import { onDestroy } from 'svelte';

/** Must match controller `BLANK_TOKEN` (kept local to avoid pulling controller into delivery). */
const BLANK_TOKEN = '{{blank}}';

type McChoice = {
  id: string;
  labelHtml?: string;
  imageUrl?: string;
  imageAlt?: string;
};
type McModel = {
  id?: string;
  mode?: string;
  correctness?: 'correct' | 'incorrect' | string;
  responseCorrect?: boolean;
  interactionMode?: string;
  template?: string;
  layoutProfile?: string;
  choiceLayout?: 'horizontal' | 'vertical' | string;
  showVisibleTranscript?: boolean;
  hasAudio?: boolean;
  audioUrl?: string;
  audioTranscript?: string;
  choices?: McChoice[];
  choiceMode?: 'text' | 'image' | string;
  prompt?: string;
  sentenceHtml?: string;
  locale?: string;
  autoplayAudioEnabled?: boolean;
  disabled?: boolean;
  correctChoiceId?: string;
  shuffle?: boolean;
  lockChoiceOrder?: boolean;
  teacherInstructions?: string | null;
};
type McSession = {
  id?: string;
  element?: string;
  choiceId?: string;
  [key: string]: unknown;
};

let props = $props<{
  model?: McModel;
  session?: McSession;
  options?: Record<string, unknown>;
  onSessionChange?: (session: McSession) => void;
  onAudioStarted?: () => void;
  onAudioEnded?: () => void;
}>();
let audioEl = $state<HTMLAudioElement | null>(null);
let activeUtterance = $state<SpeechSynthesisUtterance | null>(null);
let isSynthSpeaking = $state(false);
let isMediaPlaying = $state(false);
let localChoiceId = $state('');
let autoPlayPromptOpen = $state(false);
let autoplayAttempted = $state(false);
const instanceId = `mc-populated-blank-${Math.random().toString(36).slice(2, 10)}`;

const isEvaluateMode = $derived(props?.model?.mode === 'evaluate');
const correctness = $derived(props?.model?.correctness);
const isCorrect = $derived(correctness === 'correct');
const isIncorrect = $derived(correctness === 'incorrect');
const isAudioOnlyMode = $derived(props?.model?.interactionMode === 'audio_mc_only');
const isBlankOnlyTemplate = $derived.by(() => {
  const t = props?.model?.template || '';
  if (!t) return false;
  const plain = t
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
  return plain === BLANK_TOKEN;
});
const layoutProfile = $derived(props?.model?.layoutProfile || '');
const choiceLayout = $derived(
  props?.model?.choiceLayout || (isAudioOnlyMode || isBlankOnlyTemplate ? 'horizontal' : 'vertical')
);
const isHorizontalChoices = $derived(choiceLayout === 'horizontal');
const isVicFamilyLayout = $derived(layoutProfile === 'inline_sentence' && !isHorizontalChoices);
const isSelVicFamilyLayout = $derived(isVicFamilyLayout && !!props?.model?.hasAudio);
const showVisibleTranscript = $derived(!!props?.model?.showVisibleTranscript);
const hasPlayableAudio = $derived(!!props?.model?.hasAudio && !!props?.model?.audioUrl);
const hasTranscriptOnlyAudio = $derived(
  !!props?.model?.hasAudio && !props?.model?.audioUrl && !!props?.model?.audioTranscript
);
const hasInlineSentenceAudioLayout = $derived(
  layoutProfile === 'inline_sentence' && !!props?.model?.hasAudio
);
const useFeatureButtonAudio = $derived.by(() => {
  const profile = layoutProfile || '';
  return (
    !!props?.model?.hasAudio &&
    (profile === 'audio_blank_only' ||
      profile === 'stimulus_image_blank' ||
      profile === 'token_sequence')
  );
});

const templateParts = $derived.by(() => {
  const t = props?.model?.template || '';
  const idx = t.indexOf(BLANK_TOKEN);
  if (idx < 0) {
    return { before: t, after: '' };
  }
  return {
    before: t.slice(0, idx),
    after: t.slice(idx + BLANK_TOKEN.length),
  };
});

function plainTextFromHtml(value = ''): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const blankWidth = $derived.by(() => {
  if (layoutProfile === 'audio_blank_only' || layoutProfile === 'stimulus_image_blank') {
    return '10rem';
  }
  if (isBlankOnlyTemplate) {
    return '7rem';
  }
  if (choiceMode === 'text') {
    const modelChoices = Array.isArray(props?.model?.choices) ? props.model.choices : [];
    const longestChoiceChars = modelChoices.reduce((max: number, choice: McChoice) => {
      const textLength = plainTextFromHtml(choice?.labelHtml || '').length;
      return Math.max(max, textLength);
    }, 0);
    if (longestChoiceChars > 0) {
      const widthInCh = Math.min(24, Math.max(7, longestChoiceChars + 1));
      return `${widthInCh}ch`;
    }
  }
  return 'auto';
});
const blankBorderWidth = $derived.by(() => {
  if (layoutProfile === 'audio_blank_only' || layoutProfile === 'stimulus_image_blank') {
    return '4px';
  }
  return '2px';
});

const choices = $derived(Array.isArray(props?.model?.choices) ? props.model.choices : []);
const shouldShuffleChoices = $derived.by(() => {
  const modelShuffle = !!props?.model?.shuffle;
  const optionsShuffle = !!props?.options?.shuffle;
  const lockChoiceOrder = !!props?.model?.lockChoiceOrder || !!props?.options?.lockChoiceOrder;
  return (modelShuffle || optionsShuffle) && !lockChoiceOrder;
});
const shuffleSeed = $derived.by(
  () =>
    `${props?.session?.id || props?.model?.id || instanceId}:${choices.map((c: McChoice) => c.id).join('|')}`
);
function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
function deterministicShuffle<T extends { id?: string }>(items: T[], seed: string): T[] {
  return [...items]
    .map((item, index) => ({
      item,
      key: hashString(`${seed}:${item?.id || index}:${index}`),
    }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.item);
}
const renderedChoices = $derived.by(() =>
  shouldShuffleChoices ? deterministicShuffle(choices, shuffleSeed) : choices
);
const choiceMode = $derived(props?.model?.choiceMode || 'text');
const selectedId = $derived(props?.session?.choiceId || localChoiceId || '');
const radioGroupName = $derived(`${instanceId}-choice-group-${props?.model?.id || '1'}`);

let showCorrectAnswer = $state(false);

const displayChoiceId = $derived.by(() => {
  if (isEvaluateMode && showCorrectAnswer && props?.model?.correctChoiceId) {
    return props.model.correctChoiceId;
  }
  return selectedId;
});

const displayChoice = $derived.by(() =>
  renderedChoices.find((c: McChoice) => c.id === displayChoiceId)
);

const legendText = $derived.by(() => {
  const plain = plainTextFromHtml(props?.model?.prompt || '');
  return plain.length > 120 ? `${plain.slice(0, 117)}…` : plain || t('answerChoices');
});

const promptId = $derived(`${instanceId}-prompt`);
const transcriptId = $derived(`${instanceId}-transcript`);
const legendId = $derived(`${instanceId}-choices-legend`);
const resultId = $derived(`${instanceId}-result`);

const choicesGroupLabelledBy = $derived(props?.model?.prompt ? promptId : legendId);

const templateDescribedBy = $derived.by(() => {
  const ids: string[] = [];
  if (props?.model?.prompt) ids.push(promptId);
  if (props?.model?.hasAudio && props?.model?.audioTranscript) {
    ids.push(transcriptId);
  }
  return ids.length ? ids.join(' ') : undefined;
});

const lang = $derived.by(() => {
  const locale = props?.model?.locale || '';
  return locale ? locale.slice(0, 2) : 'en';
});

const uiStrings = {
  en: {
    answerChoices: 'Answer choices',
    correctSelected: 'Correct answer selected',
    incorrectSelected: 'Incorrect answer selected',
    selectedAnswerInSentence: 'Selected answer in sentence',
    selectedAnswerImage: 'Selected answer image',
    showCorrect: 'Show correct answer',
    hideCorrect: 'Hide correct answer',
    enableAutoplay: 'Click to enable audio autoplay',
    listen: 'Listen',
    teacherInstructions: 'Teacher instructions',
  },
  es: {
    answerChoices: 'Opciones de respuesta',
    correctSelected: 'Respuesta correcta seleccionada',
    incorrectSelected: 'Respuesta incorrecta seleccionada',
    selectedAnswerInSentence: 'Respuesta seleccionada en la oración',
    selectedAnswerImage: 'Imagen de la respuesta seleccionada',
    showCorrect: 'Mostrar respuesta correcta',
    hideCorrect: 'Ocultar respuesta correcta',
    enableAutoplay: 'Haga clic para habilitar la reproducción automática de audio',
    listen: 'Escuchar',
    teacherInstructions: 'Instrucciones para el docente',
  },
} as const;
type UiKey = keyof (typeof uiStrings)['en'];
function t(key: UiKey): string {
  return (lang === 'es' ? uiStrings.es[key] : uiStrings.en[key]) || uiStrings.en[key];
}

const resultText = $derived.by(() => {
  if (!isEvaluateMode || showCorrectAnswer) return '';
  if (isCorrect) return t('correctSelected');
  if (isIncorrect && selectedId) return t('incorrectSelected');
  return '';
});

function emitSession(updatedSession: McSession) {
  props?.onSessionChange?.(updatedSession);
}

function onRadioChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.checked) return;
  const choiceId = input.value;
  localChoiceId = choiceId;
  const updatedSession = {
    ...props.session,
    id: props.session?.id || props.model?.id || '1',
    element: 'mc-populated-blank',
    choiceId,
  };
  emitSession(updatedSession);
}

function toggleCorrectAnswer() {
  showCorrectAnswer = !showCorrectAnswer;
}

function onRadioGroupKeydown(e: KeyboardEvent) {
  if (props?.model?.disabled) return;
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

function handleEnableAutoplayClick() {
  if (hasPlayableAudio && audioEl) {
    audioEl.play().finally(() => {
      autoPlayPromptOpen = false;
    });
    return;
  }
  if (hasTranscriptOnlyAudio) {
    speakTranscript();
    autoPlayPromptOpen = false;
  }
}

function onAudioPlaying() {
  isMediaPlaying = true;
  props?.onAudioStarted?.();
  autoPlayPromptOpen = false;
}

function onAudioEnded() {
  isMediaPlaying = false;
  props?.onAudioEnded?.();
}

function speechButtonLabel() {
  return t('listen');
}

const featureAudioSkin = $derived.by(() => {
  const locale = String(props?.model?.locale || '').toLowerCase();
  if (locale.startsWith('es')) {
    return {
      silentUrl:
        'https://assets.learnosity.com/organisations/844/27a9d5b5-d873-4bd5-b9ba-22748782d8ba.svg',
      playingUrl:
        'https://assets.learnosity.com/organisations/844/120f216d-96b7-4560-94b8-1d90710216b7.svg',
    };
  }
  return {
    silentUrl:
      'https://assets.learnosity.com/organisations/844/0c9f2aa3-3cd5-4de7-93ef-541c24ca35da.svg',
    playingUrl:
      'https://assets.learnosity.com/organisations/844/231dfdc2-c113-4be5-91fb-e75a0ca5994b.svg',
  };
});

function playFeatureAudio() {
  if (hasPlayableAudio && audioEl) {
    audioEl.play().catch(() => {
      // Keep behavior resilient: if playback is blocked, user can retry.
    });
    return;
  }
  speakTranscript();
}

function speakTranscript() {
  const transcript = (props?.model?.audioTranscript || '').trim();
  if (!transcript || !window?.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(transcript);
  utterance.lang = props?.model?.locale || 'en-US';

  utterance.onstart = () => {
    isSynthSpeaking = true;
    props?.onAudioStarted?.();
  };

  utterance.onend = () => {
    isSynthSpeaking = false;
    activeUtterance = null;
    props?.onAudioEnded?.();
  };

  utterance.onerror = () => {
    isSynthSpeaking = false;
    activeUtterance = null;
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

onDestroy(() => {
  if (activeUtterance && window?.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
});

$effect(() => {
  if (props?.session?.choiceId) {
    localChoiceId = props.session.choiceId;
  }
});

$effect(() => {
  if (!props?.model?.hasAudio || !props?.model?.autoplayAudioEnabled) return;
  if (autoplayAttempted) return;

  autoplayAttempted = true;
  if (audioEl && props?.model?.audioUrl) {
    // Browser autoplay restrictions vary. Try immediate play; if blocked show click-to-enable affordance.
    audioEl.play().catch(() => {
      autoPlayPromptOpen = true;
    });
    return;
  }

  if (props?.model?.audioTranscript) {
    autoPlayPromptOpen = true;
  }
});
</script>

<div
  class={`p-4 mc-populated-blank-root layout-${layoutProfile} ${hasInlineSentenceAudioLayout ? 'has-inline-audio' : ''} ${isVicFamilyLayout ? 'vic-family-layout' : ''} ${isSelVicFamilyLayout ? 'sel-vic-family-layout' : ''}`}
  lang={lang}
>
  {#if props?.model?.prompt}
    <div class="mb-4 prose" id={promptId}>{@html props.model.prompt}</div>
  {/if}

  {#if props?.model?.hasAudio}
    <div class="mb-4 audio-container">
      {#if hasPlayableAudio && useFeatureButtonAudio}
        <audio
          bind:this={audioEl}
          class="sr-only"
          preload="metadata"
          src={props.model.audioUrl}
          aria-hidden="true"
          tabindex="-1"
          onplaying={onAudioPlaying}
          onended={onAudioEnded}
        ></audio>
        <button
          class="listen-button rli-feature-audio"
          type="button"
          aria-label={speechButtonLabel()}
          onclick={playFeatureAudio}
        >
          <img
            class={`listen-feature-icon rli-feature-listen ${isMediaPlaying || isSynthSpeaking ? '' : 'listen-active'}`}
            src={featureAudioSkin.silentUrl}
            alt=""
            aria-hidden="true"
          />
          <img
            class={`listen-feature-icon rli-feature-listen ${isMediaPlaying || isSynthSpeaking ? 'listen-active' : ''}`}
            src={featureAudioSkin.playingUrl}
            alt=""
            aria-hidden="true"
          />
        </button>
      {:else if hasPlayableAudio}
        <audio
          bind:this={audioEl}
          controls
          class="w-full max-w-md"
          preload="metadata"
          src={props.model.audioUrl}
          aria-describedby={props?.model?.audioTranscript ? transcriptId : undefined}
          onplaying={onAudioPlaying}
          onended={onAudioEnded}
        >
          <track kind="captions" />
        </audio>
        {#if autoPlayPromptOpen}
          <button class="mt-2 text-sm underline" type="button" onclick={handleEnableAutoplayClick}>
            {t('enableAutoplay')}
          </button>
        {/if}
      {:else if hasTranscriptOnlyAudio}
        <button
          class="listen-button rli-feature-audio"
          type="button"
          aria-label={speechButtonLabel()}
          onclick={playFeatureAudio}
        >
          <img
            class={`listen-feature-icon rli-feature-listen ${isMediaPlaying || isSynthSpeaking ? '' : 'listen-active'}`}
            src={featureAudioSkin.silentUrl}
            alt=""
            aria-hidden="true"
          />
          <img
            class={`listen-feature-icon rli-feature-listen ${isMediaPlaying || isSynthSpeaking ? 'listen-active' : ''}`}
            src={featureAudioSkin.playingUrl}
            alt=""
            aria-hidden="true"
          />
        </button>
      {/if}
      {#if props?.model?.audioTranscript}
        <p
          class={`text-sm mt-2 text-gray-700 ${showVisibleTranscript ? '' : 'sr-only'}`}
          id={transcriptId}
        >
          {props.model.audioTranscript}
        </p>
      {/if}
    </div>
  {/if}

  {#if props?.model?.teacherInstructions}
    <div class="mb-4 teacher-instructions">
      <h4 class="teacher-instructions-title">{t('teacherInstructions')}</h4>
      <div class="prose teacher-instructions-content">{@html props.model.teacherInstructions}</div>
    </div>
  {/if}

  {#if props?.model?.sentenceHtml}
    <div class="mb-3 prose prose-p:my-1 sentence-line" aria-describedby={templateDescribedBy}>
      {@html props.model.sentenceHtml}
    </div>
  {/if}

  {#if !isAudioOnlyMode}
    <div class="mb-4 template-line" aria-describedby={templateDescribedBy}>
      {@html templateParts.before}
      <span
        class={`inline-flex items-center min-h-[1.5em] px-2 mx-1 border-b-2 border-gray-500 align-baseline blank-slot ${isBlankOnlyTemplate ? 'blank-slot-standalone' : ''}`}
        style={`width:${blankWidth};border-bottom-width:${blankBorderWidth};`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={t('selectedAnswerInSentence')}
      >
        {#if choiceMode === 'image' && displayChoice?.imageUrl}
          <img
            src={displayChoice.imageUrl}
            alt={displayChoice.imageAlt || t('selectedAnswerImage')}
            class="max-h-16 w-auto object-contain"
          />
        {:else if displayChoice?.labelHtml}
          <span class="blank-inner choice-label">{@html displayChoice.labelHtml}</span>
        {:else}
          <span class="blank-inner-empty" aria-hidden="true">&nbsp;</span>
        {/if}
      </span>
      {@html templateParts.after}
    </div>
  {/if}

  {#if isEvaluateMode && isIncorrect}
    <button
      type="button"
      class="mb-3 flex items-center gap-2 cursor-pointer select-none"
      onclick={toggleCorrectAnswer}
      aria-pressed={showCorrectAnswer}
    >
      <span class="text-sm hover:underline">
        {showCorrectAnswer ? t('hideCorrect') : t('showCorrect')}
      </span>
    </button>
  {/if}
  {#if resultText}
    <p id={resultId} class="sr-only" role="status" aria-live="polite">{resultText}</p>
  {/if}

  <fieldset class="border-0 p-0 m-0" disabled={props?.model?.disabled}>
    <legend class="sr-only" id={legendId}>{legendText}</legend>
    <div
      class={`gap-2 ${isHorizontalChoices ? 'flex flex-row flex-wrap items-start justify-center' : 'flex flex-col'}`}
      role="radiogroup"
      tabindex="-1"
      aria-labelledby={choicesGroupLabelledBy}
      aria-describedby={resultText ? resultId : undefined}
      onkeydown={onRadioGroupKeydown}
    >
      {#each renderedChoices as c (c.id)}
        <div
          class={`flex items-start gap-2 choice-row ${isHorizontalChoices ? 'choice-row-horizontal' : ''} ${((showCorrectAnswer && isEvaluateMode ? props?.model?.correctChoiceId : selectedId) === c.id) ? 'is-selected' : ''}`}
        >
          {#if isHorizontalChoices}
            <label for={`${instanceId}-opt-${c.id}`} class="cursor-pointer choice-tile text-center">
              <span class="choice-tile-content">
                {#if choiceMode === 'image' && c.imageUrl}
                  <img
                    src={c.imageUrl}
                    alt={c.imageAlt || `Choice ${c.id}`}
                    class="max-h-20 object-contain mx-auto"
                  />
                {:else}
                  <span class="choice-label">{@html c.labelHtml || ''}</span>
                {/if}
              </span>
              <input
                type="radio"
                name={radioGroupName}
                id={`${instanceId}-opt-${c.id}`}
                value={c.id}
                checked={
                  (showCorrectAnswer && isEvaluateMode ? props?.model?.correctChoiceId : selectedId) === c.id
                }
                disabled={props?.model?.disabled}
                onchange={onRadioChange}
                class="choice-radio-bottom"
              />
            </label>
          {:else}
            <input
              type="radio"
              name={radioGroupName}
              id={`${instanceId}-opt-${c.id}`}
              value={c.id}
              checked={
                (showCorrectAnswer && isEvaluateMode ? props?.model?.correctChoiceId : selectedId) === c.id
              }
              disabled={props?.model?.disabled}
              onchange={onRadioChange}
              class="mt-1"
            />
            <label for={`${instanceId}-opt-${c.id}`} class="cursor-pointer flex-1">
              {#if choiceMode === 'image' && c.imageUrl}
                <img src={c.imageUrl} alt={c.imageAlt || `Choice ${c.id}`} class="max-h-20 object-contain" />
              {:else}
                <span class="choice-label">{@html c.labelHtml || ''}</span>
              {/if}
            </label>
          {/if}
          {#if isEvaluateMode && !showCorrectAnswer}
            {#if selectedId === c.id && isCorrect}
              <span class="text-green-600 text-sm font-medium" aria-hidden="true">✓</span>
            {:else if selectedId === c.id && isIncorrect}
              <span class="text-red-600 text-sm font-medium" aria-hidden="true">✗</span>
            {/if}
          {/if}
        </div>
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
    width: 7rem;
  }

  .listen-button {
    width: 128px;
    height: 128px;
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
    width: 128px;
    height: 128px;
    object-fit: contain;
    display: none;
  }

  .listen-feature-icon.listen-active {
    display: block;
  }

  .choice-row-horizontal {
    flex-direction: column;
    align-items: center;
    width: min(170px, 30vw);
    gap: 0;
  }

  .choice-tile {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    min-height: 11rem;
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
    min-height: 7.5rem;
  }

  .choice-row-horizontal:hover .choice-tile {
    background: #f2f2f2;
  }

  .choice-row-horizontal.is-selected .choice-tile {
    background: #fcfcd3;
  }

  .choice-row-horizontal.is-selected:hover .choice-tile {
    background: #fcfcd3;
  }

  .choice-row:not(.choice-row-horizontal):hover {
    background: #f2f2f2;
    border-radius: 6px;
  }

  .choice-row.is-selected:not(.choice-row-horizontal) {
    background: #fcfcd3;
    border-radius: 6px;
  }

  :global(.access-contrast-3) .choice-row-horizontal,
  :global(.access-contrast-6) .choice-row-horizontal {
    border-bottom-width: 4px;
    border-bottom-style: solid;
    padding-bottom: 10px;
  }

  :global(.access-contrast-3) .choice-row:not(.choice-row-horizontal),
  :global(.access-contrast-6) .choice-row:not(.choice-row-horizontal) {
    border-left-width: 4px;
    border-left-style: solid;
    padding-left: 0.35rem;
  }

  :global(.access-contrast-3) .choice-row-horizontal,
  :global(.access-contrast-3) .choice-row:not(.choice-row-horizontal) {
    border-color: #2d4e84;
  }

  :global(.access-contrast-6) .choice-row-horizontal,
  :global(.access-contrast-6) .choice-row:not(.choice-row-horizontal) {
    border-color: #000;
  }

  :global(.access-contrast-3) .choice-row:hover,
  :global(.access-contrast-6) .choice-row:hover {
    border-radius: 0;
  }

  :global(.access-contrast-3) .choice-row:hover {
    border-color: #fff25d;
    color: #fff25d;
  }

  :global(.access-contrast-6) .choice-row:hover {
    border-color: #fff;
    color: #fff;
  }

  :global(.access-contrast-3) .choice-row:hover:not(.is-selected):not(.choice-row-horizontal),
  :global(.access-contrast-6) .choice-row:hover:not(.is-selected):not(.choice-row-horizontal) {
    background: inherit;
  }

  :global(.access-contrast-3) .choice-row-horizontal:hover:not(.is-selected) .choice-tile,
  :global(.access-contrast-6) .choice-row-horizontal:hover:not(.is-selected) .choice-tile {
    background: inherit;
  }

  :global(.access-contrast-3) .choice-row.is-selected:hover,
  :global(.access-contrast-6) .choice-row.is-selected:hover {
    color: #000;
  }

  :global(.access-contrast-3) .choice-row-horizontal.is-selected:hover .choice-tile,
  :global(.access-contrast-6) .choice-row-horizontal.is-selected:hover .choice-tile {
    background: #fcfcd3;
  }

  .choice-row-horizontal :global(p) {
    margin: 0;
    text-align: center;
  }

  .choice-label :global(p),
  .blank-inner :global(p) {
    margin: 0;
  }

  .teacher-instructions {
    border-left: 4px solid #60a5fa;
    background: #eff6ff;
    padding: 0.5rem 0.75rem;
    border-radius: 4px;
  }

  .teacher-instructions-title {
    margin: 0 0 0.3rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .vic-family-layout {
    margin-left: auto;
    margin-right: auto;
    max-width: 800px;
  }

  .vic-family-layout .choice-row {
    user-select: none;
    margin-right: 10px;
  }

  .sel-vic-family-layout {
    font-size: 1.5em;
  }

  .blank-inner {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .choice-radio-bottom {
    margin-top: 0.5rem;
  }

  .layout-audio_blank_only .audio-container,
  .layout-stimulus_image_blank .audio-container {
    display: flex;
    justify-content: flex-end;
  }

  .layout-audio_blank_only .template-line,
  .layout-stimulus_image_blank .template-line {
    text-align: center;
    margin: 0.8rem 0 1.8rem;
  }

  .layout-audio_blank_only .blank-slot,
  .layout-stimulus_image_blank .blank-slot {
    width: 10rem;
    border-bottom-width: 4px;
  }

  .layout-stimulus_image_blank {
    display: grid;
    grid-template-columns: minmax(210px, 1fr) auto;
    grid-template-areas:
      'sentence audio'
      '. template'
      'choices choices';
    column-gap: 2rem;
    row-gap: 0.7rem;
    align-items: start;
  }

  .layout-stimulus_image_blank .audio-container {
    grid-area: audio;
    margin: 0;
  }

  .layout-stimulus_image_blank .sentence-line {
    grid-area: sentence;
    margin: 0.2rem 0 0;
  }

  .layout-stimulus_image_blank .template-line {
    grid-area: template;
    margin: 0;
    text-align: center;
    justify-self: center;
  }

  .layout-stimulus_image_blank fieldset {
    grid-area: choices;
    margin-top: 0.9rem;
  }

  .layout-token_sequence {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) auto;
    grid-template-areas:
      'template audio'
      'choices choices';
    column-gap: 1.5rem;
    row-gap: 0.8rem;
    align-items: start;
  }

  .layout-token_sequence .audio-container {
    grid-area: audio;
    margin: 0;
    justify-self: end;
  }

  .layout-token_sequence .template-line {
    grid-area: template;
    margin: 0.6rem 0 0;
    justify-self: center;
    text-align: center;
  }

  .layout-token_sequence .template-line :global(span + span) {
    margin-left: 0.35rem;
  }

  .layout-token_sequence .blank-slot {
    width: 7rem;
    border-bottom-width: 4px;
    margin-left: 0.35rem;
  }

  .layout-token_sequence fieldset {
    grid-area: choices;
    margin-top: 0.2rem;
  }

  .layout-inline_sentence.has-inline-audio {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) auto;
    grid-template-areas:
      'template audio'
      'choices choices';
    column-gap: 1.5rem;
    row-gap: 0.65rem;
    align-items: start;
  }

  .layout-inline_sentence.has-inline-audio .audio-container {
    grid-area: audio;
    margin: 0;
    justify-self: end;
  }

  .layout-inline_sentence.has-inline-audio .template-line {
    grid-area: template;
    margin: 0.45rem 0 0;
    text-align: center;
    justify-self: center;
  }

  .layout-inline_sentence.has-inline-audio fieldset {
    grid-area: choices;
    margin-top: 0.25rem;
  }
</style>
