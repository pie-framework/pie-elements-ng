import type { ToLaTeXConverter } from '../../../../domain/usecases/to-latex-converter';
import type { MathMLElement } from '../../../protocols/mathml-element';
import { mathMLElementToLaTeXConverter, BracketWrapper } from '../../../helpers';
import { InvalidNumberOfChildrenError } from '../../../errors';

export class MSup implements ToLaTeXConverter {
  private readonly _mathmlElement: MathMLElement;

  constructor(mathElement: MathMLElement) {
    this._mathmlElement = mathElement;
  }

  convert(): string {
    const { name, children } = this._mathmlElement;
    const childrenLength = children.length;

    if (childrenLength !== 2) throw new InvalidNumberOfChildrenError(name, 2, childrenLength);

    const base = mathMLElementToLaTeXConverter(children[0]).convert();
    const exponent = mathMLElementToLaTeXConverter(children[1]).convert();
    const prime = "'";
    const double = '″';

    if ([prime, double].indexOf(exponent)) {
      // This is a prime symbol, not a general exponent
      return `${base}${exponent}`;
    }

    return `${base}^${new BracketWrapper().wrap(exponent)}`;
  }
}
