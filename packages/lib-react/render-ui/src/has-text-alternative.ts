/**
 * Whether markup can name a control for assistive technology: it holds text, or an image with a
 * non-blank `alt`. An image whose `alt` is empty or absent is decorative and names nothing.
 * Parses with the browser's `DOMParser`, so it runs only where a DOM exists.
 */
export const hasTextAlternative = (html: string | null | undefined): boolean => {
  if (!html) {
    return false;
  }

  const { body } = new DOMParser().parseFromString(html, 'text/html');

  return (
    !!body.textContent?.trim() ||
    Array.from(body.querySelectorAll('img')).some((img) => !!img.getAttribute('alt')?.trim())
  );
};
