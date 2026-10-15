import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const env = { mode: 'gather', role: 'student' };

describe('extended-text-entry controller', () => {
  it.each([
    ['keeps paste formatting without the setting', {}, false],
    ['keeps paste formatting with the setting null', { playerPasteFormattingDisabled: null }, false],
    ['keeps paste formatting with the setting off', { playerPasteFormattingDisabled: false }, false],
    ['disables paste formatting with the setting on', { playerPasteFormattingDisabled: true }, true],
  ])('%s', async (_name, question, disabled) => {
    expect((await model(question, {}, env)).pasteFormattingDisabled).toBe(disabled);
  });
});
