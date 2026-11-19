import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const SUN = '<img alt="Sun" src="sun.png"/>';

const QUESTION = {
  possible_responses: [SUN],
  response_containers: [{ x: 0, y: 0, width: '10%', height: '10%' }],
  validation: { valid_response: { score: 1, value: [{ images: [SUN] }] }, alt_responses: [] },
};

const env = (mode: string) => ({ mode, role: 'student' }) as never;

// Item configs commonly carry `disabled: false`, and some a `mode`; the player's mode must win.
describe('the player mode decides interactivity, not the authored model', () => {
  it.each([
    ['gather', false],
    ['view', true],
    ['evaluate', true],
  ])('%s: disabled is %s', async (mode, disabled) => {
    const out = await model({ ...QUESTION } as never, undefined, env(mode));

    expect(out.disabled).toBe(disabled);
    expect(out.mode).toBe(mode);
  });

  it.each([
    ['view', true],
    ['evaluate', true],
  ])('%s: an authored disabled: false does not unlock the response', async (mode, disabled) => {
    const out = await model({ ...QUESTION, disabled: false } as never, undefined, env(mode));

    expect(out.disabled).toBe(disabled);
  });

  it('gather: an authored disabled: true does not lock the response', async () => {
    const out = await model({ ...QUESTION, disabled: true } as never, undefined, env('gather'));

    expect(out.disabled).toBe(false);
  });

  it.each(['gather', 'view', 'evaluate'])('%s: an authored mode does not replace the player mode', async (mode) => {
    const authored = mode === 'gather' ? 'view' : 'gather';
    const out = await model({ ...QUESTION, mode: authored } as never, undefined, env(mode));

    expect(out.mode).toBe(mode);
  });

  // The case the ticket describes: a config carrying both fields, as items seeded from real data do.
  it.each([
    ['gather', { disabled: false, mode: 'gather' }],
    ['view', { disabled: true, mode: 'view' }],
    ['evaluate', { disabled: true, mode: 'evaluate' }],
  ])('%s: a config carrying disabled: false and mode: gather yields the output for the env mode', async (mode, expected) => {
    const out = await model({ ...QUESTION, disabled: false, mode: 'gather' } as never, undefined, env(mode));

    expect({ disabled: out.disabled, mode: out.mode }).toEqual(expected);
  });
});
