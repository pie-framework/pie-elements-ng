# Publishing Workflow

This document describes the CI/CD publishing strategy for pie-element packages.

## Package Categories

### 1. Native Packages (Will be Published)

These packages are native to this project and will be automatically published to npm:

**Svelte Elements** (`packages/elements-svelte/*`):
- `@pie-element/media`
- `@pie-element/multiple-choice`
- `@pie-element/slider`
- `@pie-element/upload`

**Svelte Libraries** (`packages/lib-svelte/*`):
- `@pie-element/lib-a11y`
- `@pie-element/lib-config-ui`
- `@pie-element/lib-math`
- `@pie-element/lib-ui`

**Shared/Core Packages** (`packages/shared/*`, `packages/core`):
- `@pie-element/shared-types`
- `@pie-element/shared-utils`
- `@pie-element/shared-test-utils`
- All `*-controller` packages (32 controllers)
- `@pie-element/core`

**Total: ~39 packages will be published**

### 2. React Packages (NOT Published Yet)

These packages are copied from `../pie-elements` and `../pie-lib` and will **NOT** be automatically published during the transition period:

**React Elements** (`packages/elements-react/*`):
- `@pie-element/hotspot`
- `@pie-element/multiple-choice`
- `@pie-element/number-line`

**React Libraries** (`packages/lib-react/*`):
- 28 React library packages including:
  - `@pie-lib/render-ui`
  - `@pie-lib/editable-html`
  - `@pie-lib/math-rendering`
  - `@pie-lib/config-ui`
  - And 24 others

**Total: ~31 packages marked as private**

## Publishing Strategy

### Changesets Configuration

The [`.changeset/config.json`](../.changeset/config.json) file includes an `ignore` list that prevents version bumps for React packages:

```json
{
  "ignore": [
    "@pie-element/hotspot",
    "@pie-element/number-line",
    "@pie-element/multiple-choice",
    "@pie-lib/categorize",
    // ... all other React packages
  ]
}
```

### Package.json Configuration

All React packages have `"private": true` set in their `package.json`, which prevents them from being published to npm even if selected by changesets.

### Release Workflow

The GitHub Actions workflow at [`.github/workflows/release.yml`](../.github/workflows/release.yml) implements a sophisticated release strategy:

1. **Trigger Conditions**:
   - Pushes to `main` branch that include:
     - Changes to `.changeset/**`
     - Changes to `packages/**`
     - Changes to build configuration files
   - Manual workflow dispatch

2. **Release Detection**:
   - Checks for new changeset files
   - Detects version bump commits (merged release PRs)
   - Skips workflow if no relevant changes

3. **Publish Process**:
   - Only builds and tests when actually publishing
   - Uses `changesets/action@v1` for version management
   - Creates GitHub releases for published versions
   - Only publishes non-private packages

## Creating a Release

### 1. Making Changes

When you make changes to native packages (Svelte, Web Components, or Shared packages):

```bash
# After making your changes, create a changeset
bun run changeset
```

Follow the prompts to:
- Select which packages changed (only native packages will be versioned)
- Choose version bump type (major/minor/patch)
- Write a summary of changes

This creates a new file in `.changeset/` directory.

### 2. Commit and Push

```bash
git add .
git commit -m "feat: your feature description"
git push
```

### 3. Automated Release PR

The workflow will automatically:
1. Detect the changeset
2. Create a "Version Packages" PR with:
   - Updated version numbers in `package.json`
   - Generated `CHANGELOG.md` entries
   - Removal of changeset files

### 4. Publishing

When you merge the "Version Packages" PR:
1. Workflow builds all packages
2. Runs tests
3. Publishes changed packages to npm (excluding React packages)
4. Creates a GitHub release

## Manual Releases

You can trigger a release manually via GitHub Actions UI:

1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Select version type (auto/major/minor/patch)

## Transition Plan

Once this project achieves feature parity with the original pie-elements:

1. Remove React packages from `.changeset/config.json` ignore list
2. Remove `"private": true` from React package.json files
3. Coordinate with development team for migration
4. Begin publishing React packages

## Example Workflow

```bash
# 1. Make changes to a Svelte element
cd packages/elements-svelte/multiple-choice
# ... edit files ...

# 2. Create a changeset
bun run changeset
# Select: @pie-element/multiple-choice
# Type: patch
# Summary: "Fix answer validation logic"

# 3. Commit and push
git add .
git commit -m "fix(multiple-choice): correct answer validation"
git push

# 4. Wait for Version Packages PR
# 5. Review and merge PR
# 6. Package is automatically published to npm
```

## Troubleshooting

### Changeset Not Created

- Ensure you're using `bun run changeset` not `changeset` directly
- Check that you have changesets installed: `bun install`

### Release PR Not Created

- Verify the changeset file exists in `.changeset/`
- Check GitHub Actions logs for errors
- Ensure workflow has proper permissions

### Package Not Published

- Check if package is in the ignore list (`.changeset/config.json`)
- Verify package doesn't have `"private": true`
- Check NPM_TOKEN is configured in GitHub secrets
- Review GitHub Actions logs for errors

## Related Files

- [`.changeset/config.json`](../.changeset/config.json) - Changeset configuration
- [`.github/workflows/release.yml`](../.github/workflows/release.yml) - Release workflow
- [`package.json`](../package.json) - Root package scripts

## Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [pie-qti Release Workflow](https://github.com/pie-framework/pie-qti/blob/master/.github/workflows/release.yml) - Reference implementation
