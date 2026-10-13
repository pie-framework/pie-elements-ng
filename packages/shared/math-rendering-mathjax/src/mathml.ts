export const MATHML_NS = 'http://www.w3.org/1998/Math/MathML';

/** A prefixed MathML root's tag name, `mml:math`, which the HTML parser gives the whole name. */
const PREFIXED_MATH = /^([a-z_][\w.-]*):math$/;
const MATHML_NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Re-creates prefixed MathML, a `<mml:math>` and its `mml:` descendants, as MathML elements. The
 * HTML parser reads a prefixed tag as an unknown HTML element, and MathJax finds prefixed math only
 * when `<html>` binds the prefix, which host pages do not. Any prefix on a root named `math` counts,
 * bound or not, since authored content declares only the default namespace.
 */
export function unprefixMathml(root: Element): void {
  for (const math of root.querySelectorAll('*')) {
    const prefix = PREFIXED_MATH.exec(math.tagName.toLowerCase())?.[1];
    if (!prefix || !root.contains(math) || math.closest('mjx-container')) continue;
    math.replaceWith(toMathml(math, `${prefix}:`));
  }
}

function toMathml(element: Element, prefix: string): Element {
  const name = element.tagName.toLowerCase().slice(prefix.length);
  if (!MATHML_NAME.test(name)) return element;
  const mathml = element.ownerDocument.createElementNS(MATHML_NS, name);
  for (const attribute of element.attributes) mathml.setAttribute(attribute.name, attribute.value);
  for (const child of [...element.childNodes]) {
    const prefixed = child instanceof Element && child.tagName.toLowerCase().startsWith(prefix);
    mathml.appendChild(prefixed ? toMathml(child, prefix) : child);
  }
  return mathml;
}
