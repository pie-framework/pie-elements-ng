<script lang="ts">
let building = false;
let result: any = null;
let elementName = '@pie-element/multiple-choice';
let elementVersion = '0.1.0';

async function build() {
  building = true;
  result = null;

  try {
    const response = await fetch('/api/bundle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dependencies: [{ name: elementName, version: elementVersion }],
      }),
    });

    result = await response.json();
  } catch (error: any) {
    result = { success: false, errors: [error.message] };
  } finally {
    building = false;
  }
}
</script>

<div class="container mx-auto p-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-6">PIE Element Bundler</h1>

  <div class="card bg-base-200 shadow-xl mb-6">
    <div class="card-body">
      <h2 class="card-title">Build Configuration</h2>

      <div class="form-control">
        <label class="label" for="element-name">
          <span class="label-text">Element Name</span>
        </label>
        <input
          id="element-name"
          type="text"
          bind:value={elementName}
          placeholder="@pie-element/multiple-choice"
          class="input input-bordered"
          disabled={building}
        />
      </div>

      <div class="form-control">
        <label class="label" for="element-version">
          <span class="label-text">Version</span>
        </label>
        <input
          id="element-version"
          type="text"
          bind:value={elementVersion}
          placeholder="0.1.0"
          class="input input-bordered"
          disabled={building}
        />
      </div>

      <div class="card-actions justify-end mt-4">
        <button
          class="btn btn-primary"
          on:click={build}
          disabled={building}
        >
          {#if building}
            <span class="loading loading-spinner"></span>
            Building...
          {:else}
            Build Bundle
          {/if}
        </button>
      </div>
    </div>
  </div>

  {#if result}
    {#if result.success}
      <div class="alert alert-success shadow-lg mb-6">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <h3 class="font-bold">Build Successful!</h3>
            <div class="text-sm">
              Hash: <code class="bg-base-100 px-2 py-1 rounded">{result.hash}</code>
            </div>
            <div class="text-sm">Duration: {result.duration}ms</div>
            {#if result.cached}
              <div class="text-sm text-warning">✓ Loaded from cache</div>
            {/if}
          </div>
        </div>
      </div>

      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">Bundle URLs</h2>
          <div class="flex flex-col gap-2">
            <a
              href={result.bundles.player}
              target="_blank"
              class="btn btn-sm btn-outline"
            >
              📦 player.js
            </a>
            <a
              href={result.bundles.clientPlayer}
              target="_blank"
              class="btn btn-sm btn-outline"
            >
              📦 client-player.js
            </a>
            <a
              href={result.bundles.editor}
              target="_blank"
              class="btn btn-sm btn-outline"
            >
              📦 editor.js
            </a>
          </div>

          {#if result.warnings && result.warnings.length > 0}
            <div class="alert alert-warning mt-4">
              <div>
                <h4 class="font-bold">Warnings:</h4>
                <ul class="list-disc list-inside text-sm">
                  {#each result.warnings as warning}
                    <li>{warning}</li>
                  {/each}
                </ul>
              </div>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <div class="alert alert-error shadow-lg">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div>
            <h3 class="font-bold">Build Failed</h3>
            {#if result.errors}
              <div class="text-sm">
                <pre class="mt-2 overflow-x-auto">{result.errors.join('\n')}</pre>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <div class="mt-8 text-sm text-base-content/60">
    <h3 class="font-bold mb-2">About</h3>
    <p>
      This bundler creates IIFE bundles compatible with pie-player-components.
      It uses Webpack 5 to bundle elements with proper version resolution for @pie-lib packages.
    </p>
    <p class="mt-2">
      Bundles are cached and reused if the same dependencies are requested again.
    </p>
  </div>
</div>
