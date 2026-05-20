<script lang="ts">
/**
 * Session Panel Component
 * Displays the current session state as formatted JSON using TipTap editor
 */
import JsonEditor from './JsonEditor.svelte';

let { session = {} }: { session?: any } = $props();

const formattedSession = $derived(JSON.stringify(session, null, 2));
</script>

<div class="card bg-base-100 border border-base-300">
  <div class="card-body p-4">
    <h3 class="card-title text-sm uppercase text-base-content/60">Session State</h3>
    <div data-testid="session-panel-content">
      <JsonEditor value={formattedSession} readonly={true} minHeight={300} />
    </div>
  </div>
</div>
