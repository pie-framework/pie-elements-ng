<script lang="ts">
/**
 * Root error page
 * Handles all errors including non-existent element routes
 */
import { page } from '$app/stores';

const error = $derived($page.error as any);
const status = $derived($page.status);

// Check if this is an element not found error
const isElementError = $derived(error?.message?.includes('not found in registry'));
const errorMessage = $derived(error?.message || 'An unexpected error occurred');
</script>

<div class="error-container">
	<div class="error-card">
		<div class="error-icon">{status === 404 ? '🔍' : '⚠️'}</div>
		<h1 class="error-title">
			{#if status === 404 && isElementError}
				Element Not Found
			{:else if status === 404}
				Page Not Found
			{:else}
				Error {status}
			{/if}
		</h1>

		<div class="error-message">
			<pre>{errorMessage}</pre>
		</div>

		<div class="actions">
			{#if isElementError}
				<a href="/" class="btn-primary">Browse All Elements</a>
				<a href="/multiple-choice/deliver" class="btn-secondary">View Example</a>
			{:else}
				<a href="/" class="btn-primary">Go Home</a>
			{/if}
		</div>
	</div>
</div>

<style>
	.error-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	}

	.error-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		padding: 3rem;
		max-width: 700px;
		width: 100%;
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
		line-height: 1.7;
		color: #555;
		white-space: pre-wrap;
		word-break: break-word;
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
