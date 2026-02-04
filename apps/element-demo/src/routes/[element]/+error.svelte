<script lang="ts">
/**
 * Error page for element routes
 * Displays friendly error messages when elements are not found
 */
import { page } from '$app/stores';

// Extract error message
const error = $derived($page.error as any);
const status = $derived($page.status);

// Parse the error message to extract suggestions
const errorMessage = $derived(error?.message || 'Unknown error occurred');
const lines = $derived(errorMessage.split('\n'));
</script>

<div class="error-container">
	<div class="error-card">
		<div class="error-icon">⚠️</div>
		<h1 class="error-title">Element Not Found</h1>

		{#if errorMessage}
			<div class="error-message">
				<pre>{errorMessage}</pre>
			</div>
		{:else}
			<p class="error-fallback">
				The element you're looking for doesn't exist or couldn't be loaded.
			</p>
		{/if}

		<div class="actions">
			<a href="/" class="btn-primary">Browse All Elements</a>
			<a href="/multiple-choice/deliver" class="btn-secondary">View Multiple Choice Example</a>
		</div>
	</div>
</div>

<style>
	.error-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.error-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		padding: 3rem;
		max-width: 700px;
		text-align: center;
	}

	.error-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}

	.error-title {
		font-size: 2rem;
		font-weight: 700;
		color: #2c3e50;
		margin: 0 0 1.5rem;
	}

	.error-message {
		background: #fef5e7;
		border: 1px solid #f39c12;
		border-radius: 8px;
		padding: 1.5rem;
		margin: 1.5rem 0;
		text-align: left;
	}

	.error-message pre {
		margin: 0;
		font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
		font-size: 0.875rem;
		line-height: 1.6;
		color: #555;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.error-fallback {
		color: #7f8c8d;
		font-size: 1.125rem;
		margin: 1.5rem 0;
	}

	.actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 2rem;
		flex-wrap: wrap;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s;
		display: inline-block;
	}

	.btn-primary {
		background: #3498db;
		color: white;
	}

	.btn-primary:hover {
		background: #2980b9;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
	}

	.btn-secondary {
		background: #ecf0f1;
		color: #2c3e50;
	}

	.btn-secondary:hover {
		background: #d5dbdb;
		transform: translateY(-2px);
	}
</style>
