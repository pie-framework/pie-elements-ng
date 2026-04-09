<svelte:options
  customElement={{
    tag: 'mc-populated-blank',
    shadow: 'none',
    props: {
      model: { type: 'Object' },
      session: { type: 'Object' },
      options: { type: 'Object' },
    },
  }}
/>

<script lang="ts">
/** Must match controller `BLANK_TOKEN` (kept local to avoid pulling controller into delivery). */
const BLANK_TOKEN = '{{blank}}';
const DEFAULT_LAYOUT_LIMITS = {
  blankStandaloneWidthRem: 7,
  blankWideWidthRem: 10,
  blankUnderlineWidthPx: 2,
  blankUnderlineWideWidthPx: 4,
  horizontalChoiceWidthPx: 170,
  horizontalChoiceWidthVw: 30,
  horizontalChoiceTileMinHeightRem: 11,
  horizontalChoiceContentMinHeightRem: 7.5,
  selectedImageMaxHeightRem: 4,
  choiceImageMaxHeightRem: 5,
  listenButtonSizePx: 128,
  stimulusMinColumnPx: 210,
  textMinColumnPx: 260,
  legendMaxChars: 120,
  choiceGroupGapRem: 0.5,
  choiceRowGapRem: 0.5,
  toggleButtonGapRem: 0.5,
  horizontalChoiceRadioTopMarginRem: 0.5,
  audioBlankTemplateMarginTopRem: 0.8,
  audioBlankTemplateMarginBottomRem: 1.8,
  audioInstructionsMaxWidthPx: 875,
  narrowHorizontalChoiceMaxWidthPx: 230,
  stimulusGridColumnGapRem: 2,
  stimulusGridRowGapRem: 0.7,
  stimulusSentenceMarginTopRem: 0.2,
  stimulusChoicesMarginTopRem: 0.9,
  tokenGridColumnGapRem: 1.5,
  tokenGridRowGapRem: 0.8,
  tokenTemplateMarginTopRem: 0.6,
  tokenInlineTokenGapRem: 0.35,
  tokenChoicesMarginTopRem: 0.2,
  inlineGridColumnGapRem: 1.5,
  inlineGridRowGapRem: 0.65,
  inlineTemplateMarginTopRem: 0.45,
  inlineChoicesMarginTopRem: 0.25,
} as const;
const DEFAULT_LAYOUT_PROFILE_PRESETS: Record<string, Record<string, number>> = {
  audio_blank_only: {
    blankWideWidthRem: 10,
    blankUnderlineWideWidthPx: 4,
  },
  stimulus_image_blank: {
    blankWideWidthRem: 10,
    blankUnderlineWideWidthPx: 4,
  },
  token_sequence: {
    blankStandaloneWidthRem: 7,
    blankUnderlineWideWidthPx: 4,
  },
};
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
  listenLabelEn: 'Listen',
  listenLabelEs: 'Escuchar',
} as const;

let { model, session, options } = $props<{ model?: any; session?: any; options?: any }>();
let audioEl = $state<HTMLAudioElement | null>(null);
let isMediaPlaying = $state(false);
let localChoiceId = $state('');
let autoPlayPromptOpen = $state(false);
let autoplayAttempted = $state(false);
let featureAudioButtonEl = $state<HTMLButtonElement | null>(null);
let autoplayEnableButtonEl = $state<HTMLButtonElement | null>(null);
let toggleCorrectAnswerButtonEl = $state<HTMLButtonElement | null>(null);
let choicesGroupEl = $state<HTMLDivElement | null>(null);
const instanceId = `mc-populated-blank-${Math.random().toString(36).slice(2, 10)}`;

