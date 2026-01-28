/*********************************************
 * Manage the MathQuill instance's textarea
 * (as owned by the Controller)
 ********************************************/

Controller.open((_) => {
  Options.p.substituteTextarea = () =>
    $(
      '<textarea autocapitalize=off autocomplete=off autocorrect=off ' +
        'spellcheck=false x-palm-disable-ste-all=true />'
    )[0];
  _.createTextarea = function () {
    var textareaSpan = (this.textareaSpan = $('<span class="mq-textarea"></span>')),
      textarea = this.options.substituteTextarea();
    if (!textarea.nodeType) {
      throw 'substituteTextarea() must return a DOM element, got ' + textarea;
    }
    textarea = this.textarea = $(textarea).appendTo(textareaSpan);
    this.cursor.selectionChanged = () => {
      this.selectionChanged();
    };
  };
  _.selectionChanged = function () {
    forceIERedraw(this.container[0]);

    // throttle calls to setTextareaSelection(), because setting textarea.value
    // and/or calling textarea.select() can have anomalously bad performance:
    // https://github.com/mathquill/mathquill/issues/43#issuecomment-1399080
    if (this.textareaSelectionTimeout === undefined) {
      this.textareaSelectionTimeout = setTimeout(() => {
        this.setTextareaSelection();
      });
    }
  };
  _.setTextareaSelection = function () {
    this.textareaSelectionTimeout = undefined;
    var latex = '';
    if (this.cursor.selection) {
      latex = this.cursor.selection.join('latex');
      if (this.options.statelessClipboard) {
        // FIXME: like paste, only this works for math fields; should ask parent
        latex = '$' + latex + '$';
      }
    }
    this.selectFn(latex);
  };
  _.staticMathTextareaEvents = function () {
    var ctrlr = this,
      root = ctrlr.root,
      cursor = ctrlr.cursor,
      textarea = ctrlr.textarea,
      textareaSpan = ctrlr.textareaSpan;

    this.container.prepend(
      jQuery('<span class="mq-selectable">').text('$' + ctrlr.exportLatex() + '$')
    );
    ctrlr.blurred = true;
    textarea
      .bind('cut paste', false)
      .bind('copy', () => {
        ctrlr.setTextareaSelection();
      })
      .focus(() => {
        ctrlr.blurred = false;
      })
      .blur(() => {
        if (cursor.selection) cursor.selection.clear();
        setTimeout(detach); //detaching during blur explodes in WebKit
      });
    function detach() {
      textareaSpan.detach();
      ctrlr.blurred = true;
    }

    ctrlr.selectFn = (text) => {
      textarea.val(text);
      if (text) textarea.select();
    };
  };
  Options.p.substituteKeyboardEvents = saneKeyboardEvents;
  _.editablesTextareaEvents = function () {
    var textarea = this.textarea,
      textareaSpan = this.textareaSpan;

    var keyboardEventsShim = this.options.substituteKeyboardEvents(textarea, this);
    this.selectFn = (text) => {
      keyboardEventsShim.select(text);
    };
    this.container.prepend(textareaSpan);
    this.focusBlurEvents();
  };
  _.typedText = function (ch) {
    if (ch === '\n') return this.handle('enter');
    var cursor = this.notify().cursor;
    cursor.parent.write(cursor, ch);
    this.scrollHoriz();
  };
  _.cut = function () {
    var cursor = this.cursor;
    if (cursor.selection) {
      setTimeout(() => {
        this.notify('edit'); // deletes selection if present
        cursor.parent.bubble('reflow');
      });
    }
  };
  _.copy = function () {
    this.setTextareaSelection();
  };
  _.paste = function (text) {
    // TODO: document `statelessClipboard` config option in README, after
    // making it work like it should, that is, in both text and math mode
    // (currently only works in math fields, so worse than pointless, it
    //  only gets in the way by \text{}-ifying pasted stuff and $-ifying
    //  cut/copied LaTeX)
    if (this.options.statelessClipboard) {
      if (text.slice(0, 1) === '$' && text.slice(-1) === '$') {
        text = text.slice(1, -1);
      } else {
        text = '\\text{' + text + '}';
      }
    }
    // FIXME: this always inserts math or a TextBlock, even in a RootTextBlock
    this.writeLatex(text).cursor.show();
  };
});
