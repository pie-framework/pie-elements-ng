/*************************************************
 * Abstract classes of math blocks and commands.
 ************************************************/

/**
 * Math tree node base class.
 * Some math-tree-specific extensions to Node.
 * Both MathBlock's and MathCommand's descend from it.
 */
var MathElement = P(Node, (_, super_) => {
  _.finalizeInsert = function (options, cursor) {
    // `cursor` param is only for
    this.postOrder('finalizeTree', options);
    this.postOrder('contactWeld', cursor);

    // note: this order is important.
    // empty elements need the empty box provided by blur to
    // be present in order for their dimensions to be measured
    // correctly by 'reflow' handlers.
    this.postOrder('blur');

    this.postOrder('reflow');
    if (this[R].siblingCreated) this[R].siblingCreated(options, L);
    if (this[L].siblingCreated) this[L].siblingCreated(options, R);
    this.bubble('reflow');
  };
  // If the maxDepth option is set, make sure
  // deeply nested content is truncated. Just return
  // false if the cursor is already too deep.
  _.prepareInsertionAt = function (cursor) {
    var maxDepth = cursor.options.maxDepth;
    if (maxDepth !== undefined) {
      var cursorDepth = cursor.depth();
      if (cursorDepth > maxDepth) {
        return false;
      }
      this.removeNodesDeeperThan(maxDepth - cursorDepth);
    }
    return true;
  };
  // Remove nodes that are more than `cutoff`
  // blocks deep from this node.
  _.removeNodesDeeperThan = function (cutoff) {
    var depth = 0;
    var queue = [[this, depth]];
    var current;

    // Do a breadth-first search of this node's descendants
    // down to cutoff, removing anything deeper.
    while (queue.length) {
      current = queue.shift();
      current[0].children().each((child) => {
        var i = child instanceof MathBlock ? 1 : 0;
        depth = current[1] + i;

        if (depth <= cutoff) {
          queue.push([child, depth]);
        } else {
          (i ? child.children() : child).remove();
        }
      });
    }
  };
});

/**
 * Commands and operators, like subscripts, exponents, or fractions.
 * Descendant commands are organized into blocks.
 */
