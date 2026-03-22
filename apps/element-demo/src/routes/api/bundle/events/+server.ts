import type { RequestHandler } from './$types';
import { getBuildEvents, getBuildSnapshot, subscribeToBuild } from '../build-state';

function toSseMessage(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function logBuildEvents(buildId: string, message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(`[api/bundle/events][${buildId}] ${message}`, data);
    return;
  }
  console.log(`[api/bundle/events][${buildId}] ${message}`);
}

export const GET: RequestHandler = async ({ url }) => {
  const buildId = url.searchParams.get('buildId');
  if (!buildId) {
    return new Response(JSON.stringify({ error: 'buildId parameter required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const snapshot = getBuildSnapshot(buildId);
  if (!snapshot) {
    logBuildEvents(buildId, 'connect failed: build not found');
    return new Response(JSON.stringify({ error: 'buildId not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  logBuildEvents(buildId, 'client connected', { stage: snapshot.stage, done: snapshot.done });
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(toSseMessage({ type: 'snapshot', ...snapshot }));

      const events = getBuildEvents(buildId);
      logBuildEvents(buildId, 'replaying buffered events', { count: events.length });
      for (const event of events) {
        controller.enqueue(toSseMessage({ type: 'progress', ...event }));
      }

      const afterReplaySnapshot = getBuildSnapshot(buildId);
      if (afterReplaySnapshot?.done) {
        controller.enqueue(toSseMessage({ type: 'done', ...afterReplaySnapshot }));
        logBuildEvents(buildId, 'stream closed after replay', {
          stage: afterReplaySnapshot.stage,
          success: afterReplaySnapshot.success,
        });
        controller.close();
        return;
      }

      const unsubscribe = subscribeToBuild(buildId, (event) => {
        controller.enqueue(toSseMessage({ type: 'progress', ...event }));
        if (event.stage === 'completed' || event.stage === 'failed') {
          const latest = getBuildSnapshot(buildId);
          if (latest) {
            controller.enqueue(toSseMessage({ type: 'done', ...latest }));
            logBuildEvents(buildId, 'stream closed after terminal event', {
              stage: latest.stage,
              success: latest.success,
            });
          }
          unsubscribe();
          controller.close();
        }
      });
    },
    cancel(reason) {
      logBuildEvents(buildId, 'client disconnected', { reason: String(reason ?? '') });
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
  });
};
