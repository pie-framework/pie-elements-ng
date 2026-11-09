import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const question = {
  categories: [{ id: 'c1', label: 'Fruit' }, { id: 'c2', label: 'Vegetable' }],
  choices: [{ id: 'ch1', content: 'Apple' }, { id: 'ch2', content: 'Carrot' }],
  correctResponse: [{ category: 'c1', choices: ['ch1'] }, { category: 'c2', choices: ['ch2'] }],
  lockChoiceOrder: true,
};

describe('answer key in the view model', () => {
  it('carries no correct placements for a student gathering', async () => {
    const out: any = await model(question as any, { id: '1', answers: [] } as any, { mode: 'gather', role: 'student' });
    expect(out.correctResponse).toBeUndefined();
    expect(out).not.toHaveProperty('possibleResponses');
    expect(JSON.stringify(out)).not.toContain('"category":"c1"');
  });
});
