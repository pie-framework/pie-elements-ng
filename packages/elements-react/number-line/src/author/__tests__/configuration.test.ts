import { describe, expect, it, vi } from 'vitest';

const rendered: any[] = [];

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: (el: unknown) => rendered.push(el), unmount: () => {} }),
}));

const { default: Author } = await import('../index');

const TAG = 'pie-number-line-author-configuration-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, Author as CustomElementConstructor);
}

/** The props of the view the author element rendered last. */
const lastProps = () => rendered.at(-1).props;

describe('number-line author configuration changes', () => {
  it('re-renders the view with the configuration the settings panel reports', () => {
    const element = document.createElement(TAG) as any;
    element.model = {};
    const configuration = { ...lastProps().configuration, settingsPanelDisabled: true };

    // Main hands this callback to the settings panel as onChangeConfiguration.
    lastProps().onConfigurationChanged(configuration);

    expect(lastProps().configuration).toBe(configuration);
  });
});