const isEvaluateMode = $derived(model?.env?.mode === 'evaluate');
const correctness = $derived(model?.correctness);
const isCorrect = $derived(correctness === 'correct');
const isIncorrect = $derived(correctness === 'incorrect');
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
const layoutProfile = $derived(model?.layoutProfile || '');
const choiceLayout = $derived(
  model?.choiceLayout || (isAudioOnlyMode || isBlankOnlyTemplate ? 'horizontal' : 'vertical')
);
const isHorizontalChoices = $derived(choiceLayout === 'horizontal');
const showVisibleTranscript = $derived(!!model?.showVisibleTranscript);
const hasPlayableAudio = $derived(!!model?.hasAudio && !!model?.audioUrl);
const hasAudioButMissingResource = $derived(!!model?.hasAudio && !model?.audioUrl);
const hasInlineSentenceAudioLayout = $derived(
  layoutProfile === 'inline_sentence' && !!model?.hasAudio
);
const uiText = $derived.by(() => ({
  ...DEFAULT_UI_TEXT,
  ...(model?.uiText || {}),
}));
const profilePresetLimits = $derived.by(() => {
  const profile = String(layoutProfile || '');
  const defaults = DEFAULT_LAYOUT_PROFILE_PRESETS[profile] || {};
  const customPresets =
    model?.layoutProfilePresets && typeof model.layoutProfilePresets === 'object'
      ? model.layoutProfilePresets
      : {};
  const custom =
    customPresets[profile] && typeof customPresets[profile] === 'object'
      ? customPresets[profile]
      : {};
  return {
    ...defaults,
    ...custom,
  };
});
const layoutLimits = $derived.by(() => {
  const configured =
    model?.layoutLimits && typeof model.layoutLimits === 'object' ? model.layoutLimits : {};
  return {
    ...DEFAULT_LAYOUT_LIMITS,
    ...profilePresetLimits,
    ...configured,
  };
});
const rootStyle = $derived.by(() =>
  [
    `--mpb-listen-button-size:${layoutLimits.listenButtonSizePx}px`,
    `--mpb-blank-standalone-width:${layoutLimits.blankStandaloneWidthRem}rem`,
    `--mpb-blank-wide-width:${layoutLimits.blankWideWidthRem}rem`,
    `--mpb-blank-underline-width:${layoutLimits.blankUnderlineWidthPx}px`,
    `--mpb-blank-underline-wide-width:${layoutLimits.blankUnderlineWideWidthPx}px`,
    `--mpb-selected-image-max-height:${layoutLimits.selectedImageMaxHeightRem}rem`,
    `--mpb-choice-image-max-height:${layoutLimits.choiceImageMaxHeightRem}rem`,
    `--mpb-choice-width-px:${layoutLimits.horizontalChoiceWidthPx}px`,
    `--mpb-choice-width-vw:${layoutLimits.horizontalChoiceWidthVw}vw`,
    `--mpb-choice-tile-min-height:${layoutLimits.horizontalChoiceTileMinHeightRem}rem`,
    `--mpb-choice-content-min-height:${layoutLimits.horizontalChoiceContentMinHeightRem}rem`,
    `--mpb-stimulus-min-column:${layoutLimits.stimulusMinColumnPx}px`,
    `--mpb-text-min-column:${layoutLimits.textMinColumnPx}px`,
    `--mpb-choice-group-gap:${layoutLimits.choiceGroupGapRem}rem`,
    `--mpb-choice-row-gap:${layoutLimits.choiceRowGapRem}rem`,
    `--mpb-toggle-button-gap:${layoutLimits.toggleButtonGapRem}rem`,
    `--mpb-horizontal-choice-radio-top-margin:${layoutLimits.horizontalChoiceRadioTopMarginRem}rem`,
    `--mpb-audio-blank-template-margin-top:${layoutLimits.audioBlankTemplateMarginTopRem}rem`,
    `--mpb-audio-blank-template-margin-bottom:${layoutLimits.audioBlankTemplateMarginBottomRem}rem`,
    `--mpb-audio-instructions-max-width:${layoutLimits.audioInstructionsMaxWidthPx}px`,
    `--mpb-narrow-choice-max-width:${layoutLimits.narrowHorizontalChoiceMaxWidthPx}px`,
    `--mpb-stimulus-grid-column-gap:${layoutLimits.stimulusGridColumnGapRem}rem`,
    `--mpb-stimulus-grid-row-gap:${layoutLimits.stimulusGridRowGapRem}rem`,
    `--mpb-stimulus-sentence-margin-top:${layoutLimits.stimulusSentenceMarginTopRem}rem`,
    `--mpb-stimulus-choices-margin-top:${layoutLimits.stimulusChoicesMarginTopRem}rem`,
    `--mpb-token-grid-column-gap:${layoutLimits.tokenGridColumnGapRem}rem`,
    `--mpb-token-grid-row-gap:${layoutLimits.tokenGridRowGapRem}rem`,
    `--mpb-token-template-margin-top:${layoutLimits.tokenTemplateMarginTopRem}rem`,
    `--mpb-token-inline-token-gap:${layoutLimits.tokenInlineTokenGapRem}rem`,
    `--mpb-token-choices-margin-top:${layoutLimits.tokenChoicesMarginTopRem}rem`,
    `--mpb-inline-grid-column-gap:${layoutLimits.inlineGridColumnGapRem}rem`,
    `--mpb-inline-grid-row-gap:${layoutLimits.inlineGridRowGapRem}rem`,
    `--mpb-inline-template-margin-top:${layoutLimits.inlineTemplateMarginTopRem}rem`,
    `--mpb-inline-choices-margin-top:${layoutLimits.inlineChoicesMarginTopRem}rem`,
  ].join(';')
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

const templateParts = $derived.by(() => {
  const t = model?.template || '';
  const idx = t.indexOf(BLANK_TOKEN);
  if (idx < 0) {
    return { before: t, after: '' };
  }
  return {
    before: t.slice(0, idx),
    after: t.slice(idx + BLANK_TOKEN.length),
  };
});
const blankWidth = $derived.by(() => {
  if (layoutProfile === 'audio_blank_only' || layoutProfile === 'stimulus_image_blank') {
    return `${layoutLimits.blankWideWidthRem}rem`;
  }
  if (isBlankOnlyTemplate) {
    return `${layoutLimits.blankStandaloneWidthRem}rem`;
  }
  return 'auto';
});
const blankBorderWidth = $derived.by(() => {
  if (layoutProfile === 'audio_blank_only' || layoutProfile === 'stimulus_image_blank') {
    return `${layoutLimits.blankUnderlineWideWidthPx}px`;
  }
  return `${layoutLimits.blankUnderlineWidthPx}px`;
});

const choices = $derived(Array.isArray(model?.choices) ? model.choices : []);
const choiceMode = $derived(model?.choiceMode || 'text');
const selectedId = $derived(session?.choiceId || localChoiceId || '');
const radioGroupName = $derived(`${instanceId}-choice-group-${model?.id || '1'}`);

let showCorrectAnswer = $state(false);

const displayChoiceId = $derived.by(() => {
  if (isEvaluateMode && showCorrectAnswer && model?.correctChoiceId) {
    return model.correctChoiceId;
  }
  return selectedId;
});

const displayChoice = $derived.by(() => choices.find((c: any) => c.id === displayChoiceId));

const legendText = $derived.by(() => {
  const plain = (model?.prompt || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const maxChars = Math.max(
    8,
    Number(layoutLimits.legendMaxChars) || DEFAULT_LAYOUT_LIMITS.legendMaxChars
  );
  return plain.length > maxChars
    ? `${plain.slice(0, Math.max(1, maxChars - 1))}…`
    : plain || uiText.answerChoices;
});

const promptId = $derived(`${instanceId}-prompt`);
const transcriptId = $derived(`${instanceId}-transcript`);
const legendId = $derived(`${instanceId}-choices-legend`);
const resultId = $derived(`${instanceId}-result`);

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
  if (model?.hasAudio && model?.audioTranscript) {
    ids.push(transcriptId);
  }
  return ids.length ? ids.join(' ') : undefined;
});

