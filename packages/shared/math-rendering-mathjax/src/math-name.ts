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

/** Holds the speech this module put in a container's `aria-label`, so it can take it back. */
const NAMED_BY_RENDERER = 'data-pie-math-name';

/** The element a control names: the control a `label` labels, or the control itself. */
function namedElement(control: Element): Element | null {
  if (control.localName !== 'label') return control;
  const label = control as HTMLLabelElement;
  if (label.control) return label.control;
  const forId = label.getAttribute('for');
  const root = label.getRootNode() as Document | ShadowRoot;
  return (
    (forId ? root.getElementById?.(forId) : null) ??
    label.querySelector('input, select, textarea, button')
  );
}

/**
 * Whether the control's name leaves `container` out: the control is named by `aria-labelledby`
 * from elements that do not hold the math. An element that names a control that way has chosen
 * what the name says, such as a choice's key and a note that the answer follows, and leaves the
 * math to the screen reader in the content (PIE-1244).
 */
function isNamedFromElsewhere(control: Element, container: Element): boolean {
  const ids = namedElement(control)?.getAttribute('aria-labelledby')?.split(/\s+/).filter(Boolean);
  if (!ids?.length) return false;
  const root = container.getRootNode() as Document | ShadowRoot;
  return !ids.some((id) => root.getElementById?.(id)?.contains(container));
}

/** Removes a label this module set, and only while it is still the label it set. */
function unnameMath(container: Element): void {
  const speech = container.getAttribute(NAMED_BY_RENDERER);
  if (speech === null) return;
  if (container.getAttribute('aria-label') === speech) container.removeAttribute('aria-label');
  container.removeAttribute(NAMED_BY_RENDERER);
}

/**
 * Labels a typeset expression inside a control with its English speech, read from the hidden
 * MathML MathJax leaves in the `mjx-container`. An `aria-label` on the container, which has no
 * role, puts that speech in the name of the control around it in Chromium, Firefox and WebKit,
 * among the control's other text. Math outside controls stays unlabelled, so screen readers keep
 * navigating its MathML, and so does math in a control named by `aria-labelledby` from elsewhere,
 * whose name does not include it. A container that already has a label keeps it, because the
 * page's renderer or a host's speech engine set it.
 */
export function nameMathInControl(container: Element): void {
  const control = container.closest(CONTROLS);
  if (!control) return;
  if (isNamedFromElsewhere(control, container)) {
    unnameMath(container);
    return;
  }
  if (container.hasAttribute('aria-label')) return;
  const math = container.querySelector('math');
  const name = math ? speakMathml(math) : '';
  if (!name) return;
  container.setAttribute('aria-label', name);
  container.setAttribute(NAMED_BY_RENDERER, name);
}

/** Labels each typeset expression in `root` that sits inside a control. */
export function nameMathInControls(root: Element): void {
  for (const container of root.querySelectorAll('mjx-container')) nameMathInControl(container);
}
