import { describe, expect, it } from 'vitest';
import { hasSettings, mergeConfiguration, radio, setPath } from '../src/configuration.js';

const DEFAULTS = {
  prompt: { label: 'Prompt', settings: true },
  teacherInstructions: { label: 'Teacher Instructions', settings: true },
  settingsPanelDisabled: false,
};

describe('mergeConfiguration', () => {
  it('keeps default fields a player entry leaves out', () => {
    const merged = mergeConfiguration(DEFAULTS, { prompt: { settings: false } });

    expect(merged.prompt).toEqual({ label: 'Prompt', settings: false });
    expect(merged.teacherInstructions).toBe(DEFAULTS.teacherInstructions);
  });

  it('takes scalar and unknown entries as given', () => {
    const merged = mergeConfiguration(DEFAULTS, { settingsPanelDisabled: true, extra: { a: 1 } });

    expect(merged).toMatchObject({ settingsPanelDisabled: true, extra: { a: 1 } });
  });

  it('returns the defaults for a missing configuration', () => {
    expect(mergeConfiguration(DEFAULTS, undefined)).toBe(DEFAULTS);
  });
});

describe('hasSettings', () => {
  it('finds an entry offering a setting, nested ones included', () => {
    expect(hasSettings(DEFAULTS)).toBe(true);
    expect(hasSettings({ partA: { prompt: { settings: true } } })).toBe(true);
    expect(hasSettings({ prompt: { settings: false }, settingsPanelDisabled: false })).toBe(false);
  });
});

describe('setPath', () => {
  it('copies the objects along a dotted path and shares the rest', () => {
    const source = { a: { b: 1, c: 2 }, d: { e: 3 } };
    const next = setPath(source, 'a.b', 5);

    expect(next).toEqual({ a: { b: 5, c: 2 }, d: { e: 3 } });
    expect(source.a.b).toBe(1);
    expect(next.d).toBe(source.d);
  });
});

describe('radio', () => {
  it('turns string choices into label/value pairs', () => {
    expect(radio('Scoring', ['auto', { label: 'Rubric', value: 'rubric' }]).choices).toEqual([
      { label: 'auto', value: 'auto' },
      { label: 'Rubric', value: 'rubric' },
    ]);
  });
});
