<script lang="ts">
/**
 * Section component for grouping configuration form fields
 */
interface Props {
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children?: import('svelte').Snippet;
}

const {
  title,
  description,
  collapsible = false,
  defaultExpanded = true,
  children,
}: Props = $props();

let expanded = $state(defaultExpanded);

function _toggleExpanded() {
  if (collapsible) {
    expanded = !expanded;
  }
}
</script>

<div class="pie-section">
  <div class="section-header" class:collapsible onclick={toggleExpanded}>
    <h3>
      {title}
      {#if collapsible}
        <span class="toggle-icon">{expanded ? '▼' : '▶'}</span>
      {/if}
    </h3>
    {#if description}
      <p class="description">{description}</p>
    {/if}
  </div>
  {#if expanded}
    <div class="section-content">
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .pie-section {
    margin-bottom: 2rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1.5rem;
    background-color: #ffffff;
  }

  .section-header {
    margin-bottom: 1rem;
  }

  .section-header.collapsible {
    cursor: pointer;
    user-select: none;
  }

  .section-header.collapsible:hover h3 {
    color: #2563eb;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .toggle-icon {
    font-size: 0.75rem;
    color: #6b7280;
  }

  .description {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
  }

  .section-content {
    border-top: 1px solid #f3f4f6;
    padding-top: 1rem;
  }
</style>
