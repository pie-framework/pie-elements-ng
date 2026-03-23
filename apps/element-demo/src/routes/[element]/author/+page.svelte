<script lang="ts">
/**
 * Author Route
 * Shows the configure component for authoring questions
 */
import PlayerLayout from '$lib/element-player/components/PlayerLayout.svelte';
import { page } from '$app/stores';
import { parsePlayerType, type PlayerType } from '$lib/config/player-runtime';
import '@pie-element/element-player';
import {
  model,
  controller,
  updateModel,
  iifeBuildMeta,
  iifeBuildLoading,
  iifeBuildRequestVersion,
  theme,
} from '$lib/stores/demo-state';
import type { LayoutData } from '../$types';

let { data }: { data: LayoutData } = $props();

const debug = false;
let syncing = $state(false);
let authorPlayerEl = $state<HTMLElement | null>(null);
const playerType = $derived<PlayerType>(parsePlayerType($page.url.searchParams.get('player')));

type AssetUploadHandler = {
  isPasted?: boolean;
  cancel?: () => void;
  done?: (err?: Error, src?: string) => void;
  fileChosen?: (file: File) => void;
  getChosenFile?: () => File | undefined;
  progress?: (percent: number, bytes: number, total: number) => void;
};

type DeleteAssetDetail = {
  src: string;
  done?: (err?: Error) => void;
};

function toError(value: unknown, fallbackMessage = 'Unknown upload error'): Error {
  if (value instanceof Error) {
    return value;
  }
  return new Error(String(value ?? fallbackMessage));
}

function readFileAsDataUrl(
  file: File,
  handler: AssetUploadHandler,
  fallbackMessage: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error(fallbackMessage));
    };
    reader.onerror = () => {
      reject(new Error(fallbackMessage));
    };
    reader.onprogress = (event) => {
      if (!event.lengthComputable || !handler.progress) {
        return;
      }
      const percent = (event.loaded / event.total) * 100;
      handler.progress(percent, event.loaded, event.total);
    };
    reader.readAsDataURL(file);
  });
}

function pickFileWithDialogLifecycle(accept: string, onCancel: () => void): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    let resolved = false;
    let changeHandled = false;
    let dialogOpened = false;

    const cleanup = () => {
      input.onchange = null;
      input.removeEventListener('cancel', onCancelEvent as EventListener);
      window.removeEventListener('focus', onFocus);
    };

    const finalize = (file: File | null) => {
      if (resolved) {
        return;
      }
      resolved = true;
      cleanup();
      resolve(file);
    };

    const onFocus = () => {
      if (!dialogOpened || changeHandled) {
        return;
      }
      dialogOpened = false;
      window.setTimeout(() => {
        if (resolved || changeHandled) {
          return;
        }
        const file = input.files?.[0] ?? null;
        if (!file) {
          onCancel();
        }
        finalize(file);
      }, 300);
    };

    const onCancelEvent = () => {
      onCancel();
      finalize(null);
    };

    input.onchange = () => {
      changeHandled = true;
      dialogOpened = false;
      finalize(input.files?.[0] ?? null);
    };

    input.addEventListener('cancel', onCancelEvent as EventListener);
    window.addEventListener('focus', onFocus);
    dialogOpened = true;
    input.click();
  });
}

async function resolveUpload(
  handler: AssetUploadHandler,
  options: {
    accept: string;
    cancelledMessage: string;
    failedReadMessage: string;
  }
) {
  if (!handler || typeof handler !== 'object') {
    return;
  }

  let resolved = false;
  const finish = (err?: Error, src?: string) => {
    if (resolved) {
      return;
    }
    resolved = true;
    handler.done?.(err, src);
  };

  try {
    let file: File | null = null;
    if (handler.isPasted && handler.getChosenFile) {
      file = handler.getChosenFile() ?? null;
    } else {
      file = await pickFileWithDialogLifecycle(options.accept, () => {
        handler.cancel?.();
      });
      if (file && handler.fileChosen) {
        handler.fileChosen(file);
      }
    }

    if (!file) {
      handler.cancel?.();
      finish(new Error(options.cancelledMessage));
      return;
    }

    const src = await readFileAsDataUrl(file, handler, options.failedReadMessage);
    finish(undefined, src);
  } catch (error) {
    finish(toError(error, options.failedReadMessage));
  }
}

async function handleInsertImage(event: Event) {
  const customEvent = event as CustomEvent<AssetUploadHandler>;
  await resolveUpload(customEvent.detail, {
    accept: 'image/*',
    cancelledMessage: 'Image selection cancelled',
    failedReadMessage: 'Unable to read selected image file',
  });
}

