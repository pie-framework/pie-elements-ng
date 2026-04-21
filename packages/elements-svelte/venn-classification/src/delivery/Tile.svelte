<script lang="ts">
import { tileAccessibleName } from './tile-accessible-name.js';

let {
  id,
  label,
  imageUrl,
  imageAlt,
  correctness = 'neutral',
  held = false,
  invisible = false,
  ghost = false,
  disabled = false,
  focused = false,
  onpointerdown,
  onkeydown,
  onfocus,
  onclick,
}: {
  id: string;
  label: string;
  imageUrl?: string;
  imageAlt?: string;
  correctness?: 'correct' | 'incorrect' | 'unanswered' | 'neutral';
  held?: boolean;
  /** Origin tile during pointer drag: reserved in layout but visually hidden so the ghost shows instead. */
  invisible?: boolean;
  /** Render the free-floating drag preview that follows the cursor. */
  ghost?: boolean;
  disabled?: boolean;
  focused?: boolean;
  onpointerdown?: (e: PointerEvent) => void;
  onkeydown?: (e: KeyboardEvent) => void;
  onfocus?: (e: FocusEvent) => void;
  onclick?: (e: MouseEvent) => void;
} = $props();

const accessibleName = $derived(tileAccessibleName({ label, imageUrl, imageAlt }));
const hasImage = $derived(!!(imageUrl ?? '').trim());
const showText = $derived(!!(label ?? '').replace(/<[^>]*>/g, '').trim());
</script>

<button
  type="button"
  class="venn-tile"
  class:held
  class:focused
  class:invisible
  class:ghost
  class:correct={correctness === 'correct'}
  class:incorrect={correctness === 'incorrect'}
  data-tile-id={id}
  aria-label={accessibleName}
  aria-pressed={held}
  aria-hidden={ghost}
  disabled={disabled}
  tabindex={ghost || disabled ? -1 : 0}
  {onpointerdown}
  {onkeydown}
  {onfocus}
  {onclick}
>
  <span class="tile-body" class:tile-body-image={hasImage}>
    {#if hasImage}
      <img
        src={imageUrl}
        alt=""
        class="tile-img"
        aria-hidden="true"
        draggable="false"
      />
    {/if}
    {#if showText}
      <span class="tile-label" class:tile-label-below={hasImage}>{@html label}</span>
    {/if}
  </span>
  {#if correctness === 'correct'}
    <span class="badge badge-correct" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
    </span>
  {:else if correctness === 'incorrect'}
    <span class="badge badge-incorrect" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg>
    </span>
  {/if}
</button>

<style>
  .venn-tile {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    min-height: 44px;
    padding: 8px 14px;
    border: 1.5px solid #334155;
    border-radius: 10px;
    background: #ffffff;
    color: #0f172a;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    cursor: grab;
    touch-action: none;
    user-select: none;
    transition: box-shadow 120ms ease, transform 120ms ease, background 120ms ease;
  }
  .venn-tile:focus-visible,
  .venn-tile.focused {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  .venn-tile:hover:not(:disabled) {
    background: #f8fafc;
  }
  .venn-tile.held {
    cursor: grabbing;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.18);
    transform: translateY(-1px);
    background: #eef2ff;
  }
  .venn-tile.invisible {
    visibility: hidden;
  }
  .venn-tile.ghost {
    pointer-events: none;
    cursor: grabbing;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
    transform: rotate(-1.5deg);
    background: #ffffff;
    opacity: 0.96;
  }
  .venn-tile.correct {
    border-color: #0ea449;
  }
  .venn-tile.incorrect {
    border-color: #bf0d00;
  }
  .venn-tile:disabled {
    cursor: default;
  }
  .tile-body {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    pointer-events: none;
    max-width: 220px;
  }
  .tile-body-image {
    flex-direction: column;
    gap: 4px;
  }
  .tile-img {
    width: 40px;
    height: 40px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .tile-label {
    pointer-events: none;
    text-align: center;
    line-height: 1.25;
    word-break: break-word;
  }
  .tile-label-below {
    font-size: 12px;
    font-weight: 600;
  }
  .badge {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
  }
  .badge-correct {
    background: #0ea449;
  }
  .badge-incorrect {
    background: #bf0d00;
  }
  @media (prefers-reduced-motion: reduce) {
    .venn-tile {
      transition: none;
    }
  }
</style>
