export type ElementPlayerStrategy = 'esm' | 'iife' | 'preloaded';
export type ElementPlayerView = 'delivery' | 'author' | 'print';

export interface ResolveElementPlayerViewInput {
  mode?: string | null;
  view?: ElementPlayerView | null;
}

export function normalizeElementPlayerStrategy(
  value: string | null | undefined,
  fallback: ElementPlayerStrategy = 'esm'
): ElementPlayerStrategy {
  if (value === 'esm' || value === 'iife' || value === 'preloaded') {
    return value;
  }
  return fallback;
}

export function normalizeElementPlayerView(
  value: string | null | undefined,
  fallback: ElementPlayerView = 'delivery'
): ElementPlayerView {
  if (value === 'delivery' || value === 'author' || value === 'print') {
    return value;
  }
  return fallback;
}

export function resolveElementPlayerView(
  input: ResolveElementPlayerViewInput,
  fallback: ElementPlayerView = 'delivery'
): ElementPlayerView {
  const explicitView = normalizeElementPlayerView(input.view ?? undefined, fallback);
  if (input.view) {
    return explicitView;
  }

  if (input.mode === 'author') {
    return 'author';
  }
  if (input.mode === 'print') {
    return 'print';
  }
  return fallback;
}
