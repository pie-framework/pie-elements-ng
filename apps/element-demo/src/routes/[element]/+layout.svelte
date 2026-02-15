<script lang="ts">
/**
 * Player Routes Layout
 * Initializes stores and provides common data to all player routes
 * Shows navbar and tab navigation for player views
 */
import { page } from '$app/stores';
import { goto } from '$app/navigation';
import { onMount } from 'svelte';
import { initializeDemo, hasConfigure, hasPrint } from '$lib/stores/demo-state';
import DemoSelector from '$lib/components/DemoSelector.svelte';
import type { LayoutData } from './$types';

let { data, children }: { data: LayoutData; children: any } = $props();

// Initialize stores on mount - simple, no reactivity complexity
onMount(() => {
  initializeDemo({
    elementName: data.elementName,
    elementTitle: data.elementTitle,
    model: data.initialModel,
    session: data.initialSession,
    controller: null, // Will be loaded by PlayerLayout
    capabilities: data.capabilities,
    demos: data.demos,
    activeDemoId: data.activeDemoId,
  });
});

// Format element name for display
function formatElementName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Tab configuration - paths are derived from element name and preserve demo/mode/role parameters
const currentDemoParam = $derived($page.url.searchParams.get('demo'));
const currentModeParam = $derived($page.url.searchParams.get('mode'));
const currentRoleParam = $derived($page.url.searchParams.get('role'));

// Build query string with all relevant parameters
const buildQueryString = $derived((includeDeliveryParams: boolean) => {
  const params = new URLSearchParams();
  if (currentDemoParam) {
    params.set('demo', currentDemoParam);
  }
  if (includeDeliveryParams) {
    if (currentModeParam) {
      params.set('mode', currentModeParam);
    }
    if (currentRoleParam) {
      params.set('role', currentRoleParam);
    }
  }
  const str = params.toString();
  return str ? `?${str}` : '';
});

// Generate tabs dynamically based on discovered views
const tabs = $derived.by(() => {
  const generatedTabs = [];

  // Always add deliver (baseline delivery view)
  generatedTabs.push({
    id: 'deliver',
    label: 'Delivery',
    path: `/${data.elementName}/deliver${buildQueryString(true)}`,
    description: 'Interactive delivery view',
  });

  // Add dynamically discovered views
  for (const view of data.availableViews || []) {
    // Map view ID to route path
    // For delivery variants, use 'deliver' route with query param
    // For other views (author, print), use dedicated routes
    let routePath: string;
    let description = view.description;

    if (view.isDeliveryVariant) {
      // Delivery variants go to /deliver?variant=mobile
      const variantName = view.id.replace('delivery-', '');
      routePath = `/${data.elementName}/deliver${buildQueryString(true)}&variant=${variantName}`;
      description = description || `${view.label} variant`;
    } else {
      // Standard views have their own routes
      routePath = `/${data.elementName}/${view.id}${buildQueryString(false)}`;
    }

    generatedTabs.push({
      id: view.id,
      label: view.label,
      path: routePath,
      description,
    });
  }

  // Always add source (code viewer)
  generatedTabs.push({
    id: 'source',
    label: 'Source',
    path: `/${data.elementName}/source${buildQueryString(false)}`,
    description: 'View source code',
  });

  return generatedTabs;
});

// Determine active tab from current path (use $derived in Svelte 5)
const activeTab = $derived($page.url.pathname.split('/')[2] || 'deliver');
const packageName = $derived(data.packageName || `@pie-element/${data.elementName}`);

// Import stores for mode, role, and theme
import { mode, role, theme } from '$lib/stores/demo-state';

