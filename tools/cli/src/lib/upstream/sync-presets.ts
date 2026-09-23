import { join } from 'node:path';

export interface TextReplacement {
  from: string;
  to: string;
}

export interface PostSyncTextPatch {
  id: string;
  label: string;
  file: string;
  replacements: TextReplacement[];
}

export type PieLibSyncMode = 'full-sync' | 'wrapper';
export type PieLibVitePreset =
  | 'default'
  | 'math-rendering-wrapper'
  | 'test-utils'
  | 'editable-html-tip-tap';

/**
 * Central inventory for element/package-specific sync compatibility adaptations.
 *
 * Each entry gets a stable id so it can be referenced in docs/logs/tests without
 * coupling to implementation file names.
 */
export const PRESET_IDS = {
  testUtilsDeclarationStabilization: 'patch.test-utils.declaration-stabilization',
  graphingDomPropLeakGuard: 'patch.graphing.dom-prop-leak-guard',
  previewPromptPropTypesShape: 'patch.render-ui.preview-prompt-proptypes-shape',
  correctAnswerToggleStyleNormalization: 'patch.correct-answer-toggle.style-key-normalization',
  plotToolPropTypesCompatibility: 'patch.plot.tool-proptypes-compatibility',
  mathRenderingWrapperMode: 'mode.math-rendering.wrapper',
  preserveRenderUiInlineMenu: 'preserve.render-ui.inline-menu',
  depsGraphingDndKit: 'deps.graphing.dnd-kit-core',
  depsChartingD3Peers: 'deps.charting.d3-peers',
  depsMathRenderingOverride: 'deps.math-rendering.shared-adapter-only',
  viteMathRenderingWrapper: 'vite.math-rendering-wrapper',
  viteTestUtils: 'vite.test-utils',
  viteEditableHtmlTipTap: 'vite.editable-html-tip-tap',
  transformChartingUtilsTypeFix: 'transform.charting.utils-exported-function-types',
  transformTranslatorIndexTypeFix: 'transform.translator.index-type-annotations',
  transformRenderUiInlineMenuExport: 'transform.render-ui.inline-menu-export',
  transformTextSelectTokenTypesReexport: 'transform.text-select.token-types-reexport',
} as const;

export function getPostSyncTextPatches(projectRoot: string): PostSyncTextPatch[] {
  return [
    {
      id: PRESET_IDS.testUtilsDeclarationStabilization,
      label: '@pie-lib/test-utils declaration stabilization',
      file: join(projectRoot, 'packages/lib-react/test-utils/src/index.tsx'),
      replacements: [
        {
          from: "import { render } from '@testing-library/react';",
          to: "import { render, type RenderOptions, type RenderResult } from '@testing-library/react';",
        },
        {
          from: 'export function renderWithTheme(ui, options = {}) {',
          to: 'export function renderWithTheme(ui: React.ReactElement, options: RenderOptions & { theme?: unknown } = {}): RenderResult {',
        },
        {
          from: 'export function renderWithProviders(ui, options = {}) {',
          to: 'export function renderWithProviders(ui: React.ReactElement, options: RenderOptions & { theme?: unknown; providers?: React.ComponentType<{ children?: React.ReactNode }>[] } = {}): RenderResult {',
        },
      ],
    },
    {
      id: PRESET_IDS.graphingDomPropLeakGuard,
      label: '@pie-lib/graphing DOM prop leak guard',
      file: join(projectRoot, 'packages/lib-react/graphing/src/tools/shared/point/base-point.tsx'),
      replacements: [
        {
          from: '      onTouchEnd,\n      ...rest\n',
          to: '      onTouchEnd\n',
        },
        {
          from: '          <circle {...rest} r={r} cx={scale.x(x)} cy={scale.y(y)} />',
          to: '          <circle r={r} cx={scale.x(x)} cy={scale.y(y)} />',
        },
      ],
    },
    {
      id: PRESET_IDS.previewPromptPropTypesShape,
      label: '@pie-lib/render-ui PreviewPrompt PropTypes.shape',
      file: join(projectRoot, 'packages/lib-react/render-ui/src/preview-prompt.tsx'),
      replacements: [
        {
          from: '    customAudioButton: {\n      playImage: PropTypes.string,\n      pauseImage: PropTypes.string,\n    },',
          to: '    customAudioButton: PropTypes.shape({\n      playImage: PropTypes.string,\n      pauseImage: PropTypes.string,\n    }),',
        },
      ],
    },
    {
      id: PRESET_IDS.correctAnswerToggleStyleNormalization,
      label: '@pie-lib/correct-answer-toggle style key normalization',
      file: join(projectRoot, 'packages/lib-react/correct-answer-toggle/src/index.tsx'),
      replacements: [
        { from: "  '-webkit-touchCcallout': 'none',", to: "  WebkitTouchCallout: 'none'," },
        { from: "  '-webkit-user-select': 'none',", to: "  WebkitUserSelect: 'none'," },
        { from: "  '-khtml-user-select': 'none',", to: "  KhtmlUserSelect: 'none'," },
        { from: "  '-moz-user-select': 'none',", to: "  MozUserSelect: 'none'," },
        { from: "  '-ms-user-select': 'none',", to: "  msUserSelect: 'none'," },
        { from: "  'user-select': 'none',", to: "  userSelect: 'none'," },
      ],
    },
  ];
}

