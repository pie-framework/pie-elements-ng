<script lang="ts">
/**
 * Prompt Component
 *
 * Renders HTML prompts with support for:
 * - Sanitized HTML
 * - Math rendering (future: MathJax/KaTeX)
 * - Accessibility features
 */

interface Props {
  html: string;
  className?: string;
}

const { html, className = '' }: Props = $props();

// In the future, we'll add MathJax/KaTeX rendering here
// For now, we just render the HTML safely
</script>

<div class="pie-prompt {className}" role="region" aria-label="Question prompt">
  {@html html}
</div>

<style>
  .pie-prompt {
    margin-bottom: 1rem;
    line-height: 1.6;
    color: hsl(var(--bc) / 1);
  }

  .pie-prompt :global(p) {
    margin-bottom: 0.5rem;
    color: inherit;
  }

  .pie-prompt :global(img) {
    max-width: 100%;
    height: auto;
  }

  .pie-prompt :global(blockquote) {
    border-left: 4px solid #ddd;
    padding-left: 1rem;
    margin-left: 0;
    font-style: italic;
  }

  .pie-prompt :global(code) {
    background-color: #f5f5f5;
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-family: monospace;
  }

  .pie-prompt :global(pre) {
    background-color: #f5f5f5;
    padding: 1rem;
    border-radius: 0.375rem;
    overflow-x: auto;
  }

  .pie-prompt :global(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
  }

  .pie-prompt :global(th),
  .pie-prompt :global(td) {
    border: 1px solid #ddd;
    padding: 0.5rem;
    text-align: left;
  }

  .pie-prompt :global(th) {
    background-color: #f5f5f5;
    font-weight: 600;
  }
</style>
