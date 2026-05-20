<script lang="ts">
/**
 * Scoring Panel Component
 * Displays controller scoring results in evaluate mode using TipTap editor
 */
import JsonEditor from './JsonEditor.svelte';

let { score = null }: { score?: any } = $props();

const formattedScore = $derived(score ? JSON.stringify(score, null, 2) : '');
</script>

{#if score}
  <div class="card bg-base-100 border border-success/50" data-testid="scoring-panel">
    <div class="card-body p-4">
      <h3 class="card-title text-sm uppercase text-base-content/60">Score</h3>
      <div data-testid="score-value">
        <JsonEditor value={formattedScore} readonly={true} minHeight={300} />
      </div>
    </div>
  </div>
{/if}
