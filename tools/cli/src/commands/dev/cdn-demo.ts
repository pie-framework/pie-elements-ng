import { Args, Command, Flags } from '@oclif/core';
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Start a simple CDN demo that loads PIE elements from unpkg/jsdelivr.
 *
 * This command demonstrates that element players work in production with
 * zero local dependencies - just load from CDN and render.
 *
 * IMPORTANT: This command loads elements from dist/index.js (ESM format).
 * Works with pie-elements-ng packages that build ESM to dist/index.js.
 *
 * Usage:
 *   bun cli dev:cdn-demo multiple-choice
 *   bun cli dev:cdn-demo multiple-choice --cdn jsdelivr
 *   bun cli dev:cdn-demo hotspot --version 11.4.3
 *   bun cli dev:cdn-demo multiple-choice --port 3001 --open
 */
export default class DevCdnDemo extends Command {
  static override description = 'Load PIE elements from CDN using CommonJS player';

  static override examples = [
    '<%= config.bin %> <%= command.id %> multiple-choice',
    '<%= config.bin %> <%= command.id %> multiple-choice --cdn jsdelivr',
    '<%= config.bin %> <%= command.id %> hotspot --version 11.4.3',
    '<%= config.bin %> <%= command.id %> multiple-choice --port 3001 --no-open',
  ];

  static override flags = {
    port: Flags.integer({
      char: 'p',
      description: 'HTTP server port',
      default: 3000,
    }),
    'base-url': Flags.string({
      char: 'b',
      description: 'Base URL for loading elements (e.g., http://localhost:5179/@pie-element)',
      required: true,
    }),
    open: Flags.boolean({
      char: 'o',
      description: 'Open browser automatically',
      default: false,
      allowNo: false,
    }),
    version: Flags.string({
      char: 'v',
      description: 'Element version (for CDN URLs)',
      default: 'latest',
    }),
  };

  static override args = {
    element: Args.string({
      required: true,
      description: 'Element name (e.g., multiple-choice, hotspot)',
    }),
  };

  private server: Server | null = null;

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(DevCdnDemo);

    this.log('');
    this.log('🌐 Starting demo server...');
    this.log(`📦 Element: ${args.element}`);
    this.log(`🔗 Base URL: ${flags['base-url']}`);
    this.log(`📍 Version: ${flags.version}`);
    this.log(`🌐 URL: http://localhost:${flags.port}`);
    this.log('');

    try {
      // Get model and session data
      const { model, session } = this.getModelData(args.element);

      // Player is always loaded locally
      const playerUrl = '/pie-element-player.js';

      // Generate HTML
      const html = this.generateHtml(
        args.element,
        playerUrl,
        flags['base-url'],
        'custom',
        flags.version,
        model,
        session
      );

      // Start server
      this.server = this.startServer(html, flags.port);

      this.log(`✅ Demo server running at http://localhost:${flags.port}`);
      this.log(`📦 Element player: Local build`);
      this.log(`🔗 Element base URL: ${flags['base-url']}`);
      this.log('');

      // Open browser
      if (flags.open) {
        const url = `http://localhost:${flags.port}`;
        this.log('🌐 Opening browser...');
        await this.openBrowser(url);
        this.log('✅ Browser opened');
        this.log('');
      }

      this.log('Press Ctrl+C to stop the server');

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        this.log('\nShutting down...');
        this.cleanup();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        this.cleanup();
        process.exit(0);
      });

      // Keep process alive
      await new Promise(() => {});
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  private getModelData(element: string): { model: any; session: any } {
    // Try to load from ../pie-elements
    const pieElementsPath = join(
      process.cwd(),
      '../pie-elements/packages',
      element,
      'docs/demo/generate.js'
    );

    if (existsSync(pieElementsPath)) {
      try {
        // Use createRequire to load CommonJS module from ESM context
        const { createRequire } = require('node:module');
        const requireFunc = createRequire(__filename);
        const generate = requireFunc(pieElementsPath);
        const model = generate.model('1', element);
        return {
          model,
          session: { id: '1', element },
        };
      } catch (error) {
        throw new Error(`Could not load model from ${pieElementsPath}: ${error}`);
      }
    }

    throw new Error(
      `Demo model not found at ${pieElementsPath}. Ensure upstream demo data exists before running dev:cdn-demo.`
    );
  }

  private generateHtml(
    elementName: string,
    playerUrl: string,
    elementBaseUrl: string,
    cdnDisplay: string,
    version: string,
    model: any,
    session: any
  ): string {
    const elementTitle = elementName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CDN Demo: ${elementName}</title>
  <style>
    body {
      margin: 0;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f5f5;
    }
    h1 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.75rem;
    }
    .container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      max-width: 900px;
      margin: 0 auto;
    }
    .info {
      background: #e3f2fd;
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      line-height: 1.6;
    }
    .info strong {
      color: #1976d2;
    }
    .info code {
      background: #fff;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Monaco', 'Courier New', monospace;
      font-size: 0.85rem;
    }
    .element-container {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: #fafafa;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌐 CDN Demo: ${elementTitle}</h1>

    <div class="info">
      <strong>Element player:</strong> <code>Local build</code><br>
      <strong>Element CDN:</strong> <code>${cdnDisplay}</code><br>
      <strong>Element version:</strong> <code>${version}</code><br>
      <strong>Element base URL:</strong><br>
      <code>${elementBaseUrl}</code>
    </div>

    <div class="element-container">
      <pie-commonjs-element-player
        id="player"
        element-name="${elementName}"
        base-url="${elementBaseUrl}"
        version="${version}"
      ></pie-commonjs-element-player>
    </div>
  </div>

  <!-- Load element player from CDN -->
  <script type="module" src="${playerUrl}"></script>

  <!-- Initialize demo -->
  <script type="module">
    const player = document.getElementById('player');

    // Set model and session
    player.model = ${JSON.stringify(model, null, 2)};
    player.session = ${JSON.stringify(session, null, 2)};

    // Listen for session changes
    player.addEventListener('session-changed', (e) => {
      console.log('Session changed:', e.detail);
    });

    console.log('CDN demo initialized');
    console.log('Model:', player.model);
    console.log('Session:', player.session);
  </script>
</body>
</html>`;
  }

  private startServer(html: string, port: number): Server {
    const server = createServer((req, res) => {
      // Serve element-player bundle
      if (req.url === '/pie-element-player.js') {
        const playerPath = join(
          process.cwd(),
          'packages/shared/element-player/dist/pie-element-player.js'
        );

        if (existsSync(playerPath)) {
          const content = readFileSync(playerPath, 'utf-8');
          res.writeHead(200, {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache',
          });
          res.end(content);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end(
            'Element player not found. Run: bun run turbo build --filter @pie-element/element-player'
          );
        }
        return;
      }

      // Serve HTML for all other requests
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      });
      res.end(html);
    });

    server.listen(port);

    return server;
  }

  private async openBrowser(url: string): Promise<void> {
    try {
      const open = await import('open');
      await open.default(url);
    } catch (error) {
      this.warn(`Could not open browser: ${error}`);
      this.log(`Please open ${url} manually`);
    }
  }

  private cleanup(): void {
    if (this.server) {
      try {
        this.server.close();
      } catch (error) {
        // Ignore errors during cleanup
      }
      this.server = null;
    }
  }
}
