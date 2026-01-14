<script lang="ts">
/**
 * Loading Spinner Component
 *
 * Shows a loading state with optional message.
 */

interface Props {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const { message, size = 'md', className = '' }: Props = $props();

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};
</script>

<div class="pie-loading {className}" role="status" aria-live="polite">
  <svg
    class="spinner {sizeClasses[size]}"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>

  {#if message}
    <span class="sr-only">{message}</span>
    <p class="message">{message}</p>
  {:else}
    <span class="sr-only">Loading...</span>
  {/if}
</div>

<style>
  .pie-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
  }

  .spinner {
    animation: spin 1s linear infinite;
    color: #3b82f6;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .message {
    font-size: 0.875rem;
    color: #6b7280;
    text-align: center;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
