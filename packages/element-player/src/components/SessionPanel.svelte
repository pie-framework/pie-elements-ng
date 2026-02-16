<script lang="ts">
/**
 * Session Panel Component
 * Displays the current session state as formatted JSON
 */

let { session = {} }: { session?: any } = $props();

const formattedSession = $derived(JSON.stringify(session, null, 2));
</script>

<div class="session-panel panel">
  <h3>Session State</h3>
  <pre>{formattedSession}</pre>
</div>

<style>
  .session-panel {
    max-height: 300px;
    overflow: auto;
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    text-transform: uppercase;
    color: #666;
    font-weight: 600;
  }

  pre {
    margin: 0;
    padding: 0.75rem;
    background: #f5f5f5;
    border-radius: 4px;
    font-size: 0.85rem;
    line-height: 1.4;
    overflow-x: auto;
  }
</style>
