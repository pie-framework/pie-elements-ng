import type { ToLaTeXConverter } from '../../../../domain/usecases/to-latex-converter';
import type { MathMLElement } from '../../../protocols/mathml-element';
import { normalizeWhiteSpaces } from '../../../helpers';
import {
  HashUTF8ToLtXConverter,
  allMathOperatorsByChar,
  allMathOperatorsByGlyph,
  mathNumberByGlyph,
  allMathOperatorsByGlyphSpecial,
  mathNumberByGlyphSpecial,
} from '../../../../syntax';

export class MO implements ToLaTeXConverter {
  private readonly _mathmlElement: MathMLElement;

  constructor(mathElement: MathMLElement) {
    this._mathmlElement = mathElement;
  }

  convert(): string {
    const normalizedValue = normalizeWhiteSpaces(this._mathmlElement.value);
    const trimmedValue = normalizedValue.trim();

    if (this._mathmlElement.attributes['data-mjx-texclass'] === 'OPEN' && trimmedValue === '|') {
      return `\\left|`;
    }
    if (this._mathmlElement.attributes['data-mjx-texclass'] === 'CLOSE' && trimmedValue === '|') {
      return `\\right|`;
    }

    return Operator.operate(trimmedValue);
  }
}

class Operator {
  private _value: string;

  constructor(value: string) {
    this._value = value;
  }

  static operate(value: string): string {
    return new Operator(value)._operate();
  }

  private _operate(): string {
    return (
      this._findByCharacter() ||
      this._findByGlyph() ||
      this._findByNumber() ||
      new HashUTF8ToLtXConverter().convert(this._value)
    );
  }

  private _findByCharacter(): string | undefined {
    return allMathOperatorsByChar[this._value];
  }

  private _findByGlyph(): string | undefined {
    const mathOperator = allMathOperatorsByGlyphSpecial[`"${this._value}"`];

    return mathOperator || allMathOperatorsByGlyph[this._value];
  }

  private _findByNumber(): string | undefined {
    const mathOperator = mathNumberByGlyphSpecial[`"${this._value}"`];

    return mathOperator || mathNumberByGlyph[this._value];
  }
}
