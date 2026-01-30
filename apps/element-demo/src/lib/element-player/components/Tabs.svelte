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
      title={tab.description}
    >
      <span class="tab-label">{tab.label}</span>
      {#if tab.description}
        <span class="tab-description">{tab.description}</span>
      {/if}
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 1.25rem;
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

  .tab-label {
    font-weight: 500;
    font-size: 0.95rem;
  }

  .tab-description {
    font-size: 0.75rem;
    color: #999;
    font-weight: normal;
  }

  button:hover:not(:disabled) {
    color: #0066cc;
    background: #f5f5f5;
  }

  button:hover:not(:disabled) .tab-description {
    color: #0066cc;
  }

  button.active {
    color: #0066cc;
    border-bottom-color: #0066cc;
  }

  button.active .tab-description {
    color: #0066cc;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    .tab-description {
      display: none;
    }
  }
</style>
