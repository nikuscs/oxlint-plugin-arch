import { createRequire } from 'node:module'
import { backendGroup } from './groups/backend.ts'
import { basicsGroup } from './groups/basics.ts'
import { commentsGroup } from './groups/comments.ts'
import { consoleGroup } from './groups/console.ts'
import { expoGroup } from './groups/expo.ts'
import { formsGroup } from './groups/forms.ts'
import { importsGroup } from './groups/imports.ts'
import { layoutGroup } from './groups/layout.ts'
import { limitsGroup } from './groups/limits.ts'
import { namingGroup } from './groups/naming.ts'
import { nextGroup } from './groups/next.ts'
import { orpcGroup } from './groups/orpc.ts'
import { reactGroup } from './groups/react.ts'
import { schemasGroup } from './groups/schemas.ts'
import { shadcnGroup } from './groups/shadcn.ts'
import { sqlGroup } from './groups/sql.ts'
import { styleGroup } from './groups/style.ts'
import { tailwindGroup } from './groups/tailwind.ts'
import { tanstackGroup } from './groups/tanstack.ts'
import { testsGroup } from './groups/tests.ts'
import { typesGroup } from './groups/types.ts'
import { presetProject } from './preset-folders.ts'
import { presetRecipes, presetTemplates } from './preset-recipes.ts'
import { presetCommonRules, presetGroupOrder } from './preset.constants.ts'
import { presetIntersect, presetSeverity } from './preset.utils.ts'
import type * as PresetTypes from '../types/preset.types.ts'
import type { OxlintConfig, OxlintOverride } from 'oxlint'

export type {
  PresetConfig,
  PresetFolder,
  PresetFolders,
  PresetGroups,
  PresetGroupName,
  PresetRecipe,
  PresetLevel,
  PresetSwitch,
  PresetLayoutMode,
  PresetLayoutOptions,
  PresetLimitsOptions,
  PresetStyleOptions,
  PresetBasicsOptions,
  PresetNamingOptions,
  PresetCommentsOptions,
  PresetTypesOptions,
  PresetImportsOptions,
  PresetTestsOptions,
  PresetMockingOptions,
  PresetMockingApi,
  PresetMockingException,
  PresetMockingPreset,
  PresetReactOptions,
  PresetFrameworkOptions,
  PresetTailwindOptions,
  PresetShadcnOptions,
  PresetBackendOptions,
  PresetOrpcOptions,
  PresetFormsOptions,
  PresetSqlOptions,
} from '../types/preset.types.ts'

export { PresetError } from './preset.utils.ts'

export const recipes = presetRecipes
export const templates = presetTemplates

const require = createRequire(import.meta.url)

const presetBuilders: PresetTypes.PresetBuilders = {
  style: styleGroup,
  imports: importsGroup,
  types: typesGroup,
  layout: layoutGroup,
  naming: namingGroup,
  comments: commentsGroup,
  basics: basicsGroup,
  console: consoleGroup,
  tests: testsGroup,
  schemas: schemasGroup,
  sql: sqlGroup,
  orpc: orpcGroup,
  react: reactGroup,
  forms: formsGroup,
  tanstack: tanstackGroup,
  next: nextGroup,
  expo: expoGroup,
  backend: backendGroup,
  tailwind: tailwindGroup,
  shadcn: shadcnGroup,
  limits: limitsGroup,
}

function presetSettings<K extends PresetTypes.PresetGroupName>(scope: PresetTypes.PresetScope, name: K): PresetTypes.PresetGroupSettings<K> | null {
  const settings: PresetTypes.PresetEffective[K] = scope.effective[name]

  if (name !== 'console') {
    return settings ?? null
  }

  // SAFETY: the console group has no options; its builder only reads the level.
  return settings ? null : ({ level: scope.folder.severity ?? 'error' } as PresetTypes.PresetGroupSettings<K>)
}

