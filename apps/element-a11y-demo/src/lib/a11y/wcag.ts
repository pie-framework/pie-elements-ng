const WCAG_UNDERSTANDING_SLUGS: Record<string, string> = {
  '1.1.1': 'non-text-content',
  '1.2.1': 'audio-only-and-video-only-prerecorded',
  '1.2.2': 'captions-prerecorded',
  '1.3.1': 'info-and-relationships',
  '1.3.2': 'meaningful-sequence',
  '1.4.1': 'use-of-color',
  '1.4.11': 'non-text-contrast',
  '2.1.1': 'keyboard',
  '2.4.3': 'focus-order',
  '2.4.6': 'headings-and-labels',
  '2.5.1': 'pointer-gestures',
  '2.5.7': 'dragging-movements',
  '2.5.8': 'target-size-minimum',
  '3.1.1': 'language-of-page',
  '3.3.1': 'error-identification',
  '3.3.2': 'labels-or-instructions',
  '3.3.3': 'error-suggestion',
  '4.1.2': 'name-role-value',
  '4.1.3': 'status-messages',
};

export function wcagUnderstandingUrl(criterion: string): string {
  const slug = WCAG_UNDERSTANDING_SLUGS[criterion];
  return slug
    ? `https://www.w3.org/WAI/WCAG22/Understanding/${slug}`
    : `https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2#principle${criterion}`;
}
