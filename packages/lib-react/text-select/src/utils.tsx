// @ts-nocheck
/**
 * @synced-from pie-lib/packages/text-select/src/utils.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

const createElementFromHTML = (htmlString = '') => {
  const div = document.createElement('div');

  div.innerHTML = htmlString.trim();

  return div;
};

export const parseBrs = (dom) => {
  const brs = dom.querySelectorAll('br');

  brs.forEach((br) => br.replaceWith('\n'));

  dom.innerHTML = dom.innerHTML.replace(/\n\n/g, '\n');
};

export const parseParagraph = (paragraph, end) => {
  if (end) {
    return paragraph.innerHTML;
  }

  return `${paragraph.innerHTML}\n\n`;
};

export const parseParagraphs = (dom) => {
  const paragraphs = dom.querySelectorAll('p');
  // separate variable for easily debugging, if needed
  let str = '';

  paragraphs.forEach((par, index) => {
    str += parseParagraph(par, index === paragraphs.length - 1);
  });

  return str || null;
};

export const prepareText = (text) => {
  let txtDom = createElementFromHTML(text);
  const allDomElements = Array.from(txtDom.querySelectorAll('*'));

  if (txtDom.querySelectorAll('p').length === 0) {
    const div = document.createElement('div');

    div.innerHTML = `<p>${txtDom.innerHTML}</p>`;
    txtDom = div;
  }

  // if no dom elements, we just return the text
  if (allDomElements.length === 0) {
    return text;
  }

  parseBrs(txtDom);

  return parseParagraphs(txtDom);
};