const lang = $derived.by(() => {
  const locale = model?.locale || '';
  return locale ? locale.slice(0, 2) : 'en';
});
const audioErrorMessage = $derived.by(() =>
  hasAudioButMissingResource ? uiText.audioResourceUnavailable : ''
);

const resultText = $derived.by(() => {
  if (!isEvaluateMode || showCorrectAnswer) return '';
  if (isCorrect) return 'Correct answer selected';
  if (isIncorrect && selectedId) return 'Incorrect answer selected';
  return '';
});

function emitSession(updatedSession: any, sourceEl?: HTMLElement | null) {
  const host = getHostElement(sourceEl);
  if (host?.onSessionChange) {
    host.onSessionChange(updatedSession);
    return;
  }
  host?.dispatchEvent(
    new CustomEvent('session-changed', {
      bubbles: true,
      composed: true,
      detail: { complete: !!updatedSession?.choiceId, component: 'mc-populated-blank' },
    })
  );
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
  showCorrectAnswer = !showCorrectAnswer;
}

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

function handleEnableAutoplayClick() {
  if (hasPlayableAudio && audioEl) {
    audioEl.play().finally(() => {
      autoPlayPromptOpen = false;
    });
  }
}

function onAudioPlaying(e: Event) {
  const host = getHostElement(e.currentTarget as HTMLElement);
  isMediaPlaying = true;
  host?.onAudioStarted?.();
  autoPlayPromptOpen = false;
}

function onAudioEnded(e: Event) {
  const host = getHostElement(e.currentTarget as HTMLElement);
  isMediaPlaying = false;
  host?.onAudioEnded?.();
}

function getHostElement(sourceEl?: HTMLElement | null) {
  let cursor: HTMLElement | null | undefined = sourceEl;
  while (cursor) {
    const maybeHost = cursor as any;
    if (
      typeof maybeHost?.onSessionChange === 'function' ||
      typeof maybeHost?.onAudioStarted === 'function' ||
      typeof maybeHost?.onAudioEnded === 'function'
    ) {
      return maybeHost;
    }
    cursor = cursor.parentElement;
  }
  return (document.querySelector('mc-populated-blank') as any) || null;
}

