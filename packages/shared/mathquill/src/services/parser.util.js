var Parser = P(function (_, super_, Parser) {
  // The Parser object is a wrapper for a parser function.
  // Externally, you use one to parse a string by calling
  //   var result = SomeParser.parse('Me Me Me! Parse Me!');
  // You should never call the constructor, rather you should
  // construct your Parser from the base parsers and the
  // parser combinator methods.

  function parseError(stream, message) {
    if (stream) {
      stream = "'" + stream + "'";
    } else {
      stream = 'EOF';
    }

    throw 'Parse Error: ' + message + ' at ' + stream;
  }

  _.init = function (body) {
    this._ = body;
  };

  _.parse = function (stream) {
    return this.skip(eof)._('' + stream, success, parseError);

    function success(stream, result) {
      return result;
    }
  };

  // -*- primitive combinators -*- //
  _.or = function (alternative) {
    pray('or is passed a parser', alternative instanceof Parser);

    return Parser((stream, onSuccess, onFailure) => this._(stream, onSuccess, failure));
  };

  _.then = function (next) {
    return Parser((stream, onSuccess, onFailure) => this._(stream, success, onFailure));
  };

  // -*- optimized iterative combinators -*- //
  _.many = function () {
    return Parser((stream, onSuccess, onFailure) => {
      var xs = [];
      while (this._(stream, success, failure));
      return onSuccess(stream, xs);

      function success(newStream, x) {
        stream = newStream;
        xs.push(x);
        return true;
      }

      function failure() {
        return false;
      }
    });
  };

  _.times = function (min, max) {
    if (arguments.length < 2) max = min;

    return Parser((stream, onSuccess, onFailure) => {
      var xs = [];
      var result = true;
      var failure;

      for (var i = 0; i < min; i += 1) {
        result = this._(stream, success, firstFailure);
        if (!result) return onFailure(stream, failure);
      }

      for (; i < max && result; i += 1) {
        result = this._(stream, success, secondFailure);
      }

      return onSuccess(stream, xs);

      function success(newStream, x) {
        xs.push(x);
        stream = newStream;
        return true;
      }

      function firstFailure(newStream, msg) {
        failure = msg;
        stream = newStream;
        return false;
      }

      function secondFailure(newStream, msg) {
        return false;
      }
    });
  };

  // -*- higher-level combinators -*- //
  _.result = function (res) {
    return this.then(succeed(res));
  };
  _.atMost = function (n) {
    return this.times(0, n);
  };
  _.atLeast = function (n) {
    return this.times(n).then((start) => this.many().map((end) => start.concat(end)));
  };

  _.map = function (fn) {
    return this.then((result) => succeed(fn(result)));
  };

  _.skip = function (two) {
    return this.then((result) => two.result(result));
  };

  // -*- primitive parsers -*- //
  var string = (this.string = (str) => {
    var len = str.length;
    var expected = "expected '" + str + "'";

    return Parser((stream, onSuccess, onFailure) => {
      var head = stream.slice(0, len);

      if (head === str) {
        return onSuccess(stream.slice(len), head);
      } else {
        return onFailure(stream, expected);
      }
    });
  });

  var regex = (this.regex = (re) => {
    pray('regexp parser is anchored', re.toString().charAt(1) === '^');

    var expected = 'expected ' + re;

    return Parser((stream, onSuccess, onFailure) => {
      var match = re.exec(stream);

      if (match) {
        var result = match[0];
        return onSuccess(stream.slice(result.length), result);
      } else {
        return onFailure(stream, expected);
      }
    });
  });

  var succeed = (Parser.succeed = (result) =>
    Parser((stream, onSuccess) => onSuccess(stream, result)));

  var fail = (Parser.fail = (msg) => Parser((stream, _, onFailure) => onFailure(stream, msg)));

  var letter = (Parser.letter = regex(/^[a-z]/i));
  var letters = (Parser.letters = regex(/^[a-z]*/i));
  var digit = (Parser.digit = regex(/^[0-9]/));
  var digits = (Parser.digits = regex(/^[0-9]*/));
  var whitespace = (Parser.whitespace = regex(/^\s+/));
  var optWhitespace = (Parser.optWhitespace = regex(/^\s*/));

  var any = (Parser.any = Parser((stream, onSuccess, onFailure) => {
    if (!stream) return onFailure(stream, 'expected any character');

    return onSuccess(stream.slice(1), stream.charAt(0));
  }));

  var all = (Parser.all = Parser((stream, onSuccess, onFailure) => onSuccess('', stream)));

  var eof = (Parser.eof = Parser((stream, onSuccess, onFailure) => {
    if (stream) return onFailure(stream, 'expected EOF');

    return onSuccess(stream, stream);
  }));
});
