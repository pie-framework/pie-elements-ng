import React from 'react';
import type { CSSProperties } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import KeyLegend from '../key-legend';

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white absolute.
const DARK = {
  '--pie-background': '#1a202c',
  '--pie-text': '#e2e8f0',
  '--pie-white': '#ffffff',
} as CSSProperties;

const renderLegend = (vars: CSSProperties) => {
  const { container } = render(
    <div style={vars}>
      <KeyLegend isLabelAvailable />
    </div>,
  );
  return { legend: getComputedStyle(screen.getByText('Key').parentElement as HTMLElement), container };
};

describe('graphing KeyLegend', () => {
  it('paints the legend on the theme background in the theme text colour', () => {
    const { legend } = renderLegend(DARK);

    expect(legend.backgroundColor).toBe('#1a202c');
    expect(legend.color).toBe('#e2e8f0');
  });

  it('keeps the label swatches white, as the graph draws its mark labels', () => {
    const { container } = renderLegend(DARK);
    const swatches = container.querySelectorAll('rect[fill="white"]');

    expect(swatches).toHaveLength(4);
  });

  it('stays white when no theme is applied', () => {
    expect(renderLegend({}).legend.backgroundColor).toBe('#ffffff');
  });

  it.each([
    [
      'en_US',
      'Key',
      [
        'Missing Required Label',
        'Answer Key Correct',
        'Answer Key Correct Label',
        'Student Incorrect',
        'Incorrect Student Label',
        'Student Correct',
        'Student Correct Label',
      ],
    ],
    [
      'es_ES',
      'Clave',
      [
        'Falta una etiqueta obligatoria',
        'Clave de respuesta correcta',
        'Etiqueta correcta de la clave de respuesta',
        'Respuesta incorrecta del estudiante',
        'Etiqueta incorrecta del estudiante',
        'Respuesta correcta del estudiante',
        'Etiqueta correcta del estudiante',
      ],
    ],
  ])('labels the legend in the %s item language', (language, title, rows) => {
    const { container } = render(<KeyLegend isLabelAvailable language={language} />);
    const legend = screen.getByText(title).parentElement as HTMLElement;

    expect(container.contains(legend)).toBe(true);
    expect([...legend.children].slice(1).map((row) => row.firstElementChild?.textContent)).toEqual(rows);
  });
});
