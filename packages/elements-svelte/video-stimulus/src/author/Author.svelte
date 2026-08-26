<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
    },
  }}
/>

<script lang="ts">
import type { MediaSource, TextTrackRef, TranscriptRef } from '@pie-element/shared-types';
import { createEventDispatcher } from 'svelte';
import {
  createDefaultModel,
  model as buildViewModel,
  reviewAccessibility,
  validate,
  validateDraft,
} from '../controller/index.js';
import VideoStimulus from '../delivery/VideoStimulus.svelte';
import type {
  AccessibilityFinding,
  AudioContentDeclaration,
  CaptionSupportDeclaration,
  VideoStimulusAccessibilityProfile,
  VideoStimulusFieldKey,
  VideoStimulusModel,
  VideoStimulusValidationErrors,
  VisualSupportDeclaration,
} from '../types.js';
import {
  AUTHOR_MESSAGES,
  localizeAuthorFinding,
  resolveAuthorLocale,
  type AuthorMessageKey,
} from './i18n.js';

type ModelUpdatedDetail = {
  update: VideoStimulusModel;
  reset: false;
};

let {
  model: suppliedModel,
  onChange,
  locale = 'en',
}: {
  model?: VideoStimulusModel;
  onChange?: (model: VideoStimulusModel) => void;
  locale?: string;
} = $props();

const dispatch = createEventDispatcher<{ 'model.updated': ModelUpdatedDetail }>();
const authorPropsId = $props.id();
const authorInstanceId = `video-stimulus-author-${authorPropsId}`;
const errorsHeadingId = `${authorInstanceId}-errors-heading`;
const warningsHeadingId = `${authorInstanceId}-warnings-heading`;
const previewHeadingId = `${authorInstanceId}-preview-heading`;
let workingModel = $state<VideoStimulusModel>(createDefaultModel());
let lastSuppliedModel: VideoStimulusModel | undefined;
let errors = $state<VideoStimulusValidationErrors>({});
let warnings = $state<AccessibilityFinding[]>([]);
let editorPercent = $state(48);

const authorLocale = $derived(resolveAuthorLocale(locale));
const messages = $derived(AUTHOR_MESSAGES[authorLocale]);
const previewModel = $derived(buildViewModel(workingModel, undefined, { mode: 'view' }));
const errorEntries = $derived(
  Object.entries(errors).filter((entry): entry is [VideoStimulusFieldKey, string] =>
    Boolean(entry[1])
  )
);

$effect(() => {
  const incomingModel = suppliedModel;
  if (incomingModel !== lastSuppliedModel) {
    lastSuppliedModel = incomingModel;
    const nextWorkingModel = createDefaultModel(incomingModel ?? {});
    workingModel = nextWorkingModel;
    errors = {};
    warnings = reviewAccessibility(nextWorkingModel).warnings;
  }
});

function t(key: AuthorMessageKey): string {
  return messages[key];
}

function fieldId(field: VideoStimulusFieldKey): string {
  return `${authorInstanceId}-${field.replace(/[^a-z0-9]+/gi, '-')}`;
}

function fieldTargetId(field: VideoStimulusFieldKey): string {
  if (
    field === 'model' ||
    field === 'media' ||
    field === 'media.version' ||
    field === 'media.kind' ||
    field === 'media.thumbnail' ||
    field === 'media.durationSeconds'
  ) {
    return fieldId('media.id');
  }
  return fieldId(field);
}

function localizedFinding(message: string): string {
  return localizeAuthorFinding(message, authorLocale);
}

function errorFor(field: VideoStimulusFieldKey): string | undefined {
  const message = errors[field];
  return message ? localizedFinding(message) : undefined;
}

