const DESCRIBED_IMAGE = /<img\b[^>]*\balt\s*=\s*("[^"]*\S[^"]*"|'[^']*\S[^']*')/i;

const hasText = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .trim().length > 0;

/** Whether a choice label has no text and no described image, so it alone would leave the choice unnamed. */
export const labelIsNameless = (label: unknown) => {
  const html = typeof label === 'string' ? label : '';
  return !hasText(html) && !DESCRIBED_IMAGE.test(html);
};
