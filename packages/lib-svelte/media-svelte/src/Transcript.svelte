<script lang="ts">
import { resolveMediaUiText } from './media-ui.js';
import { resolveTranscriptContent } from './transcript.js';
import type { TranscriptProps } from './types.js';

let {
  transcript,
  label,
  language,
  contentLanguage,
  initiallyExpanded = false,
  uiText,
}: TranscriptProps = $props();

const componentId = $props.id();
const transcriptId = `media-transcript-${componentId}`;
const readInitialExpansion = () => initiallyExpanded;
let expanded = $state(readInitialExpansion());
const messages = $derived(resolveMediaUiText(language, uiText));
const content = $derived(resolveTranscriptContent(transcript));
const transcriptLanguage = $derived(
  transcript?.lang?.trim() || contentLanguage?.trim() || undefined
);

function toggleTranscript() {
  expanded = !expanded;
}
</script>

{#if content}
  <div class="media-transcript">
    <button
      class="media-transcript__toggle"
      type="button"
      aria-expanded={expanded}
      aria-controls={transcriptId}
      onclick={toggleTranscript}
    >
      {expanded ? messages.hideTranscript : messages.showTranscript}
    </button>

    <section
      class="media-transcript__region"
      id={transcriptId}
      aria-label={label}
      lang={transcriptLanguage}
      hidden={!expanded}
    >
      {#if content.kind === 'html'}
        <div class="media-transcript__prose">{@html content.value}</div>
      {:else if content.kind === 'plainText'}
        <div class="media-transcript__plain-text">{content.value}</div>
      {:else}
        <a class="media-transcript__external-link" href={content.value}>
          {messages.viewTranscript}
        </a>
      {/if}
    </section>
  </div>
{/if}

<style>
  .media-transcript {
    display: grid;
    min-inline-size: 0;
    gap: var(--media-transcript-gap, 0.75rem);
    color: var(--pie-text);
  }

  .media-transcript__toggle {
    inline-size: fit-content;
    min-block-size: var(--media-control-min-size, 44px);
    padding: var(--media-control-padding, 0.625rem 0.875rem);
    border: var(--media-control-border-width, 1px) solid var(--pie-border-light);
    border-radius: var(--media-control-border-radius, 0.25rem);
    color: var(--pie-text);
    background: var(--pie-white);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .media-transcript__toggle:hover {
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }

  .media-transcript__toggle:focus-visible,
  .media-transcript__external-link:focus-visible {
    outline: var(--media-focus-width, 2px) solid
      var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border)));
    outline-offset: var(--media-focus-offset, 2px);
  }

  .media-transcript__region {
    min-inline-size: 0;
    padding-inline-start: var(--media-region-padding, 1rem);
    border-inline-start: var(--media-region-border-width, 0.25rem) solid var(--pie-border-light);
    overflow-wrap: anywhere;
  }

  .media-transcript__plain-text {
    white-space: pre-wrap;
  }

  .media-transcript__prose :global(p),
  .media-transcript__prose :global(ul),
  .media-transcript__prose :global(ol) {
    margin-block: 0 var(--media-prose-block-gap, 0.75rem);
  }

  .media-transcript__prose :global(:last-child) {
    margin-block-end: 0;
  }

  .media-transcript__prose :global(a),
  .media-transcript__external-link {
    color: var(--pie-text);
    overflow-wrap: anywhere;
  }
</style>
