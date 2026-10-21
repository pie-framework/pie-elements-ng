/**
 * `latexToMml` is how an editor saves math as MathML (`mmlOutput`). It is synchronous, so it
 * answers only once a MathJax has started, and an element's copy of the adapter, which hands its
 * typesetting to the page's renderer, never starts one of its own: it has to ask the copy that did.
 */
import { expect, test } from '@playwright/test';
import { ADAPTER_URL, type Build, copyUrl, openPage, renderWithAdapter } from './harness';

const BODY = '<body style="font: 20px serif"><div id="a">\\(x\\)</div></body>';

for (const build of ['npm', 'browser'] as Build[]) {
  test.describe(`the ${build} build`, () => {
    test('gives clean one-line MathML once MathJax has started', async ({ page }) => {
      const { errors } = await openPage(page, BODY, build);

      const before = await page.evaluate(async (url) => {
        const { latexToMml } = await import(url);
        return latexToMml('\\frac{4}{18}');
      }, ADAPTER_URL);
      await renderWithAdapter(page, 'a');
      const after = await page.evaluate(async (url) => {
        const { latexToMml } = await import(url);
        return {
          inline: latexToMml('\\frac{4}{18}'),
          display: latexToMml('\\frac{a}{b}', { display: true }),
          unknownMacro: latexToMml('\\notAMacro{1}'),
        };
      }, ADAPTER_URL);

      expect(before).toBeNull();
      expect(after.inline).toContain('<mfrac');
      // `data-latex` marks an authored LaTeX span, which the legacy renderer rewrites wherever it is.
      expect(after.inline).not.toContain('data-latex');
      expect(after.inline).not.toContain('\n');
      expect(after.inline).not.toContain('display=');
      expect(after.display).toContain('display="block"');
      expect(after.unknownMacro).toBeNull();
      expect(errors).toEqual([]);
    });

    test('converts the same LaTeX again, a label included', async ({ page }) => {
      await openPage(page, BODY, build);
      await renderWithAdapter(page, 'a');

      const results = await page.evaluate(async (url) => {
        const { latexToMml } = await import(url);
        const labelled = '\\begin{equation}x\\label{a}\\end{equation}';
        return [latexToMml(labelled), latexToMml(labelled), latexToMml('\\frac{1}{2}')];
      }, ADAPTER_URL);

      // Without a reset the second `\label{a}` is a duplicate, which MathJax reports as an error.
      expect(results.map((mathMl) => mathMl !== null)).toEqual([true, true, true]);
    });
  });
}

test.describe('two copies of the browser build', () => {
  test("an element's copy asks the copy the player installed as the page's renderer", async ({
    page,
  }) => {
    await openPage(page, BODY, 'browser');

    const result = await page.evaluate(
      async ([playerUrl, elementUrl]) => {
        const player = await import(playerUrl);
        const element = await import(elementUrl);
        const aloneBefore = element.latexToMml('x');

        // What PieElementPlayer installs: its renderer, and the converter of the MathJax it starts.
        const renderMath = player.createMathjaxRenderer();
        (window as any)['@pie-lib/math-rendering'] = {
          renderMath,
          latexToMml: player.latexToMml,
        };
        await renderMath(document.getElementById('a'));

        return {
          aloneBefore,
          viaPlayer: element.latexToMml('\\frac{4}{18}'),
          playerItself: player.latexToMml('\\frac{4}{18}'),
        };
      },
      [copyUrl(1), copyUrl(2)]
    );

    expect(result.aloneBefore).toBeNull();
    expect(result.viaPlayer).toContain('<mfrac');
    expect(result.viaPlayer).not.toContain('data-latex');
    // The player's own copy answers from its own MathJax, not by asking itself.
    expect(result.playerItself).toBe(result.viaPlayer);
  });

  test("an element's copy has no MathML to give when the page's renderer has no converter", async ({
    page,
  }) => {
    await openPage(page, BODY, 'browser');

    const viaHost = await page.evaluate(
      async ([playerUrl, elementUrl]) => {
        const player = await import(playerUrl);
        const element = await import(elementUrl);
        const renderMath = player.createMathjaxRenderer();
        (window as any)['@pie-lib/math-rendering'] = { renderMath };
        await renderMath(document.getElementById('a'));

        return element.latexToMml('x');
      },
      [copyUrl(1), copyUrl(2)]
    );

    // Its own MathJax never started, so an editor keeps the LaTeX rather than guess.
    expect(viaHost).toBeNull();
  });
});
