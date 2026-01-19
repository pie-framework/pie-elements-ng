<script lang="ts">
/**
 * Tabs Component
 * Tab navigation for switching between Delivery and Configure views
 */

import type { Tab } from '../lib/types';

let {
  tabs = [],
  active = $bindable('delivery'),
}: {
  tabs: Tab[];
  active?: string;
} = $props();
</script>

<div class="tabs">
  {#each tabs as tab}
    <button
      class:active={active === tab.id}
      disabled={tab.disabled}
      onclick={() => !tab.disabled && (active = tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</div>

<style>
  .tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    border-bottom: 2px solid #ddd;
  }

  button {
    padding: 0.75rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    font-size: 0.95rem;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: -2px;
  }

  button:hover:not(:disabled) {
    color: #0066cc;
    background: #f5f5f5;
  }

  button.active {
    color: #0066cc;
    border-bottom-color: #0066cc;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
