// @ts-nocheck
/**
 * @synced-from pie-lib/packages/text-select/src/tokenizer/selection-utils.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const clearSelection = () => {
  if (document.getSelection) {
    // for all new browsers (IE9+, Chrome, Firefox)
    document.getSelection().removeAllRanges();
    document.getSelection().addRange(document.createRange());
  } else if (window.getSelection) {
    // equals with the document.getSelection (MSDN info)
    if (window.getSelection().removeAllRanges) {
      // for all new browsers (IE9+, Chrome, Firefox)
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(document.createRange());
    } else if (window.getSelection().empty) {
      // Chrome supports this as well
      window.getSelection().empty();
    }
  } else if (document.selection) {
    // IE8-
    document.selection.empty();
  }
};

export const getCaretCharacterOffsetWithin = (element) => {
  var caretOffset = 0;
  var doc = element.ownerDocument || element.document;
  var win = doc.defaultView || doc.parentWindow;
  var sel;
  if (typeof win.getSelection !== 'undefined') {
    sel = win.getSelection();
    if (sel.rangeCount > 0) {
      var range = win.getSelection().getRangeAt(0);
      var selected = range.toString().length;
      var preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      if (selected) {
        caretOffset = preCaretRange.toString().length - selected;
      } else {
        caretOffset = preCaretRange.toString().length;
      }
    }
  } else if ((sel = doc.selection) && sel.type !== 'Control') {
    var textRange = sel.createRange();
    var preCaretTextRange = doc.body.createTextRange();
    preCaretTextRange.moveToElementText(element);
    preCaretTextRange.setEndPoint('EndToEnd', textRange);
    caretOffset = preCaretTextRange.text.length;
  }
  return caretOffset;
};
