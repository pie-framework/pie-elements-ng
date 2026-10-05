<script lang="ts">
let {
  isDropTarget = false,
  focused = false,
  label,
  onpointerenter,
  onpointerleave,
  children,
}: {
  isDropTarget?: boolean;
  focused?: boolean;
  label: string;
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
    border: 1.5px dashed var(--pie-border-dark, #64748b);
    border-radius: 12px;
    padding: 14px 16px;
    background: var(--pie-surface, #f8fafc);
    min-height: 120px;
    transition: background 120ms ease, border-color 120ms ease;
  }
  .venn-tray.drop-target {
    background: var(--pie-faded-primary, #e0f2fe);
    border-color: var(--pie-tertiary, #0284c7);
  }
  .venn-tray.focused {
    outline: 2px solid var(--vc-focus-ring, #1565c0);
    outline-offset: 2px;
  }
  .tray-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--pie-text, #475569);
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
