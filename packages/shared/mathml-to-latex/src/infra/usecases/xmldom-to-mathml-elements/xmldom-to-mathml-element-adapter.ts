import xmldom, { type Element as XMLElement } from '@xmldom/xmldom';

import type { DOMParser } from '@xmldom/xmldom';
import type { ElementsToMathMLAdapter } from './xmldom-elements-to-mathml-elements-adapter';
import type { ErrorHandler } from './error-handler';
import type { MathMLElement } from '../../../data/protocols/mathml-element';

export class XmlToMathMLAdapter {
  private _xml = '';
  private readonly _xmlDOM: DOMParser;
  private readonly _errorHandler: ErrorHandler;
  private readonly _elementsConvertor: ElementsToMathMLAdapter;

  constructor(elementsConvertor: ElementsToMathMLAdapter, errorHandler: ErrorHandler) {
    this._elementsConvertor = elementsConvertor;
    this._errorHandler = errorHandler;

    this._xmlDOM = new xmldom.DOMParser({
      locator: this._errorHandler.errorLocator as any,
      errorHandler: this._fixError.bind(this) as any,
    });
  }

  convert(xml: string): MathMLElement[] {
    this._xml = this._removeLineBreaks(xml);

    return this._elementsConvertor.convert(this._mathMLElements);
  }

  private _fixError(errorMessage: string): void {
    this._xml = this._errorHandler.fixError(this._xml, errorMessage);
  }

  private _removeLineBreaks(xml: string): string {
    const LINE_BREAK = /\n|\r\n|\r/g;
    return xml.replace(LINE_BREAK, '');
  }

  private get _mathMLElements(): XMLElement[] {
    let elements = this._xmlDOM.parseFromString(this._xml, 'text/xml').getElementsByTagName('math');
    if (this._errorHandler.isThereAnyErrors()) {
      this._errorHandler.cleanErrors();
      elements = this._xmlDOM.parseFromString(this._xml, 'text/xml').getElementsByTagName('math');
    }

    return Array.from(elements);
  }
}