function speechButtonLabel(locale = '') {
  return locale.toLowerCase().startsWith('es') ? uiText.listenLabelEs : uiText.listenLabelEn;
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

function playFeatureAudio() {
  if (hasPlayableAudio && audioEl) {
    audioEl.play().catch(() => {
      // Keep behavior resilient: if playback is blocked, user can retry.
    });
  }
}

$effect(() => {
  if (session?.choiceId) {
    localChoiceId = session.choiceId;
  }
});

$effect(() => {
  const el = audioEl;
  if (!el) return;
  const handlePlaying = (e: Event) => onAudioPlaying(e);
  const handleEnded = (e: Event) => onAudioEnded(e);
  el.addEventListener('playing', handlePlaying);
  el.addEventListener('ended', handleEnded);
  return () => {
    el.removeEventListener('playing', handlePlaying);
    el.removeEventListener('ended', handleEnded);
  };
});

$effect(() => {
  const btn = featureAudioButtonEl;
  if (!btn) return;
  const handleClick = () => playFeatureAudio();
  btn.addEventListener('click', handleClick);
  return () => {
    btn.removeEventListener('click', handleClick);
  };
});

$effect(() => {
  const btn = autoplayEnableButtonEl;
  if (!btn) return;
  const handleClick = () => handleEnableAutoplayClick();
  btn.addEventListener('click', handleClick);
  return () => {
    btn.removeEventListener('click', handleClick);
  };
});

$effect(() => {
  const btn = toggleCorrectAnswerButtonEl;
  if (!btn) return;
  const handleClick = () => toggleCorrectAnswer();
  btn.addEventListener('click', handleClick);
  return () => {
    btn.removeEventListener('click', handleClick);
  };
});

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
  if (autoplayAttempted) return;

  autoplayAttempted = true;
  if (audioEl && model?.audioUrl) {
    // Browser autoplay restrictions vary. Try immediate play; if blocked show click-to-enable affordance.
    audioEl.play().catch(() => {
      autoPlayPromptOpen = true;
    });
  }
});
</script>

<div
  class={`p-4 mc-populated-blank-root pie-element pie-element-mc-populated-blank pie-delivery-root layout-${layoutProfile} ${hasInlineSentenceAudioLayout ? 'has-inline-audio' : ''}`}
  lang={lang}
  style={rootStyle}