function inputValue(event: Event): string {
  return (event.currentTarget as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
}

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function runReview(strict: boolean): void {
  const accessibility = reviewAccessibility(workingModel);
  warnings = accessibility.warnings;
  errors = strict ? validate(workingModel) : validateDraft(workingModel);
}

function emit(nextModel: VideoStimulusModel): void {
  workingModel = nextModel;
  onChange?.(nextModel);
  dispatch('model.updated', { update: nextModel, reset: false });
  runReview(false);
}

function updateRoot(patch: Partial<VideoStimulusModel>): void {
  emit({ ...workingModel, ...patch });
}

function updateMedia(patch: Partial<VideoStimulusModel['media']>): void {
  emit({
    ...workingModel,
    media: {
      ...workingModel.media,
      ...patch,
    },
  });
}

function updatePresentation(
  field: keyof NonNullable<VideoStimulusModel['presentation']>,
  value: boolean
): void {
  updateRoot({
    presentation: {
      ...workingModel.presentation,
      [field]: value,
    },
  });
}

function addSource(): void {
  updateMedia({
    sources: [...workingModel.media.sources, { src: '', type: 'video/mp4' }],
  });
}

function updateSource(index: number, patch: Partial<MediaSource>): void {
  const sources = workingModel.media.sources.map((source: MediaSource, sourceIndex: number) =>
    sourceIndex === index ? { ...source, ...patch } : { ...source }
  );
  updateMedia({ sources });
}

function removeSource(index: number): void {
  updateMedia({
    sources: workingModel.media.sources
      .filter((_: MediaSource, sourceIndex: number) => sourceIndex !== index)
      .map((source: MediaSource) => ({ ...source })),
  });
}

function moveSource(index: number, direction: -1 | 1): void {
  const target = index + direction;
  if (target < 0 || target >= workingModel.media.sources.length) return;
  const sources = workingModel.media.sources.map((source: MediaSource) => ({ ...source }));
  [sources[index], sources[target]] = [sources[target], sources[index]];
  updateMedia({ sources });
}

function addTrack(): void {
  const track: TextTrackRef = {
    src: '',
    kind: 'captions',
    lang: workingModel.media.lang || 'en',
    label: 'Captions',
  };
  updateMedia({ tracks: [...(workingModel.media.tracks ?? []), track] });
}

function updateTrack(index: number, patch: Partial<TextTrackRef>): void {
  const tracks = (workingModel.media.tracks ?? []).map((track: TextTrackRef, trackIndex: number) =>
    trackIndex === index ? { ...track, ...patch } : { ...track }
  );
  updateMedia({ tracks });
}

function setDefaultTrack(index: number, selected: boolean): void {
  const tracks = (workingModel.media.tracks ?? []).map(
    (track: TextTrackRef, trackIndex: number) => ({
      ...track,
      default: selected ? trackIndex === index : trackIndex === index ? false : track.default,
    })
  );
  updateMedia({ tracks });
}

function removeTrack(index: number): void {
  updateMedia({
    tracks: (workingModel.media.tracks ?? [])
      .filter((_: TextTrackRef, trackIndex: number) => trackIndex !== index)
      .map((track: TextTrackRef) => ({ ...track })),
  });
}

function moveTrack(index: number, direction: -1 | 1): void {
  const tracks = (workingModel.media.tracks ?? []).map((track: TextTrackRef) => ({ ...track }));
  const target = index + direction;
  if (target < 0 || target >= tracks.length) return;
  [tracks[index], tracks[target]] = [tracks[target], tracks[index]];
  updateMedia({ tracks });
}

function updateTranscript(patch: Partial<TranscriptRef>): void {
  updateMedia({
    transcript: {
      ...(workingModel.media.transcript ?? {}),
      ...patch,
    },
  });
}

function updateAccessibility(
  field: keyof VideoStimulusAccessibilityProfile,
  value: AudioContentDeclaration | CaptionSupportDeclaration | VisualSupportDeclaration
): void {
  updateRoot({
    accessibilityProfile: {
      ...workingModel.accessibilityProfile,
      [field]: value,
    },
  });
}

function adjustEditorWidth(nextPercent: number): void {
  editorPercent = Math.min(70, Math.max(30, nextPercent));
}

function handleSplitterKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    adjustEditorWidth(editorPercent - 2);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    adjustEditorWidth(editorPercent + 2);
  } else if (event.key === 'Home') {
    event.preventDefault();
    adjustEditorWidth(30);
  } else if (event.key === 'End') {
    event.preventDefault();
    adjustEditorWidth(70);
  }
}
</script>

