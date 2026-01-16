import type { ToLaTeXConverter } from '../../../../domain/usecases/to-latex-converter';
import type { MathMLElement } from '../../../protocols/mathml-element';
import {
  mathMLElementToLaTeXConverter,
  ParenthesisWrapper,
  BracketWrapper,
} from '../../../helpers';
import { InvalidNumberOfChildrenError } from '../../../errors';

export class MSub implements ToLaTeXConverter {
  private readonly _mathmlElement: MathMLElement;

  constructor(mathElement: MathMLElement) {
    this._mathmlElement = mathElement;
  }

  convert(): string {
    const { name, children } = this._mathmlElement;
    const childrenLength = children.length;

    if (childrenLength !== 2) throw new InvalidNumberOfChildrenError(name, 2, childrenLength);

    const base = mathMLElementToLaTeXConverter(children[0]).convert();
    const subscript = mathMLElementToLaTeXConverter(children[1]).convert();

    if (base === 'log') {
      return `\\${base}_${new BracketWrapper().wrap(subscript)}`;
    }

    return `${base}_${new BracketWrapper().wrap(subscript)}`;
    // return `${new ParenthesisWrapper().wrapIfMoreThanOneChar(base)}_${new BracketWrapper().wrap(subscript)}`;
  }
}
