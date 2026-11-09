<script lang="ts">
import { sanitizeModelHtml } from '@pie-element/shared-utils';
import { elementLanguageAttributes } from '@pie-element/shared-i18n';
import { catalogs } from '../i18n/index.js';

/** `language` is the chrome language, resident before this renders; `html` stays in the item's. */
let { html, language }: { html: string; language?: string } = $props();

const i18n = $derived(catalogs.forLocale(language));

let expanded = $state(false);
const panelId = `venn-teacher-instructions-${Math.random().toString(36).slice(2, 10)}`;
</script>

<!-- Collapsed by default, as multiple-choice shows them; the controller sends them to instructors only. -->
<div class="teacher-instructions pie-teacher-instructions">
  <button
    type="button"
    class="teacher-instructions-toggle pie-teacher-instructions-toggle"
    aria-expanded={expanded}
    aria-controls={panelId}
    {...elementLanguageAttributes(language)}
    onclick={() => (expanded = !expanded)}
  >
    {i18n.t(expanded ? 'hideTeacherInstructions' : 'showTeacherInstructions')}
  </button>
  <div id={panelId} class="teacher-instructions-content pie-teacher-instructions-content" hidden={!expanded}>
    {@html sanitizeModelHtml(html)}
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
    outline: 2px solid var(--vc-focus-ring, #1565c0);
    outline-offset: 2px;
  }

  .teacher-instructions-content {
    padding-top: 1rem;
  }
</style>