<div class="video-stimulus-author" lang={authorLocale}>
  <header class="author-header">
    <div>
      <h1>{t('heading')}</h1>
      <p>{t('intro')}</p>
    </div>
    <div class="review-actions">
      <button type="button" class="secondary-button" onclick={() => runReview(false)}>
        {t('reviewDraft')}
      </button>
      <button type="button" class="primary-button" onclick={() => runReview(true)}>
        {t('reviewForPublish')}
      </button>
    </div>
  </header>

  {#if errorEntries.length > 0 || warnings.length > 0}
    <div class="review-results" aria-live="polite">
      {#if errorEntries.length > 0}
        <section class="review-summary errors" aria-labelledby={errorsHeadingId}>
          <h2 id={errorsHeadingId}><span aria-hidden="true">!</span> {t('errorsHeading')}</h2>
          <ul>
            {#each errorEntries as [field, message]}
              <li><a href={`#${fieldTargetId(field)}`}>{localizedFinding(message)}</a></li>
            {/each}
          </ul>
        </section>
      {/if}
      {#if warnings.length > 0}
        <section class="review-summary warnings" aria-labelledby={warningsHeadingId}>
          <h2 id={warningsHeadingId}><span aria-hidden="true">i</span> {t('warningsHeading')}</h2>
          <ul>
            {#each warnings as warning}
              <li><a href={`#${fieldTargetId(warning.field)}`}>{localizedFinding(warning.message)}</a></li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>
  {/if}

  <div
    class="author-shell"
    style={`grid-template-columns: minmax(22rem, ${editorPercent}%) 1.5rem minmax(22rem, 1fr);`}
  >
    <form class="editor-panel" onfocusout={() => runReview(false)} onsubmit={(event) => event.preventDefault()}>
      <details class="form-section" open>
        <summary><span>1</span> {t('basics')}</summary>
        <div class="section-content field-grid">
          <label class="field">
            <span>{t('assetId')}</span>
            <input
              id={fieldId('media.id')}
              type="text"
              value={workingModel.media.id}
              aria-invalid={Boolean(errorFor('media.id'))}
              onchange={(event) => updateMedia({ id: inputValue(event) })}
            />
            {#if errorFor('media.id')}<small class="field-error">{errorFor('media.id')}</small>{/if}
          </label>
          <label class="field">
            <span>{t('videoLabel')}</span>
            <input
              id={fieldId('media.label')}
              type="text"
              value={workingModel.media.label ?? ''}
              aria-invalid={Boolean(errorFor('media.label'))}
              onchange={(event) => updateMedia({ label: inputValue(event) })}
            />
            {#if errorFor('media.label')}<small class="field-error">{errorFor('media.label')}</small>{/if}
          </label>
          <label class="field full">
            <span>{t('description')}</span>
            <textarea
              id={fieldId('media')}
              value={workingModel.media.description ?? ''}
              onchange={(event) => updateMedia({ description: inputValue(event) })}
            ></textarea>
          </label>
          <label class="field">
            <span>{t('mediaLanguage')}</span>
            <input
              id={fieldId('media.lang')}
              type="text"
              value={workingModel.media.lang ?? ''}
              aria-invalid={Boolean(errorFor('media.lang'))}
              onchange={(event) => updateMedia({ lang: inputValue(event) })}
            />
            {#if errorFor('media.lang')}<small class="field-error">{errorFor('media.lang')}</small>{/if}
          </label>
          <label class="field">
            <span>{t('uiLanguage')}</span>
            <input
              id={fieldId('language')}
              type="text"
              value={workingModel.language ?? ''}
              aria-invalid={Boolean(errorFor('language'))}
              onchange={(event) => updateRoot({ language: inputValue(event) })}
            />
            {#if errorFor('language')}<small class="field-error">{errorFor('language')}</small>{/if}
          </label>
          <div class="field full checkbox-grid">
            <label>
              <input
                type="checkbox"
                checked={workingModel.presentation?.showLabel !== false}
                onchange={(event) =>
                  updatePresentation('showLabel', (event.currentTarget as HTMLInputElement).checked)}
              />
              <span>{t('showLabel')}</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={workingModel.presentation?.showDescription !== false}
                onchange={(event) =>
                  updatePresentation('showDescription', (event.currentTarget as HTMLInputElement).checked)}
              />
              <span>{t('showDescription')}</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={workingModel.presentation?.transcriptInitiallyExpanded === true}
                onchange={(event) =>
                  updatePresentation(
                    'transcriptInitiallyExpanded',
                    (event.currentTarget as HTMLInputElement).checked
                  )}
              />
              <span>{t('transcriptInitiallyExpanded')}</span>
            </label>
          </div>
        </div>
      </details>

      <details class="form-section" open>
        <summary><span>2</span> {t('sources')}</summary>
        <div class="section-content" id={fieldId('media.sources')}>
          <div class="section-toolbar">
            <p>{workingModel.media.sources.length === 0 ? t('emptySources') : ''}</p>
            <button type="button" class="secondary-button" onclick={addSource} data-testid="add-source">
              {t('addSource')}
            </button>
          </div>
          {#if errorFor('media.sources')}
            <p class="field-error">{errorFor('media.sources')}</p>
          {/if}
          <ol class="row-list">
            {#each workingModel.media.sources as source, index}
              <li class="repeat-row">
                <div class="row-heading">
                  <strong>{t('source')} {index + 1}</strong>
                  <div class="row-actions">
                    <button type="button" onclick={() => moveSource(index, -1)} disabled={index === 0} aria-label={`${t('moveUp')}: ${t('source')} ${index + 1}`}>↑</button>
                    <button type="button" onclick={() => moveSource(index, 1)} disabled={index === workingModel.media.sources.length - 1} aria-label={`${t('moveDown')}: ${t('source')} ${index + 1}`}>↓</button>
                    <button type="button" class="danger-button" onclick={() => removeSource(index)} aria-label={`${t('remove')}: ${t('source')} ${index + 1}`}>×</button>
                  </div>
                </div>
                <div class="field-grid compact">
                  <label class="field full">
                    <span>{t('sourceUrl')}</span>
                    <input
                      id={fieldId(`media.sources.${index}.src`)}
                      type="url"
                      value={source.src}
                      aria-invalid={Boolean(errorFor(`media.sources.${index}.src`))}
                      onchange={(event) => updateSource(index, { src: inputValue(event) })}
                    />
                    {#if errorFor(`media.sources.${index}.src`)}<small class="field-error">{errorFor(`media.sources.${index}.src`)}</small>{/if}
                  </label>
                  <label class="field full">
                    <span>{t('mimeType')}</span>
                    <input
                      id={fieldId(`media.sources.${index}.type`)}
                      type="text"
                      value={source.type ?? ''}
                      aria-invalid={Boolean(errorFor(`media.sources.${index}.type`))}
                      onchange={(event) => updateSource(index, { type: inputValue(event) })}
                    />
                    {#if errorFor(`media.sources.${index}.type`)}<small class="field-error">{errorFor(`media.sources.${index}.type`)}</small>{/if}
                  </label>
                  {#each ['width', 'height', 'bitrate'] as numericField}
                    <label class="field">
                      <span>{t(numericField as 'width' | 'height' | 'bitrate')}</span>
                      <input
                        id={fieldId(`media.sources.${index}.${numericField}` as VideoStimulusFieldKey)}
                        type="number"
                        min="1"
                        value={source[numericField as 'width' | 'height' | 'bitrate'] ?? ''}
                        aria-invalid={Boolean(errorFor(`media.sources.${index}.${numericField}` as VideoStimulusFieldKey))}
                        onchange={(event) =>
                          updateSource(index, {
                            [numericField]: optionalNumber(inputValue(event)),
                          })}
                      />
                      {#if errorFor(`media.sources.${index}.${numericField}` as VideoStimulusFieldKey)}<small class="field-error">{errorFor(`media.sources.${index}.${numericField}` as VideoStimulusFieldKey)}</small>{/if}
                    </label>
                  {/each}
                </div>
              </li>
            {/each}
          </ol>
        </div>
      </details>

      <details class="form-section">
        <summary><span>3</span> {t('poster')}</summary>
        <div class="section-content field-grid">
          <label class="field full">
            <span>{t('posterUrl')}</span>
            <input
              id={fieldId('media.poster')}
              type="url"
              value={workingModel.media.poster ?? ''}
              aria-invalid={Boolean(errorFor('media.poster'))}
              onchange={(event) => updateMedia({ poster: inputValue(event) })}
            />
            {#if errorFor('media.poster')}<small class="field-error">{errorFor('media.poster')}</small>{/if}
          </label>
        </div>
      </details>

      <details class="form-section" open>
        <summary><span>4</span> {t('tracks')}</summary>
        <div class="section-content" id={fieldId('media.tracks')}>
          <p class="section-help">{t('tracksHelp')}</p>
          <div class="section-toolbar">
            <p>{(workingModel.media.tracks ?? []).length === 0 ? t('emptyTracks') : ''}</p>
            <button type="button" class="secondary-button" onclick={addTrack} data-testid="add-track">
              {t('addTrack')}
            </button>
          </div>
          {#if errorFor('media.tracks')}
            <p class="field-error">{errorFor('media.tracks')}</p>
          {/if}
          <ol class="row-list">
            {#each workingModel.media.tracks ?? [] as track, index}
              <li class="repeat-row">
                <div class="row-heading">
                  <strong>{t('track')} {index + 1}</strong>
                  <div class="row-actions">
                    <button type="button" onclick={() => moveTrack(index, -1)} disabled={index === 0} aria-label={`${t('moveUp')}: ${t('track')} ${index + 1}`}>↑</button>
                    <button type="button" onclick={() => moveTrack(index, 1)} disabled={index === (workingModel.media.tracks ?? []).length - 1} aria-label={`${t('moveDown')}: ${t('track')} ${index + 1}`}>↓</button>
                    <button type="button" class="danger-button" onclick={() => removeTrack(index)} aria-label={`${t('remove')}: ${t('track')} ${index + 1}`}>×</button>
                  </div>
                </div>
                <div class="field-grid compact">
                  <label class="field full">
                    <span>{t('trackUrl')}</span>
                    <input id={fieldId(`media.tracks.${index}.src`)} type="url" value={track.src} aria-invalid={Boolean(errorFor(`media.tracks.${index}.src`))} onchange={(event) => updateTrack(index, { src: inputValue(event) })} />
                    {#if errorFor(`media.tracks.${index}.src`)}<small class="field-error">{errorFor(`media.tracks.${index}.src`)}</small>{/if}
                  </label>
                  <label class="field">
                    <span>{t('kind')}</span>
                    <select id={fieldId(`media.tracks.${index}.kind`)} value={track.kind} onchange={(event) => updateTrack(index, { kind: inputValue(event) as TextTrackRef['kind'] })}>
                      <option value="captions">{t('trackKindCaptions')}</option>
                      <option value="subtitles">{t('trackKindSubtitles')}</option>
                      <option value="descriptions">{t('trackKindDescriptions')}</option>
                      <option value="chapters">{t('trackKindChapters')}</option>
                      <option value="metadata">{t('trackKindMetadata')}</option>
                    </select>
                  </label>
                  <label class="field">
                    <span>{t('language')}</span>
                    <input id={fieldId(`media.tracks.${index}.lang`)} type="text" value={track.lang} aria-invalid={Boolean(errorFor(`media.tracks.${index}.lang`))} onchange={(event) => updateTrack(index, { lang: inputValue(event) })} />
                    {#if errorFor(`media.tracks.${index}.lang`)}<small class="field-error">{errorFor(`media.tracks.${index}.lang`)}</small>{/if}
                  </label>
                  <label class="field">
                    <span>{t('label')}</span>
                    <input id={fieldId(`media.tracks.${index}.label`)} type="text" value={track.label} aria-invalid={Boolean(errorFor(`media.tracks.${index}.label`))} onchange={(event) => updateTrack(index, { label: inputValue(event) })} />
                    {#if errorFor(`media.tracks.${index}.label`)}<small class="field-error">{errorFor(`media.tracks.${index}.label`)}</small>{/if}
                  </label>
                  <label class="field checkbox-field" id={fieldId(`media.tracks.${index}.default`)}>
                    <input type="checkbox" checked={track.default === true} onchange={(event) => setDefaultTrack(index, (event.currentTarget as HTMLInputElement).checked)} />
                    <span>{t('defaultTrack')}</span>
                  </label>
                </div>
              </li>
            {/each}
          </ol>
        </div>
      </details>

      <details class="form-section" open>
        <summary><span>5</span> {t('transcript')}</summary>
        <div class="section-content field-grid" id={fieldId('media.transcript')}>
          <p class="section-help full">{t('transcriptHelp')}</p>
          {#if errorFor('media.transcript')}<p class="field-error full">{errorFor('media.transcript')}</p>{/if}
          <label class="field full">
            <span>{t('transcriptUrl')}</span>
            <input id={fieldId('media.transcript.src')} type="url" value={workingModel.media.transcript?.src ?? ''} aria-invalid={Boolean(errorFor('media.transcript.src'))} onchange={(event) => updateTranscript({ src: inputValue(event) })} />
            {#if errorFor('media.transcript.src')}<small class="field-error">{errorFor('media.transcript.src')}</small>{/if}
          </label>
          <label class="field full">
            <span>{t('transcriptHtml')}</span>
            <textarea id={fieldId('media.transcript.html')} value={workingModel.media.transcript?.html ?? ''} aria-invalid={Boolean(errorFor('media.transcript.html'))} onchange={(event) => updateTranscript({ html: inputValue(event) })}></textarea>
            {#if errorFor('media.transcript.html')}<small class="field-error">{errorFor('media.transcript.html')}</small>{/if}
          </label>
          <label class="field full">
            <span>{t('transcriptPlainText')}</span>
            <textarea id={fieldId('media.transcript.plainText')} value={workingModel.media.transcript?.plainText ?? ''} aria-invalid={Boolean(errorFor('media.transcript.plainText'))} onchange={(event) => updateTranscript({ plainText: inputValue(event) })}></textarea>
            {#if errorFor('media.transcript.plainText')}<small class="field-error">{errorFor('media.transcript.plainText')}</small>{/if}
          </label>
          <label class="field">
            <span>{t('transcriptLanguage')}</span>
            <input id={fieldId('media.transcript.lang')} type="text" value={workingModel.media.transcript?.lang ?? ''} aria-invalid={Boolean(errorFor('media.transcript.lang'))} onchange={(event) => updateTranscript({ lang: inputValue(event) })} />
            {#if errorFor('media.transcript.lang')}<small class="field-error">{errorFor('media.transcript.lang')}</small>{/if}
          </label>
        </div>
      </details>

      <details class="form-section" open>
        <summary><span>6</span> {t('accessibility')}</summary>
        <div class="section-content field-grid">
          <p class="section-help full">{t('accessibilityHelp')}</p>
          <label class="field">
            <span>{t('audioContent')}</span>
            <select id={fieldId('accessibilityProfile.audioContent')} value={workingModel.accessibilityProfile?.audioContent ?? 'unknown'} aria-invalid={Boolean(errorFor('accessibilityProfile.audioContent'))} onchange={(event) => updateAccessibility('audioContent', inputValue(event) as AudioContentDeclaration)}>
              <option value="unknown">{t('unknown')}</option>
              <option value="none">{t('noMeaningfulAudio')}</option>
              <option value="meaningful">{t('meaningfulAudio')}</option>
            </select>
            {#if errorFor('accessibilityProfile.audioContent')}<small class="field-error">{errorFor('accessibilityProfile.audioContent')}</small>{/if}
          </label>
          <label class="field">
            <span>{t('captionSupport')}</span>
            <select id={fieldId('accessibilityProfile.captionSupport')} value={workingModel.accessibilityProfile?.captionSupport ?? 'unknown'} aria-invalid={Boolean(errorFor('accessibilityProfile.captionSupport'))} onchange={(event) => updateAccessibility('captionSupport', inputValue(event) as CaptionSupportDeclaration)}>
              <option value="unknown">{t('unknown')}</option>
              <option value="notRequired">{t('captionsNotRequired')}</option>
              <option value="track">{t('captionsTrack')}</option>
              <option value="open">{t('openCaptions')}</option>
              <option value="missing">{t('captionsMissing')}</option>
            </select>
            {#if errorFor('accessibilityProfile.captionSupport')}<small class="field-error">{errorFor('accessibilityProfile.captionSupport')}</small>{/if}
          </label>
          <label class="field full">
            <span>{t('visualSupport')}</span>
            <select id={fieldId('accessibilityProfile.visualSupport')} value={workingModel.accessibilityProfile?.visualSupport ?? 'unknown'} aria-invalid={Boolean(errorFor('accessibilityProfile.visualSupport'))} onchange={(event) => updateAccessibility('visualSupport', inputValue(event) as VisualSupportDeclaration)}>
              <option value="unknown">{t('unknown')}</option>
              <option value="notMeaningful">{t('visualsNotMeaningful')}</option>
              <option value="described">{t('visualsDescribed')}</option>
              <option value="missing">{t('visualsMissing')}</option>
            </select>
            {#if errorFor('accessibilityProfile.visualSupport')}<small class="field-error">{errorFor('accessibilityProfile.visualSupport')}</small>{/if}
          </label>
        </div>
      </details>
    </form>

    <input
      class="splitter"
      type="range"
      min="30"
      max="70"
      step="2"
      value={editorPercent}
      aria-label={t('splitLabel')}
      aria-orientation="vertical"
      onkeydown={handleSplitterKeydown}
      oninput={(event) => adjustEditorWidth(Number(inputValue(event)))}
    />

    <aside class="preview-panel" aria-labelledby={previewHeadingId}>
      <header>
        <h2 id={previewHeadingId}>{t('preview')}</h2>
        <p>{t('previewHelp')}</p>
      </header>
      <div class="preview-surface">
        <VideoStimulus model={previewModel} />
      </div>
    </aside>
  </div>
</div>

<style>
  .video-stimulus-author,
  .video-stimulus-author * {
    box-sizing: border-box;
  }

  .video-stimulus-author {
    min-width: 0;
    color: var(--pie-text);
    background: var(--pie-background-dark);
    font-family: inherit;
  }

  button,
  input,
  select,
  textarea {
    font: inherit;
  }

  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible,
  summary:focus-visible,
  .splitter:focus-visible {
    outline: 3px solid
      var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border)));
    outline-offset: 2px;
  }

  .author-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--pie-border-light);
    background: var(--pie-white);
  }

  .author-header h1,
  .author-header p,
  .preview-panel h2,
  .preview-panel p {
    margin: 0;
  }

  .author-header h1 {
    font-size: 1.4rem;
  }

  .author-header p,
  .preview-panel p,
  .section-help,
  .section-toolbar p {
    margin-top: 0.35rem;
    color: var(--pie-tertiary);
    line-height: 1.5;
  }

  .review-actions,
  .section-toolbar,
  .row-heading,
  .row-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .review-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  button {
    min-height: 44px;
    min-width: 44px;
    border: 1px solid var(--pie-border-light);
    border-radius: 0.5rem;
    background: var(--pie-white);
    color: var(--pie-text);
    padding: 0.5rem 0.75rem;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: var(--pie-background-dark);
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .primary-button {
    border-color: var(--pie-focus-checked-border);
    background: var(--pie-secondary-background);
    font-weight: 700;
  }

  .danger-button {
    border-color: var(--pie-incorrect-icon);
    color: var(--pie-incorrect-icon);
  }

  .review-results {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
    padding: 1rem 1.5rem 0;
  }

  .review-summary {
    padding: 0.875rem 1rem;
    border: 1px solid var(--pie-border-light);
    border-radius: 0.625rem;
    background: var(--pie-white);
  }

  .review-summary.errors {
    border-color: var(--pie-incorrect-icon);
    background: var(--pie-incorrect-secondary);
  }

  .review-summary.warnings {
    background: var(--pie-secondary-background);
  }

  .review-summary h2 {
    margin: 0;
    font-size: 1rem;
  }

  .review-summary ul {
    margin: 0.5rem 0 0 1.25rem;
    padding: 0;
  }

  .review-summary a {
    color: var(--pie-text);
  }

  .author-shell {
    display: grid;
    min-height: var(--video-stimulus-author-min-height, 44rem);
    padding-top: 1rem;
  }

  .editor-panel,
  .preview-panel {
    min-width: 0;
    background: var(--pie-white);
  }

  .editor-panel {
    padding: 0 1rem 3rem 1.5rem;
  }

  .form-section {
    margin-bottom: 1rem;
    overflow: clip;
    border: 1px solid var(--pie-border-light);
    border-radius: 0.75rem;
    background: var(--pie-white);
  }

  .form-section > summary {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-height: 52px;
    padding: 0.75rem 0.875rem;
    cursor: pointer;
    font-weight: 750;
  }

  .form-section > summary span {
    display: grid;
    width: 1.625rem;
    height: 1.625rem;
    place-items: center;
    border-radius: 50%;
    background: var(--pie-secondary-background);
    font-size: 0.75rem;
  }

  .section-content {
    padding: 1rem;
    border-top: 1px solid var(--pie-border-light);
  }

  .field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.875rem;
  }

  .field-grid.compact {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .field,
  .field > span {
    display: block;
    min-width: 0;
  }

  .field > span {
    margin-bottom: 0.375rem;
    font-size: 0.825rem;
    font-weight: 700;
  }

  .field.full,
  .section-help.full,
  .field-error.full {
    grid-column: 1 / -1;
  }

  input[type='text'],
  input[type='url'],
  input[type='number'],
  select,
  textarea {
    width: 100%;
    min-height: 44px;
    border: 1px solid var(--pie-border-light);
    border-radius: 0.5rem;
    background: var(--pie-white);
    color: var(--pie-text);
    padding: 0.55rem 0.625rem;
  }

  textarea {
    min-height: 7rem;
    resize: vertical;
    line-height: 1.5;
  }

  [aria-invalid='true'] {
    border-color: var(--pie-incorrect-icon);
  }

  .checkbox-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
  }

  .checkbox-grid label,
  .checkbox-field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
  }

  input[type='checkbox'] {
    width: 1.25rem;
    height: 1.25rem;
  }

  .section-toolbar {
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .section-toolbar p {
    margin: 0;
  }

  .row-list {
    display: grid;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .repeat-row {
    padding: 0.875rem;
    border: 1px solid var(--pie-border-light);
    border-radius: 0.625rem;
    background: var(--pie-tertiary-light);
  }

  .row-heading {
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .row-actions button {
    padding: 0.375rem;
  }

  .field-error {
    display: block;
    margin: 0.35rem 0 0;
    color: var(--pie-incorrect-icon);
    font-size: 0.8rem;
    font-weight: 650;
    line-height: 1.4;
  }

  .section-help {
    margin: 0;
  }

  .splitter {
    width: 24px;
    height: 100%;
    min-height: 44px;
    margin: 0;
    cursor: col-resize;
    writing-mode: vertical-lr;
    direction: rtl;
  }

  .preview-panel {
    padding: 0 1.5rem 3rem 1rem;
  }

  .preview-panel > header {
    margin-bottom: 0.75rem;
  }

  .preview-panel h2 {
    font-size: 1.1rem;
  }

  .preview-surface {
    position: sticky;
    top: 1rem;
    overflow: hidden;
    border: 1px solid var(--pie-border-light);
    border-radius: 0.75rem;
    background: var(--pie-white);
  }

  @media (max-width: 56rem) {
    .author-header,
    .section-toolbar {
      align-items: stretch;
      flex-direction: column;
    }

    .review-actions {
      justify-content: flex-start;
    }

    .review-results,
    .author-shell {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    .splitter {
      display: none;
    }

    .editor-panel,
    .preview-panel {
      padding-inline: 1rem;
    }

    .preview-panel {
      padding-top: 1rem;
    }

    .preview-surface {
      position: static;
    }
  }

  @media (max-width: 34rem) {
    .author-header,
    .review-results {
      padding-inline: 1rem;
    }

    .review-results,
    .field-grid,
    .field-grid.compact {
      grid-template-columns: minmax(0, 1fr);
    }

    .row-heading {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
