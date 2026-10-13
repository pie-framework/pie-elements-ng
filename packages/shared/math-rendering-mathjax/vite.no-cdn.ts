/**
 * Fails a build whose output names a CDN host. MathJax's files load from the asset root, which
 * the page or the module's own URL decides (`src/assets.ts`).
 */
import type { Plugin } from 'vite';

const CDN_HOSTS = [
  'cdn.jsdelivr.net',
  'unpkg.com',
  'esm.sh',
  'esm.run',
  'cdnjs.cloudflare.com',
  'jspm.io',
  'skypack.dev',
];

export function noCdnHosts(): Plugin {
  return {
    name: 'pie-no-cdn-hosts',
    generateBundle(_options, bundle) {
      for (const [file, output] of Object.entries(bundle)) {
        const code = output.type === 'chunk' ? output.code : String(output.source);
        const host = CDN_HOSTS.find((name) => code.includes(name));
        if (host) this.error(`${file} names the CDN host ${host}`);
      }
    },
  };
}
