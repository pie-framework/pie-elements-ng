import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const env = { mode: 'gather', role: 'student' };

describe('explicit-constructed-response controller idle save', () => {
  it.each([
    ['saves after a second without the setting', {}, 1000],
    ['saves after a second with the setting null', { playerIdleSaveDelay: null }, 1000],
    ['takes the delay the model sets', { playerIdleSaveDelay: 2500 }, 2500],
    ['saves on blur only with the setting 0', { playerIdleSaveDelay: 0 }, 0],
  ])('%s', async (_name, question, delay) => {
    expect((await model(question as any, {}, env as any)).idleSaveDelay).toBe(delay);
  });
});
