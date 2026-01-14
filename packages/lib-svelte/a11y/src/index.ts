/**
 * Accessibility Utilities
 *
 * Provides helpers for making PIE elements accessible.
 */

/**
 * Announce a message to screen readers
 */
export function announceToScreenReader(message: string, assertive = false): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', assertive ? 'alert' : 'status');
  announcement.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Get ARIA label for a score
 */
export function getScoreAriaLabel(score: number, maxScore: number): string {
  const percentage = Math.round((score / maxScore) * 100);
  return `Score: ${score} out of ${maxScore} points (${percentage} percent)`;
}

/**
 * Get ARIA label for feedback
 */
export function getFeedbackAriaLabel(correct: boolean): string {
  return correct ? 'Correct answer' : 'Incorrect answer';
}

/**
 * Add keyboard navigation to an element
 */
export function makeKeyboardNavigable(element: HTMLElement, onActivate: () => void): void {
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'button');

  element.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  });
}

/**
 * Create a visually hidden element (for screen readers only)
 */
export function createScreenReaderOnly(content: string): HTMLElement {
  const element = document.createElement('span');
  element.className = 'sr-only';
  element.textContent = content;
  return element;
}

/**
 * Check if an element is visible to screen readers
 */
export function isVisibleToScreenReader(element: HTMLElement): boolean {
  const ariaHidden = element.getAttribute('aria-hidden');
  const role = element.getAttribute('role');

  if (ariaHidden === 'true') {
    return false;
  }

  if (role === 'presentation' || role === 'none') {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return false;
  }

  return true;
}

/**
 * Focus management - trap focus within an element
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') {
      return;
    }

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Get appropriate ARIA role for an element type
 */
export function getAriaRole(
  elementType: 'button' | 'link' | 'heading' | 'region' | 'list'
): string {
  const roles: Record<string, string> = {
    button: 'button',
    link: 'link',
    heading: 'heading',
    region: 'region',
    list: 'list',
  };

  return roles[elementType] || 'region';
}

/**
 * Add skip link for keyboard navigation
 */
export function addSkipLink(targetId: string, label = 'Skip to main content'): HTMLElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className = 'skip-link';

  // Style to be visible only on focus
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  return skipLink;
}

/**
 * Validate color contrast ratio (WCAG AA standard)
 */
export function meetsContrastRatio(
  foreground: string,
  background: string,
  largeText = false
): boolean {
  // This is a simplified placeholder
  // Real implementation would calculate luminance and contrast ratio
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  console.log('Contrast check (placeholder):', { foreground, background, largeText });
  return true;
}

/**
 * Get keyboard shortcut description for ARIA
 */
export function getKeyboardShortcutLabel(key: string, modifiers: string[] = []): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrl = isMac ? 'Command' : 'Control';

  const modifierLabels = modifiers.map((mod) => {
    switch (mod.toLowerCase()) {
      case 'ctrl':
      case 'control':
        return ctrl;
      case 'alt':
        return isMac ? 'Option' : 'Alt';
      case 'shift':
        return 'Shift';
      case 'meta':
        return isMac ? 'Command' : 'Windows';
      default:
        return mod;
    }
  });

  return [...modifierLabels, key].join(' + ');
}
