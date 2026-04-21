<svelte:options
  customElement={{
    shadow: 'none',
    props: {
      model: { type: 'Object' },
      session: { type: 'Object' }
    }
  }}
/>

<script lang="ts">
import { onMount, tick } from 'svelte';
import { forwardSessionChange } from '@pie-lib/delivery-events-svelte';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import Tile from './Tile.svelte';
import { tileAccessibleName } from './tile-accessible-name.js';
import Tray from './Tray.svelte';
import {
  buildLayout2Set,
  defaultGeometry2Set,
  hitTest,
  type DiagramLayout,
  type RegionLayout,
} from './layout.js';
import { applyPlacement, groupTilesByRegion, unplacedTiles } from './dnd.js';
import { regionsEqual, regionKey as regionKeyFn } from '../controller/region.js';
import type { Region, VennModel, VennSession, VennTile } from '../types.js';

type VmTile = {
  id: string;
  label: string;
  imageUrl?: string;
  imageAlt?: string;
  correctRegion?: Region;
};
type ViewModel = {
  prompt?: string | null;
  circles?: Array<{ label: string }>;
  tiles?: VmTile[];
  regionLabels?: Record<string, string>;
  disabled?: boolean;
  env?: { mode?: string };
  correctRegionsById?: Record<string, Region>;
  correctness?: Record<string, 'correct' | 'incorrect' | 'unanswered'>;
};

let props = $props<{ model?: ViewModel; session?: VennSession }>();

/** Grid cell for tile stacking (image + caption tiles need extra height). */
const TILE_W = 132;
const TILE_H = 68;

let containerEl: HTMLDivElement | null = null;
let diagramEl: HTMLDivElement | null = null;
let svgEl: SVGSVGElement | null = null;
let liveRegion: HTMLDivElement | null = null;

let showCorrect = $state(false);
let heldTileId = $state<string | null>(null);
let hoveredRegionKey = $state<string | null>(null);
let keyboardFocusKey = $state<string | null>(null);
let dragPos = $state<{ x: number; y: number } | null>(null);

const geometry = defaultGeometry2Set();

const modelShape = $derived<VennModel>({
  circles: (props?.model?.circles ?? [
    { label: 'Set A' },
    { label: 'Set B' },
  ]) as VennModel['circles'],
  tiles: (props?.model?.tiles ?? []) as VennTile[],
  regionLabels: props?.model?.regionLabels ?? {},
  scoringPolicy: 'partialPerTile',
  promptEnabled: true,
});

const layout = $derived<DiagramLayout>(buildLayout2Set(modelShape as VennModel, geometry));
const isEvaluate = $derived(props?.model?.env?.mode === 'evaluate');
const disabled = $derived(props?.model?.disabled === true);
const prompt = $derived<string | null>(props?.model?.prompt ?? null);

const visiblePlacements = $derived<Record<string, Region | null>>(
  buildVisiblePlacements(props?.session, props?.model, showCorrect)
);

const visibleSession = $derived<VennSession>({ placements: visiblePlacements });

const grouped = $derived<Record<string, VennTile[]>>(
  groupTilesByRegion(modelShape as VennModel, visibleSession)
);
const trayTiles = $derived<VennTile[]>(unplacedTiles(modelShape as VennModel, visibleSession));

const navigableTargets = $derived<string[]>(['0', '0,1', '1', '', 'tray']);

function buildVisiblePlacements(
  session: VennSession | undefined,
  model: ViewModel | undefined,
  show: boolean
): Record<string, Region | null> {
  const base = { ...((session?.placements ?? {}) as Record<string, Region | null>) };
  if (show && model?.correctRegionsById) {
    for (const [id, region] of Object.entries(model.correctRegionsById)) {
      base[id] = region;
    }
  }
  return base;
}

function announce(message: string) {
  if (liveRegion) {
    liveRegion.textContent = '';
    requestAnimationFrame(() => {
      if (liveRegion) liveRegion.textContent = message;
    });
  }
}

function viewBoxToPercent(x: number, y: number) {
  return {
    left: (x / geometry.width) * 100,
    top: (y / geometry.height) * 100,
  };
}

