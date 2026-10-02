// @ts-nocheck
// Locates an imageUploadNode by nodeKey. An upload resolves while the author keeps editing,
// so a position captured when it started can no longer be trusted.
export const findImageNodeByKey = (editor, nodeKey) => {
  if (!editor || !nodeKey) {
    return null;
  }

  let found = null;

  editor.state.doc.descendants((node, pos) => {
    if (found !== null) {
      return false;
    }

    if (node.type.name === 'imageUploadNode' && node.attrs.nodeKey === nodeKey) {
      found = [node, pos];
      return false;
    }
  });

  return found;
};

export const newImageNodeKey = () => `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default findImageNodeByKey;
