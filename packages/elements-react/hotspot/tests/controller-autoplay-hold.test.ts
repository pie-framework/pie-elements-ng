import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const GATHER = { mode: 'gather', role: 'student' };
const QUESTION = { id: '1', element: 'hotspot', shapes: { rectangles: [], polygons: [], circles: [] } };

describe('hotspot model: autoplay hold', () => {
  it('passes a hold from the item player through to the view', async () => {
    const out: any = await model({ ...QUESTION, autoplayAudioEnabled: true, autoplayAudioHeld: true } as any, { answers: [] } as any, GATHER as any);

    expect(out).toMatchObject({ autoplayAudioEnabled: true, autoplayAudioHeld: true });
  });

  it('leaves an unheld item unheld', async () => {
    const out: any = await model({ ...QUESTION, autoplayAudioEnabled: true } as any, { answers: [] } as any, GATHER as any);

    expect(out.autoplayAudioHeld).toBeFalsy();
  });
});
