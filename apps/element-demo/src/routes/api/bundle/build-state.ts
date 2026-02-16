import type {
  BuildProgressEvent,
  BuildRequest,
  BuildResult,
  BuildStage,
} from '@pie-element/bundler-shared';

export interface BuildSnapshot {
  buildId: string;
  hash: string;
  stage: BuildStage;
  done: boolean;
  success?: boolean;
  startedAt: number;
  updatedAt: number;
  result?: BuildResult;
  error?: string;
}

interface BuildRecord {
  snapshot: BuildSnapshot;
  events: BuildProgressEvent[];
  listeners: Set<(event: BuildProgressEvent) => void>;
  promise: Promise<BuildResult>;
}

const byBuildId = new Map<string, BuildRecord>();
const activeByHash = new Map<string, string>();
const MAX_EVENTS = 100;

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getBuildSnapshot(buildId: string): BuildSnapshot | null {
  return byBuildId.get(buildId)?.snapshot || null;
}

export function getBuildEvents(buildId: string): BuildProgressEvent[] {
  return byBuildId.get(buildId)?.events || [];
}

export function subscribeToBuild(
  buildId: string,
  listener: (event: BuildProgressEvent) => void
): () => void {
  const record = byBuildId.get(buildId);
  if (!record) {
    return () => {};
  }
  record.listeners.add(listener);
  return () => {
    record.listeners.delete(listener);
  };
}

export function createOrJoinBuild(
  buildKey: string,
  request: BuildRequest,
  hash: string,
  runner: (buildId: string, request: BuildRequest) => Promise<BuildResult>
): { buildId: string; joined: boolean; promise: Promise<BuildResult> } {
  const activeId = activeByHash.get(buildKey);
  if (activeId) {
    const activeRecord = byBuildId.get(activeId);
    if (activeRecord) {
      return { buildId: activeId, joined: true, promise: activeRecord.promise };
    }
    activeByHash.delete(buildKey);
  }

  const buildId = request.options?.buildId || randomId();
  const now = Date.now();
  const snapshot: BuildSnapshot = {
    buildId,
    hash,
    stage: 'queued',
    done: false,
    startedAt: now,
    updatedAt: now,
  };

  const record: BuildRecord = {
    snapshot,
    events: [],
    listeners: new Set(),
    promise: Promise.resolve({ success: false, hash, duration: 0, errors: ['not_started'] }),
  };
  byBuildId.set(buildId, record);
  activeByHash.set(buildKey, buildId);

  const runPromise = runner(buildId, request)
    .then((result) => {
      record.snapshot = {
        ...record.snapshot,
        stage: result.success ? 'completed' : 'failed',
        done: true,
        success: result.success,
        updatedAt: Date.now(),
        result,
        error: result.success ? undefined : result.errors?.join('\n') || 'build_failed',
      };
      return result;
    })
    .catch((error: any) => {
      const message = error?.message || String(error);
      const result: BuildResult = {
        success: false,
        hash,
        duration: Date.now() - record.snapshot.startedAt,
        errors: [message],
      };
      record.snapshot = {
        ...record.snapshot,
        stage: 'failed',
        done: true,
        success: false,
        updatedAt: Date.now(),
        result,
        error: message,
      };
      return result;
    })
    .finally(() => {
      activeByHash.delete(buildKey);
    });

  record.promise = runPromise;
  return { buildId, joined: false, promise: runPromise };
}

export function emitBuildEvent(buildId: string, event: BuildProgressEvent) {
  const record = byBuildId.get(buildId);
  if (!record) return;

  record.events.push(event);
  if (record.events.length > MAX_EVENTS) {
    record.events.splice(0, record.events.length - MAX_EVENTS);
  }
  record.snapshot = {
    ...record.snapshot,
    stage: event.stage,
    updatedAt: event.timestamp,
  };

  for (const listener of record.listeners) {
    listener(event);
  }
}
