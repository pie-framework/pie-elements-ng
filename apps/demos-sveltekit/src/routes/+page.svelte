<script lang="ts">
import { onMount } from 'svelte';
import { listDemoTagNames } from '$lib/demo-registry';

let demos: string[] = [];
let error: string | null = null;

onMount(async () => {
  try {
    demos = await listDemoTagNames();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
});
</script>

<main style="padding: 16px; max-width: 1000px; margin: 0 auto;">
  <h1>PIE demos</h1>
  <p>
    These demos are generated from upstream <code>pie-elements</code> demo data and precompiled into ESM.
  </p>

  {#if error}
    <pre style="color: #b00020;">{error}</pre>
  {:else if demos.length === 0}
    <p>No demos found yet. Run <code>bun run upstream:sync --element=&lt;name&gt;</code> to generate demo data.</p>
  {:else}
    <ul>
      {#each demos as tag}
        <li><a href={`/demos/${tag}`}>{tag}</a></li>
      {/each}
    </ul>
  {/if}
</main>

