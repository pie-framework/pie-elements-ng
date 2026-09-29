import type { Component } from 'svelte';
import ConfigLayoutComponent from './ConfigLayout.svelte';
import SettingsPanelComponent from './SettingsPanel.svelte';
import type { ConfigLayoutProps, SettingsPanelProps } from './types.js';

export {
  getPath,
  hasSettings,
  mergeConfiguration,
  radio,
  setPath,
  toggle,
} from './configuration.js';
export type * from './types.js';

// Typed through `.ts` props types so the emitted declarations reference no `.svelte` file:
// `dist` ships the compiled components only.
export const ConfigLayout: Component<ConfigLayoutProps> = ConfigLayoutComponent;
export const SettingsPanel: Component<SettingsPanelProps> = SettingsPanelComponent;
