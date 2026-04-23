<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
import { EditableHtml } from '@pie-lib/editable-html-tiptap-svelte';
import { createEventDispatcher } from 'svelte';
import RegionPicker from './RegionPicker.svelte';
import VennClassification from '../delivery/VennClassification.svelte';
import { buildPreviewSession } from '../controller/index.js';
import {
  enumerateRegions,
  regionKey,
  composeRegionLabel,
  normalizeRegion,
} from '../controller/region.js';
import type { Region, ScoringPolicy, VennModel, VennTile } from '../types.js';
import { stripHtml } from '../delivery/tile-accessible-name.js';

const dispatch = createEventDispatcher();

let {
  model = $bindable(),
  onChange,
}: { model?: VennModel; onChange?: (model: VennModel) => void } = $props();

function emit(next: VennModel) {
  if (onChange) onChange(next);
  dispatch('model.updated', { update: next, reset: false });
}

function safeModel(): VennModel {
  const m = (model || {}) as VennModel;
  return {
    id: m.id ?? '1',
    element: m.element ?? 'venn-classification',
    prompt: m.prompt ?? '',
    promptEnabled: m.promptEnabled !== false,
    circles:
      Array.isArray(m.circles) && m.circles.length > 0
        ? m.circles
        : [{ label: 'Set A' }, { label: 'Set B' }],
    tiles: Array.isArray(m.tiles) ? m.tiles : [],
    regionLabels: m.regionLabels ?? {},
    scoringPolicy: m.scoringPolicy ?? 'partialPerTile',
  };
}

function update(patch: Partial<VennModel>) {
  emit({ ...safeModel(), ...patch });
}

function onPromptChange(html: string) {
  update({ prompt: html });
}

function setPromptEnabled(enabled: boolean) {
  update({ promptEnabled: enabled });
}

function setCircleLabel(idx: number, label: string) {
  const base = safeModel();
  const nextCircles = base.circles.map((c, i) => (i === idx ? { ...c, label } : c));
  update({ circles: nextCircles });
}

function addTile() {
  const base = safeModel();
  const id = `tile-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000).toString(36)}`;
  const tile: VennTile = { id, label: 'New tile', correctRegion: [] };
  update({ tiles: [...base.tiles, tile] });
}

function removeTile(idx: number) {
  const base = safeModel();
  const next = base.tiles.slice();
  next.splice(idx, 1);
  update({ tiles: next });
}

function moveTile(idx: number, delta: number) {
  const base = safeModel();
  const target = idx + delta;
  if (target < 0 || target >= base.tiles.length) return;
  const next = base.tiles.slice();
  [next[idx], next[target]] = [next[target], next[idx]];
  update({ tiles: next });
}

function setTileLabel(idx: number, label: string) {
  const base = safeModel();
  const next = base.tiles.map((t, i) => (i === idx ? { ...t, label } : t));
  update({ tiles: next });
}

function setTileImageUrl(idx: number, imageUrl: string) {
  const base = safeModel();
  const v = imageUrl.trim();
  const next = base.tiles.map((t, i) =>
    i === idx
      ? { ...t, ...(v ? { imageUrl: v } : { imageUrl: undefined, imageAlt: undefined }) }
      : t
  );
  update({ tiles: next });
}

function setTileImageAlt(idx: number, imageAlt: string) {
  const base = safeModel();
  const next = base.tiles.map((t, i) =>
    i === idx ? { ...t, imageAlt: imageAlt.trim() || undefined } : t
  );
  update({ tiles: next });
}

function clearTileImage(idx: number) {
  const base = safeModel();
  const next = base.tiles.map((t, i) => {
    if (i !== idx) return t;
    const { imageUrl: _u, imageAlt: _a, ...rest } = t;
    return rest as VennTile;
  });
  update({ tiles: next });
}

function setTileId(idx: number, id: string) {
  const base = safeModel();
  const next = base.tiles.map((t, i) => (i === idx ? { ...t, id } : t));
  update({ tiles: next });
}

