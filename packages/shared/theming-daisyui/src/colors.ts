/**
 * Color manipulation utilities
 * Simple color math for deriving theme colors
 */

/**
 * Parse hex color to RGB
 * Supports 3-digit and 6-digit hex colors
 *
 * @param hex - Hex color string (#RGB or #RRGGBB)
 * @returns RGB object or null if invalid
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  const clean = hex.replace(/^#/, '');

  // Handle 3-digit hex
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return { r, g, b };
  }

  // Handle 6-digit hex
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return { r, g, b };
  }

  return null;
}

/**
 * Parse rgb/rgba color to RGB
 * Supports rgb(r, g, b) and rgba(r, g, b, a) formats
 *
 * @param rgb - RGB/RGBA color string
 * @returns RGB object or null if invalid
 */
function rgbStringToRgb(rgb: string): { r: number; g: number; b: number } | null {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
    };
  }
  return null;
}

/**
 * Convert oklch color to RGB
 * DaisyUI v4+ uses oklch color space
 *
 * @param oklch - OKLCH color string in format "oklch(L C H)" or "oklch(L C H / alpha)"
 * @returns RGB object or null if invalid
 */
function oklchToRgb(oklch: string): { r: number; g: number; b: number } | null {
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (!match) {
    return null;
  }

  let l = parseFloat(match[1]); // lightness (0-1)
  const c = parseFloat(match[2]); // chroma (0-0.4 typical)
  let h = parseFloat(match[3]); // hue (0-360 degrees)

  // Normalize values
  l = Math.max(0, Math.min(1, l));
  h = h % 360;
  if (h < 0) h += 360;

  // Convert OKLCH → OKLAB → linear RGB → sRGB
  // This is a simplified conversion that works well enough for theme derivation

  // OKLCH to OKLAB
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  // OKLAB to linear RGB (simplified matrix transformation)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  // Linear RGB
  let r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let blue = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

  // Clamp and apply gamma correction (linear → sRGB)
  const gammaCorrect = (val: number): number => {
    val = Math.max(0, Math.min(1, val));
    return val <= 0.0031308 ? 12.92 * val : 1.055 * val ** (1 / 2.4) - 0.055;
  };

  r = Math.round(gammaCorrect(r) * 255);
  g = Math.round(gammaCorrect(g) * 255);
  blue = Math.round(gammaCorrect(blue) * 255);

  return { r, g, b: blue };
}

/**
 * Parse any color format to RGB
 * Supports hex, rgb, rgba, and oklch formats
 *
 * @param color - Color string in any format
 * @returns RGB object or null if invalid
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith('#')) {
    return hexToRgb(color);
  }
  if (color.startsWith('rgb')) {
    return rgbStringToRgb(color);
  }
  if (color.startsWith('oklch')) {
    return oklchToRgb(color);
  }
  return null;
}

/**
 * Convert RGB values to hex string
 *
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns Hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Lighten a color by a given amount
 * Moves color closer to white
 *
 * @param color - Color string (hex, rgb, or oklch)
 * @param amount - Amount to lighten (0-1)
 * @returns Lightened color as hex string
 *
 * @example
 * ```typescript
 * lighten('#3F51B5', 0.3); // Lighter indigo
 * lighten('rgb(63, 81, 181)', 0.5); // Much lighter indigo
 * lighten('oklch(0.45 0.24 277.023)', 0.3); // Lighter oklch color
 * ```
 */
export function lighten(color: string, amount: number): string {
  const rgb = parseColor(color);
  if (!rgb) {
    console.warn(`lighten: Invalid color "${color}"`);
    return color;
  }

  const r = rgb.r + (255 - rgb.r) * amount;
  const g = rgb.g + (255 - rgb.g) * amount;
  const b = rgb.b + (255 - rgb.b) * amount;

  return rgbToHex(r, g, b);
}

/**
 * Darken a color by a given amount
 * Moves color closer to black
 *
 * @param color - Color string (hex, rgb, or oklch)
 * @param amount - Amount to darken (0-1)
 * @returns Darkened color as hex string
 *
 * @example
 * ```typescript
 * darken('#3F51B5', 0.3); // Darker indigo
 * darken('rgb(63, 81, 181)', 0.5); // Much darker indigo
 * darken('oklch(0.45 0.24 277.023)', 0.3); // Darker oklch color
 * ```
 */
export function darken(color: string, amount: number): string {
  const rgb = parseColor(color);
  if (!rgb) {
    console.warn(`darken: Invalid color "${color}"`);
    return color;
  }

  const r = rgb.r * (1 - amount);
  const g = rgb.g * (1 - amount);
  const b = rgb.b * (1 - amount);

  return rgbToHex(r, g, b);
}

/**
 * Create rgba color with alpha transparency
 * Converts any color format to rgba
 *
 * @param color - Color string (hex, rgb, or oklch)
 * @param alpha - Alpha transparency (0-1)
 * @returns RGBA color string
 *
 * @example
 * ```typescript
 * rgba('#3F51B5', 0.5); // 'rgba(63, 81, 181, 0.5)'
 * rgba('rgb(255, 0, 0)', 0.2); // 'rgba(255, 0, 0, 0.2)'
 * rgba('oklch(0.45 0.24 277.023)', 0.5); // 'rgba(63, 81, 181, 0.5)'
 * ```
 */
export function rgba(color: string, alpha: number): string {
  const rgb = parseColor(color);
  if (!rgb) {
    console.warn(`rgba: Invalid color "${color}"`);
    return color;
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * Adjust color saturation
 * Experimental - for future use
 *
 * @param color - Color string
 * @param amount - Saturation adjustment (-1 to 1)
 * @returns Adjusted color
 */
export function adjustSaturation(color: string, amount: number): string {
  const rgb = parseColor(color);
  if (!rgb) {
    return color;
  }

  // Convert to HSL for saturation adjustment
  // This is a simplified version - full HSL conversion is complex
  // For now, just lighten/darken as a proxy
  return amount > 0 ? lighten(color, amount * 0.3) : darken(color, -amount * 0.3);
}

/**
 * Mix two colors
 * Blends colors by averaging RGB values
 *
 * @param color1 - First color
 * @param color2 - Second color
 * @param weight - Weight of first color (0-1, default 0.5)
 * @returns Mixed color as hex string
 *
 * @example
 * ```typescript
 * mix('#FF0000', '#0000FF', 0.5); // Purple
 * mix('#FF0000', '#0000FF', 0.75); // More red
 * ```
 */
export function mix(color1: string, color2: string, weight: number = 0.5): string {
  const rgb1 = parseColor(color1);
  const rgb2 = parseColor(color2);

  if (!rgb1 || !rgb2) {
    console.warn(`mix: Invalid color(s)`);
    return color1;
  }

  const w = Math.max(0, Math.min(1, weight));
  const r = rgb1.r * w + rgb2.r * (1 - w);
  const g = rgb1.g * w + rgb2.g * (1 - w);
  const b = rgb1.b * w + rgb2.b * (1 - w);

  return rgbToHex(r, g, b);
}