var MathCommand = P(MathElement, (_, super_) => {
  _.init = function (ctrlSeq, htmlTemplate, textTemplate) {
    super_.init.call(this);

    if (!this.ctrlSeq) this.ctrlSeq = ctrlSeq;
    if (htmlTemplate) this.htmlTemplate = htmlTemplate;
    if (textTemplate) this.textTemplate = textTemplate;
  };

  // obvious methods
  _.replaces = function (replacedFragment) {
    replacedFragment.disown();
    this.replacedFragment = replacedFragment;
  };
  _.isEmpty = function () {
    return this.foldChildren(true, (isEmpty, child) => isEmpty && child.isEmpty());
  };

  _.parser = function () {
    var block = latexMathParser.block;

    return block.times(this.numBlocks()).map((blocks) => {
      this.blocks = blocks;

      for (var i = 0; i < blocks.length; i += 1) {
        blocks[i].adopt(this, this.ends[R], 0);
      }

      return this;
    });
  };

  // createLeftOf(cursor) and the methods it calls
  _.createLeftOf = function (cursor) {
    var replacedFragment = this.replacedFragment;

    this.createBlocks();
    super_.createLeftOf.call(this, cursor);
    if (replacedFragment) {
      replacedFragment.adopt(this.ends[L], 0, 0);
      replacedFragment.jQ.appendTo(this.ends[L].jQ);
      this.placeCursor(cursor);
      this.prepareInsertionAt(cursor);
    }
    this.finalizeInsert(cursor.options);
    this.placeCursor(cursor);
  };
  _.createBlocks = function () {
    var numBlocks = this.numBlocks(),
      blocks = (this.blocks = Array(numBlocks));

    for (var i = 0; i < numBlocks; i += 1) {
      var newBlock = (blocks[i] = MathBlock());
      newBlock.adopt(this, this.ends[R], 0);
    }
  };
  _.placeCursor = function (cursor) {
    //insert the cursor at the right end of the first empty child, searching
    //left-to-right, or if none empty, the right end child
    cursor.insAtRightEnd(
      this.foldChildren(this.ends[L], (leftward, child) => (leftward.isEmpty() ? leftward : child))
    );
  };

  // editability methods: called by the cursor for editing, cursor movements,
  // and selection of the MathQuill tree, these all take in a direction and
  // the cursor
  _.moveTowards = function (dir, cursor, updown) {
    var updownInto = updown && this[updown + 'Into'];
    cursor.insAtDirEnd(-dir, updownInto || this.ends[-dir]);
  };
  _.deleteTowards = function (dir, cursor) {
    if (this.isEmpty()) cursor[dir] = this.remove()[dir];
    else this.moveTowards(dir, cursor, null);
  };
  _.selectTowards = function (dir, cursor) {
    cursor[-dir] = this;
    cursor[dir] = this[dir];
  };
  _.selectChildren = function () {
    return Selection(this, this);
  };
  _.unselectInto = function (dir, cursor) {
    cursor.insAtDirEnd(-dir, cursor.anticursor.ancestors[this.id]);
  };
  _.seek = function (pageX, cursor) {
    function getBounds(node) {
      var bounds = {};
      bounds[L] = node.jQ.offset().left;
      bounds[R] = bounds[L] + node.jQ.outerWidth();
      return bounds;
    }
    var cmdBounds = getBounds(this);

    if (pageX < cmdBounds[L]) return cursor.insLeftOf(this);
    if (pageX > cmdBounds[R]) return cursor.insRightOf(this);

    var leftLeftBound = cmdBounds[L];
    this.eachChild((block) => {
      var blockBounds = getBounds(block);
      if (pageX < blockBounds[L]) {
        // closer to this block's left bound, or the bound left of that?
        if (pageX - leftLeftBound < blockBounds[L] - pageX) {
          if (block[L]) cursor.insAtRightEnd(block[L]);
          else cursor.insLeftOf(this);
        } else cursor.insAtLeftEnd(block);
        return false;
      } else if (pageX > blockBounds[R]) {
        if (block[R])
          leftLeftBound = blockBounds[R]; // continue to next block
        else {
          // last (rightmost) block
          // closer to this block's right bound, or the cmd's right bound?
          if (cmdBounds[R] - pageX < pageX - blockBounds[R]) {
            cursor.insRightOf(this);
          } else cursor.insAtRightEnd(block);
        }
      } else {
        block.seek(pageX, cursor);
        return false;
      }
    });
  };

  // methods involved in creating and cross-linking with HTML DOM nodes
  /*
    They all expect an .htmlTemplate like
      '<span>&0</span>'
    or
      '<span><span>&0</span><span>&1</span></span>'

    See html.test.js for more examples.

    Requirements:
    - For each block of the command, there must be exactly one "block content
      marker" of the form '&<number>' where <number> is the 0-based index of the
      block. (Like the LaTeX \newcommand syntax, but with a 0-based rather than
      1-based index, because JavaScript because C because Dijkstra.)
    - The block content marker must be the sole contents of the containing
      element, there can't even be surrounding whitespace, or else we can't
      guarantee sticking to within the bounds of the block content marker when
      mucking with the HTML DOM.
    - The HTML not only must be well-formed HTML (of course), but also must
      conform to the XHTML requirements on tags, specifically all tags must
      either be self-closing (like '<br/>') or come in matching pairs.
      Close tags are never optional.

    Note that &<number> isn't well-formed HTML; if you wanted a literal '&123',
    your HTML template would have to have '&amp;123'.
  */
  _.numBlocks = function () {
    var matches = this.htmlTemplate.match(/&\d+/g);
    return matches ? matches.length : 0;
  };
  _.html = function () {
    var blocks = this.blocks;
    var cmdId = ' mathquill-command-id=' + this.id;
    var tokens = this.htmlTemplate.match(/<[^<>]+>|[^<>]+/g);

    pray('no unmatched angle brackets', tokens.join('') === this.htmlTemplate);

    // add cmdId to all top-level tags
    for (var i = 0, token = tokens[0]; token; i += 1, token = tokens[i]) {
      // top-level self-closing tags
      if (token.slice(-2) === '/>') {
        tokens[i] = token.slice(0, -2) + cmdId + '/>';
      }
      // top-level open tags
      else if (token.charAt(0) === '<') {
        pray('not an unmatched top-level close tag', token.charAt(1) !== '/');

        tokens[i] = token.slice(0, -1) + cmdId + '>';

        // skip matching top-level close tag and all tag pairs in between
        var nesting = 1;
        do {
          (i += 1), (token = tokens[i]);
          pray('no missing close tags', token);
          // close tags
          if (token.slice(0, 2) === '</') {
            nesting -= 1;
          }
          // non-self-closing open tags
          else if (token.charAt(0) === '<' && token.slice(-2) !== '/>') {
            nesting += 1;
          }
        } while (nesting > 0);
      }
    }
    return tokens
      .join('')
      .replace(
        />&(\d+)/g,
        ($0, $1) => ' mathquill-block-id=' + blocks[$1].id + '>' + blocks[$1].join('html')
      );
  };

  // methods to export a string representation of the math tree
  _.latex = function () {
    return this.foldChildren(
      this.ctrlSeq,
      (latex, child) => latex + '{' + (child.latex() || ' ') + '}'
    );
  };
  _.textTemplate = [''];
  _.text = function () {
    var i = 0;
    return this.foldChildren(this.textTemplate[i], (text, child) => {
      i += 1;
      var child_text = child.text();
      if (
        text &&
        this.textTemplate[i] === '(' &&
        child_text[0] === '(' &&
        child_text.slice(-1) === ')'
      )
        return text + child_text.slice(1, -1) + this.textTemplate[i];
      return text + child_text + (this.textTemplate[i] || '');
    });
  };
});

