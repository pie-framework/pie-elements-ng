<script lang="ts">
import { page } from '$app/state';
import DemoEl from '$lib/DemoEl.svelte';
import { loadDemo, type DemoModule } from '$lib/demo-registry';

let demo: DemoModule | null = null;
let error: string | null = null;

$: tagName = page.params.tagName;

$: (async () => {
  error = null;
  demo = null;
  try {
    demo = await loadDemo(tagName);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
})();
</script>

<main style="padding: 16px; max-width: 1200px; margin: 0 auto;">
  <p><a href="/">← Back</a></p>
  <h1>{tagName}</h1>

  {#if error}
    <pre style="color: #b00020;">{error}</pre>
  {:else if demo}
    <DemoEl {demo} />
  {:else}
    <p>Loading…</p>
  {/if}
</main>

