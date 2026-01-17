#!/usr/bin/env bun
/**
 * Simple static HTTP server using Bun
 * Serves files from the workspace root on port 5174
 */

const PORT = 5174;
const ROOT_DIR = import.meta.dir + '/..';

const fetchHandler = async (req: Request) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Handle CORS for development
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  // Serve files from workspace root
  const filePath = ROOT_DIR + (pathname === '/' ? '/index.html' : pathname);
  const file = Bun.file(filePath);

  if (await file.exists()) {
    return new Response(file, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  return new Response('Not Found', { status: 404 });
};

let server: ReturnType<typeof Bun.serve>;
try {
  server = Bun.serve({ port: PORT, fetch: fetchHandler });
} catch (e: any) {
  const code = e?.code ?? e?.errno ?? e?.cause?.code;
  if (code === 'EADDRINUSE') {
    console.warn(`[http-server] Port ${PORT} is in use. Retrying with a random free port...`);
    server = Bun.serve({ port: 0, fetch: fetchHandler });
  } else {
    throw e;
  }
}

console.log(`[http-server] Serving files from: ${ROOT_DIR}`);
console.log(`[http-server] Listening on: http://localhost:${server.port}`);
