<script lang="ts">
let { data } = $props();
</script>

<div class="h-full overflow-auto bg-base-200 p-4 md:p-6">
  <div class="card bg-base-100 shadow-sm border border-base-300 mb-4">
    <div class="card-body gap-4">
      <div>
        <h1 class="card-title text-2xl">Controller Source</h1>
        <p class="text-sm text-base-content/70 mt-1">
          Controllers are loaded as package subpath modules. This tab shows the local source used to
          build that module; it is not a <code>/{data.elementName}/controller.js</code> browser route.
        </p>
      </div>

      <div class="flex flex-wrap gap-2 text-xs">
        <span class="badge badge-outline">{data.packageName}</span>
        {#if data.controllerSourceAvailable}
          <span class="badge badge-outline">{data.sourcePath}</span>
        {/if}
      </div>
    </div>
  </div>

  {#if data.controllerSourceAvailable}
    <div class="card bg-base-100 shadow-sm border border-base-300 mb-4">
      <div class="card-body gap-3">
        <h2 class="card-title text-lg">Package Entry Points</h2>
        <p class="text-sm text-base-content/70">
          ESM players should import <code>{data.esmSpecifier}</code>. Legacy alias-based builders may
          resolve <code>{data.compatibilitySpecifier}</code>, which is backed by the published root
          <code>controller.js</code> shim.
        </p>
      </div>
    </div>

    <div class="card bg-base-100 shadow-sm border border-base-300">
      <div class="card-body p-0">
        <pre class="m-0 overflow-auto p-4 text-sm leading-relaxed"><code>{data.source}</code></pre>
      </div>
    </div>
  {:else}
    <div class="alert alert-warning">
      <div class="space-y-1">
        <p class="font-semibold">Controller source was not found for this element.</p>
        <p class="text-sm">
          Expected a source file at <code>src/controller/index.ts</code>, <code>.tsx</code>,
          <code>.js</code>, or <code>.jsx</code>.
        </p>
      </div>
    </div>
  {/if}
</div>