/**
 * Lightweight command without blocks or children.
 */
var Symbol = P(MathCommand, (_, super_) => {
  _.init = function (ctrlSeq, html, text) {
    if (!text) text = ctrlSeq && ctrlSeq.length > 1 ? ctrlSeq.slice(1) : ctrlSeq;

    super_.init.call(this, ctrlSeq, html, [text]);
  };

  _.parser = function () {
    return Parser.succeed(this);
  };
  _.numBlocks = () => 0;

  _.replaces = (replacedFragment) => {
    replacedFragment.remove();
  };
  _.createBlocks = noop;

  _.moveTowards = function (dir, cursor) {
    cursor.jQ.insDirOf(dir, this.jQ);
    cursor[-dir] = this;
    cursor[dir] = this[dir];
  };
  _.deleteTowards = function (dir, cursor) {
    cursor[dir] = this.remove()[dir];
  };
  _.seek = function (pageX, cursor) {
    // insert at whichever side the click was closer to
    if (pageX - this.jQ.offset().left < this.jQ.outerWidth() / 2) cursor.insLeftOf(this);
    else cursor.insRightOf(this);
  };

  _.latex = function () {
    return this.ctrlSeq;
  };
  _.text = function () {
    return this.textTemplate;
  };
  _.placeCursor = noop;
  _.isEmpty = () => true;
});
var VanillaSymbol = P(Symbol, (_, super_) => {
  _.init = function (ch, html) {
    super_.init.call(this, ch, '<span>' + (html || ch) + '</span>');
  };
});
var BinaryOperator = P(Symbol, (_, super_) => {
  _.init = function (ctrlSeq, html, text) {
    super_.init.call(this, ctrlSeq, '<span class="mq-binary-operator">' + html + '</span>', text);
  };
});

/**
 * Children and parent of MathCommand's. Basically partitions all the
 * symbols and operators that descend (in the Math DOM tree) from
 * ancestor operators.
 */