function clientToViewBox(clientX: number, clientY: number): { x: number; y: number } | null {
  if (!diagramEl) return null;
  const rect = diagramEl.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  const nx = (clientX - rect.left) / rect.width;
  const ny = (clientY - rect.top) / rect.height;
  return {
    x: nx * geometry.width,
    y: ny * geometry.height,
  };
}

function commitPlacement(tileId: string, placement: Region | null) {
  const next = applyPlacement({
    model: modelShape as VennModel,
    session: props?.session,
    tileId,
    placement,
  });

  forwardSessionChange({
    sourceEl: containerEl,
    fallbackSelector: 'venn-classification',
    component: 'venn-classification',
    session: next,
    complete: next.completed === true,
  });
}

function findTile(id: string | null | undefined): VennTile | null {
  if (!id) return null;
  return ((modelShape as VennModel).tiles || []).find((t) => t.id === id) ?? null;
}

function regionByKey(key: string): RegionLayout | undefined {
  return layout.regionByKey[key];
}

function onTilePointerDown(tile: VennTile, e: PointerEvent) {
  if (disabled) return;
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  target.setPointerCapture?.(e.pointerId);
  heldTileId = tile.id;
  dragPos = { x: e.clientX, y: e.clientY };
  hoveredRegionKey = resolveHoverKeyFromPointer(e.clientX, e.clientY);
  announce(`Picked up ${tileAccessibleName(tile)}`);

  const onMove = (ev: PointerEvent) => {
    dragPos = { x: ev.clientX, y: ev.clientY };
    hoveredRegionKey = resolveHoverKeyFromPointer(ev.clientX, ev.clientY);
  };
  const onUp = (ev: PointerEvent) => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);

    const hoverKey = resolveHoverKeyFromPointer(ev.clientX, ev.clientY);
    heldTileId = null;
    dragPos = null;
    const snapped = hoveredRegionKey;
    hoveredRegionKey = null;

    const targetKey = hoverKey ?? snapped;
    if (targetKey === null) {
      announce('Cancelled');
      return;
    }
    if (targetKey === 'tray') {
      commitPlacement(tile.id, null);
      announce(`${tileAccessibleName(tile)} returned to tray`);
      return;
    }
    const region = regionByKey(targetKey);
    if (!region) {
      announce('Cancelled');
      return;
    }
    commitPlacement(tile.id, region.region);
    announce(`${tileAccessibleName(tile)} placed in ${region.label}`);
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
}

function resolveHoverKeyFromPointer(clientX: number, clientY: number): string | null {
  if (isOverTray(clientX, clientY)) return 'tray';
  const p = clientToViewBox(clientX, clientY);
  if (!p) return null;
  const r = hitTest(layout, p.x, p.y);
  return r ? r.key : null;
}

function isOverTray(clientX: number, clientY: number): boolean {
  const trayEl = containerEl?.querySelector('[data-region-key="tray"]') as HTMLElement | null;
  if (!trayEl) return false;
  const rect = trayEl.getBoundingClientRect();
  return (
    clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  );
}

function onTileKeyDown(tile: VennTile, e: KeyboardEvent) {
  if (disabled) return;
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (heldTileId === tile.id) {
      const targetKey = keyboardFocusKey;
      heldTileId = null;
      if (!targetKey) {
        announce('Cancelled');
        return;
      }
      if (targetKey === 'tray') {
        commitPlacement(tile.id, null);
        announce(`${tileAccessibleName(tile)} returned to tray`);
        return;
      }
      const region = regionByKey(targetKey);
      if (!region) return;
      commitPlacement(tile.id, region.region);
      announce(`${tileAccessibleName(tile)} placed in ${region.label}`);
    } else {
      heldTileId = tile.id;
      keyboardFocusKey = navigableTargets[0] ?? null;
      announce(
        `Picked up ${tileAccessibleName(tile)}. Use arrow keys to choose a region, then press Enter to commit.`
      );
    }
    return;
  }

  if (e.key === 'Escape' && heldTileId === tile.id) {
    e.preventDefault();
    heldTileId = null;
    keyboardFocusKey = null;
    announce('Cancelled');
    return;
  }

  if (
    heldTileId === tile.id &&
    (e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Tab')
  ) {
    e.preventDefault();
    const current = keyboardFocusKey ?? navigableTargets[0] ?? '0';
    let idx = navigableTargets.indexOf(current);
    if (idx < 0) idx = 0;
    const delta =
      e.key === 'ArrowLeft' || e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey) ? -1 : 1;
    idx = (idx + delta + navigableTargets.length) % navigableTargets.length;
    keyboardFocusKey = navigableTargets[idx];
    const r = keyboardFocusKey === 'tray' ? { label: 'Tiles tray' } : regionByKey(keyboardFocusKey);
    announce(`Drop target: ${r?.label ?? 'unknown'}`);
  }
}

