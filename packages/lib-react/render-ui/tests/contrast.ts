export type RGB = number[];

const NAMED: Record<string, RGB> = { black: [0, 0, 0], white: [255, 255, 255] };

export const channels = (literal: string): RGB => {
  const named = NAMED[literal.toLowerCase()];
  if (named) return named;
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(literal);
  return hex ? hex.slice(1).map((h) => parseInt(h, 16)) : literal.match(/\d+/g)!.slice(0, 3).map(Number);
};

const luminance = (rgb: RGB) => {
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// WCAG 2.2 contrast ratio between two opaque colours.
export const contrast = (a: RGB, b: RGB) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
