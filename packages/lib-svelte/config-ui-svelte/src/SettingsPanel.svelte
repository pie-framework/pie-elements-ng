<script lang="ts">
import { getPath, setPath } from './configuration.js';
import type { Setting, SettingsPanelProps } from './types.js';

let {
  groups,
  model,
  configuration = {},
  onChangeModel,
  onChangeConfiguration,
}: SettingsPanelProps = $props();

const uid = Math.random().toString(36).slice(2, 10);

/** Groups with at least one offered setting, in the order given. */
const visibleGroups = $derived(
  Object.entries(groups)
    .map(
      ([name, group]) =>
        [
          name,
          Object.entries(group).filter((entry): entry is [string, Setting] => !!entry[1]),
        ] as const
    )
    .filter(([, entries]) => entries.length > 0)
);

const settingValue = (key: string, setting: Setting) =>
  getPath(setting.isConfigProperty ? configuration : model, key);

function change(key: string, setting: Setting, value: unknown) {
  if (setting.isConfigProperty) {
    onChangeConfiguration?.(setPath(configuration, key, value), key);
  } else {
    onChangeModel(setPath(model, key, value), key);
  }
}
</script>

<div class="pie-settings-panel">
  {#each visibleGroups as [name, entries] (name)}
    <fieldset class="pie-settings-group">
      <legend class="pie-settings-group-name">{name}</legend>
      {#each entries as [key, setting] (key)}
        {#if setting.type === 'toggle'}
          <label class="pie-settings-toggle">
            <span>{setting.label}</span>
            <input
              type="checkbox"
              role="switch"
              checked={!!settingValue(key, setting)}
              disabled={setting.disabled}
              onchange={(e) => change(key, setting, (e.currentTarget as HTMLInputElement).checked)}
            />
          </label>
        {:else if setting.type === 'radio'}
          <fieldset class="pie-settings-choice">
            <legend>{setting.label}</legend>
            {#each setting.choices as choice (choice.value)}
              <label class="pie-settings-choice-row">
                <input
                  type="radio"
                  name={`${uid}-${key}`}
                  value={choice.value}
                  checked={settingValue(key, setting) === choice.value}
                  onchange={() => change(key, setting, choice.value)}
                />
                <span>{choice.label}</span>
              </label>
            {/each}
          </fieldset>
        {/if}
      {/each}
    </fieldset>
  {/each}
</div>

<style>
  .pie-settings-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border: 1px solid var(--pie-border-light, #ccc);
    border-radius: 4px;
    color: var(--pie-text, #212121);
  }

  fieldset {
    margin: 0;
    padding: 0;
    border: 0;
    min-width: 0;
  }

  .pie-settings-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pie-settings-group-name {
    margin-bottom: 8px;
    font-weight: 600;
  }

  .pie-settings-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .pie-settings-choice legend {
    margin-bottom: 4px;
  }

  .pie-settings-choice-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  input {
    accent-color: var(--pie-primary, #3f51b5);
  }

  input:focus-visible {
    outline: 2px solid var(--pie-focus-outline, #1a73e8);
    outline-offset: 2px;
  }
</style>
