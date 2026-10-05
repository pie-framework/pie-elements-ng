/**
 * Which changed paths are documentation, and what CI and the pre-push gate run for a change.
 *
 * One definition for CI (scripts/ci-change-scope.mjs) and the pre-push hook
 * (scripts/pre-push-gate.mjs). A path counts as documentation when nothing but the `lint` job
 * reads it — biome checks its JSON, `verify:no-local-paths` its text — so a change made of such
 * paths cannot fail the build, the tests or the dependency check:
 *
 * - Everything under `docs/` except the files a test reads.
 * - Markdown at the repository root.
 * - Everything under `.claude/` and `.agents/`.
 *
 * Package READMEs are not documentation here: the element docs build reads them. `.changeset/` is
 * release input.
 */

const ROOT_MARKDOWN = /^[^/]+\.md$/i;
const DOCUMENTATION_DIRS = ['docs/', '.claude/', '.agents/'];
/** Read by tools/cli/tests/element-contracts.test.ts. */
const TESTED_DOCS = new Set(['docs/PIE_ELEMENT_CONTRACT.md']);

/** @param {string} path A repository-relative path with forward slashes. */
export function isDocumentationPath(path) {
  if (TESTED_DOCS.has(path)) return false;
  return ROOT_MARKDOWN.test(path) || DOCUMENTATION_DIRS.some((dir) => path.startsWith(dir));
}

/**
 * An empty list is not documentation-only: a change whose paths could not be listed, or that has
 * none, gets the full gate.
 *
 * @param {readonly string[]} paths
 */
export function isDocumentationOnly(paths) {
  return paths.length > 0 && paths.every(isDocumentationPath);
}

/**
 * The CI jobs to skip for one workflow run. Each flag is a skip, so a value CI could not compute
 * reads as "run".
 *
 * @param {object} args
 * @param {boolean} args.skipHeavy A release pull request, or one opted out of heavy CI.
 * @param {readonly string[] | null} args.changedPaths The run's changed paths, or null when they
 *   could not be listed.
 * @returns {{skipCode: boolean, skipLint: boolean}}
 */
export function ciScope({ skipHeavy, changedPaths }) {
  const docsOnly = changedPaths !== null && isDocumentationOnly(changedPaths);
  return { skipCode: skipHeavy || docsOnly, skipLint: skipHeavy };
}

/** git's sentinel for "this ref does not exist", used for branch creation and deletion. */
const isZeroSha = (sha) => /^0+$/.test(sha);

/**
 * Whether the pre-push gate runs for the refs git hands the hook on stdin, one
 * `<local ref> <local sha> <remote ref> <remote sha>` line each. It skips when the push adds no
 * commits, or when every path its new commits touch is documentation. Every uncertain case runs:
 * an unreadable stdin, a malformed line, a ref whose commits could not be listed.
 *
 * @param {object} args
 * @param {string | null} args.stdin
 * @param {(refUpdate: {localSha: string, remoteSha: string}) => {commits: number, paths: string[]} | null}
 *   args.listNewCommits The commits this ref update adds to the remote and every path they touch,
 *   or null when git could not list them. Injected so the decision stays free of git.
 * @returns {{verdict: 'run' | 'skip', reason: string}}
 */
export function classifyPush({ stdin, listNewCommits }) {
  const lines = (typeof stdin === 'string' ? stdin : '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return { verdict: 'run', reason: 'no ref information was available on stdin' };
  }

  let commits = 0;
  const paths = [];
  for (const line of lines) {
    const fields = line.split(/\s+/);
    if (fields.length !== 4) {
      return { verdict: 'run', reason: `could not parse the pushed refs from stdin: "${line}"` };
    }
    const [, localSha, , remoteSha] = fields;
    // Deleting a remote ref carries no content to validate.
    if (isZeroSha(localSha)) continue;

    const added = listNewCommits({ localSha, remoteSha });
    if (!added || !Number.isInteger(added.commits) || !Array.isArray(added.paths)) {
      return { verdict: 'run', reason: `could not list the commits ${localSha.slice(0, 9)} adds` };
    }
    commits += added.commits;
    paths.push(...added.paths);
  }

  if (commits === 0) {
    return { verdict: 'skip', reason: 'the push adds no commits the remote lacks' };
  }
  if (isDocumentationOnly(paths)) {
    return {
      verdict: 'skip',
      reason: `the ${commits} commit(s) being pushed change documentation only`,
    };
  }
  return { verdict: 'run', reason: `${commits} commit(s) are being pushed` };
}
