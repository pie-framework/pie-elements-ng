<script lang="ts">
/**
 * Upload Component
 *
 * WCAG 2.2 Level AA compliant file upload control
 * Maps to QTI uploadInteraction
 */

import { addFile, removeFile } from './upload.controller.js';
import type { FileValidationError, UploadComponentProps } from './upload.types.js';

let {
  model,
  session = $bindable(),
  evaluation,
  env,
  onSessionChange,
}: UploadComponentProps = $props();

// Component state
let fileInput: HTMLInputElement | undefined = $state();
let _dragActive = $state(false);
let _error: FileValidationError | undefined = $state();
let _uploading = $state(false);

// Reactive computed values
const isDisabled = $derived(env.mode === 'view');
const _showRationale = $derived(
  env.mode === 'evaluate' && env.role === 'instructor' && model.rationaleEnabled && model.rationale
);
const _showEvaluation = $derived(env.mode === 'evaluate' && evaluation);
const files = $derived(session.files || []);
const maxFiles = $derived(model.maxFiles || 1);
const _canAddMore = $derived(files.length < maxFiles && !isDisabled);

// Unique IDs for accessibility
const _uploadId = $derived(`upload-${model.id}`);
const _promptId = $derived(`upload-prompt-${model.id}`);
const _statusId = $derived(`upload-status-${model.id}`);
const _errorId = $derived(`upload-error-${model.id}`);

/**
 * Handle file selection
 */
async function handleFiles(fileList: FileList | null) {
  if (!fileList || fileList.length === 0 || isDisabled) return;

  _error = undefined;
  _uploading = true;

  try {
    // Process each file
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const result = await addFile(session, file, model);

      if (result.error) {
        _error = result.error;
        break;
      }

      session = result.session;
    }

    onSessionChange(session);
  } catch (err) {
    _error = {
      type: 'type',
      message: err instanceof Error ? err.message : 'Failed to upload file',
    };
  } finally {
    _uploading = false;

    // Reset file input
    if (fileInput) {
      fileInput.value = '';
    }
  }
}

/**
 * Handle file input change
 */
function _handleInputChange(event: Event) {
  const target = event.target as HTMLInputElement;
  handleFiles(target.files);
}

/**
 * Handle file removal
 */
function _handleRemove(index: number) {
  if (isDisabled) return;

  _error = undefined;
  session = removeFile(session, index);
  onSessionChange(session);
}

/**
 * Handle drag over
 */
function _handleDragOver(event: DragEvent) {
  if (isDisabled) return;

  event.preventDefault();
  _dragActive = true;
}

/**
 * Handle drag leave
 */
function _handleDragLeave() {
  _dragActive = false;
}

/**
 * Handle drop
 */
function _handleDrop(event: DragEvent) {
  if (isDisabled) return;

  event.preventDefault();
  _dragActive = false;

  handleFiles(event.dataTransfer?.files || null);
}

/**
 * Trigger file input click
 */
function _triggerFileInput() {
  if (!isDisabled && fileInput) {
    fileInput.click();
  }
}

// Evaluation status class
const _evaluationClass = $derived(() => {
  if (!evaluation) return '';
  return evaluation.complete ? 'complete' : 'incomplete';
});
</script>

<div
	class="pie-upload"
	class:disabled={isDisabled}
	class:evaluated={showEvaluation}
