import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on images.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { EditableHtml } = await import('../src/components/EditableHtml');

const SRC = 'https://assets.pie-api.com/assets/a/image/jpeg/b';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function mountEditor(markup: string, props: Record<string, unknown> = {}) {
  let editor: any;
  const { container } = render(
    <EditableHtml
      markup={markup}
      onChange={vi.fn()}
      editorRef={(instance: any) => {
        editor = instance;
      }}
      {...props}
    />,
  );
  await waitFor(() => expect(editor?.view.dom.isConnected).toBe(true));

  return { editor, container };
}

const pictures = (editor: any) => {
  const found: any[] = [];
  editor.state.doc.descendants((node: any) => {
    if (node.type.name === 'imageUploadNode') found.push(node.attrs);
  });
  return found;
};

describe('images in saved markup', () => {
  it('loads a plain <img> as an editable, finished image keeping its size', async () => {
    const { editor } = await mountEditor(`<img src="${SRC}" width="364" height="364">`);

    const [image] = pictures(editor);

    expect(image).toMatchObject({ src: SRC, width: 364, height: 364, loaded: true });
    expect(image.nodeKey).toBeTruthy();
  });

  it('writes the marker back out, so the image round-trips', async () => {
    const { editor } = await mountEditor(`<img src="${SRC}" width="364" height="364">`);

    expect(editor.getHTML()).toContain('data-type="image-upload-node"');
  });

  it('loads a plain <img> inside a list item and a table cell', async () => {
    const { editor } = await mountEditor(
      `<ul><li><img src="${SRC}"></li></ul><table><tbody><tr><td><img src="${SRC}"></td></tr></tbody></table>`,
    );

    expect(pictures(editor)).toHaveLength(2);
  });

  it('still treats an <img> with a data URL as unfinished, so it is uploaded', async () => {
    const { editor } = await mountEditor(`<img src="${PNG}" data-type="image-upload-node">`);

    expect(pictures(editor)[0].loaded).toBe(false);
  });
});

describe('image size limits', () => {
  const load = async (naturalWidth: number, naturalHeight: number, props: Record<string, unknown>) => {
    const { editor, container } = await mountEditor(`<img src="${SRC}">`, props);
    const img = await waitFor(() => {
      const found = container.querySelector('img[draggable="false"]') as HTMLImageElement;
      expect(found).toBeTruthy();
      return found;
    });

    Object.defineProperty(img, 'naturalWidth', { value: naturalWidth });
    Object.defineProperty(img, 'naturalHeight', { value: naturalHeight });
    fireEvent.load(img);

    return { editor, img };
  };

  // The host's authoring configuration reaches the editor as maxImageWidth/maxImageHeight.
  it('shrinks an oversize image to the configured limits, keeping its aspect ratio', async () => {
    const { editor, img } = await load(800, 400, { maxImageWidth: 300, maxImageHeight: 300 });

    await waitFor(() => expect(pictures(editor)[0]).toMatchObject({ width: 300, height: 150 }));
    expect(img.style.width).toBe('300px');
  });

  it('limits by height when that is the tighter limit', async () => {
    const { editor } = await load(800, 800, { maxImageWidth: 900, maxImageHeight: 300 });

    await waitFor(() => expect(pictures(editor)[0]).toMatchObject({ width: 300, height: 300 }));
  });

  it('does not enlarge an image that already fits', async () => {
    const { editor } = await load(200, 100, { maxImageWidth: 300, maxImageHeight: 300 });

    await waitFor(() => expect(pictures(editor)[0]).toMatchObject({ width: 200, height: 100 }));
  });

  it('falls back to 700 x 900 when the host sets no limits', async () => {
    const { editor } = await load(1400, 1400, {});

    await waitFor(() => expect(pictures(editor)[0]).toMatchObject({ width: 700, height: 700 }));
  });
});
