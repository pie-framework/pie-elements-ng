import type { RequestHandler } from './$types';
import { getBuildEvents, getBuildSnapshot, subscribeToBuild } from '../build-state';

function toSseMessage(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
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
    return new Response(JSON.stringify({ error: 'buildId not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(toSseMessage({ type: 'snapshot', ...snapshot }));

      for (const event of getBuildEvents(buildId)) {
        controller.enqueue(toSseMessage({ type: 'progress', ...event }));
      }

      if (snapshot.done) {
        controller.enqueue(toSseMessage({ type: 'done', ...snapshot }));
        controller.close();
        return;
      }

      const unsubscribe = subscribeToBuild(buildId, (event) => {
        controller.enqueue(toSseMessage({ type: 'progress', ...event }));
        if (event.stage === 'completed' || event.stage === 'failed') {
          const latest = getBuildSnapshot(buildId);
          if (latest) {
            controller.enqueue(toSseMessage({ type: 'done', ...latest }));
          }
          unsubscribe();
          controller.close();
        }
      });
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
