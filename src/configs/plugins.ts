import { createRequire } from 'node:module'
import type { OxlintConfig } from 'oxlint'
import type { PresetContext, PresetJsPlugins, PresetSettings } from '../types/preset.types.ts'

const require = createRequire(import.meta.url)

export function presetPluginsConfig(context: PresetContext): OxlintConfig {
  const { options, reactFiles, css } = context
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
      specifier: require.resolve('oxlint-plugin-arch'),
    },
    {
      name: 'dillon-anti-slop',
      specifier: require.resolve('oxlint-plugin-arch/rules/dillon-anti-slop'),
    },
    {
      name: 'modules',
      specifier: require.resolve('oxlint-plugin-arch/rules/module-policy'),
    },
  ]
  const settings: PresetSettings = {
    react: { version: '19' },
    'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.mts', '.cts'] } },
  }

  if (reactFiles.length) {
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
    jsPlugins.push(require.resolve('oxlint-tailwindcss'))
    settings.tailwindcss = { rootFontSize: options.tailwind?.rootFontSize ?? 16 }

    if (options.shadcn !== false) {
      jsPlugins.push(require.resolve('@shadcn/lint'))
      settings.shadcn = {
        ui: options.shadcn?.ui ?? '@/components/ui',
        componentImports: options.shadcn?.components ?? ['^@/components/'],
      }
    }
  }

  return { jsPlugins, settings }
}
