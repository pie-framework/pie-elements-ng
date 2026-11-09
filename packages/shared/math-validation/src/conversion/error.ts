export class ParseError extends Error {
  location?: number;

  constructor(message: string, location?: number) {
    super(message || 'Error parsing input');
    this.name = 'ParseError';
    this.location = location;
  }
}
