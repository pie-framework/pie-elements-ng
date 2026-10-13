import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const env = { mode: 'gather', role: 'student' };

describe('explicit-constructed-response controller idle save', () => {
  it.each([
    ['saves after 1.5 seconds without the setting', {}, 1500],
    ['saves after 1.5 seconds with the setting null', { playerIdleSaveDelay: null }, 1500],
    ['takes the delay the model sets', { playerIdleSaveDelay: 2500 }, 2500],
    ['saves on blur only with the setting 0', { playerIdleSaveDelay: 0 }, 0],
  ])('%s', async (_name, question, delay) => {
    expect((await model(question as any, {}, env as any)).idleSaveDelay).toBe(delay);
  });
});
