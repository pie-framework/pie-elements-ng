import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const part = (value: string) => ({
  choiceMode: 'radio',
  choices: [{ value, label: value, correct: true }],
  autoplayAudioEnabled: true,
  lockChoiceOrder: true,
});

const GATHER = { mode: 'gather', role: 'student' };

describe('ebsr model: autoplay hold', () => {
  it('holds both parts when the item is held', async () => {
    const view: any = await model(
      { partA: part('a'), partB: part('b'), autoplayAudioHeld: true },
      { id: '1', element: 'ebsr' },
      GATHER,
    );

    expect(view.partA.autoplayAudioHeld).toBe(true);
    expect(view.partB.autoplayAudioHeld).toBe(true);
  });

  it('keeps a hold written onto one part', async () => {
    const view: any = await model(
      { partA: { ...part('a'), autoplayAudioHeld: true }, partB: part('b') },
      { id: '1', element: 'ebsr' },
      GATHER,
    );

    expect(view.partA.autoplayAudioHeld).toBe(true);
    expect(view.partB.autoplayAudioHeld).toBeFalsy();
  });
});
