/**
 * Webpack configuration for IIFE bundles
 * Simplified from pie-api-aws/packages/bundler/src/webpack/player.ts
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
import { EsbuildPlugin } from 'esbuild-loader';
import { getLibPackagePathMap } from './dependency-resolver.js';

const BUNDLE_LIB_PACKAGES = ['@pie-lib/pie-toolbox', '@pie-lib/math-rendering'];
const SHIM_DIR = resolveShimDir();

function resolveShimDir(): string {
  try {
    const moduleUrl = new URL(import.meta.url);
    if (moduleUrl.protocol === 'file:') {
      const modulePath = fileURLToPath(moduleUrl);
      return join(dirname(modulePath), 'shims');
    }
  } catch {
    // Fall through to CWD heuristics below.
  }

  // Some test transforms can provide non-file URLs; fall back to CWD heuristics.
  const candidates = [
    join(process.cwd(), 'src', 'shims'),
    join(process.cwd(), 'dist', 'shims'),
    join(process.cwd(), 'packages', 'shared', 'bundler-shared', 'src', 'shims'),
    join(process.cwd(), 'packages', 'shared', 'bundler-shared', 'dist', 'shims'),
  ];

  const resolved = candidates.find((candidate) => existsSync(candidate));
  return resolved || candidates[0];
}

interface WebpackConfigOptions {
  context: string;
  entry: Record<string, string>;
  outputPath: string;
  workspaceDir: string;
  elements: string[];
}

interface ControllerWebpackConfigOptions {
  context: string;
  entry: Record<string, string>;
  outputPath: string;
  workspaceDir: string;
}

const moduleRules: webpack.RuleSetRule[] = [
  {
    test: /\.(ts|tsx)$/,
    exclude: (filePath: string) => {
      if (!filePath.includes('/node_modules/')) {
        return false;
      }
      // Bun stores packages under node_modules/.bun/<pkg>@<ver>/node_modules/<pkg>.
      // We still need to transpile PIE packages (including @pie-lib) inside that tree.
      if (filePath.includes('/node_modules/.bun/@pie-')) {
        return false;
      }
      if (/\/node_modules\/@pie-[^/]+\//.test(filePath)) {
        return false;
      }
      return true;
    },
    use: [
      {
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2015',
          legalComments: 'none',
        },
      },
    ],
  },
  {
    test: /\.(js|jsx)$/,
    exclude: (filePath: string) => {
      if (!filePath.includes('/node_modules/')) {
        return false;
      }
      if (filePath.includes('/node_modules/.bun/@pie-')) {
        return false;
      }
      if (/\/node_modules\/@pie-[^/]+\//.test(filePath)) {
        return false;
      }
      return true;
    },
    use: [
      {
        loader: 'esbuild-loader',
        options: {
          loader: 'jsx',
          target: 'es2015',
          legalComments: 'none',
        },
      },
    ],
  },
  {
    test: /\.css$/,
    use: ['style-loader', 'css-loader'],
  },
  {
    test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
    type: 'asset',
    parser: {
      dataUrlCondition: {
        maxSize: 10000,
      },
    },
  },
];

export function createWebpackConfig(opts: WebpackConfigOptions): webpack.Configuration {
  const libPackagePathMap = getLibPackagePathMap(opts.workspaceDir, opts.elements);

  console.log('[webpack-config] Creating config for elements:', opts.elements);

  return {
    target: 'web',
    context: opts.context,
    entry: opts.entry,
    mode: 'production',

    externals: BUNDLE_LIB_PACKAGES.reduce(
      (obj, pkg) => {
        obj[pkg] = pkg;
        return obj;
      },
      {} as Record<string, string>
    ),

    optimization: {
      // Dev/demo bundling prioritizes correctness and debuggability over size.
      // Some large mixed ESM/CJS dependency graphs can break under aggressive minification.
      minimizer: [new EsbuildPlugin({ target: 'es2015' })],
      minimize: false,
    },

    devtool: false,

    module: {
      rules: moduleRules,
    },

    resolve: {
      alias: {
        '@pie-element': join(opts.workspaceDir, 'node_modules', '@pie-element'),
        // Some linked workspace packages emit jsxDEV calls.
        // In production bundles React's jsx-dev-runtime can end up without a callable jsxDEV.
        // Route both import forms to a tiny shim backed by react/jsx-runtime.
        'react/jsx-dev-runtime$': join(SHIM_DIR, 'react-jsx-dev-runtime.js'),
        'react/jsx-dev-runtime.js$': join(SHIM_DIR, 'react-jsx-dev-runtime.js'),
        ...libPackagePathMap,
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      modules: [join(opts.workspaceDir, 'node_modules'), 'node_modules'],
    },

    plugins: [
      // Some legacy PIE dependencies (notably MathQuill) expect global jQuery.
      // Provide it consistently so mixed module/global consumers resolve `jQuery`.
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
      }),
      // Version resolution plugin - handles different @pie-lib versions per element
      new webpack.NormalModuleReplacementPlugin(
        new RegExp(BUNDLE_LIB_PACKAGES.map((p) => `(${p})`).join('|')),
        (resource) => {
          const element = opts.elements.find((el) => resource.context.includes(el));
          const libPackage = BUNDLE_LIB_PACKAGES.find((p) => resource.request.includes(p));

          if (!libPackage) return;

          let replacement = `${libPackage}-root`;

          if (element) {
            const isConfigure = resource.context.includes('configure');
            const isController = resource.context.includes('controller');
            const isAuthor = resource.context.includes('author');

            if (isConfigure && libPackagePathMap[`${libPackage}-${element}-configure`]) {
              replacement = `${libPackage}-${element}-configure`;
            } else if (isController && libPackagePathMap[`${libPackage}-${element}-controller`]) {
              replacement = `${libPackage}-${element}-controller`;
            } else if (isAuthor && libPackagePathMap[`${libPackage}-${element}-author`]) {
              replacement = `${libPackage}-${element}-author`;
            } else if (libPackagePathMap[`${libPackage}-${element}`]) {
              replacement = `${libPackage}-${element}`;
            }
          }

          console.log(
            `[webpack-config] Replacing ${libPackage} with ${replacement} in ${resource.context}`
          );

          resource.request = resource.request.replace(libPackage, replacement);
        }
      ),
    ],

    output: {
      filename: '[name].js',
      library: 'pie',
      path: opts.outputPath,
      libraryTarget: 'window',
      publicPath: '',
    },
  };
}

export function createControllerWebpackConfig(
  opts: ControllerWebpackConfigOptions
): webpack.Configuration {
  return {
    target: 'web',
    context: opts.context,
    entry: opts.entry,
    mode: 'production',
    optimization: {
      minimizer: [new EsbuildPlugin({ target: 'es2015' })],
      minimize: false,
    },
    devtool: false,
    module: {
      rules: moduleRules,
    },
    resolve: {
      alias: {
        '@pie-element': join(opts.workspaceDir, 'node_modules', '@pie-element'),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      modules: [join(opts.workspaceDir, 'node_modules'), 'node_modules'],
    },
    output: {
      filename: '[name].js',
      libraryTarget: 'commonjs2',
      path: opts.outputPath,
      publicPath: '',
    },
  };
}
