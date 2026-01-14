<script lang="ts">
/**
 * Feedback Component
 *
 * Shows correct/incorrect feedback with optional message.
 */

interface Props {
  correct: boolean;
  feedback?: string;
  className?: string;
}

const { correct, feedback, className = '' }: Props = $props();
</script>

<div
  class="pie-feedback {className}"
  class:correct
  class:incorrect={!correct}
  role="alert"
  aria-live="polite"
>
  <div class="icon">
    {#if correct}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clip-rule="evenodd"
        />
      </svg>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clip-rule="evenodd"
        />
      </svg>
    {/if}
  </div>

  {#if feedback}
    <div class="message">
      {@html feedback}
    </div>
  {/if}
</div>

<style>
  .pie-feedback {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 0.375rem;
    margin-top: 0.5rem;
  }

  .pie-feedback.correct {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
  }

  .pie-feedback.incorrect {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
  }

  .icon {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.125rem;
  }

  .message {
    flex: 1;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .message :global(p) {
    margin: 0;
  }
</style>
