import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the settings panel.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { Main } = await import('../main');
const { default: defaults } = await import('../defaults');

const renderMain = (configuration = defaults.configuration) => {
  const onModelChanged = vi.fn();
  render(
    <Main
      model={defaults.model}
      configuration={configuration}
      imageSupport={{}}
      uploadSoundSupport={{}}
      onModelChanged={onModelChanged}
      onConfigurationChanged={vi.fn()}
    />
  );
  // Without a measured width the layout puts the settings on a tab of their own.
  fireEvent.click(screen.getByRole('tab', { name: 'Settings' }));
  return onModelChanged;
};

const LABEL = defaults.configuration.playerPasteFormatting.label;

describe('Main settings', () => {
  it('turns paste formatting off for students', () => {
    const onModelChanged = renderMain();
    const toggle = screen.getByRole('switch', { name: LABEL });

    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);

    expect(onModelChanged).toHaveBeenCalledWith(expect.objectContaining({ playerPasteFormattingDisabled: true }));
  });

  it('leaves the setting out when the host hides it', () => {
    renderMain({
      ...defaults.configuration,
      playerPasteFormatting: { ...defaults.configuration.playerPasteFormatting, settings: false },
    });

    expect(screen.queryByText(LABEL)).toBeNull();
  });
});
