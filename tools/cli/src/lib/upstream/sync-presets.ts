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
  graphingAutosizeInterop: 'patch.graphing.autosize-interop',
  chartingAutosizeInterop: 'patch.charting.autosize-interop',
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
      id: PRESET_IDS.graphingAutosizeInterop,
      label: '@pie-lib/graphing autosize interop',
      file: join(projectRoot, 'packages/lib-react/graphing/src/mark-label.tsx'),
      replacements: [
        {
          from: "import AutosizeInput from 'react-input-autosize';",
          to: "import AutosizeInput from 'react-input-autosize';\nconst AutosizeInputComponent = AutosizeInput?.default ?? AutosizeInput;",
        },
        {
          from: '<AutosizeInput',
          to: '<AutosizeInputComponent',
        },
      ],
    },
    {
      id: PRESET_IDS.chartingAutosizeInterop,
      label: '@pie-lib/charting autosize interop',
      file: join(projectRoot, 'packages/lib-react/charting/src/mark-label.tsx'),
      replacements: [
        {
          from: "import AutosizeInput from 'react-input-autosize';",
          to: "import AutosizeInput from 'react-input-autosize';\nconst AutosizeInputComponent = AutosizeInput?.default ?? AutosizeInput;",
        },
        {
          from: '<AutosizeInput',
          to: '<AutosizeInputComponent',
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
