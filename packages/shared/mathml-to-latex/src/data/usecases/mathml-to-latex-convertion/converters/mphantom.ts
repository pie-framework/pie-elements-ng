import type { ToLaTeXConverter } from '../../../../domain/usecases/to-latex-converter';

export class MPhantom implements ToLaTeXConverter {
  convert(): string {
    return '';
  }
}
