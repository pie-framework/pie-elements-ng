type Success<T> = {
  ok: true;
  value: T;
  rest: string;
};

type Failure = {
  ok: false;
  rest: string;
};

type ParseResult<T> = Success<T> | Failure;

type ParserBody<T> = (stream: string) => ParseResult<T>;

export class Parser<T> {
  private readonly body: ParserBody<T>;

  constructor(body: ParserBody<T>) {
    this.body = body;
  }

  parse(stream: string): T {
    const out = this.body(stream);
    if (!out.ok || out.rest.length > 0) {
      throw new Error(`Parse Error at '${out.rest}'`);
    }
    return out.value;
  }

  run(stream: string): ParseResult<T> {
    return this.body(stream);
  }

  map<R>(fn: (value: T) => R): Parser<R> {
    return new Parser<R>((stream) => {
      const out = this.body(stream);
      if (!out.ok) {
        return out;
      }
      return {
        ok: true,
        value: fn(out.value),
        rest: out.rest,
      };
    });
  }

  chain<R>(next: (value: T) => Parser<R>): Parser<R> {
    return new Parser<R>((stream) => {
      const out = this.body(stream);
      if (!out.ok) {
        return out;
      }
      return next(out.value).run(out.rest);
    });
  }

  or(alternative: Parser<T>): Parser<T> {
    return new Parser<T>((stream) => {
      const out = this.body(stream);
      if (out.ok) {
        return out;
      }
      return alternative.run(stream);
    });
  }

  many(): Parser<T[]> {
    return new Parser<T[]>((stream) => {
      const values: T[] = [];
      let rest = stream;

      while (true) {
        const out = this.body(rest);
        if (!out.ok) {
          break;
        }
        values.push(out.value);
        rest = out.rest;
      }

      return {
        ok: true,
        value: values,
        rest,
      };
    });
  }
}

export function regexParser(expression: RegExp): Parser<string> {
  const anchored = expression.source.startsWith('^')
    ? expression
    : new RegExp(`^${expression.source}`);

  return new Parser<string>((stream) => {
    const out = anchored.exec(stream);
    if (!out) {
      return { ok: false, rest: stream };
    }
    return {
      ok: true,
      value: out[0],
      rest: stream.slice(out[0].length),
    };
  });
}

export function stringParser(value: string): Parser<string> {
  return new Parser<string>((stream) => {
    if (!stream.startsWith(value)) {
      return { ok: false, rest: stream };
    }
    return {
      ok: true,
      value,
      rest: stream.slice(value.length),
    };
  });
}
