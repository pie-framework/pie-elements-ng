// @ts-nocheck
/**
 * @synced-from pie-elements/packages/select-text/configure/src/utils.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

var createElementFromHTML = function createElementFromHTML() {
  var htmlString = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div;
};

var parseParagraph = function parseParagraph(paragraph, end) {
  if (end) {
    return paragraph.innerHTML;
  }

  return ''.concat(paragraph.innerHTML, '\n\n');
};

var parseParagraphs = function parseParagraphs(dom) {
  var paragraphs = dom.querySelectorAll('div[separator=true]'); // separate variable for easily debugging, if needed

  var str = '';
  paragraphs.forEach(function (par, index) {
    str += parseParagraph(par, index === paragraphs.length - 1);
  });
  return str || null;
};

var prepareText = function prepareText(text) {
  var txtDom = createElementFromHTML(text);

  var div = document.createElement('div');
  div.innerHTML = "<div separator='true'>".concat(txtDom.innerHTML, '</div>');
  txtDom = div;

  var allDomElements = Array.from(txtDom.querySelectorAll('*'));

  if (allDomElements.length === 0) {
    return text;
  }

  return parseParagraphs(txtDom);
};

export const generateModel = (model) => {
  if (!model) return model;

  // parsing
  const modelText = prepareText(model.text || '');

  const newTokens = (model.tokens || []).reduce((acc, token = {}) => {
    const tokenText = prepareText((model.text || '').slice(token.start, token.end));

    if (!tokenText) {
      return [...acc, token];
    }

    const getStartIndex = (start) => {
      let length = start;

      while (length >= 0) {
        let newStartIndex = modelText.slice(length).indexOf(tokenText);

        if (newStartIndex >= 0) {
          return newStartIndex + length;
        }

        length--;
      }

      return 0;
    };

    const lastToken = acc[acc.length - 1];
    const newStart = getStartIndex(lastToken ? lastToken.end : token.start);
    const newEnd = newStart + tokenText.length;

    return [
      ...acc,
      {
        ...token,
        text: tokenText,
        start: newStart,
        end: newEnd,
        // needed for getScore when tokens position is recalculated
        oldStart: token.start,
        oldEnd: token.end,
      },
    ];
  }, []);

  return {
    ...model,
    tokens: newTokens,
    text: modelText,
  };
};

export const generateValidationMessage = (config) => {
  const { minTokens, maxTokens, maxSelections } = config;

  const tokensMessage =
    `\nThere should be at least ${minTokens} ` + (maxTokens ? `and at most ${maxTokens} ` : '') + 'tokens defined.';

  const selectionsMessage =
    '\nThere should be at least 1 ' +
    (maxSelections ? `and at most ${maxSelections} ` : '') +
    'token' +
    (maxSelections ? 's' : '') +
    ' selected.';

  const message = 'Validation requirements:' + tokensMessage + selectionsMessage;

  return message;
};
