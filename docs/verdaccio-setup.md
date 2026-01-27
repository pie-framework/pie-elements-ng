# Local Package Registry (Verdaccio)

This project uses [Verdaccio](https://verdaccio.org/) as a local npm registry for testing package publishing and ESM module resolution before deploying to the real npm registry.

## Why Verdaccio?

- **Production validation**: Test that packages work exactly as they would on npm/CDN
- **ESM readiness**: Verify that built packages are truly ESM-compatible
- **Fast iteration**: Publish and test locally without hitting external services
- **Debugging**: Inspect package contents and resolution behavior

## Quick Start

### 1. Start the Registry

```bash
npm run registry:start
```

This starts Verdaccio in a Docker container on `http://localhost:4873`.

### 2. Build and Publish Packages

```bash
npm run registry:publish
```

This builds all packages and publishes them to the local registry.

### 3. View Packages

Open http://localhost:4873 in your browser to see all published packages.

### 4. Test with Demos

The demo HTML files should use import maps pointing to the local registry:

```html
<script type="importmap">
{
  "imports": {
    "@pie-element/multiple-choice": "http://localhost:4873/@pie-element/multiple-choice/0.1.0/dist/index.js",
    "@pie-lib/config-ui": "http://localhost:4873/@pie-lib/config-ui/0.1.0/dist/index.js"
  }
}
</script>
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run registry:start` | Start Verdaccio container |
| `npm run registry:stop` | Stop Verdaccio container |
| `npm run registry:logs` | View Verdaccio logs |
| `npm run registry:reset` | Reset registry (clears all packages) |
| `npm run registry:publish` | Build and publish all packages |
| `npm run registry:publish:force` | Force publish (overwrites existing versions) |

## Common Workflows

### Initial Setup

```bash
# Start the registry
npm run registry:start

# Publish all packages
npm run registry:publish
```

### After Making Changes

```bash
# Option 1: Update version numbers and publish
npm run changeset
npm run version
npm run registry:publish

# Option 2: Force publish with same version (for testing)
npm run registry:publish:force
```

### Debugging Package Issues

```bash
# View logs
npm run registry:logs

# Reset and republish
npm run registry:reset
npm run registry:publish
```

### Clean Slate

```bash
# Stop and remove all data
npm run registry:reset
```

## Verdaccio Storage

Package data is stored in Docker volumes:
- `pie-elements-verdaccio-storage`: Published package tarballs
- `pie-elements-verdaccio-conf`: Verdaccio configuration
- `pie-elements-verdaccio-plugins`: Verdaccio plugins

To completely remove all data:

```bash
docker compose down -v
```

## Troubleshooting

### Port Already in Use

If port 4873 is already in use:

```bash
# Find what's using the port
lsof -i :4873

# Stop the conflicting service or change the port in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker compose logs verdaccio

# Rebuild
docker compose down
docker compose up -d verdaccio
```

### Published Package Not Found

```bash
# Verify package was published
curl http://localhost:4873/@pie-element/multiple-choice

# Check storage
docker volume inspect pie-elements-verdaccio-storage
```

### Import Maps Not Working

1. Ensure the URL format is correct: `http://localhost:4873/PACKAGE/VERSION/dist/index.js`
2. Check browser console for 404 errors
3. Verify package.json exports field matches the requested path
4. Test the URL directly: `curl http://localhost:4873/@pie-element/multiple-choice/0.1.0/dist/index.js`

## Integration with CI/CD

For GitHub Actions or other CI systems:

```yaml
- name: Start Verdaccio
  run: npm run registry:start

- name: Publish packages
  run: npm run registry:publish

- name: Run E2E tests
  run: npm run test:demos
```

## Related Documentation

- [Verdaccio Official Docs](https://verdaccio.org/docs/what-is-verdaccio)
- [npm publish documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [Import Maps Specification](https://github.com/WICG/import-maps)
