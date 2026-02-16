/**
 * In-process build manager with single-flight by hash.
 * Same-hash requests join one active build; different hashes run in parallel.
 */

export class BuildManager<T> {
  private readonly activeByHash = new Map<string, Promise<T>>();

  async run(hash: string, runner: () => Promise<T>): Promise<T> {
    const existing = this.activeByHash.get(hash);
    if (existing) {
      return existing;
    }

    const task = runner().finally(() => {
      this.activeByHash.delete(hash);
    });

    this.activeByHash.set(hash, task);
    return task;
  }

  hasActive(hash: string): boolean {
    return this.activeByHash.has(hash);
  }
}
