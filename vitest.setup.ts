import '@testing-library/jest-dom/vitest';

// Pushing from a linked worktree runs this suite from pre-push with `GIT_DIR` naming that
// worktree's git directory, and a fixture's `git init` that inherits it sets `core.bare = true`
// in the real repository.
for (const name of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR']) {
  delete process.env[name];
}