var MathBlock = P(MathElement, (_, super_) => {
  _.join = function (methodName) {
    return this.foldChildren('', (fold, child) => fold + child[methodName]());
  };
  _.html = function () {
    return this.join('html');
  };
  _.latex = function () {
    return this.join('latex');
  };
  _.text = function () {
    return this.ends[L] === this.ends[R] && this.ends[L] !== 0
      ? this.ends[L].text()
      : this.join('text');
  };

  _.keystroke = function (key, e, ctrlr) {
    if (ctrlr.options.spaceBehavesLikeTab && (key === 'Spacebar' || key === 'Shift-Spacebar')) {
      e.preventDefault();
      ctrlr.escapeDir(key === 'Shift-Spacebar' ? L : R, key, e);
      return;
    }
    return super_.keystroke.apply(this, arguments);
  };

  // editability methods: called by the cursor for editing, cursor movements,
  // and selection of the MathQuill tree, these all take in a direction and
  // the cursor
  _.moveOutOf = function (dir, cursor, updown) {
    var updownInto = updown && this.parent[updown + 'Into'];
    if (!updownInto && this[dir]) cursor.insAtDirEnd(-dir, this[dir]);
    else cursor.insDirOf(dir, this.parent);
  };
  _.selectOutOf = function (dir, cursor) {
    cursor.insDirOf(dir, this.parent);
  };
  _.deleteOutOf = (dir, cursor) => {
    cursor.unwrapGramp();
  };
  _.seek = function (pageX, cursor) {
    var node = this.ends[R];
    if (!node || node.jQ.offset().left + node.jQ.outerWidth() < pageX) {
      return cursor.insAtRightEnd(this);
    }
    if (pageX < this.ends[L].jQ.offset().left) return cursor.insAtLeftEnd(this);
    while (pageX < node.jQ.offset().left) node = node[L];
    return node.seek(pageX, cursor);
  };
  _.chToCmd = (ch, options) => {
    var cons;
    // exclude f because it gets a dedicated command with more spacing
    if (ch.match(/^[a-eg-zA-Z]$/)) return Letter(ch);
    else if (/^\d$/.test(ch)) return Digit(ch);
    else if (options && options.typingSlashWritesDivisionSymbol && ch === '/')
      return LatexCmds['÷'](ch);
    else if (options && options.typingAsteriskWritesTimesSymbol && ch === '*')
      return LatexCmds['×'](ch);
    else if ((cons = CharCmds[ch] || LatexCmds[ch])) return cons(ch);
    else return VanillaSymbol(ch);
  };
  _.write = function (cursor, ch) {
    var cmd;
    // preventing creating too many nested symbols
    if (cursor.tooDeep()) return false;
    cmd = this.chToCmd(ch, cursor.options);
    if (cursor.selection) cmd.replaces(cursor.replaceSelection());
    if (!cursor.isTooDeep()) {
      cmd.createLeftOf(cursor.show());
    }
  };

  _.focus = function () {
    this.jQ.addClass('mq-hasCursor');
    this.jQ.removeClass('mq-empty');

    return this;
  };
  _.blur = function () {
    this.jQ.removeClass('mq-hasCursor');
    if (this.isEmpty()) this.jQ.addClass('mq-empty');

    return this;
  };
});

Options.p.mouseEvents = true;
API.StaticMath = (APIClasses) =>
  P(APIClasses.AbstractMathQuill, function (_, super_) {
    this.RootBlock = MathBlock;
    _.__mathquillify = function (opts, interfaceVersion) {
      this.config(opts);
      super_.__mathquillify.call(this, 'mq-math-mode');
      if (this.__options.mouseEvents) {
        this.__controller.delegateMouseEvents();
        this.__controller.staticMathTextareaEvents();
      }
      return this;
    };
    _.init = function () {
      super_.init.apply(this, arguments);
      this.__controller.root.postOrder(
        'registerInnerField',
        (this.innerFields = []),
        APIClasses.MathField
      );
    };
    _.latex = function () {
      var returned = super_.latex.apply(this, arguments);
      if (arguments.length > 0) {
        this.__controller.root.postOrder(
          'registerInnerField',
          (this.innerFields = []),
          APIClasses.MathField
        );
      }
      return returned;
    };
  });

var RootMathBlock = P(MathBlock, RootBlockMixin);
API.MathField = (APIClasses) =>
  P(APIClasses.EditableField, function (_, super_) {
    this.RootBlock = RootMathBlock;
    _.__mathquillify = function (opts, interfaceVersion) {
      this.config(opts);
      if (interfaceVersion > 1) this.__controller.root.reflow = noop;
      super_.__mathquillify.call(this, 'mq-editable-field mq-math-mode');
      delete this.__controller.root.reflow;
      return this;
    };
  });