function presetEmit<K extends PresetTypes.PresetGroupName>(
  project: PresetTypes.PresetProject,
  name: K,
  builder: PresetTypes.PresetBuilder<K>,
): OxlintOverride[] {
  const key = (scope: PresetTypes.PresetScope) => JSON.stringify(presetSettings(scope, name))
  const breaks = project.scopes.filter((scope) => scope.parent === null || key(scope) !== key(scope.parent))

  const nearest = (owner: PresetTypes.PresetScope) =>
    breaks.filter((scope) => {
      let current = scope.parent

      while (current && current !== owner && !breaks.includes(current)) {
        current = current.parent
      }

      return scope !== owner && current === owner
    })

  return breaks.flatMap((owner) => {
    const settings = presetSettings(owner, name)

    if (!settings) {
      return []
    }

    const excluded = nearest(owner).map((scope) => `${scope.key}/**`)

    return builder(project, settings).flatMap((override) => {
      const files = override.files.flatMap((glob) => presetIntersect(glob, owner.key))

      if (files.length === 0 || !override.rules) {
        return []
      }

      return [
        {
          ...override,
          files,
          excludeFiles: [...(override.excludeFiles ?? []), ...excluded],
          rules: presetSeverity(override.rules, settings.level),
        },
      ]
    })
  })
}

function presetPlugins(project: PresetTypes.PresetProject): Pick<OxlintConfig, 'jsPlugins' | 'settings'> {
  const react = project.scopes.some((scope) => scope.effective.react)
  const tailwind = project.scopes.find((scope) => scope.effective.tailwind)?.effective.tailwind
  const shadcn = project.scopes.find((scope) => scope.effective.shadcn)?.effective.shadcn

  const jsPlugins: PresetTypes.PresetJsPlugins = [
    { name: 'eslint-js', specifier: require.resolve('oxlint-plugin-eslint') },
    { name: 'import-extra', specifier: require.resolve('eslint-plugin-import') },
    require.resolve('@regru/eslint-plugin-prefer-early-return'),
    require.resolve('eslint-plugin-unused-imports'),
    require.resolve('eslint-plugin-perfectionist'),
    require.resolve('eslint-plugin-tsdoc'),
    require.resolve('@eslint-community/eslint-plugin-eslint-comments'),
    { name: 'arch', specifier: require.resolve('oxlint-plugin-arch') },
    { name: 'dillon-anti-slop', specifier: require.resolve('oxlint-plugin-arch/dillon-anti-slop') },
  ]

  const settings: PresetTypes.PresetSettings = {
    react: { version: '19' },
    'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.mts', '.cts'] } },
  }

  if (react) {
    jsPlugins.push(
      { name: 'react-extra', specifier: require.resolve('eslint-plugin-react') },
      require.resolve('eslint-plugin-react-you-might-not-need-an-effect'),
      require.resolve('eslint-plugin-svg-jsx'),
    )
  }

  if (!tailwind || Object.keys(project.css).length === 0) {
    return { jsPlugins, settings }
  }

  jsPlugins.push(require.resolve('oxlint-tailwindcss'))
  settings.tailwindcss = { rootFontSize: tailwind.rem }

  if (shadcn) {
    jsPlugins.push(require.resolve('@shadcn/lint'))
    settings.shadcn = { ui: shadcn.ui, componentImports: shadcn.components }
  }

  return { jsPlugins, settings }
}

export function preset(config: PresetTypes.PresetConfig): OxlintConfig {
  const project = presetProject(config)
  const [root] = project.scopes
  const level = root.folder.severity ?? 'error'

  const emitGroup = <K extends PresetTypes.PresetGroupName>(name: K) => {
    const builder: PresetTypes.PresetBuilders[K] = presetBuilders[name]

    return builder ? presetEmit(project, name, builder) : []
  }

  const overrides = presetGroupOrder.flatMap(emitGroup)

  for (const scope of project.scopes.toSorted((left, right) => left.depth - right.depth)) {
    if (scope.folder.rules) {
      overrides.push({ files: [scope.key === '.' ? '**' : `${scope.key}/**`], rules: scope.folder.rules })
    }
  }

  return {
    options: { typeAware: true },
    categories: { correctness: level },
    plugins: ['typescript', 'react', 'react-perf', 'jsx-a11y', 'import', 'unicorn', 'promise', 'vitest', 'node', 'oxc'],
    ignorePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.output/**',
      ...(project.nextWeb.length > 0 ? ['**/.next/**', '**/next-env.d.ts'] : []),
      ...(project.expoWeb.length > 0 ? ['**/.expo/**', '**/expo-env.d.ts'] : []),
      ...project.generated,
      ...project.ignores,
    ],
    ...presetPlugins(project),
    rules: presetSeverity(presetCommonRules, level),
    overrides,
  }
}