function setTileRegion(idx: number, region: Region) {
  const base = safeModel();
  const next = base.tiles.map((t, i) =>
    i === idx ? { ...t, correctRegion: normalizeRegion(region) } : t
  );
  update({ tiles: next });
}

function setScoringPolicy(policy: ScoringPolicy) {
  update({ scoringPolicy: policy });
}

function setRegionLabelOverride(key: string, label: string) {
  const base = safeModel();
  const next = { ...(base.regionLabels || {}) };
  if (label.trim().length === 0) {
    delete next[key];
  } else {
    next[key] = label;
  }
  update({ regionLabels: next });
}

const m = $derived(safeModel());
const regions = $derived(enumerateRegions(m.circles?.length || 0));

const previewSession = $derived(buildPreviewSession(m));
const previewModel = $derived({
  circles: m.circles,
  tiles: m.tiles,
  regionLabels: m.regionLabels ?? {},
  prompt: m.promptEnabled === false ? null : (m.prompt ?? null),
  disabled: true,
  env: { mode: 'view' as const },
});

const SPLITTER_W = 6;
const MIN_EDITOR_W = 260;
const MIN_PREVIEW_W = 200;

let authorShellEl: HTMLDivElement | null = $state(null);
let shellWidth = $state(0);
/** Pixel width of the editor column; initialized to half the shell when first measured. */
let editorWidthPx = $state<number | null>(null);

$effect(() => {
  if (shellWidth > 0 && editorWidthPx === null) {
    editorWidthPx = Math.floor((shellWidth - SPLITTER_W) / 2);
  }
});

$effect(() => {
  if (shellWidth <= 0 || editorWidthPx === null) return;
  const maxEditor = shellWidth - MIN_PREVIEW_W - SPLITTER_W;
  if (editorWidthPx > maxEditor) editorWidthPx = maxEditor;
  if (editorWidthPx < MIN_EDITOR_W) editorWidthPx = MIN_EDITOR_W;
});

const editorColumnWidth = $derived.by(() => {
  const sw = shellWidth;
  if (!sw) return '50%';
  const maxEditor = sw - MIN_PREVIEW_W - SPLITTER_W;
  const w = editorWidthPx ?? Math.floor((sw - SPLITTER_W) / 2);
  return `${Math.min(Math.max(w, MIN_EDITOR_W), maxEditor)}px`;
});

function onSplitPointerDown(e: PointerEvent) {
  const shellEl = authorShellEl;
  if (!shellEl) return;
  e.preventDefault();
  const shell = shellEl;
  const gutter = e.currentTarget as HTMLElement;
  gutter.setPointerCapture(e.pointerId);
  const rect0 = shell.getBoundingClientRect();
  const startX = e.clientX;
  const startW = editorWidthPx ?? Math.floor((rect0.width - SPLITTER_W) / 2);

  function move(ev: PointerEvent) {
    const rect = shell.getBoundingClientRect();
    const maxEditor = rect.width - MIN_PREVIEW_W - SPLITTER_W;
    const dx = ev.clientX - startX;
    editorWidthPx = Math.min(Math.max(startW + dx, MIN_EDITOR_W), maxEditor);
  }

  function up(ev: PointerEvent) {
    try {
      gutter.releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore if capture already released */
    }
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  }

  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

function onSplitKeyDown(e: KeyboardEvent) {
  const shell = authorShellEl;
  if (!shell || editorWidthPx === null) return;
  const rect = shell.getBoundingClientRect();
  const maxEditor = rect.width - MIN_PREVIEW_W - SPLITTER_W;
  const step = 24;
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    editorWidthPx = Math.max(MIN_EDITOR_W, editorWidthPx - step);
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    editorWidthPx = Math.min(maxEditor, editorWidthPx + step);
  }
}
</script>

