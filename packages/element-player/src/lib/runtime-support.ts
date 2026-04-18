export type RuntimeSupportCheck = 'off' | 'on';
export type RuntimeSupportStrategy = 'esm' | 'iife';
export type RuntimeSupportView = 'delivery' | 'author' | 'print';

export interface PieElementRuntimeSupport {
  schemaVersion: number;
  packageName?: string;
  version?: string;
  supports?: Partial<Record<RuntimeSupportStrategy, Partial<Record<RuntimeSupportView, boolean>>>>;
}

export function normalizeRuntimeSupportCheck(
  value: string | null | undefined,
  fallback: RuntimeSupportCheck = 'off'
): RuntimeSupportCheck {
  if (value === 'off' || value === 'on') {
    return value;
  }
  return fallback;
}

export function isRuntimeSupportEnabled(mode: RuntimeSupportCheck): boolean {
  return mode === 'on';
}

export function isStrategySupportedForView(
  runtimeSupport: PieElementRuntimeSupport,
  strategy: RuntimeSupportStrategy,
  view: RuntimeSupportView
): boolean {
  const byStrategy = runtimeSupport.supports?.[strategy];
  if (!byStrategy) {
    return true;
  }
  const value = byStrategy[view];
  if (value === undefined) {
    return true;
  }
  return value;
}
