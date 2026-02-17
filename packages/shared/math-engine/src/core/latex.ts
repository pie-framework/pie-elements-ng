const EXTRA_SLASHES_REGEX = /[\\]{2,}/gm;
const SPACE_REGEX = / /g;

export function normalizeLatex(latex: string | null | undefined): string {
  if (!latex) {
    return '';
  }

  return latex.replace(EXTRA_SLASHES_REGEX, '\\');
}

export function stripSpaces(latex: string | null | undefined): string {
  if (!latex) {
    return '';
  }

  return latex.replace(SPACE_REGEX, '');
}

export function countBraces(latex: string | null | undefined): number {
  if (!latex) {
    return 0;
  }

  let count = 0;
  for (const char of latex) {
    if (char === '{') {
      count += 1;
    }
  }
  return count;
}
