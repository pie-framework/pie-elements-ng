<script lang="ts">
import { tCommon } from './i18n';

let { html, language }: { html: string; language?: string } = $props();

let expanded = $state(false);
const panelId = `mpb-teacher-instructions-${Math.random().toString(36).slice(2, 10)}`;
</script>

<!-- Collapsed by default, as multiple-choice shows them; the controller sends them to instructors only. -->
<div class="teacher-instructions pie-teacher-instructions">
  <button
    type="button"
    class="teacher-instructions-toggle pie-teacher-instructions-toggle"
    aria-expanded={expanded}
    aria-controls={panelId}
    onclick={() => (expanded = !expanded)}
  >
    {tCommon(expanded ? 'hideTeacherInstructions' : 'showTeacherInstructions', language)}
  </button>
  <div id={panelId} class="teacher-instructions-content pie-teacher-instructions-content" hidden={!expanded}>
    {@html html}
  </div>
</div>

<style>
  .teacher-instructions {
    margin-bottom: 1rem;
  }

  .teacher-instructions-toggle {
    padding: 0;
    border: 0;
    border-bottom: 1px dotted currentColor;
    background: transparent;
    font: inherit;
    color: var(--pie-primary, #3f51b5);
    cursor: pointer;
  }

  .teacher-instructions-toggle:focus-visible {
    outline: 2px solid var(--mpb-focus-ring, var(--pie-focus-outline, #1565c0));
    outline-offset: 2px;
  }

  .teacher-instructions-content {
    padding-top: 1rem;
  }
</style>
