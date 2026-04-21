<script lang="ts">
import {
  enumerateRegions,
  regionKey,
  composeRegionLabel,
  regionsEqual,
} from '../controller/region.js';
import type { Region, VennCircle } from '../types.js';

let {
  circles,
  regionLabels = {},
  value,
  onchange,
}: {
  circles: VennCircle[];
  regionLabels?: Record<string, string>;
  value: Region | undefined;
  onchange: (region: Region) => void;
} = $props();

const regions = $derived(enumerateRegions(circles?.length || 0));

function label(region: Region): string {
  const key = regionKey(region);
  const override = regionLabels?.[key];
  return override && override.trim().length > 0
    ? override
    : composeRegionLabel(circles || [], region);
}

function isSelected(region: Region): boolean {
  return regionsEqual(region, value);
}
</script>

<div class="region-picker" role="radiogroup" aria-label="Correct region">
  {#each regions as region (regionKey(region))}
    <button
      type="button"
      class="region-cell"
      class:selected={isSelected(region)}
      role="radio"
      aria-checked={isSelected(region)}
      onclick={() => onchange(region)}
    >
      <span class="cell-key">{regionKey(region) || '—'}</span>
      <span class="cell-label">{label(region)}</span>
    </button>
  {/each}
</div>

<style>
  .region-picker {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
  .region-cell {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 8px 10px;
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    cursor: pointer;
    text-align: left;
    font-size: 12px;
  }
  .region-cell:hover {
    background: #f1f5f9;
  }
  .region-cell.selected {
    border-color: #2563eb;
    background: #eff6ff;
  }
  .cell-key {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: #64748b;
  }
  .cell-label {
    font-weight: 500;
    color: #0f172a;
  }
</style>
