#!/usr/bin/env node
/**
 * Simple static file server for demos
 * Serves built bundles without any transformation for production-like behavior
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 5174;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function serveFile(res, filePath) {
  try {
    const content = await readFile(filePath);
    const mimeType = getMimeType(filePath);
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': 'no-cache',
    });
    res.end(content);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    console.error(`Error reading ${filePath}:`, err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
    return true;
  }
}

function createStaticServer(rootDir) {
  const packagesRoot = resolve(rootDir, '../..');

  return createServer(async (req, res) => {
    let url = req.url;

    // Remove query string
    const queryIndex = url.indexOf('?');
    if (queryIndex !== -1) {
      url = url.substring(0, queryIndex);
    }

    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${url}`);

    // Handle root -> index.html redirect
    if (url === '/') {
      url = '/index.html';
    }

    // Handle /iife and /esm routes (SPA-style routing)
    if (url === '/iife') {
      url = '/iife.html';
    } else if (url === '/esm') {
      url = '/esm.html';
    }

    // Try to serve from demo directory first
    const demoPath = resolve(rootDir, url.substring(1));
    if (await serveFile(res, demoPath)) {
      return;
    }

    // Handle paths starting with /packages/ - serve from workspace root
    if (url.startsWith('/packages/')) {
      const absolutePath = resolve(packagesRoot, url.substring(10)); // Remove '/packages/'
      if (await serveFile(res, absolutePath)) {
        return;
      }
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });
}

export function startServer(demoDir) {
  const server = createStaticServer(demoDir);

  server.listen(PORT, () => {
    console.log(`\n✅ Static demo server running`);
    console.log(`📁 Serving: ${demoDir}`);
    console.log(`🌐 Local:   http://localhost:${PORT}`);
    console.log(`\nPress Ctrl+C to stop\n`);
  });

  // Handle errors
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use`);
      console.error('Please stop the other server or use a different port\n');
      process.exit(1);
    } else {
      console.error(`\n❌ Server error:`, err);
      process.exit(1);
    }
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down server...');
    server.close(() => {
      console.log('✅ Server stopped');
      process.exit(0);
    });
  });

  return server;
}

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const demoDir = process.argv[2];
  if (!demoDir) {
    console.error('Usage: node static-demo-server.js <demo-directory>');
    process.exit(1);
  }
  startServer(resolve(process.cwd(), demoDir));
}