async function handleInsertSound(event: Event) {
  const customEvent = event as CustomEvent<AssetUploadHandler>;
  await resolveUpload(customEvent.detail, {
    accept: 'audio/*',
    cancelledMessage: 'Sound selection cancelled',
    failedReadMessage: 'Unable to read selected sound file',
  });
}

function handleDeleteAsset(event: Event) {
  const customEvent = event as CustomEvent<DeleteAssetDetail>;
  const detail = customEvent.detail;
  try {
    detail?.done?.();
  } catch (error) {
    detail?.done?.(toError(error, 'Unable to delete uploaded asset'));
  }
}

// Handle model changes from configure component
function handleModelChanged(event: CustomEvent) {
  console.log('[author] Model changed event received:', event.detail);
  syncing = true;
  updateModel(event.detail);
  console.log('[author] updateModel() called, model store should be updated');
  setTimeout(() => {
    syncing = false;
  }, 300);
}

function handleBundleMeta(event: CustomEvent) {
  iifeBuildMeta.set({ ...(event.detail || {}), stage: 'completed', error: null });
}

function handleBuildState(event: CustomEvent) {
  const detail = (event.detail || {}) as {
    loading?: boolean;
    error?: string | null;
    stage?: string;
  };
  iifeBuildLoading.set(!!detail.loading);
  if (detail.stage) {
    iifeBuildMeta.update((prev) => ({
      source: prev?.source ?? 'local',
      url: prev?.url ?? '',
      hash: prev?.hash,
      duration: prev?.duration,
      cached: prev?.cached,
      stage: detail.stage,
      error: prev?.error ?? null,
    }));
  }
  if (detail.error) {
    iifeBuildMeta.update((prev) => ({
      source: prev?.source ?? 'local',
      url: prev?.url ?? '',
      hash: prev?.hash,
      duration: prev?.duration,
      cached: prev?.cached,
      stage: prev?.stage,
      error: detail.error,
    }));
  }
}

$effect(() => {
  if (!authorPlayerEl) {
    return;
  }
  const onInsertImage = (event: Event) => {
    void handleInsertImage(event);
  };
  const onInsertSound = (event: Event) => {
    void handleInsertSound(event);
  };
  const onDeleteImage = (event: Event) => {
    handleDeleteAsset(event);
  };
  const onDeleteSound = (event: Event) => {
    handleDeleteAsset(event);
  };
  authorPlayerEl.addEventListener('insert.image', onInsertImage);
  authorPlayerEl.addEventListener('insert.sound', onInsertSound);
  authorPlayerEl.addEventListener('delete.image', onDeleteImage);
  authorPlayerEl.addEventListener('delete.sound', onDeleteSound);
  return () => {
    authorPlayerEl?.removeEventListener('insert.image', onInsertImage);
    authorPlayerEl?.removeEventListener('insert.sound', onInsertSound);
    authorPlayerEl?.removeEventListener('delete.image', onDeleteImage);
    authorPlayerEl?.removeEventListener('delete.sound', onDeleteSound);
  };
});
</script>

<PlayerLayout
  elementName={data.elementName}
  packageName={data.packageName}
  bind:controller={$controller}
  capabilities={data.capabilities}
  preloadController={playerType === 'esm'}
  preloadAuthor={false}
  preloadPrint={false}
  {debug}
>
  {#snippet children()}
    {#if syncing}
      <div class="sync-indicator">
        <span class="spinner-small"></span>
        Synchronizing...
      </div>
    {/if}
    <pie-element-theme-daisyui theme={$theme}>
      <div class="author-view" class:iife-author-player={playerType === 'iife'}>
        <div class="configure-container">
          <pie-element-player
            bind:this={authorPlayerEl}
            strategy={playerType}
            view="author"
            element-name={data.elementName}
            package-name={data.packageName}
            element-version={(data as LayoutData & { elementVersion?: string }).elementVersion || 'latest'}
            model={$model}
            rebuildVersion={$iifeBuildRequestVersion}
            onmodel-changed={handleModelChanged}
            onbundle-meta={handleBundleMeta}
            onbuild-state={handleBuildState}
          ></pie-element-player>
        </div>
      </div>
    </pie-element-theme-daisyui>
  {/snippet}
</PlayerLayout>

<style>
  .sync-indicator {
    position: fixed;
    top: 5rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    background: #4caf50;
    color: white;
    border-radius: 4px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 1000;
    animation: fadeIn 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .spinner-small {
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .author-view {
    height: 100%;
    overflow: auto;
  }

  .configure-container {
    padding: 1rem;
    height: 100%;
  }
</style>