// Sync URL parameters with stores for bookmarkability
onMount(() => {
  const url = new URL($page.url);
  let needsUpdate = false;

  // Demo parameter
  const currentDemoParam = url.searchParams.get('demo');
  const hasMultipleDemos = data.demos && data.demos.length > 1;
  if (hasMultipleDemos && !currentDemoParam && data.activeDemoId) {
    url.searchParams.set('demo', data.activeDemoId);
    needsUpdate = true;
  }

  // Mode parameter (only for deliver route)
  const isDeliverRoute = $page.url.pathname.endsWith('/deliver');
  if (isDeliverRoute) {
    const modeParam = url.searchParams.get('mode');
    if (modeParam && ['gather', 'view', 'evaluate'].includes(modeParam)) {
      mode.set(modeParam as 'gather' | 'view' | 'evaluate');
    } else if (!modeParam) {
      // Add current mode to URL
      url.searchParams.set('mode', $mode);
      needsUpdate = true;
    }

    // Role parameter
    const roleParam = url.searchParams.get('role');
    if (roleParam && ['student', 'instructor'].includes(roleParam)) {
      role.set(roleParam as 'student' | 'instructor');
    } else if (!roleParam) {
      // Add current role to URL
      url.searchParams.set('role', $role);
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    goto(url.toString(), { replaceState: true, noScroll: true });
  }
});

// Bidirectional sync: URL ↔ stores
$effect(() => {
  const isDeliverRoute = $page.url.pathname.endsWith('/deliver');
  if (isDeliverRoute) {
    const modeParam = $page.url.searchParams.get('mode');
    const roleParam = $page.url.searchParams.get('role');

    // Sync URL → stores (when URL changes from navigation)
    if (modeParam && ['gather', 'view', 'evaluate'].includes(modeParam)) {
      const newMode = modeParam as 'gather' | 'view' | 'evaluate';
      if (newMode !== $mode) {
        mode.set(newMode);
      }
    }

    if (roleParam && ['student', 'instructor'].includes(roleParam)) {
      const newRole = roleParam as 'student' | 'instructor';
      if (newRole !== $role) {
        role.set(newRole);
      }
    }

    // Sync stores → URL (when stores change programmatically)
    const url = new URL($page.url);
    let needsUpdate = false;

    if (modeParam !== $mode) {
      url.searchParams.set('mode', $mode);
      needsUpdate = true;
    }

    if (roleParam !== $role) {
      url.searchParams.set('role', $role);
      needsUpdate = true;
    }

    if (needsUpdate) {
      goto(url.toString(), { replaceState: true, noScroll: true });
    }
  }
});

// Handle theme toggle checkbox
function handleThemeToggle(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const newTheme = checkbox.checked ? 'dark' : 'light';
  theme.set(newTheme);
}
</script>

<div class="flex flex-col h-screen">
  <!-- Navbar -->
  <div class="navbar bg-base-100 shadow-lg">
    <div class="navbar-start flex-shrink min-w-0">
      <a href="/" class="btn btn-ghost btn-sm flex-shrink-0" title="All Elements">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </a>
      <a href="/{data.elementName}" class="btn btn-ghost text-xl gap-3 flex-shrink min-w-0 overflow-hidden">
        <img src="/pie-logo-orange.svg" alt="PIE Logo" class="w-10 h-10 flex-shrink-0" />
        <div class="flex flex-col items-start min-w-0 overflow-hidden">
          <span class="font-bold truncate max-w-full">{formatElementName(data.elementName)}</span>
          <span class="text-xs opacity-70 truncate max-w-full">{packageName}</span>
        </div>
      </a>
    </div>
    <div class="navbar-center flex-shrink-0">
      <DemoSelector demos={data.demos || []} activeDemoId={data.activeDemoId || 'default'} />
    </div>
    <div class="navbar-end flex-shrink-0">
      <label class="swap swap-rotate">
        <input
          type="checkbox"
          class="theme-controller"
          value="dark"
          checked={$theme === 'dark'}
          onchange={handleThemeToggle}
        />
        <svg class="swap-on fill-current w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1-.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
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
        data-testid="tab-{tab.id}"
      >
        {tab.label}
      </a>
    {/each}
  </div>

  <!-- Page Content -->
  <div class="flex-1 overflow-hidden bg-base-200">
    {@render children()}
  </div>
</div>
