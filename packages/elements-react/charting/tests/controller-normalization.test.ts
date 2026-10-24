// Controllers also run server-side, so these run without a DOM.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkLabelsEquality, getScore } from '../src/controller/index.js';

describe('label comparison', () => {
  it('folds case in the content language', () => {
    expect(checkLabelsEquality('ISPARTA', 'ısparta')).toBe(false);
    expect(checkLabelsEquality('ISPARTA', 'ısparta', 'tr')).toBe(true);
    expect(checkLabelsEquality('İzmir', 'izmir', 'az')).toBe(true);
    expect(checkLabelsEquality('Paris', 'paris')).toBe(true);
  });

  it('matches digits typed in another system', () => {
    expect(checkLabelsEquality('٢٠٢٤', '2024')).toBe(true);
  });

  it('scores a Turkish label through the model language or the environment locale', () => {
    const category = (label: string) => ({ label, value: 1, interactive: true, editable: true });
    const question = {
      scoringType: 'all or nothing',
      data: [category('')],
      correctAnswer: { data: [category('ısparta')] },
    } as any;
    const session = { id: '1', answer: [category('ISPARTA')] } as any;

    expect(getScore(question, session).score).toBe(0);
    expect(getScore({ ...question, language: 'tr_TR' }, session).score).toBe(1);
    expect(getScore(question, session, { locale: 'tr' } as any).score).toBe(1);
  });
});
