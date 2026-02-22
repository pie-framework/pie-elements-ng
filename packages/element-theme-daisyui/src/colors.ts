function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

function rgbStringToRgb(rgb: string): { r: number; g: number; b: number } | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    return null;
  }
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
  };
}

function oklchToRgb(oklch: string): { r: number; g: number; b: number } | null {
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) return null;

  let l = Math.max(0, Math.min(1, parseFloat(match[1])));
  const c = parseFloat(match[2]);
  let h = parseFloat(match[3]) % 360;
  if (h < 0) h += 360;

  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  const gammaCorrect = (val: number): number => {
    val = Math.max(0, Math.min(1, val));
    return val <= 0.0031308 ? 12.92 * val : 1.055 * val ** (1 / 2.4) - 0.055;
  };

  r = Math.round(gammaCorrect(r) * 255);
  g = Math.round(gammaCorrect(g) * 255);
  blue = Math.round(gammaCorrect(blue) * 255);

  return { r, g, b: blue };
}

function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith('#')) return hexToRgb(color);
  if (color.startsWith('rgb')) return rgbStringToRgb(color);
  if (color.startsWith('oklch')) return oklchToRgb(color);
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function lighten(color: string, amount: number): string {
  const rgb = parseColor(color);
  if (!rgb) return color;
  return rgbToHex(
    rgb.r + (255 - rgb.r) * amount,
    rgb.g + (255 - rgb.g) * amount,
    rgb.b + (255 - rgb.b) * amount
  );
}

export function darken(color: string, amount: number): string {
  const rgb = parseColor(color);
  if (!rgb) return color;
  return rgbToHex(rgb.r * (1 - amount), rgb.g * (1 - amount), rgb.b * (1 - amount));
}

export function rgba(color: string, alpha: number): string {
  const rgb = parseColor(color);
  if (!rgb) return color;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function adjustSaturation(color: string, amount: number): string {
  return amount > 0 ? lighten(color, amount * 0.3) : darken(color, -amount * 0.3);
}

export function mix(color1: string, color2: string, weight = 0.5): string {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);
  if (!rgb1 || !rgb2) return color1;

  const w = Math.max(0, Math.min(1, weight));
  return rgbToHex(
    rgb1.r * w + rgb2.r * (1 - w),
    rgb1.g * w + rgb2.g * (1 - w),
    rgb1.b * w + rgb2.b * (1 - w)
  );
}
