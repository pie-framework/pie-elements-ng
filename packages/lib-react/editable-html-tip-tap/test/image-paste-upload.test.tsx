import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tiptap/core', () => ({
  Node: { create: (config: any) => config },
  mergeAttributes: (...args: any[]) => Object.assign({}, ...args),
}));

vi.mock('@tiptap/pm/state', () => ({
  Plugin: vi.fn(function MockPlugin(this: any, spec: any) {
    this.spec = spec;
  }),
}));

vi.mock('@tiptap/react', () => ({
  ReactNodeViewRenderer: (component: any) => component,
  NodeViewWrapper: () => null,
}));

vi.mock('../src/extensions/image-component.js', () => ({ default: () => null }));

import { Plugin } from '@tiptap/pm/state';
import { ImageUploadNode } from '../src/extensions/image';
import { findImageNodeByKey } from '../src/components/image/findImageNode';

const DATA_URL = 'data:image/png;base64,Zm9v';

/**
 * A stand-in for the pieces of a Tiptap editor the paste plugin touches: a flat document whose
 * node positions are array indices, plus the transaction/dispatch pair used to write attributes.
 */
function createEditor() {
  const nodes: any[] = [];

  const makeTr = () => {
    const ops: any[] = [];
    const tr: any = {
      ops,
      setNodeMarkup(pos: number, _type: unknown, attrs: any) {
        ops.push({ kind: 'setNodeMarkup', pos, attrs });
        return tr;
      },
      delete(from: number, to: number) {
        ops.push({ kind: 'delete', from, to });
        return tr;
      },
    };
    return tr;
  };

  const editor: any = {
    commands: {
      insertContent: vi.fn((content: any) => {
        nodes.push({
          type: { name: content.type },
          attrs: { ...content.attrs },
          nodeSize: 1,
        });
      }),
    },
    state: {
      get tr() {
        return makeTr();
      },
      doc: {
        descendants(fn: (node: any, pos: number) => boolean | void) {
          for (let pos = 0; pos < nodes.length; pos += 1) {
            if (fn(nodes[pos], pos) === false) {
              return;
            }
          }
        },
        nodeAt(pos: number) {
          return nodes[pos] || null;
        },
      },
    },
    view: {
      dispatch: vi.fn((tr: any) => {
        tr.ops.forEach((op: any) => {
          if (op.kind === 'setNodeMarkup' && nodes[op.pos]) {
            nodes[op.pos].attrs = { ...nodes[op.pos].attrs, ...op.attrs };
          }
          if (op.kind === 'delete') {
            nodes.splice(op.from, op.to - op.from);
          }
        });
      }),
    },
    nodes,
  };

  return editor;
}

function setupPastePlugin(options?: any) {
  const editor = createEditor();

  (Plugin as any).mockClear();

  const plugins = ImageUploadNode.addProseMirrorPlugins.call({ editor, options });

  expect(plugins).toHaveLength(1);
  expect(Plugin).toHaveBeenCalledTimes(1);

  return { editor, handlePaste: (Plugin as any).mock.calls[0][0].props.handlePaste };
}

