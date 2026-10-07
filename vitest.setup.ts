import '@testing-library/jest-dom/vitest';

// Pushing from a linked worktree runs this suite from pre-push with `GIT_DIR` naming that
// worktree's git directory, and a fixture's `git init` that inherits it sets `core.bare = true`
// in the real repository.
for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) {
  delete process.env[name];
}

// happy-dom answers `nodeName` from each node class and leaves `Node.prototype`'s getter returning
// '', while DOMPurify reads it through `Node.prototype` so a clobbered node cannot lie. Under
// happy-dom it then sees every element as nameless and drops it; dispatching the base getter to the
// node's own class gives DOMPurify what a browser does.
//
// That is enough for components to render sanitized model HTML. Tests of the sanitizer, and tests
// that assert sanitized markup exactly, run under jsdom: happy-dom parses MathML into the HTML namespace, where DOMPurify drops it; drops a fragment's
// leading no-break space; and its NodeIterator stops at a removed node, so DOMPurify leaves
// everything after the first removal unsanitized.
if (typeof Node !== 'undefined' && navigator.userAgent.includes('HappyDOM')) {
  const base = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeName');
  Object.defineProperty(Node.prototype, 'nodeName', {
    configurable: true,
    get(this: Node) {
      for (
        let proto = Object.getPrototypeOf(this);
        proto && proto !== Node.prototype;
        proto = Object.getPrototypeOf(proto)
      ) {
        const own = Object.getOwnPropertyDescriptor(proto, 'nodeName')?.get;
        if (own) return own.call(this);
      }
      return base?.get?.call(this);
    },
  });
}