function tileCorrectness(id: string): 'correct' | 'incorrect' | 'unanswered' | 'neutral' {
  if (!isEvaluate || showCorrect) return 'neutral';
  const c = props?.model?.correctness?.[id];
  if (c === 'correct' || c === 'incorrect' || c === 'unanswered') return c;
  return 'neutral';
}

function typeset() {
  if (!containerEl) return;
  try {
    renderMath(containerEl);
  } catch (err) {
    console.warn('venn-classification: MathJax render failed', err);
  }
}

onMount(() => {
  tick().then(typeset);
});

$effect(() => {
  // Re-typeset whenever visible placements or tile labels change.
  // Touch `visiblePlacements` and `modelShape.tiles` length so Svelte tracks them.
  const _ = visiblePlacements;
  const __ = (modelShape as VennModel).tiles?.length ?? 0;
  void _;
  void __;
  tick().then(typeset);
});

const incorrectCount = $derived<number>(
  isEvaluate
    ? Object.values(props?.model?.correctness ?? {}).filter(
        (v) => v === 'incorrect' || v === 'unanswered'
      ).length
    : 0
);

// Active drop target while a tile is held (pointer hover or keyboard aim).
// Used to drive the shape-matching region highlights below so the visual
// cue echoes the Venn shape (crescent / lens / rect-minus-circles) rather
// than a rectangular bounding box — matching how other PIE drag-and-drop
// elements (e.g. categorize) highlight the *actual* target zone.
const activeDropKey = $derived<string | null>(
  heldTileId !== null ? (hoveredRegionKey ?? keyboardFocusKey ?? null) : (hoveredRegionKey ?? null)
);
const hitLeftOnly = $derived(activeDropKey === '0');
const hitRightOnly = $derived(activeDropKey === '1');
const hitOverlap = $derived(activeDropKey === '0,1');
const hitOutside = $derived(activeDropKey === '');
const highlightFill = 'rgba(37, 99, 235, 0.18)';

const draggedTile = $derived<VennTile | null>(
  heldTileId !== null && dragPos !== null ? (findTile(heldTileId) as VennTile | null) : null
);
</script>

