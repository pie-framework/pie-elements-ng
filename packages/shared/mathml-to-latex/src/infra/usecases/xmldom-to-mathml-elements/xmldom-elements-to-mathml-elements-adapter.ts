import type { Element as XMLElement, Attr, NamedNodeMap, NodeList, Node } from '@xmldom/xmldom';
import type { MathMLElement } from '../../../data/protocols/mathml-element';

export class ElementsToMathMLAdapter {
  convert(els: XMLElement[]): MathMLElement[] {
    return els
      .filter((el: XMLElement) => el.tagName !== undefined)
      .map((el: XMLElement) => this._convertElement(el));
  }

  private _convertElement(el: XMLElement): MathMLElement {
    return {
      name: el.tagName,
      attributes: this._convertElementAttributes(el.attributes),
      value: this._hasElementChild(el) ? '' : el.textContent || '',
      children: this._hasElementChild(el)
        ? this.convert(Array.from(el.childNodes) as XMLElement[])
        : ([] as MathMLElement[]),
    };
  }

  private _convertElementAttributes(attributes: NamedNodeMap): Record<string, string> {
    return Array.from(attributes).reduce(
      (acc, attr: Attr) => {
        acc[attr.nodeName] = attr.nodeValue === attr.nodeName ? '' : (attr.nodeValue ?? '');
        return acc;
      },
      {} as Record<string, string>
    );
  }

  private _hasElementChild(el: XMLElement): boolean {
    const childNodes = el.childNodes;
    return !!childNodes && childNodes.length !== 0 && this._isThereAnyNoTextNode(childNodes);
  }

  private _isThereAnyNoTextNode(children: NodeList): boolean {
    return Array.from(children).some((child: Node) => child.nodeName !== '#text');
  }
}
