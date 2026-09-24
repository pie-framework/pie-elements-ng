import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import SettingsPanel from '../src/SettingsPanel.svelte';
import { radio, toggle } from '../src/configuration.js';

let target: HTMLElement | null = null;
let instance: ReturnType<typeof mount> | null = null;

function render(props: Record<string, unknown>) {
  target = document.createElement('div');
  document.body.appendChild(target);
  instance = mount(SettingsPanel, { target, props: props as any });
  flushSync();
  return target;
}

afterEach(() => {
  if (instance) unmount(instance);
  target?.remove();
  instance = null;
  target = null;
});

describe('SettingsPanel', () => {
  it('writes a toggled model setting and reports its key', () => {
    const onChangeModel = vi.fn();
    const el = render({
      model: { promptEnabled: true, prompt: '<p>Kept</p>' },
      groups: { Settings: { promptEnabled: toggle('Prompt') } },
      onChangeModel,
    });
    const input = el.querySelector('input[role="switch"]') as HTMLInputElement;

    expect(input.checked).toBe(true);
    expect(input.closest('label')?.textContent).toContain('Prompt');
    input.click();

    expect(onChangeModel).toHaveBeenCalledWith(
      { promptEnabled: false, prompt: '<p>Kept</p>' },
      'promptEnabled'
    );
  });

  it('routes a config property to the configuration', () => {
    const onChangeModel = vi.fn();
    const onChangeConfiguration = vi.fn();
    const el = render({
      model: {},
      configuration: { spellCheck: { enabled: false, label: 'Spellcheck' } },
      groups: { Settings: { 'spellCheck.enabled': toggle('Spellcheck', true) } },
      onChangeModel,
      onChangeConfiguration,
    });
    (el.querySelector('input[role="switch"]') as HTMLInputElement).click();

    expect(onChangeModel).not.toHaveBeenCalled();
    expect(onChangeConfiguration).toHaveBeenCalledWith(
      { spellCheck: { enabled: true, label: 'Spellcheck' } },
      'spellCheck.enabled'
    );
  });

  it('leaves out settings that are not offered, and groups left empty', () => {
    const el = render({
      model: {},
      groups: {
        Settings: { promptEnabled: false && toggle('Prompt') },
        Properties: { teacherInstructionsEnabled: toggle('Teacher Instructions'), other: undefined },
      },
      onChangeModel: vi.fn(),
    });

    expect([...el.querySelectorAll('legend.pie-settings-group-name')].map((l) => l.textContent)).toEqual([
      'Properties',
    ]);
    expect(el.querySelectorAll('input')).toHaveLength(1);
  });

  it('offers a choice as a labelled radio group', () => {
    const onChangeModel = vi.fn();
    const el = render({
      model: { scoringPolicy: 'partialPerTile' },
      groups: {
        Properties: {
          scoringPolicy: radio('Scoring policy', [
            { label: 'Partial credit per tile', value: 'partialPerTile' },
            { label: 'All or nothing', value: 'allOrNothing' },
          ]),
        },
      },
      onChangeModel,
    });
    const radios = [...el.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];

    expect(radios.map((r) => r.checked)).toEqual([true, false]);
    expect(radios[0].closest('fieldset')?.querySelector('legend')?.textContent).toBe(
      'Scoring policy'
    );
    radios[1].click();

    expect(onChangeModel).toHaveBeenCalledWith({ scoringPolicy: 'allOrNothing' }, 'scoringPolicy');
  });
});
