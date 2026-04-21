<script lang="ts">
let {
  isDropTarget = false,
  focused = false,
  label = 'Tiles to classify',
  onpointerenter,
  onpointerleave,
  children,
}: {
  isDropTarget?: boolean;
  focused?: boolean;
  label?: string;
  onpointerenter?: (e: PointerEvent) => void;
  onpointerleave?: (e: PointerEvent) => void;
  children?: import('svelte').Snippet;
} = $props();
</script>

<div
  class="venn-tray"
  class:drop-target={isDropTarget}
  class:focused
  role="region"
  aria-label={label}
  data-region-key="tray"
  {onpointerenter}
  {onpointerleave}
>
  <div class="tray-label">{label}</div>
  <div class="tray-items">
    {#if children}{@render children()}{/if}
  </div>
</div>

<style>
  .venn-tray {
    border: 1.5px dashed #94a3b8;
    border-radius: 12px;
    padding: 14px 16px;
    background: #f8fafc;
    min-height: 120px;
    transition: background 120ms ease, border-color 120ms ease;
  }
  .venn-tray.drop-target {
    background: #e0f2fe;
    border-color: #0ea5e9;
  }
  .venn-tray.focused {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  .tray-label {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
  }
  .tray-items {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  @media (prefers-reduced-motion: reduce) {
    .venn-tray {
      transition: none;
    }
  }
</style>
