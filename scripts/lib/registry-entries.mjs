const REGISTRY = 'https://registry.npmjs.org';

async function fetchEntry({ name, version }, registry, fetchImpl) {
  try {
    const response = await fetchImpl(`${registry}/${name.replace('/', '%2F')}`);
    const entry = (await response.json())?.versions?.[version];
    return entry ? { entry } : { reason: 'not on the registry at this version' };
  } catch (error) {
    return { reason: `registry fetch failed: ${error.message}` };
  }
}

/**
 * The registry entry of each `{ name, version }` target, keyed `name@version`: `{ entry }`, or
 * `{ reason }` when it could not be read. npm answers 404 for a freshly published version for
 * minutes (25 of 30 on release run 36261828664), so with `retryMs` set, missing targets are
 * fetched again with backoff until that budget is spent.
 */
export async function fetchRegistryEntries(
  targets,
  {
    registry = REGISTRY,
    fetchImpl = fetch,
    retryMs = 0,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now = Date.now,
    log = console.log,
  } = {}
) {
  const results = new Map();
  const deadline = now() + retryMs;
  let pending = targets;
  for (let delay = 5_000; ; delay = Math.min(delay * 2, 60_000)) {
    const missing = [];
    for (const target of pending) {
      const result = await fetchEntry(target, registry, fetchImpl);
      results.set(`${target.name}@${target.version}`, result);
      if (!result.entry) missing.push(target);
    }
    pending = missing;
    if (pending.length === 0) return results;
    if (now() + delay > deadline) {
      if (retryMs > 0) {
        for (const { name, version } of pending) {
          const result = results.get(`${name}@${version}`);
          result.reason = `${result.reason} (still missing after ${Math.round(retryMs / 1000)}s)`;
        }
      }
      return results;
    }
    log(
      `[check-provenance] ${pending.length} version(s) not readable yet; retrying in ${delay / 1000}s`
    );
    await sleep(delay);
  }
}
