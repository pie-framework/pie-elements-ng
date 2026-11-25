import { describe, expect, it, vi } from 'vitest';

// The math renderer converts TeX only once it has started; `ready` stands for that.
const math = vi.hoisted(() => ({ ready: true }));
const MATHML: Record<string, string> = {
  'c^2': '<math><msup><mi>c</mi><mn>2</mn></msup></math>',
  '\\pi r^2': '<math><mi>π</mi><msup><mi>r</mi><mn>2</mn></msup></math>',
  'x+1': '<math><mi>x</mi><mo>+</mo><mn>1</mn></math>',
  '\\frac{1}{2}': '<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>',
};

vi.mock('@pie-element/shared-math-rendering-mathjax', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  latexToMml: (latex: string) => (math.ready ? (MATHML[latex] ?? null) : null),
}));

const { speakChoice } = await import('../choice-speech');
const { describeChoiceTile, describePlacementResult, describeSelection, translatorFor } = await import(
  '../announcements'
);

const t = translatorFor('en-US');

describe('speakChoice', () => {
  it('speaks TeX in each delimiter as the math renderer names math', () => {
    expect(speakChoice('\\(c^2\\)')).toEqual({ text: 'c squared', complete: true });
    expect(speakChoice('\\[\\pi r^2\\]').text).toBe('pi r squared');
    expect(speakChoice('$$x+1$$').text).toBe('x plus 1');
    expect(speakChoice('<p>Half is \\(\\frac{1}{2}\\).</p>').text).toBe('Half is 1 over 2.');
  });

  it('speaks authored MathML, rendered math and the legacy renderer\'s LaTeX spans', () => {
    expect(speakChoice('<math><msup><mi>a</mi><mn>2</mn></msup></math>').text).toBe('a squared');
    expect(speakChoice('<mjx-container aria-label="b squared"><mjx-math></mjx-math></mjx-container>').text).toBe(
      'b squared',
    );
    expect(speakChoice('<span data-latex="" data-raw="c^2">c^2</span>').text).toBe('c squared');
  });

  it('reads an image by its alt text, and text with entities decoded and blocks apart', () => {
    expect(speakChoice('<img alt="3x8 array" src="a.svg">').text).toBe('3x8 array');
    expect(speakChoice('<p>Tom &amp; Jerry</p><p>5&nbsp;cm</p>').text).toBe('Tom & Jerry 5 cm');
  });

  it('leaves alone what MathJax is told to leave alone', () => {
    expect(speakChoice('<span class="mathjax_ignore">costs \\(c^2\\)</span>').text).toBe('costs \\(c^2\\)');
  });

  it('keeps unspoken math as its TeX, without delimiters, until the renderer can speak it', () => {
    math.ready = false;

    try {
      expect(speakChoice('<b>\\(c^2\\)</b>')).toEqual({ text: 'c^2', complete: false });
    } finally {
      math.ready = true;
    }

    // Unfinished speech is not kept, so the same choice is spoken once the renderer has started.
    expect(speakChoice('<b>\\(c^2\\)</b>')).toEqual({ text: 'c squared', complete: true });
  });
});

describe('announcements of a choice with math or an image', () => {
  const config = {
    markup: 'x = {{0}}',
    choices: [
      { id: 'm', value: '\\(\\pi r^2\\)' },
      { id: 'i', value: '<img alt="36÷9 array" src="b.svg">' },
    ],
  };

  it('names the tile and announces the choice by its spoken math or alt text', () => {
    expect(describeChoiceTile(t, config.choices[0])).toBe('Answer choice: pi r squared');
    expect(describeChoiceTile(t, config.choices[1], '0')).toBe('Answer choice: 36÷9 array in blank 1');
    expect(describeSelection(t, config, 'm')).toBe('Selected answer choice pi r squared. Use TAB to choose a blank.');
    expect(
      describePlacementResult(t, config, {}, { choice: config.choices[1], fromChoice: true }, '0'),
    ).toContain('Placed answer choice 36÷9 array in blank 1');
  });
});
