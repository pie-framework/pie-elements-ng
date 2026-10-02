---
'@pie-element/element-bundler': patch
---

Exports `findWorkspacePackages` and `workspaceDependencyClosure`, which give the workspace packages a `workspace-fast` build of given elements reads, so a caller can key its bundle cache on them.
