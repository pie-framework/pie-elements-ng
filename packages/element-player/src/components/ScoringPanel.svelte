<script lang="ts">
/**
 * Scoring Panel Component
 * Displays controller scoring results in evaluate mode
 */

let { score = null }: { score?: any } = $props();

const formattedScore = $derived(score ? JSON.stringify(score, null, 2) : '');
</script>

{#if score}
  <div class="scoring-panel panel">
    <h3>Score</h3>
    <pre>{formattedScore}</pre>
  </div>
{/if}

<style>
  .scoring-panel {
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
    background: #e8f5e9;
    border: 1px solid #4caf50;
    border-radius: 4px;
    font-size: 0.85rem;
    line-height: 1.4;
    overflow-x: auto;
    color: #1b5e20;
  }
</style>
