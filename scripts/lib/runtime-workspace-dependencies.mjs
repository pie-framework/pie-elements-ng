const RUNTIME_DEPENDENCY_SECTIONS = ['dependencies', 'optionalDependencies'];

/**
 * The workspace packages that must be on npm before `pkg` is: its runtime dependencies, and the
 * editor runtime its editor-runtime variant loads at the version pie.browserEditorRuntime names.
 * `localVersions` maps each workspace package name to its manifest version.
 */
export function runtimeWorkspaceDependencies(pkg, localVersions) {
  const dependencies = [];
  for (const section of RUNTIME_DEPENDENCY_SECTIONS) {
    for (const [dependencyName, range] of Object.entries(pkg[section] ?? {})) {
      if (localVersions.has(dependencyName)) {
        dependencies.push({
          packageName: pkg.name,
          dependencyName,
          version: localVersions.get(dependencyName),
          section,
          range,
        });
      }
    }
  }
  const editorRuntime = pkg.pie?.browserEditorRuntime;
  if (typeof editorRuntime?.name === 'string' && localVersions.has(editorRuntime.name)) {
    dependencies.push({
      packageName: pkg.name,
      dependencyName: editorRuntime.name,
      version: editorRuntime.version,
      section: 'pie.browserEditorRuntime',
      range: editorRuntime.version,
    });
  }
  return dependencies;
}
