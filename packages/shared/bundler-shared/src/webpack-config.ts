/**
 * Webpack configuration for IIFE bundles
 * Simplified from pie-api-aws/packages/bundler/src/webpack/player.ts
 */

import { join } from 'node:path';
import webpack from 'webpack';
import { EsbuildPlugin } from 'esbuild-loader';
import { getLibPackagePathMap } from './dependency-resolver.js';

const BUNDLE_LIB_PACKAGES = ['@pie-lib/pie-toolbox', '@pie-lib/math-rendering'];

interface WebpackConfigOptions {
  context: string;
  entry: Record<string, string>;
  outputPath: string;
  workspaceDir: string;
  elements: string[];
}

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
      minimizer: [new EsbuildPlugin({ target: 'es2015' })],
      minimize: true,
    },

    devtool: 'source-map',

    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules\/(?!(@pie-.*)\/).*/,
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
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
          use: [
            {
              loader: 'url-loader',
              options: { limit: 10000 },
            },
          ],
        },
      ],
    },

    resolve: {
      alias: {
        '@pie-element': join(opts.workspaceDir, 'node_modules', '@pie-element'),
        ...libPackagePathMap,
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      modules: [join(opts.workspaceDir, 'node_modules'), 'node_modules'],
    },

    plugins: [
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
