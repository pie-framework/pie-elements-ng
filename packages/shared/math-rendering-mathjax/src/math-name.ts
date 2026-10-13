import { speakMathml } from './math-speech.js';

/**
 * Elements that take their accessible name from their content. Browsers leave MathML out of that
 * name, so a button or option holding only math has none, and a radio or checkbox labelled with
 * math is named from its bare symbols ("4 12" for 4 over 12).
 */
const CONTROLS = [
  'a[href]',
  'button',
  'label',
  'summary',
  ...[
    'button',
    'checkbox',
    'combobox',
    'link',
    'menuitem',
    'menuitemcheckbox',
    'menuitemradio',
    'option',
    'radio',
    'switch',
    'tab',
    'treeitem',
  ].map((role) => `[role="${role}"]`),
].join(', ');

/**
 * Labels a typeset expression inside a control with its English speech, read from the hidden
 * MathML MathJax leaves in the `mjx-container`. An `aria-label` on the container, which has no
 * role, puts that speech in the name of the control around it in Chromium, Firefox and WebKit,
 * among the control's other text. Math outside controls stays unlabelled, so screen readers keep
 * navigating its MathML. A container that already has a label keeps it, because the page's
 * renderer or a host's speech engine set it.
 */
export function nameMathInControl(container: Element): void {
  if (container.hasAttribute('aria-label') || !container.closest(CONTROLS)) return;
  const math = container.querySelector('math');
  const name = math ? speakMathml(math) : '';
  if (name) container.setAttribute('aria-label', name);
}

/** Labels each typeset expression in `root` that sits inside a control. */
export function nameMathInControls(root: Element): void {
  for (const container of root.querySelectorAll('mjx-container')) nameMathInControl(container);
}