<div class="venn-author">
  <div class="author-shell" bind:this={authorShellEl} bind:clientWidth={shellWidth}>
  <div class="editor-column" style:width={editorColumnWidth}>
    <div class="field-group">
      <label class="field-header">
        <input
          type="checkbox"
          checked={m.promptEnabled !== false}
          onchange={(e) => setPromptEnabled((e.currentTarget as HTMLInputElement).checked)}
        />
        <span>Prompt</span>
      </label>
      {#if m.promptEnabled !== false}
        <EditableHtml
          markup={m.prompt || ''}
          onChange={onPromptChange}
          placeholder="Enter a prompt for the Venn classification question..."
        />
      {/if}
    </div>

    <div class="field-group">
      <div class="field-header">Circles</div>
      <p class="hint circle-count-note">2 circles (4 regions).</p>
      <div class="circle-labels">
        {#each m.circles as circle, idx}
          <label class="circle-label-row">
            <span>Circle {idx + 1} label</span>
            <input
              type="text"
              value={circle.label}
              oninput={(e) => setCircleLabel(idx, (e.currentTarget as HTMLInputElement).value)}
            />
          </label>
        {/each}
      </div>
    </div>

    <div class="field-group">
      <div class="field-header-row">
        <span class="field-header">Tiles</span>
        <button type="button" class="btn-add" onclick={addTile}>+ Add tile</button>
      </div>
      {#if m.tiles.length === 0}
        <div class="hint">
          Add at least one tile; each tile needs a correct region and either a label (text or simple HTML) or an
          image URL plus short alt text.
        </div>
      {/if}
      <ul class="tile-list">
        {#each m.tiles as tile, idx (tile.id)}
          <li class="tile-row">
            <div class="tile-row-header">
              <div class="tile-inputs">
                <label>
                  <span>ID</span>
                  <input
                    type="text"
                    value={tile.id}
                    oninput={(e) => setTileId(idx, (e.currentTarget as HTMLInputElement).value)}
                  />
                </label>
                <label class="label-input">
                  <span>Label</span>
                  <input
                    type="text"
                    value={tile.label}
                    oninput={(e) => setTileLabel(idx, (e.currentTarget as HTMLInputElement).value)}
                  />
                </label>
                <label class="label-input tile-field-full">
                  <span>Image URL (optional)</span>
                  <input
                    type="text"
                    value={tile.imageUrl ?? ''}
                    placeholder="https://… or data:image/…"
                    oninput={(e) => setTileImageUrl(idx, (e.currentTarget as HTMLInputElement).value)}
                  />
                </label>
                <label class="label-input tile-field-full">
                  <span>Image alt (required if image URL is set)</span>
                  <input
                    type="text"
                    value={tile.imageAlt ?? ''}
                    oninput={(e) => setTileImageAlt(idx, (e.currentTarget as HTMLInputElement).value)}
                  />
                </label>
                {#if (tile.imageUrl ?? '').trim()}
                  <div class="tile-field-full">
                    <button type="button" class="btn-ghost" onclick={() => clearTileImage(idx)}>
                      Remove image
                    </button>
                  </div>
                {/if}
              </div>
              <div class="tile-actions">
                <button type="button" class="btn-ghost" onclick={() => moveTile(idx, -1)} aria-label="Move up" disabled={idx === 0}>↑</button>
                <button type="button" class="btn-ghost" onclick={() => moveTile(idx, 1)} aria-label="Move down" disabled={idx === m.tiles.length - 1}>↓</button>
                <button type="button" class="btn-ghost danger" onclick={() => removeTile(idx)} aria-label="Remove">✕</button>
              </div>
            </div>
            <div class="tile-region">
              <div class="region-header">Correct region</div>
              <RegionPicker
                circles={m.circles}
                regionLabels={m.regionLabels}
                value={tile.correctRegion}
                onchange={(region) => setTileRegion(idx, region)}
              />
            </div>
          </li>
        {/each}
      </ul>
    </div>

    <div class="field-group">
      <div class="field-header">Scoring policy</div>
      <label class="radio-row">
        <input
          type="radio"
          name="scoring"
          value="partialPerTile"
          checked={m.scoringPolicy !== 'allOrNothing'}
          onchange={() => setScoringPolicy('partialPerTile')}
        />
        <span>Partial credit per tile</span>
      </label>
      <label class="radio-row">
        <input
          type="radio"
          name="scoring"
          value="allOrNothing"
          checked={m.scoringPolicy === 'allOrNothing'}
          onchange={() => setScoringPolicy('allOrNothing')}
        />
        <span>All or nothing</span>
      </label>
    </div>

    <details class="field-group">
      <summary class="field-header">Region labels (advanced)</summary>
      <p class="hint">Override the auto-composed region labels that delivery uses for aria-labels and visible region chrome.</p>
      {#each regions as region (regionKey(region))}
        {@const key = regionKey(region)}
        {@const placeholder = composeRegionLabel(m.circles || [], region)}
        <label class="override-row">
          <span class="override-key">{key || '(outside)'}</span>
          <input
            type="text"
            placeholder={placeholder}
            value={m.regionLabels?.[key] ?? ''}
            oninput={(e) => setRegionLabelOverride(key, (e.currentTarget as HTMLInputElement).value)}
          />
        </label>
      {/each}
    </details>
  </div>

  <button
    type="button"
    class="split-gutter"
    role="slider"
    aria-orientation="vertical"
    aria-valuemin={MIN_EDITOR_W}
    aria-valuemax={shellWidth > 0 ? shellWidth - MIN_PREVIEW_W - SPLITTER_W : MIN_EDITOR_W + 100}
    aria-valuenow={editorWidthPx ?? (shellWidth > 0 ? Math.floor((shellWidth - SPLITTER_W) / 2) : MIN_EDITOR_W)}
    aria-label="Resize editor and preview panels"
    onpointerdown={onSplitPointerDown}
    onkeydown={onSplitKeyDown}
  ></button>

  <div class="preview-column">
    <div class="preview-header">Preview</div>
    <div class="preview-note">
      Live diagram with each tile in its authored <em>correct region</em>. Drag the vertical handle (or use
      arrow keys when it is focused) to change the editor / preview split.
    </div>
    <div class="preview-summary">
      <div><strong>Circles:</strong> {m.circles.map((c) => c.label).join(', ')}</div>
      <div><strong>Scoring:</strong> {m.scoringPolicy === 'allOrNothing' ? 'All or nothing' : 'Partial per tile'}</div>
      <div><strong>Tiles:</strong> {m.tiles.length}</div>
    </div>
    {#if m.tiles.length > 0 && m.circles?.length === 2}
      <div class="preview-diagram">
        <VennClassification model={previewModel} session={previewSession} />
      </div>
    {:else if m.tiles.length === 0}
      <p class="hint preview-diagram-placeholder">Add at least one tile to see the diagram.</p>
    {:else}
      <p class="hint preview-diagram-placeholder">Exactly two circles are required for the preview.</p>
    {/if}
    {#if m.tiles.length > 0}
      <div class="preview-list-heading">Correct regions</div>
      <ol class="preview-list">
        {#each m.tiles as tile}
          <li>
            <span class="preview-tile">
              {#if (tile.imageUrl ?? '').trim()}
                <img src={tile.imageUrl} alt="" class="preview-thumb" aria-hidden="true" />
              {/if}
              {stripHtml(tile.label) || (tile.imageAlt ?? '').trim() || tile.id}
            </span>
            <span class="preview-arrow">→</span>
            <span class="preview-region">{composeRegionLabel(m.circles, tile.correctRegion)}</span>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
  </div>
</div>

<style>
  .venn-author {
    padding: 24px;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
    color: #0f172a;
    box-sizing: border-box;
  }
  .author-shell {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    width: 100%;
    min-height: min(72vh, 720px);
    max-height: min(85vh, 960px);
    box-sizing: border-box;
  }
  .editor-column {
    display: flex;
    flex-direction: column;
    gap: 20px;
    flex-shrink: 0;
    overflow: auto;
    min-width: 0;
  }
  .split-gutter {
    flex: 0 0 6px;
    width: 6px;
    margin: 0;
    padding: 0;
    border: none;
    border-left: 1px solid #cbd5e1;
    border-right: 1px solid #cbd5e1;
    cursor: col-resize;
    touch-action: none;
    background: #e2e8f0;
    align-self: stretch;
  }
  .split-gutter:hover,
  .split-gutter:focus-visible {
    background: #cbd5e1;
  }
  .split-gutter:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  @media (max-width: 900px) {
    .author-shell {
      flex-direction: column;
      min-height: unset;
      max-height: unset;
    }
    .editor-column {
      width: 100% !important;
      flex: none;
      max-width: none;
    }
    .split-gutter {
      display: none;
    }
    .preview-column {
      flex: none;
      width: 100%;
    }
  }
  .field-group {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    background: #ffffff;
  }
  .field-header,
  .field-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 12px;
    color: #0f172a;
  }
  .field-header input[type='checkbox'] {
    margin-right: 8px;
  }
  .field-header-row {
    gap: 8px;
  }
  .btn-add {
    background: #2563eb;
    color: #ffffff;
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
  }
  .btn-add:hover {
    background: #1d4ed8;
  }
  .btn-ghost {
    background: transparent;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    font-size: 13px;
  }
  .btn-ghost:hover:not(:disabled) {
    background: #f1f5f9;
  }
  .btn-ghost:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-ghost.danger {
    color: #bf0d00;
  }
  .circle-labels {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .circle-count-note {
    margin: 0 0 4px 0;
  }
  .radio-row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    margin-top: 6px;
  }
  .circle-label-row {
    display: grid;
    grid-template-columns: 120px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .circle-label-row input,
  .tile-inputs input,
  .override-row input {
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 13px;
    width: 100%;
    box-sizing: border-box;
  }
  .tile-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .tile-row {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    background: #f8fafc;
  }
  .tile-row-header {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .tile-inputs {
    flex: 1;
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 8px;
  }
  .tile-inputs label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    color: #475569;
  }
  .tile-inputs .tile-field-full {
    grid-column: 1 / -1;
  }
  .tile-actions {
    display: flex;
    gap: 4px;
  }
  .tile-region {
    margin-top: 8px;
  }
  .region-header {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
  }
  .override-row {
    display: grid;
    grid-template-columns: 100px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
    font-size: 13px;
    margin-top: 6px;
  }
  .override-key {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    color: #64748b;
  }
  .hint {
    font-size: 12px;
    color: #64748b;
    margin: 8px 0;
  }
  .preview-column {
    flex: 1 1 auto;
    min-width: 0;
    overflow: auto;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    background: #ffffff;
  }
  .preview-diagram {
    margin: 12px 0 16px 0;
    max-width: 100%;
    overflow-x: auto;
  }
  .preview-diagram :global(.venn-root) {
    padding-top: 8px;
  }
  .preview-list-heading {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin: 8px 0 6px 0;
  }
  .preview-diagram-placeholder {
    margin: 12px 0;
  }
  .preview-header {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
  }
  .preview-note {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 12px;
  }
  .preview-summary {
    font-size: 13px;
    line-height: 1.5;
    color: #334155;
    margin-bottom: 10px;
  }
  .preview-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .preview-list li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
  }
  .preview-tile {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 4px;
    padding: 2px 6px;
    color: #1d4ed8;
  }
  .preview-thumb {
    width: 22px;
    height: 22px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .preview-arrow {
    color: #94a3b8;
  }
  .preview-region {
    color: #0f172a;
  }
</style>
