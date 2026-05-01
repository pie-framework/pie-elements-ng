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
import {
  ensureVariantCssInjected,
  getVariantCssConfig,
  getVariantRootClass,
} from './variant-css-map';
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
    blankUnderlineWideWidthPx: 6,
    horizontalChoiceTileMinHeightRem: 11.25,
    horizontalChoiceContentMinHeightRem: 9.375,
    choiceGroupGapRem: 1,
    audioBlankTemplateMarginBottomRem: 1.875,
  },
  stimulus_image_blank: {
    blankWideWidthRem: 10,
    blankUnderlineWideWidthPx: 6,
  },
  token_sequence: {
    blankStandaloneWidthRem: 7,
    blankUnderlineWideWidthPx: 6,
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

let { model, session } = $props<{ model?: any; session?: any; options?: any }>();
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
// Feeds: rootStyle, blankWidth, blankBorderWidth, choiceState, useFeatureButtonAudio
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
const hasPlayableAudio = $derived(!!model?.hasAudio && !!model?.audioUrl);
const hasAudioButMissingResource = $derived(!!model?.hasAudio && !model?.audioUrl);
const hasInlineSentenceAudioLayout = $derived(
  layoutProfile === 'inline_sentence' && !!model?.hasAudio
);
const showVisibleTranscript = $derived(!!model?.showVisibleTranscript);
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
  return { ...defaults, ...custom };
});
const layoutLimits = $derived.by(() => {
  const configured =
    model?.layoutLimits && typeof model.layoutLimits === 'object' ? model.layoutLimits : {};
  return {
    ...DEFAULT_LAYOUT_LIMITS,
    ...configured,
    ...profilePresetLimits,
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
  if (
    layoutProfile === 'audio_blank_only' ||
    layoutProfile === 'stimulus_image_blank' ||
    layoutProfile === 'token_sequence'
  ) {
    return `${layoutLimits.blankUnderlineWideWidthPx}px`;
  }
  return `${layoutLimits.blankUnderlineWidthPx}px`;
});

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
const choiceCorrectnessById = $derived.by(() => {
  const map = new Map<string, 'correct' | 'incorrect'>();
  const correctChoiceId = String(model?.correctChoiceId || '');
  const activeSelectedId = String(selectedId || '');

  if (!isEvaluateMode || !correctChoiceId) {
    return map;
  }
  if (showCorrectAnswer) {
    // Reveal mode: show only the canonical correct answer, not the student's selection.
    map.set(correctChoiceId, 'correct');
    return map;
  }
  if (!activeSelectedId) {
    map.set(correctChoiceId, 'incorrect');
    return map;
  }
  if (activeSelectedId === correctChoiceId) {
    map.set(correctChoiceId, 'correct');
    return map;
  }
  map.set(activeSelectedId, 'incorrect');
  map.set(correctChoiceId, 'incorrect');
  return map;
});

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
  const maxChars = Math.max(
    8,
    Number(layoutLimits.legendMaxChars) || DEFAULT_LAYOUT_LIMITS.legendMaxChars
  );
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
  hasAudioButMissingResource ? uiText.audioResourceUnavailable : ''
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
    correctAnswerStyleVars,
  ].join(';')
);

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

function handleEnableAutoplayClick() {
  if (hasPlayableAudio && audioEl) {
    audioEl.play().finally(() => {
      autoPlayPromptOpen = false;
    });
  }
}

function onAudioPlaying(e: Event) {
  const host = resolveDeliveryHost(e.currentTarget as HTMLElement, {
    fallbackSelector: 'mc-populated-blank',
  });
  isMediaPlaying = true;
  host?.onAudioStarted?.();
  autoPlayPromptOpen = false;
}

function onAudioEnded(e: Event) {
  const host = resolveDeliveryHost(e.currentTarget as HTMLElement, {
    fallbackSelector: 'mc-populated-blank',
  });
  isMediaPlaying = false;
  host?.onAudioEnded?.();
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

$effect(() => {
  ensureVariantCssInjected(variantCssConfig);
});
</script>

<div
  class={`p-4 mc-populated-blank-root pie-element pie-element-mc-populated-blank pie-delivery-root layout-${layoutProfile} ${variantRootClass} ${hasInlineSentenceAudioLayout ? 'has-inline-audio' : ''}`}
  lang={lang}
  style={rootStyle}
>
  {#if model?.prompt}
    <div class="mb-4 prose pie-prompt" id={promptId}>{@html model.prompt}</div>
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
