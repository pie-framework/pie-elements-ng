import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const GATHER = { mode: 'gather', role: 'student' };

describe('image-cloze-association model: response area labels', () => {
  it('reads the snake-case aria_label that imported content carries as ariaLabel', async () => {
    const question = {
      response_containers: [
        { x: 0, y: 0, width: '10%', height: '10%', aria_label: 'Stem' },
        { x: 50, y: 0, width: '10%', height: '10%' },
      ],
      possible_responses: [],
      validation: { valid_response: { score: 1, value: [] }, alt_responses: [] },
    };

    const out = await model(question, undefined, GATHER);

    expect(out.responseContainers?.map((container) => container.ariaLabel)).toEqual(['Stem', undefined]);
  });
});