>
	{#if model.promptEnabled && model.prompt}
		<div id={promptId} class="prompt">
			{@html model.prompt}
		</div>
	{/if}

	{#if model.instructions}
		<div class="instructions">
			{@html model.instructions}
		</div>
	{/if}

	<!-- Upload area -->
	<div class="upload-container">
		<!-- File input (hidden) -->
		<input
			bind:this={fileInput}
			type="file"
			id={uploadId}
			class="file-input"
			accept={getAcceptString(model)}
			multiple={maxFiles > 1}
			disabled={isDisabled || !canAddMore}
			onchange={handleInputChange}
			aria-labelledby={model.promptEnabled && model.prompt ? promptId : undefined}
			aria-label={!model.promptEnabled || !model.prompt ? 'File upload' : undefined}
			aria-describedby={error ? errorId : showEvaluation ? statusId : undefined}
			aria-invalid={error ? 'true' : undefined}
		/>

		<!-- Drop zone -->
		{#if canAddMore}
			<div
				class="drop-zone"
				class:drag-active={dragActive}
				role="button"
				tabindex={isDisabled ? -1 : 0}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				ondrop={handleDrop}
				onclick={triggerFileInput}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						triggerFileInput();
					}
				}}
				aria-label="Click or drag files to upload"
			>
				<svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<polyline points="17 8 12 3 7 8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<line x1="12" y1="3" x2="12" y2="15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>

				<p class="drop-text">
					{#if dragActive}
						Drop files here
					{:else}
						Click to select files or drag and drop
					{/if}
				</p>

				{#if model.acceptedTypes && model.acceptedTypes.length > 0}
					<p class="file-types">Accepted: {model.acceptedTypes.join(', ')}</p>
				{/if}

				{#if model.maxFileSize}
					<p class="file-size">Max size: {formatFileSize(model.maxFileSize)}</p>
				{/if}

				{#if uploading}
					<div class="uploading" role="status" aria-live="polite">
						Uploading...
					</div>
				{/if}
			</div>
		{/if}

		<!-- Uploaded files list -->
		{#if files.length > 0}
			<div class="files-list" role="list" aria-label="Uploaded files">
				{#each files as file, index}
					<div class="file-item" role="listitem">
						{#if model.showPreview && file.preview}
							<img src={file.preview} alt={file.name} class="file-preview" />
						{:else if isImageType(file.type)}
							<svg class="file-icon image" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
								<circle cx="8.5" cy="8.5" r="1.5" stroke-width="2"/>
								<polyline points="21 15 16 10 5 21" stroke-width="2"/>
							</svg>
						{:else}
							<svg class="file-icon document" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-width="2"/>
								<polyline points="14 2 14 8 20 8" stroke-width="2"/>
								<line x1="16" y1="13" x2="8" y2="13" stroke-width="2"/>
								<line x1="16" y1="17" x2="8" y2="17" stroke-width="2"/>
								<polyline points="10 9 9 9 8 9" stroke-width="2"/>
							</svg>
						{/if}

						<div class="file-info">
							<span class="file-name">{file.name}</span>
							<span class="file-size">{formatFileSize(file.size)}</span>
						</div>

						{#if !isDisabled && model.allowReplace !== false}
							<button
								type="button"
								class="remove-button"
								onclick={() => handleRemove(index)}
								aria-label="Remove {file.name}"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
									<line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
									<line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
								</svg>
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Error message -->
		{#if error}
			<div id={errorId} class="error-message" role="alert" aria-live="assertive">
				{error.message}
			</div>
		{/if}

		<!-- File count info -->
		{#if maxFiles > 1}
			<div class="file-count" aria-live="polite">
				{files.length} of {maxFiles} file{maxFiles === 1 ? '' : 's'} uploaded
			</div>
		{/if}
	</div>

	<!-- Evaluation feedback -->
	{#if showEvaluation && evaluation}
		<div id={statusId} class="response-indicator {evaluationClass()}" role="status" aria-live="polite">
			{#if evaluation.complete}
				<span class="status-icon">✓</span>
				<span class="status-text">Upload complete</span>
			{:else}
				<span class="status-icon">○</span>
				<span class="status-text">Upload incomplete</span>
			{/if}

			{#if evaluation.filesUploaded !== undefined}
				<span class="file-count">
					{evaluation.filesUploaded} file{evaluation.filesUploaded === 1 ? '' : 's'} uploaded
				</span>
			{/if}
		</div>
	{/if}

	<!-- Rationale (instructor only) -->
	{#if showRationale}
		<div class="rationale">
			<strong>Rationale:</strong>
			{@html model.rationale}
		</div>
	{/if}
</div>

<style>
	.pie-upload {
		font-family: system-ui, -apple-system, sans-serif;
		max-width: 800px;
		margin: 0 auto;
	}

	.prompt {
		margin-bottom: 1rem;
		font-size: 1rem;
		line-height: 1.5;
	}

	.instructions {
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: #f3f4f6;
		border-left: 4px solid #3b82f6;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		color: #374151;
	}

	.upload-container {
		margin: 1rem 0;
	}

	/* Hidden file input */
	.file-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Drop zone */
	.drop-zone {
		border: 2px dashed #d1d5db;
		border-radius: 0.5rem;
		padding: 2rem;
		text-align: center;
		background-color: #f9fafb;
		cursor: pointer;
		transition: all 0.2s;
	}

	.drop-zone:hover:not(.drag-active) {
		border-color: #9ca3af;
		background-color: #f3f4f6;
	}

	.drop-zone.drag-active {
		border-color: #3b82f6;
		background-color: #eff6ff;
	}

	.drop-zone:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.upload-icon {
		width: 48px;
		height: 48px;
		margin: 0 auto 1rem;
		color: #6b7280;
	}

	.drop-text {
		font-size: 1rem;
		color: #374151;
		margin-bottom: 0.5rem;
	}

	.file-types,
	.file-size {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.25rem;
	}

	.uploading {
		margin-top: 1rem;
		padding: 0.5rem;
		background-color: #eff6ff;
		border-radius: 0.25rem;
		color: #1e40af;
		font-weight: 500;
	}

	/* Files list */
	.files-list {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.file-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		transition: background-color 0.15s;
	}

	.file-item:hover {
		background-color: #f9fafb;
	}

	.file-preview {
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: 0.25rem;
		border: 1px solid #e5e7eb;
	}

	.file-icon {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
		padding: 0.5rem;
		border-radius: 0.25rem;
	}

	.file-icon.image {
		color: #10b981;
		background-color: #d1fae5;
	}

	.file-icon.document {
		color: #3b82f6;
		background-color: #dbeafe;
	}

	.file-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.file-name {
		font-weight: 500;
		color: #1f2937;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-info .file-size {
		font-size: 0.875rem;
		color: #6b7280;
	}

	.remove-button {
		width: 32px;
		height: 32px;
		padding: 0.25rem;
		border: none;
		background-color: transparent;
		color: #ef4444;
		cursor: pointer;
		border-radius: 0.25rem;
		transition: background-color 0.15s;
	}

	.remove-button:hover {
		background-color: #fee2e2;
	}

	.remove-button:focus-visible {
		outline: 2px solid #ef4444;
		outline-offset: 2px;
	}

	.remove-button svg {
		width: 100%;
		height: 100%;
	}

	/* Error message */
	.error-message {
		margin-top: 1rem;
		padding: 0.75rem;
		background-color: #fee2e2;
		border: 1px solid #ef4444;
		border-radius: 0.5rem;
		color: #991b1b;
		font-size: 0.875rem;
	}

	/* File count */
	.file-count {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: #6b7280;
		text-align: center;
	}

	/* Response indicator */
	.response-indicator {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.response-indicator.complete {
		background-color: #d1fae5;
		color: #065f46;
		border: 1px solid #10b981;
	}

	.response-indicator.incomplete {
		background-color: #fef3c7;
		color: #92400e;
		border: 1px solid #f59e0b;
	}

	.status-icon {
		font-size: 1.25rem;
	}

	.response-indicator .file-count {
		margin-left: auto;
		margin-top: 0;
		text-align: right;
		opacity: 0.8;
	}

	/* Rationale */
	.rationale {
		margin-top: 1rem;
		padding: 1rem;
		background-color: #f3f4f6;
		border-left: 4px solid #3b82f6;
		border-radius: 0.25rem;
	}

	.rationale strong {
		display: block;
		margin-bottom: 0.5rem;
		color: #1f2937;
	}

	/* Disabled state */
	.pie-upload.disabled {
		opacity: 0.7;
		pointer-events: none;
	}

	/* Responsive */
	@media (max-width: 640px) {
		.pie-upload {
			max-width: 100%;
		}

		.drop-zone {
			padding: 1.5rem 1rem;
		}

		.file-item {
			flex-wrap: wrap;
		}

		.file-info {
			flex-basis: 100%;
			order: 3;
		}

		.remove-button {
			margin-left: auto;
		}
	}
</style>
