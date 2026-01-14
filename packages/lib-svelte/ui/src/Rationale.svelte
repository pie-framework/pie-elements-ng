<script lang="ts">
/**
 * Rationale Component
 *
 * Shows instructional rationale (instructor-only).
 */

interface Props {
  rationale: string;
  title?: string;
  className?: string;
}

const { rationale, title = 'Rationale', className = '' }: Props = $props();
</script>

<details class="pie-rationale {className}" open>
  <summary>{title}</summary>
  <div class="content">
    {@html rationale}
  </div>
</details>

<style>
  .pie-rationale {
    margin-top: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.375rem;
    padding: 0.75rem;
    background-color: #f9fafb;
  }

  summary {
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::before {
    content: '▶';
    display: inline-block;
    transition: transform 0.2s;
    font-size: 0.75rem;
  }

  details[open] summary::before {
    transform: rotate(90deg);
  }

  summary:hover {
    color: #3b82f6;
  }

  .content {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #e5e7eb;
    line-height: 1.6;
  }

  .content :global(p) {
    margin-bottom: 0.5rem;
  }

  .content :global(p:last-child) {
    margin-bottom: 0;
  }
</style>
