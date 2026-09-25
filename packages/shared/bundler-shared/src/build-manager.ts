/**
 * In-process build manager. Requests with the same key join one active build; builds that share a
 * directory run one after another, since each installs into it and rewrites its metadata; builds
 * in different directories run in parallel.
 */

export class BuildManager<T> {
  private readonly activeByKey = new Map<string, Promise<T>>();
  private readonly lastByDirectory = new Map<string, Promise<T>>();

  async run(key: string, runner: () => Promise<T>, directory: string = key): Promise<T> {
    const existing = this.activeByKey.get(key);
    if (existing) {
      return existing;
    }

    const previous = this.lastByDirectory.get(directory);
    const task: Promise<T> = (previous ? previous.then(runner, runner) : runner()).finally(() => {
      this.activeByKey.delete(key);
      if (this.lastByDirectory.get(directory) === task) {
        this.lastByDirectory.delete(directory);
      }
    });

    this.activeByKey.set(key, task);
    this.lastByDirectory.set(directory, task);
    return task;
  }

  hasActive(key: string): boolean {
    return this.activeByKey.has(key);
  }
}
