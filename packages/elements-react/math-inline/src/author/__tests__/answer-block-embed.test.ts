import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerEmbed } from '@pie-lib/math-input';

import GeneralConfigBlock from '../general-config-block';

vi.mock('@pie-lib/math-input', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  registerEmbed: vi.fn(),
}));

type Embed = (data: string) => { htmlString: string };

// general-config-block.tsx is untyped, so its class declares no props.
const Block = GeneralConfigBlock as unknown as new (props: object) => { UNSAFE_componentWillMount: () => void };

afterEach(() => {
  document.body.innerHTML = '';
});

describe('math-inline authoring response blocks', () => {
  it('repeat no id when two configure panels show the same response', () => {
    new Block({ model: { expression: '{{response}}' } }).UNSAFE_componentWillMount();
    const [[name, embed]] = vi.mocked(registerEmbed).mock.calls as unknown as [[string, Embed]];

    for (const panel of [document.createElement('div'), document.createElement('div')]) {
      panel.innerHTML = embed('r1').htmlString;
      document.body.appendChild(panel);
    }

    expect(name).toBe('answerBlock');
    expect(document.querySelectorAll('[id]')).toHaveLength(0);
    expect(document.querySelectorAll('[data-answer-block-index="r1"]')).toHaveLength(2);
  });
});
