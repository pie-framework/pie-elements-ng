<script lang="ts">
/**
 * Player Routes Layout
 * Initializes stores and provides common data to all player routes
 * Shows navbar and tab navigation for player views
 */
import { page } from '$app/stores';
import { initializeDemo, hasConfigure, hasPrint } from '$lib/stores/demo-state';
import type { LayoutData } from './$types';

let { data, children }: { data: LayoutData; children: any } = $props();

// Initialize stores immediately when data is available
if (data) {
  initializeDemo({
    elementName: data.elementName,
    elementTitle: data.elementTitle,
    model: data.initialModel,
    session: data.initialSession,
    controller: null, // Will be loaded by PlayerLayout
    capabilities: data.capabilities,
    mathRenderer: data.mathRenderer,
  });
}

// Format element name for display
function formatElementName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Tab configuration - paths are derived from element name
const tabs = $derived([
  { id: 'deliver', label: 'Delivery', path: `/${data.elementName}/deliver` },
  { id: 'author', label: 'Author', path: `/${data.elementName}/author` },
  { id: 'print', label: 'Print', path: `/${data.elementName}/print` },
  { id: 'source', label: 'Source', path: `/${data.elementName}/source` },
]);

// Determine active tab from current path (use $derived in Svelte 5)
const activeTab = $derived($page.url.pathname.split('/')[2] || 'deliver');
const packageName = $derived(`@pie-element/${data.elementName}`);
</script>

<div class="flex flex-col h-screen">
  <!-- Navbar -->
  <div class="navbar bg-base-100 shadow-lg">
    <div class="navbar-start">
      <a href="/{data.elementName}" class="btn btn-ghost text-xl gap-3">
        <img src="/pie-logo-orange.svg" alt="PIE Logo" class="w-10 h-10" />
        <div class="flex flex-col items-start">
          <span class="font-bold">{formatElementName(data.elementName)}</span>
          <span class="text-xs opacity-70">{packageName}</span>
        </div>
      </a>
    </div>
    <div class="navbar-end">
      <label class="swap swap-rotate">
        <input type="checkbox" class="theme-controller" value="dark" />
        <svg class="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
        </svg>
        <svg class="swap-off fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"/>
        </svg>
      </label>
    </div>
  </div>

  <!-- Tab Navigation using DaisyUI tabs -->
  <div role="tablist" class="tabs tabs-bordered bg-base-100 border-b border-base-300">
    {#each tabs as tab}
      {@const isDisabled =
        (tab.id === "author" && !$hasConfigure) ||
        (tab.id === "print" && !$hasPrint)}
      {@const isActive = activeTab === tab.id}
      <a
        href={tab.path}
        role="tab"
        class="tab"
        class:tab-active={isActive}
        class:tab-disabled={isDisabled}
        aria-disabled={isDisabled}
        tabindex={isDisabled ? -1 : 0}
      >
        {tab.label}
      </a>
    {/each}
  </div>

  <!-- Page Content -->
  <div class="flex-1 overflow-auto bg-base-200">
    {@render children()}
  </div>
</div>