export function getPieLibSyncMode(pkgName: string): PieLibSyncMode {
  if (pkgName === 'math-rendering') {
    return 'wrapper';
  }
  return 'full-sync';
}

export function getPieLibSourcePreserveList(pkgName: string): string[] {
  if (pkgName === 'render-ui') {
    return ['inline-menu.tsx'];
  }
  return [];
}

export function shouldGenerateAutosizeInputComponent(pkgName: string): boolean {
  return ['charting', 'graphing', 'graphing-solution-set'].includes(pkgName);
}

export function shouldGenerateConfigUiFractionHelper(pkgName: string): boolean {
  return pkgName === 'config-ui';
}

export function shouldTransformReactInputAutosizeSource(sourcePath?: string): boolean {
  if (!sourcePath) {
    return true;
  }

  return ['charting', 'graphing', 'graphing-solution-set'].some(
    (pkgName) =>
      sourcePath.includes(`pie-lib/packages/${pkgName}/src/`) ||
      sourcePath.includes(`packages/lib-react/${pkgName}/src/`)
  );
}

export function shouldTransformConfigUiMathjsSource(sourcePath?: string): boolean {
  if (!sourcePath) {
    return false;
  }

  return (
    sourcePath.includes('pie-lib/packages/config-ui/src/number-text-field-custom') ||
    sourcePath.includes('packages/lib-react/config-ui/src/number-text-field-custom')
  );
}

export function getPieLibVitePreset(pkgName?: string): PieLibVitePreset {
  if (pkgName === 'math-rendering') {
    return 'math-rendering-wrapper';
  }
  if (pkgName === 'test-utils') {
    return 'test-utils';
  }
  if (pkgName === 'editable-html-tip-tap') {
    return 'editable-html-tip-tap';
  }
  return 'default';
}

export function getPieLibDependencyAugmentations(pkgName: string): Record<string, string> {
  if (pkgName === 'graphing') {
    return {
      '@dnd-kit/core': '^6.3.0',
    };
  }
  if (pkgName === 'charting') {
    return {
      'd3-time': '^3.1.0',
      'd3-interpolate': '^3.0.1',
      'd3-shape': '^3.2.0',
    };
  }
  return {};
}

export function getPieLibDependencyOverride(pkgName: string): Record<string, string> | null {
  if (pkgName === 'math-rendering') {
    return {
      '@pie-element/shared-math-rendering-mathjax': 'workspace:*',
    };
  }
  return null;
}

/**
 * Exact versions forced onto a synced package's dependencies, whatever upstream declares.
 *
 * tiptap pins its own peers exactly from 3.24.0 on — `@tiptap/core@3.31.3` peers on
 * `@tiptap/pm: "3.31.3"`, not a range — so every `@tiptap/*` package in one install tree has
 * to be the same exact version. Mix them and a second `@tiptap/core` resolves, which breaks
 * ProseMirror on duplicate schema and plugin identity.
 *
 * Upstream pie-lib still declares 3.20.0 and is no longer maintained, so the version lives
 * here instead of being fixed there. This matters because `ensurePieLibPackageJson` rebuilds
 * `dependencies` from the upstream manifest on every sync: without this pin, one
 * `upstream:sync` walks the whole set back to 3.20.0 and silently undoes the alignment.
 *
 * Matched by prefix rather than by name so a newly imported `@tiptap/*` package is pinned as
 * well, instead of arriving as a caret range off whatever happens to be installed. Keep in
 * step with the root `package.json` `overrides`.
 */
const PIE_LIB_DEPENDENCY_VERSION_PINS: ReadonlyArray<{ prefix: string; version: string }> = [
  { prefix: '@tiptap/', version: '3.31.3' },
];

export function applyPieLibDependencyVersionPins(
  deps: Record<string, string>
): Record<string, string> {
  const pinned: Record<string, string> = {};
  for (const [depName, version] of Object.entries(deps)) {
    const pin = PIE_LIB_DEPENDENCY_VERSION_PINS.find(({ prefix }) => depName.startsWith(prefix));
    pinned[depName] = pin ? pin.version : version;
  }
  return pinned;
}

export const PIE_LIB_COMPATIBILITY_APPEND_PATCHES: Record<
  string,
  { id: string; append: string; requiredMarker: string }
> = {
  plot: {
    id: PRESET_IDS.plotToolPropTypesCompatibility,
    requiredMarker: 'ToolPropTypeFields',
    append: `

// Local compatibility export used by graphing tool components.
export const ToolPropTypeFields = {
  graphProps: GraphPropsType.isRequired,
  mark: PropTypes.object,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  onClick: PropTypes.func,
};

export const ToolPropType = PropTypes.shape(ToolPropTypeFields);
`,
  },
};
