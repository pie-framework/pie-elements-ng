<script lang="ts">
import { page } from '$app/stores';

let { data } = $props();

const viewHref = (viewId: string): string => {
  const params = new URLSearchParams($page.url.searchParams);
  params.set('view', viewId);
  const query = params.toString();
  return query.length ? `?${query}` : '';
};
</script>

<div class="h-full overflow-auto p-4 md:p-6 bg-base-200">
  {#if !data.docsAvailable}
    <div class="alert alert-warning">
      <div class="space-y-1">
        <p class="font-semibold">Docs are not generated for this element yet.</p>
        <p class="text-sm">
          Expected manifest at <code>{data.manifestPath}</code>.
        </p>
      </div>
    </div>
  {:else}
    <div class="card bg-base-100 shadow-sm border border-base-300 mb-4">
      <div class="card-body gap-4">
        <div>
          <h1 class="card-title text-2xl">Element Docs</h1>
          <p class="text-base-content/70 text-sm mt-1">{data.manifest.summary}</p>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <span class="badge badge-outline">{data.manifest.packageName}</span>
          <span class="badge badge-outline">framework: {data.manifest.framework}</span>
          <span class="badge badge-outline">generated: {data.manifest.generatedAt}</span>
        </div>
        {#if data.manifest.supportedModes.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each data.manifest.supportedModes as mode}
              <span class="badge badge-primary badge-sm">{mode}</span>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="tabs tabs-boxed mb-4 overflow-x-auto">
      {#each data.manifest.views as view}
        <a
          href={viewHref(view.id)}
          class="tab"
          class:tab-active={view.id === data.activeViewId}
          data-sveltekit-reload
        >
          {view.id}
        </a>
      {/each}
    </div>

    {#if data.activeViewFile}
      <div class="card bg-base-100 shadow-sm border border-base-300">
        <div class="card-body p-3 md:p-4">
          <iframe
            title={`${data.elementName} docs ${data.activeViewId}`}
            src={`${data.docsBasePath}/${data.activeViewFile}`}
            class="w-full min-h-[70vh] rounded border border-base-300 bg-base-100"
          ></iframe>
        </div>
      </div>
    {:else}
      <div class="alert alert-info">No documented views were found for this element.</div>
    {/if}
  {/if}
</div>
