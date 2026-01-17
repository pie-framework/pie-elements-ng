import { describe, test, expect } from 'bun:test';
import path from 'node:path';
import { createVitePlugin } from '../src/adapters/vite.js';
import { createSvelteKitHandle } from '../src/adapters/sveltekit.js';
import { createConnectMiddleware } from '../src/adapters/connect.js';

describe('Adapter Integration Tests', () => {
  // Determine repo root (apps/local-esm-cdn/test -> repo root)
  const repoRoot = path.resolve(import.meta.dir, '..', '..', '..');

  const testConfig = {
    repoRoot,
    esmShBaseUrl: 'https://esm.sh',
  };

  describe('Vite Adapter', () => {
    test('returns a valid Vite plugin', () => {
      const plugin = createVitePlugin(testConfig);

      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('vite-plugin-local-esm-cdn');
      expect(plugin.configureServer).toBeFunction();
    });

    test('plugin has proper structure', () => {
      const plugin = createVitePlugin(testConfig);

      expect(typeof plugin.name).toBe('string');
      expect(typeof plugin.configureServer).toBe('function');
    });
  });

  describe('SvelteKit Adapter', () => {
    test('returns a valid SvelteKit handle function', () => {
      const handle = createSvelteKitHandle(testConfig);

      expect(handle).toBeFunction();
    });

    test('handle function accepts event and resolve', async () => {
      const handle = createSvelteKitHandle(testConfig);

      // Mock SvelteKit event for PIE package request
      const mockEvent = {
        request: new Request('http://localhost:5173/@pie-element/hotspot'),
        url: new URL('http://localhost:5173/@pie-element/hotspot'),
      };

      const mockResolve = async () => new Response('fallback');

      const response = await handle({
        event: mockEvent as any,
        resolve: mockResolve,
      });

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/javascript');
    });

    test('passes through non-PIE requests to resolve', async () => {
      const handle = createSvelteKitHandle(testConfig);

      // Mock SvelteKit event for non-PIE request
      const mockEvent = {
        request: new Request('http://localhost:5173/some/other/route'),
        url: new URL('http://localhost:5173/some/other/route'),
      };

      let resolveCalled = false;
      const mockResolve = async () => {
        resolveCalled = true;
        return new Response('resolved');
      };

      await handle({
        event: mockEvent as any,
        resolve: mockResolve,
      });

      expect(resolveCalled).toBe(true);
    });
  });

  describe('Connect/Express Adapter', () => {
    test('returns a valid middleware function', () => {
      const middleware = createConnectMiddleware(testConfig);

      expect(middleware).toBeFunction();
      expect(middleware.length).toBe(3); // (req, res, next)
    });

    test('middleware calls next for non-PIE requests', (done) => {
      const middleware = createConnectMiddleware(testConfig);

      // Mock request/response for non-PIE route
      const mockReq = {
        url: '/some/other/route',
        method: 'GET',
        headers: { host: 'localhost:3000' },
        socket: {},
      };

      const mockRes = {};

      const mockNext = () => {
        // Next was called, test passes
        done();
      };

      middleware(mockReq as any, mockRes as any, mockNext);
    });

    test('middleware handles PIE package requests', (done) => {
      const middleware = createConnectMiddleware(testConfig);

      // Mock request/response for PIE package
      const mockReq = {
        url: '/@pie-element/hotspot',
        method: 'GET',
        headers: { host: 'localhost:3000' },
        socket: {},
      };

      let statusCode = 0;
      const headers: Record<string, string> = {};
      let responseBody = '';

      const mockRes = {
        set statusCode(code: number) {
          statusCode = code;
        },
        get statusCode() {
          return statusCode;
        },
        setHeader(key: string, value: string) {
          headers[key] = value;
        },
        end(body?: string) {
          if (body) responseBody = body;
          // Response completed
          expect(statusCode).toBe(200);
          expect(headers['content-type']).toContain('application/javascript');
          expect(headers['access-control-allow-origin']).toBe('*');
          done();
        },
      };

      const mockNext = (err?: any) => {
        if (err) {
          done(err);
        }
      };

      middleware(mockReq as any, mockRes as any, mockNext);
    });
  });

  describe('Adapter Configuration', () => {
    test('all adapters accept partial config', () => {
      const partialConfig = { repoRoot: '/test/path' };

      expect(() => createVitePlugin(partialConfig)).not.toThrow();
      expect(() => createSvelteKitHandle(partialConfig)).not.toThrow();
      expect(() => createConnectMiddleware(partialConfig)).not.toThrow();
    });

    test('all adapters work with minimal config', () => {
      const minimalConfig = {};

      expect(() => createVitePlugin(minimalConfig)).not.toThrow();
      expect(() => createSvelteKitHandle(minimalConfig)).not.toThrow();
      expect(() => createConnectMiddleware(minimalConfig)).not.toThrow();
    });
  });
});