<div class="venn-root" bind:this={containerEl}>
  {#if prompt}
    <div class="venn-prompt prose">{@html prompt}</div>
  {/if}

  {#if isEvaluate && incorrectCount > 0}
    <button
      type="button"
      class="toggle-correct"
      aria-pressed={showCorrect}
      onclick={() => (showCorrect = !showCorrect)}
    >
      {#if showCorrect}
        <svg class="toggle-icon" preserveAspectRatio="xMinYMin meet" version="1.1" viewBox="-283 359 34 35" aria-hidden="true">
          <circle cx="-266" cy="375.9" r="14" fill="#bce2ff" />
          <path
            d="M-280.5,375.9c0-8,6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5s-6.5,14.5-14.5,14.5S-280.5,383.9-280.5,375.9z M-279.5,375.9c0,7.4,6.1,13.5,13.5,13.5c7.4,0,13.5-6.1,13.5-13.5s-6.1-13.5-13.5-13.5C-273.4,362.4-279.5,368.5-279.5,375.9z"
            fill="#bce2ff"
          />
          <polygon points="-265.4,383.1 -258.6,377.2 -261.2,374.2 -264.3,376.9 -268.9,368.7 -272.4,370.6" fill="#1a9cff" />
        </svg>
      {:else}
        <svg class="toggle-icon" preserveAspectRatio="xMinYMin meet" version="1.1" viewBox="-129.5 127 34 35" aria-hidden="true">
          <path
            style="fill: #D0CAC5; stroke: #E6E3E0; stroke-width: 0.75; stroke-miterlimit: 10;"
            d="M-112.9,160.4c-8.5,0-15.5-6.9-15.5-15.5c0-8.5,6.9-15.5,15.5-15.5s15.5,6.9,15.5,15.5 C-97.4,153.5-104.3,160.4-112.9,160.4z"
          />
          <path
            style="fill: #B3ABA4; stroke: #CDC7C2; stroke-width: 0.5; stroke-miterlimit: 10;"
            d="M-113.2,159c-8,0-14.5-6.5-14.5-14.5s6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5S-105.2,159-113.2,159z"
          />
          <circle cx="-114.2" cy="143.5" r="14" fill="white" />
          <path
            d="M-114.2,158c-8,0-14.5-6.5-14.5-14.5s6.5-14.5,14.5-14.5s14.5,6.5,14.5,14.5S-106.2,158-114.2,158z M-114.2,130c-7.4,0-13.5,6.1-13.5,13.5s6.1,13.5,13.5,13.5s13.5-6.1,13.5-13.5S-106.8,130-114.2,130z"
            fill="#bce2ff"
          />
          <polygon points="-114.8,150.7 -121.6,144.8 -119,141.8 -115.9,144.5 -111.3,136.3 -107.8,138.2" fill="#1a9cff" />
        </svg>
      {/if}
      <span class="toggle-label">
        {showCorrect ? 'Hide' : 'Show'} correct answer
      </span>
    </button>
  {/if}

  <div class="venn-diagram" bind:this={diagramEl}>
    <svg
      viewBox="0 0 {geometry.width} {geometry.height}"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      bind:this={svgEl}
    >
      <!--
        Shape masks for drop-target highlights. SVG masks use white=visible,
        black=hidden; combining them with a coloured fill lets us highlight
        the actual crescent / lens / "rect-minus-circles" shape of each
        region instead of a rectangular bounding box, matching the way the
        Venn diagram is drawn.
      -->
      <defs>
        <mask id="venn-mask-left-only" maskUnits="userSpaceOnUse" x="0" y="0" width={geometry.width} height={geometry.height}>
          <rect x="0" y="0" width={geometry.width} height={geometry.height} fill="black" />
          <circle cx={geometry.circles[0].cx} cy={geometry.circles[0].cy} r={geometry.circles[0].r} fill="white" />
          <circle cx={geometry.circles[1].cx} cy={geometry.circles[1].cy} r={geometry.circles[1].r} fill="black" />
        </mask>
        <mask id="venn-mask-right-only" maskUnits="userSpaceOnUse" x="0" y="0" width={geometry.width} height={geometry.height}>
          <rect x="0" y="0" width={geometry.width} height={geometry.height} fill="black" />
          <circle cx={geometry.circles[1].cx} cy={geometry.circles[1].cy} r={geometry.circles[1].r} fill="white" />
          <circle cx={geometry.circles[0].cx} cy={geometry.circles[0].cy} r={geometry.circles[0].r} fill="black" />
        </mask>
        <clipPath id="venn-clip-left" clipPathUnits="userSpaceOnUse">
          <circle cx={geometry.circles[0].cx} cy={geometry.circles[0].cy} r={geometry.circles[0].r} />
        </clipPath>
        <mask id="venn-mask-outside" maskUnits="userSpaceOnUse" x="0" y="0" width={geometry.width} height={geometry.height}>
          <rect x="0" y="0" width={geometry.width} height={geometry.height} fill="white" />
          <circle cx={geometry.circles[0].cx} cy={geometry.circles[0].cy} r={geometry.circles[0].r} fill="black" />
          <circle cx={geometry.circles[1].cx} cy={geometry.circles[1].cy} r={geometry.circles[1].r} fill="black" />
        </mask>
      </defs>

      <!--
        Universal-set frame: the entire diagram rect is one continuous space.
        Circles sit in the upper portion and the bottom strip (everything
        below `outsideStripTop`) is where outside-region tiles land. A thin
        dashed divider is the only visual hint that the bottom strip is
        "outside the sets" — it's part of the same framed universe, not a
        separate widget.
      -->
      <rect
        x="1"
        y="1"
        width={geometry.width - 2}
        height={geometry.height - 2}
        fill="#ffffff"
        stroke="#cbd5e1"
        stroke-width="1.5"
        rx="12"
      />

      <!-- Circle fills (so overlap shows a darker shade) -->
      {#each geometry.circles as c}
        <circle cx={c.cx} cy={c.cy} r={c.r} fill="rgba(14, 165, 233, 0.12)" />
      {/each}

      <!--
        Shape-matching drop-target highlights. Rendered only while a tile is
        being dragged (pointer or keyboard) over / aimed at the region, so
        the highlight visually echoes the Venn shape students are targeting
        rather than a rectangular hit-box.
      -->
      {#if hitLeftOnly}
        <rect x="0" y="0" width={geometry.width} height={geometry.height} fill={highlightFill} mask="url(#venn-mask-left-only)" />
      {/if}
      {#if hitRightOnly}
        <rect x="0" y="0" width={geometry.width} height={geometry.height} fill={highlightFill} mask="url(#venn-mask-right-only)" />
      {/if}
      {#if hitOverlap}
        <circle cx={geometry.circles[1].cx} cy={geometry.circles[1].cy} r={geometry.circles[1].r} fill={highlightFill} clip-path="url(#venn-clip-left)" />
      {/if}
      {#if hitOutside}
        <rect x="0" y="0" width={geometry.width} height={geometry.height} fill={highlightFill} mask="url(#venn-mask-outside)" />
      {/if}

      <!-- Circle outlines -->
      {#each geometry.circles as c}
        <circle cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke="#1e293b" stroke-width="2.5" />
      {/each}

      <!-- Circle labels -->
      {#each geometry.circles as c, idx}
        <text
          x={idx === 0 ? Math.max(20, c.cx - c.r) : Math.min(geometry.width - 20, c.cx + c.r)}
          y={Math.max(26, c.cy - c.r - 12)}
          text-anchor={idx === 0 ? 'start' : 'end'}
          font-size="22"
          font-weight="600"
          fill="#0f172a"
        >
          {(modelShape.circles[idx]?.label) ?? ''}
        </text>
      {/each}

      <!--
        The bottom strip IS the outside region. We follow classic Venn
        convention and leave the "universe" unlabeled visually — a thin
        dashed divider is the only cue that the strip is a distinct
        landing area. Screen readers still get the region name via the
        aria-labelled region element below (`.region-aria`), and keyboard
        pickup announces it via the live region, so the name isn't lost.
      -->
      <line
        x1="16"
        x2={geometry.width - 16}
        y1={layout.outsideStripTop}
        y2={layout.outsideStripTop}
        stroke="#cbd5e1"
        stroke-width="1"
        stroke-dasharray="4 6"
      />
    </svg>

    <!-- Accessible region targets (semantic) -->
    <div class="region-labels" aria-hidden="false">
      {#each layout.regions as region}
        {@const pct = viewBoxToPercent(region.hitRect.x + region.hitRect.w / 2, region.hitRect.y + region.hitRect.h / 2)}
        <div
          class="region-aria"
          role="region"
          aria-label={region.label}
          data-region-key={region.key}
          style="left: {pct.left}%; top: {pct.top}%;"
        ></div>
      {/each}
    </div>

    <!-- Placed tiles, absolutely positioned in viewBox space -->
    <div class="placed-tiles">
      {#each Object.entries(grouped) as [key, tilesInRegion]}
        {@const region = layout.regionByKey[key]}
        {#if region}
          {#each tilesInRegion as tile, index (tile.id)}
            {@const slot = region.gridSlot(index, TILE_W, TILE_H)}
            {@const pct = viewBoxToPercent(slot.x, slot.y)}
            <div
              class="tile-wrapper"
              style="left: {pct.left}%; top: {pct.top}%;"
            >
              <Tile
                id={tile.id}
                label={tile.label}
                imageUrl={tile.imageUrl}
                imageAlt={tile.imageAlt}
                correctness={tileCorrectness(tile.id)}
                held={heldTileId === tile.id}
                invisible={heldTileId === tile.id && dragPos !== null}
                disabled={disabled}
                onpointerdown={(e) => onTilePointerDown(tile, e)}
                onkeydown={(e) => onTileKeyDown(tile, e)}
              />
            </div>
          {/each}
        {/if}
      {/each}
    </div>
  </div>

  <Tray
    isDropTarget={hoveredRegionKey === 'tray' || (heldTileId !== null && keyboardFocusKey === 'tray')}
    label="Tiles to classify"
  >
    {#each trayTiles as tile (tile.id)}
      <Tile
        id={tile.id}
        label={tile.label}
        imageUrl={tile.imageUrl}
        imageAlt={tile.imageAlt}
        correctness={'neutral'}
        held={heldTileId === tile.id}
        invisible={heldTileId === tile.id && dragPos !== null}
        disabled={disabled}
        onpointerdown={(e) => onTilePointerDown(tile, e)}
        onkeydown={(e) => onTileKeyDown(tile, e)}
      />
    {/each}
  </Tray>

  <!--
    Drag ghost: a free-floating copy of the tile that follows the cursor
    during pointer drag, so users see what they're moving (not just where
    it could land). Matches the DragOverlay pattern used by the React
    `categorize` element. Positioned with `fixed` so we can feed the raw
    `clientX/clientY` from pointer events straight into the style.
  -->
  {#if draggedTile && dragPos}
    <div
      class="drag-ghost"
      style="left: {dragPos.x}px; top: {dragPos.y}px;"
    >
      <Tile
        id={draggedTile.id}
        label={draggedTile.label}
        imageUrl={draggedTile.imageUrl}
        imageAlt={draggedTile.imageAlt}
        correctness="neutral"
        ghost={true}
      />
    </div>
  {/if}

  <!-- Visually hidden live region for a11y announcements -->
  <div class="sr-only" aria-live="polite" aria-atomic="true" bind:this={liveRegion}></div>
</div>

<style>
  .venn-root {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    color: #0f172a;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  }
  .venn-prompt {
    font-size: 16px;
    line-height: 1.5;
  }
  .venn-prompt :global(p) {
    margin: 0 0 8px 0;
  }
  .toggle-correct {
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 4px 0;
    padding: 0;
    background: transparent;
    border: 0;
    color: inherit;
    font: inherit;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
  }
  .toggle-correct:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
    border-radius: 2px;
  }
  .toggle-icon {
    width: 25px;
    height: 25px;
    flex-shrink: 0;
  }
  .toggle-label {
    line-height: 1.2;
  }
  .toggle-correct:hover .toggle-label,
  .toggle-correct:focus-visible .toggle-label {
    text-decoration: underline;
  }
  .venn-diagram {
    position: relative;
    width: 100%;
    /*
     * Keep the diagram "smart" about vertical space: it should not monopolise
     * the viewport and force the tray below the fold.
     *   - aspect-ratio preserves the 3:2 geometry the SVG is tuned for
     *   - max-width keeps the diagram from dominating wide layouts
     *   - max-height (viewport-relative) shrinks it further in short windows
     *     so the prompt, toggle, and tray remain in view without scrolling
     *     whenever possible. The SVG uses preserveAspectRatio="xMidYMid meet",
     *     so when max-height wins the width reduces in lockstep.
     */
    max-width: 720px;
    aspect-ratio: 900 / 540;
    max-height: min(60vh, 430px);
    margin: 0 auto;
  }
  .venn-diagram svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .placed-tiles,
  .region-labels {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .tile-wrapper {
    position: absolute;
    transform: translate(-50%, -50%);
    pointer-events: auto;
  }
  .region-aria {
    position: absolute;
    width: 1px;
    height: 1px;
    transform: translate(-50%, -50%);
    opacity: 0;
    pointer-events: none;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .drag-ghost {
    position: fixed;
    top: 0;
    left: 0;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1000;
  }
</style>
