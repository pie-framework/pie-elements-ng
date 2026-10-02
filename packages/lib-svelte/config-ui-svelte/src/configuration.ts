import type { Configuration, RadioSetting, SettingChoice, ToggleSetting } from './types.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * The element's defaults with a player's configuration laid over them, entry by
 * entry: `{ prompt: { settings: false } }` keeps the default `prompt.label`.
 * React elements merge only top-level keys, which drops that label.
 */
export function mergeConfiguration<T extends Configuration>(
  defaults: T,
  configuration: unknown
): T {
  if (!isRecord(configuration)) return defaults;
  const merged: Configuration = { ...defaults };
  for (const [key, value] of Object.entries(configuration)) {
    const base = defaults[key];
    merged[key] = isRecord(base) && isRecord(value) ? { ...base, ...value } : value;
  }
  return merged as T;
}

/**
 * Whether any entry, nested entries included, offers a setting. React's layout
 * shows no settings panel otherwise.
 */
export function hasSettings(configuration: unknown): boolean {
  if (!isRecord(configuration)) return false;
  return Object.values(configuration).some(
    (entry) => isRecord(entry) && (entry.settings === true || hasSettings(entry))
  );
}

export const toggle = (
  label: string,
  isConfigProperty = false,
  disabled = false
): ToggleSetting => ({
  type: 'toggle',
  label,
  isConfigProperty,
  disabled,
});

export const radio = (
  label: string,
  choices: Array<string | SettingChoice>,
  isConfigProperty = false
): RadioSetting => ({
  type: 'radio',
  label,
  choices: choices.map((choice) =>
    typeof choice === 'string' ? { label: choice, value: choice } : choice
  ),
  isConfigProperty,
});

export function getPath(source: unknown, path: string): unknown {
  let value: unknown = source;
  for (const key of path.split('.')) {
    if (!isRecord(value)) return undefined;
    value = value[key];
  }
  return value;
}

/** A copy of `source` with `path` set; the objects along the path are copied, the rest shared. */
export function setPath<T extends Record<string, unknown>>(
  source: T,
  path: string,
  value: unknown
): T {
  const [key, ...rest] = path.split('.');
  const current = source[key];
  const next =
    rest.length === 0 ? value : setPath(isRecord(current) ? current : {}, rest.join('.'), value);
  return { ...source, [key]: next };
}
