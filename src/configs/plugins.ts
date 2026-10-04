import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { OxlintConfig } from 'oxlint'
import type {
  PresetContext,
  PresetJsPlugins,
  PresetSettings,
} from '../types/preset.types.ts'

const require = createRequire(import.meta.url)

export function presetPluginsConfig(context: PresetContext): OxlintConfig {
  const { options, web, css } = context
  const jsPlugins: PresetJsPlugins = [
    { name: 'eslint-js', specifier: require.resolve('oxlint-plugin-eslint') },
    {
      name: 'import-extra',
      specifier: require.resolve('eslint-plugin-import'),
    },
    require.resolve('@regru/eslint-plugin-prefer-early-return'),
    require.resolve('eslint-plugin-unused-imports'),
    require.resolve('eslint-plugin-perfectionist'),
    require.resolve('eslint-plugin-tsdoc'),
    require.resolve('@eslint-community/eslint-plugin-eslint-comments'),
    {
      name: 'arch',
      specifier: fileURLToPath(new URL('../index.js', import.meta.url)),
    },
    {
      name: 'dillon-anti-slop',
      specifier: fileURLToPath(
        new URL('../rules/dillon-anti-slop/index.js', import.meta.url),
      ),
    },
    {
      name: 'modules',
      specifier: fileURLToPath(
        new URL('../rules/module-policy/index.js', import.meta.url),
      ),
    },
  ]
  const settings: PresetSettings = {
    react: { version: '19' },
    'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.mts', '.cts'] } },
  }

  if (web.length) {
    jsPlugins.push(
      {
        name: 'react-extra',
        specifier: require.resolve('eslint-plugin-react'),
      },
      require.resolve('eslint-plugin-react-you-might-not-need-an-effect'),
      require.resolve('eslint-plugin-svg-jsx'),
    )
  }

  if (Object.keys(css).length && options.tailwind !== false) {
    jsPlugins.push(require.resolve('eslint-plugin-better-tailwindcss'))

    if (options.shadcn !== false) {
      jsPlugins.push(require.resolve('@shadcn/lint'))
      settings.shadcn = {
        ui: options.shadcn?.ui ?? '@/components/ui',
        componentImports: options.shadcn?.componentImports ?? [
          '^@/components/',
        ],
      }
    }
  }

  return { jsPlugins, settings }
}