>
  {#if model?.prompt}
    <div class="mb-4 prose pie-prompt" id={promptId}>{@html model.prompt}</div>
  {/if}

  {#if model?.hasAudio}
    <div class="mb-4 audio-container pie-audio-container">
      {#if hasPlayableAudio && useFeatureButtonAudio}
        <audio
          bind:this={audioEl}
          class="sr-only pie-audio-player"
          preload="metadata"
          src={model.audioUrl}
          aria-hidden="true"
          tabindex="-1"
        ></audio>
        <button
          bind:this={featureAudioButtonEl}
          class="listen-button pie-listen-button rli-feature-audio"
          type="button"
          aria-label={speechButtonLabel(model?.locale)}
        >
          <img
            class={`listen-feature-icon pie-listen-icon rli-feature-listen ${isMediaPlaying ? '' : 'listen-active'}`}
            src={featureAudioSkin.silentUrl}
            alt=""
            aria-hidden="true"
          />
          <img
            class={`listen-feature-icon pie-listen-icon rli-feature-listen ${isMediaPlaying ? 'listen-active' : ''}`}
            src={featureAudioSkin.playingUrl}
            alt=""
            aria-hidden="true"
          />
        </button>
      {:else if hasPlayableAudio}
        <audio
          bind:this={audioEl}
          controls
          class="w-full max-w-md pie-audio-player"
          preload="metadata"
          src={model.audioUrl}
          aria-describedby={model?.audioTranscript ? transcriptId : undefined}
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
      {:else if hasAudioButMissingResource}
        <p class="text-sm text-red-700 pie-audio-error" role="alert">{audioErrorMessage}</p>
      {/if}
      {#if model?.audioTranscript}
        <p
          class={`text-sm mt-2 text-gray-700 pie-audio-transcript ${showVisibleTranscript ? '' : 'sr-only'}`}
          id={transcriptId}
        >
          <strong>{uiText.transcriptLabel}:</strong> {model.audioTranscript}
        </p>
      {/if}
    </div>
  {/if}

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
        style={`width:${blankWidth};border-bottom-width:${blankBorderWidth};`}
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
        {:else if displayChoice?.labelHtml}
          <span class="blank-inner choice-label pie-blank-value">{@html displayChoice.labelHtml}</span>
        {:else}
          <span class="blank-inner-empty" aria-hidden="true">&nbsp;</span>
        {/if}
      </span>
      {@html templateParts.after}
    </div>
  {/if}

  {#if isEvaluateMode && isIncorrect}
    <button
      bind:this={toggleCorrectAnswerButtonEl}
      type="button"
      class="mb-3 flex items-center cursor-pointer select-none pie-toggle-correct-answer"
      style="gap:var(--mpb-toggle-button-gap, 0.5rem);"
      aria-pressed={showCorrectAnswer}
    >
      <span class="text-sm hover:underline">
        {showCorrectAnswer ? uiText.hideCorrectAnswer : uiText.showCorrectAnswer}
      </span>
    </button>
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
      {#each choices as c (c.id)}
        <div
          class={`flex items-start choice-row pie-choice ${isHorizontalChoices ? 'choice-row-horizontal pie-choice-horizontal' : ''} ${((showCorrectAnswer && isEvaluateMode ? model?.correctChoiceId : selectedId) === c.id) ? 'is-selected pie-choice-selected' : ''}`}
          style="gap:var(--mpb-choice-row-gap, 0.5rem);"
        >
          {#if isHorizontalChoices}
            <label
              for={`${instanceId}-opt-${c.id}`}
              class="cursor-pointer choice-tile text-center pie-choice-tile"
            >
              <span class="choice-tile-content pie-choice-tile-content">
                {#if choiceMode === 'image' && c.imageUrl}
                  <img
                    src={c.imageUrl}
                    alt={c.imageAlt || `Choice ${c.id}`}
                    class="object-contain mx-auto pie-choice-image"
                    style="max-height:var(--mpb-choice-image-max-height, 5rem);"
                  />
                {:else}
                  <span class="choice-label pie-choice-label">{@html c.labelHtml || ''}</span>
                {/if}
              </span>
              <input
                type="radio"
                name={radioGroupName}
                id={`${instanceId}-opt-${c.id}`}
                value={c.id}
                checked={
                  (showCorrectAnswer && isEvaluateMode ? model?.correctChoiceId : selectedId) === c.id
                }
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
              checked={
                (showCorrectAnswer && isEvaluateMode ? model?.correctChoiceId : selectedId) === c.id
              }
              disabled={model?.disabled}
              class="choice-radio-inline pie-choice-radio pie-choice-radio-inline"
            />
            <label for={`${instanceId}-opt-${c.id}`} class="cursor-pointer flex-1 pie-choice-label-wrap">
              {#if choiceMode === 'image' && c.imageUrl}
                <img
                  src={c.imageUrl}
                  alt={c.imageAlt || `Choice ${c.id}`}
                  class="object-contain pie-choice-image"
                  style="max-height:var(--mpb-choice-image-max-height, 5rem);"
                />
              {:else}
                <span class="choice-label pie-choice-label">{@html c.labelHtml || ''}</span>
              {/if}
            </label>
          {/if}
          {#if isEvaluateMode && !showCorrectAnswer}
            {#if selectedId === c.id && isCorrect}
              <span class="text-green-600 text-sm font-medium pie-choice-feedback-correct" aria-hidden="true">
                ✓
              </span>
            {:else if selectedId === c.id && isIncorrect}
              <span class="text-red-600 text-sm font-medium pie-choice-feedback-incorrect" aria-hidden="true">
                ✗
              </span>
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
    width: var(--mpb-blank-standalone-width, 7rem);
  }

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

  .choice-row-horizontal {
    flex-direction: column;
    align-items: center;
    width: min(var(--mpb-choice-width-px, 170px), var(--mpb-choice-width-vw, 30vw));
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
    background: #ececec;
  }

  .choice-row-horizontal.is-selected .choice-tile {
    background: #eceabf;
  }

  .choice-row-horizontal.is-selected:hover .choice-tile {
    background: #eceabf;
  }

  .choice-row-horizontal :global(p) {
    margin: 0;
    text-align: center;
  }

  .choice-label :global(p),
  .blank-inner :global(p) {
    margin: 0;
  }

  .blank-inner {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .choice-radio-bottom {
    margin-top: var(--mpb-horizontal-choice-radio-top-margin, 0.5rem);
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

  .layout-audio_blank_only .blank-slot,
  .layout-stimulus_image_blank .blank-slot {
    width: var(--mpb-blank-wide-width, 10rem);
    border-bottom-width: var(--mpb-blank-underline-wide-width, 4px);
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
