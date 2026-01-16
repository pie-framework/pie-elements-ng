import type { ToLaTeXConverter } from '../../domain/usecases/to-latex-converter';

export class MathMLElementToLaTexConverter implements ToLaTeXConverter {
  convert(): string {
    return 'a';
  }
}
