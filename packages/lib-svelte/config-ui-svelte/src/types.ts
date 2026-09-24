import type { Snippet } from 'svelte';

/**
 * One entry of an author element's `configuration`, as `@pie-lib/config-ui`
 * reads it: `label` names the field in the design view and its setting in the
 * panel, and `settings: true` offers the author that setting.
 */
export type ConfigurationEntry = {
  label?: string;
  settings?: boolean;
  [key: string]: unknown;
};

export type Configuration = Record<string, unknown>;

export type SettingChoice = { label: string; value: string };

export type ToggleSetting = {
  type: 'toggle';
  label: string;
  isConfigProperty: boolean;
  disabled: boolean;
};

export type RadioSetting = {
  type: 'radio';
  label: string;
  choices: SettingChoice[];
  isConfigProperty: boolean;
};

export type Setting = ToggleSetting | RadioSetting;

/**
 * Keyed by the dotted path the setting writes, in the model or, for a
 * config property, the configuration. A falsy entry is left out, so
 * `prompt.settings && toggle(prompt.label)` offers the setting only when
 * configured, as in React's `Panel`.
 */
export type SettingsGroup = Record<string, Setting | false | null | undefined>;

export type SettingsGroups = Record<string, SettingsGroup>;

export type SettingsPanelProps = {
  groups: SettingsGroups;
  // `any` values: an element's model interface has no index signature to meet `unknown`'s.
  model: Record<string, any>;
  configuration?: Configuration;
  onChangeModel: (model: Record<string, any>, key: string) => void;
  onChangeConfiguration?: (configuration: Configuration, key: string) => void;
};

export type ConfigLayoutProps = {
  children: Snippet;
  settings?: Snippet;
  hideSettings?: boolean;
};