function clipboardWith(file: File | null) {
  return {
    clipboardData: {
      items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
    },
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('ImageUploadNode paste handling', () => {
  let file: File;

  beforeEach(() => {
    file = new File([new Uint8Array([1, 2, 3])], 'pasted.png', { type: 'image/png' });

    vi.stubGlobal(
      'FileReader',
      class {
        result: string | null = null;
        onload: (() => void) | null = null;
        readAsDataURL() {
          this.result = DATA_URL;
          setTimeout(() => this.onload?.(), 0);
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('clipboard content that is not an image', () => {
    it('ignores a clipboard with no image file', () => {
      const { handlePaste } = setupPastePlugin();

      expect(
        handlePaste({}, { clipboardData: { items: [{ kind: 'string', type: 'text/plain' }] } }),
      ).toBe(false);
    });

    it('ignores an event with no clipboardData', () => {
      const { handlePaste } = setupPastePlugin();

      expect(handlePaste({}, {})).toBe(false);
    });

    it('ignores an image item that yields no file', () => {
      const { handlePaste } = setupPastePlugin();

      expect(handlePaste({}, clipboardWith(null))).toBe(false);
    });
  });

  describe('with no upload host configured', () => {
    it('inlines the data URL and marks the node loaded', async () => {
      const { editor, handlePaste } = setupPastePlugin({ imageHandling: {} });

      expect(handlePaste({}, clipboardWith(file))).toBe(true);
      await flush();

      expect(editor.commands.insertContent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageUploadNode',
          attrs: expect.objectContaining({ src: DATA_URL, loaded: true }),
        }),
      );
    });
  });

  describe('with an upload host configured', () => {
    const setup = () => {
      const insertImageRequested = vi.fn();
      const { editor, handlePaste } = setupPastePlugin({
        imageHandling: { insertImageRequested },
      });

      return { editor, handlePaste, insertImageRequested };
    };

    it('shows the data URL as an unloaded preview while the upload runs', async () => {
      const { editor, handlePaste } = setup();

      handlePaste({}, clipboardWith(file));
      await flush();

      expect(editor.commands.insertContent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'imageUploadNode',
          attrs: expect.objectContaining({ src: DATA_URL, loaded: false, nodeKey: expect.any(String) }),
        }),
      );
    });

    it('hands the pasted file to the host instead of leaving base64 in the document', async () => {
      const { editor, handlePaste, insertImageRequested } = setup();

      handlePaste({}, clipboardWith(file));
      await flush();

      expect(insertImageRequested).toHaveBeenCalledTimes(1);

      const [requestEditor, nodeInfo, getHandler] = insertImageRequested.mock.calls[0];

      expect(requestEditor).toBe(editor);
      expect(nodeInfo[0].attrs.nodeKey).toBe(editor.nodes[0].attrs.nodeKey);

      const handler = getHandler(vi.fn());

      // The two flags a host checks to upload a pasted file rather than opening a file picker.
      expect(handler.isPasted).toBe(true);
      expect(handler.getChosenFile()).toBe(file);
    });

    it('replaces the data URL with the uploaded src', async () => {
      const { editor, handlePaste, insertImageRequested } = setup();

      handlePaste({}, clipboardWith(file));
      await flush();

      const onFinish = vi.fn();
      const handler = insertImageRequested.mock.calls[0][2](onFinish);

      handler.done(null, 'https://cdn.example.com/pasted.png');

      expect(editor.nodes[0].attrs).toMatchObject({
        src: 'https://cdn.example.com/pasted.png',
        loaded: true,
        percent: 100,
      });
      expect(onFinish).toHaveBeenCalledWith(true);
    });

    it('writes the uploaded src to the right node after the document has shifted', async () => {
      const { editor, handlePaste, insertImageRequested } = setup();

      handlePaste({}, clipboardWith(file));
      await flush();

      const pastedKey = editor.nodes[0].attrs.nodeKey;
      const handler = insertImageRequested.mock.calls[0][2](vi.fn());

      // The author keeps typing while the upload is in flight - nothing blocks the editor for a
      // pasted image the way the file picker does for the toolbar button - so the position
      // captured when the upload started no longer points at the pasted node.
      editor.nodes.unshift({ type: { name: 'paragraph' }, attrs: {}, nodeSize: 1 });
      editor.nodes.unshift({
        type: { name: 'imageUploadNode' },
        attrs: { nodeKey: 'some-other-image', src: 'https://cdn.example.com/other.png' },
        nodeSize: 1,
      });

      handler.done(null, 'https://cdn.example.com/pasted.png');

      const pasted = editor.nodes.find((n: any) => n.attrs.nodeKey === pastedKey);

      expect(pasted.attrs.src).toBe('https://cdn.example.com/pasted.png');
      expect(editor.nodes[0].attrs.src).toBe('https://cdn.example.com/other.png');
    });

    it('leaves a visible image behind when the upload fails', async () => {
      const { editor, handlePaste, insertImageRequested } = setup();

      handlePaste({}, clipboardWith(file));
      await flush();

      const onFinish = vi.fn();
      const handler = insertImageRequested.mock.calls[0][2](onFinish);

      handler.done(new Error('upload failed'));

      expect(editor.nodes[0].attrs).toMatchObject({ src: DATA_URL, loaded: true });
      expect(onFinish).toHaveBeenCalledWith(false);
    });
  });
});

describe('findImageNodeByKey', () => {
  it('returns null for a missing editor or key', () => {
    expect(findImageNodeByKey(null, 'a')).toBeNull();
    expect(findImageNodeByKey(createEditor(), null)).toBeNull();
  });

  it('finds the image node carrying the key and ignores other node types', () => {
    const editor = createEditor();

    editor.nodes.push({ type: { name: 'paragraph' }, attrs: { nodeKey: 'a' }, nodeSize: 1 });
    editor.nodes.push({ type: { name: 'imageUploadNode' }, attrs: { nodeKey: 'a' }, nodeSize: 1 });

    expect(findImageNodeByKey(editor, 'a')?.[1]).toBe(1);
    expect(findImageNodeByKey(editor, 'missing')).toBeNull();
  });
});
