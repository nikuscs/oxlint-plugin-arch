import { presetExportPrefix, presetExtensions, presetNamingRules } from '../preset.constants.ts'
import { PresetError, presetOverride, presetScopes } from '../preset.utils.ts'
import { layoutGroup } from './layout.ts'
import type { NamingFileOptions } from '../../types/naming.types.ts'
import type { PresetBuilder, PresetRules } from '../../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

const namingOperationMessage = 'Use domain-action.name.ts or domain-query.name.ts.'

function namingOperation(role: string, file: string) {
  return { mode: 'template', file, export: `{domain}${role === 'action' ? 'Action' : 'Query'}{Name}`, placeholder: '[a-z0-9-]+', camelCase: true }
}

export const namingGroup: PresetBuilder<'naming'> = (project, settings, owner) => {
  const { web, serviceRoots, app, ui, testFiles, components, hooks, operations } = project
  const flatApp = app.filter((path) => !operations.includes(path))
  const folderApp = app.filter((path) => operations.includes(path))
  const frontendEntries = [...presetScopes(web, 'services/**/*.{client,server,rsc}.ts'), ...presetScopes(web, 'services/**/*.rsc.tsx')]
  const ungroupedWeb = web.filter((path) => !project.layouts.some((scope) => scope.path === `${path}/components`))
  const overrides: OxlintOverride[] = []
  const { files: filesPattern, exports: exportsPattern, unique } = settings

  for (const [key, source] of [['files', filesPattern], ['exports', exportsPattern], ['unique', unique]]) {
    try {
      RegExp(typeof source === 'string' ? source : '')
    } catch {
      throw new PresetError(`naming.${String(key)} must be a valid regular expression.`)
    }
  }

  const folderChecks: NamingFileOptions[] = []

  if (typeof filesPattern === 'string' || unique !== undefined) {
    const check: NamingFileOptions = { pattern: typeof filesPattern === 'string' ? filesPattern : '', message: `File names here must match ${String(filesPattern)}.` }

    if (unique !== undefined) {
      check.unique = unique
    }

    folderChecks.push(check)
    overrides.push(presetOverride([`**/${presetExtensions}`], { 'arch/naming-file': ['error', check] }))

    for (const override of owner.effective.layout ? layoutGroup(project, owner.effective.layout, owner) : []) {
      const layoutRule = override.rules?.['arch/naming-file']

      if (Array.isArray(layoutRule)) {
        overrides.push({ ...override, rules: { 'arch/naming-file': [...layoutRule, check] } })
      }
    }
  }

  const add = (kind: 'files' | 'exports' | 'folders', files: string[], rules: PresetRules, excludeFiles?: string[]) => {
    const fileRule = rules['arch/naming-file']

    if (Array.isArray(fileRule) && folderChecks.length > 0) {
      rules['arch/naming-file'] = [...fileRule, ...folderChecks]
    }

    if (settings[kind]) {
      overrides.push(presetOverride(files, rules, excludeFiles))
    }
  }

  add('files', [`**/${presetExtensions}`], presetNamingRules)
  add(
    'files',
    presetScopes(app, 'types/**/*.ts'),
    { 'arch/naming-file': ['error', { pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*[.]types[.]ts$', message: 'Use domain.types.ts filenames.' }] },
    ['**/*.constants.ts'],
  )
  add(
    'exports',
    presetScopes(app, '**/*.{constants,utils,handler,service,types,client,server,rsc}.ts'),
    { 'arch/naming-exports': ['error', presetExportPrefix] },
    [...ui, ...presetScopes(serviceRoots, 'entry.*.ts')],
  )
  add(
    'exports',
    frontendEntries,
    { 'arch/naming-exports': ['error', { ...presetExportPrefix, scope: 'functions', services: true, allow: '^\\*$' }] },
    testFiles,
  )
  add(
    'exports',
    presetScopes(web, 'services/**/*.constants.ts'),
    { 'arch/naming-exports': ['error', { ...presetExportPrefix, scope: 'declarations', allow: '^\\*$' }] },
    testFiles,
  )
  add(
    'exports',
    presetScopes(app, '**/*.utils.ts'),
    { 'arch/naming-exports': ['error', { ...presetExportPrefix, scope: 'functions', allow: '^\\*$' }] },
    ui,
  )
  add(
    'files',
    hooks,
    {
      'arch/naming-file': [
        'error',
        {
          pattern: '^use-[a-z0-9]+(?:-[a-z0-9]+)*(?:[.](?:web|native|ios|android))?[.]ts$',
          message: 'Hooks use use-domain.ts filenames, with an optional .web, .native, .ios or .android platform suffix.',
        },
      ],
    },
    ui,
  )
  add(
    'exports',
    hooks,
    { 'arch/naming-exports': ['error', {}, { mode: 'pattern', pattern: '^use[A-Z]', types: true }] },
    ui,
  )
  add(
    'exports',
    components,
    { 'arch/files-components-only': ['error', { filename: true, types: true, roles: ['illustration'] }] },
    [...ui, ...testFiles],
  )
  add(
    'folders',
    presetScopes(ungroupedWeb, 'components/**/*.tsx'),
    { 'arch/naming-folder': ['error', { singularize: 'trailing-s', separators: ['-'] }] },
    [...ui, ...testFiles],
  )

  for (const role of ['action', 'query']) {
    const files = [...presetScopes(flatApp, `services/**/*-${role}.*.ts`), ...presetScopes(web, `services/**/*-${role}.*.rsc.tsx`)]

    add('files', files, {
      'arch/naming-file': ['error', { pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*-${role}\\.[a-z0-9]+(?:-[a-z0-9]+)*\\.ts$`, message: namingOperationMessage }],
    })
    add('exports', files, {
      'arch/naming-exports': [
        'error',
        { ...presetExportPrefix, roles: [role], scope: 'functions', allow: '^\\*$' },
        namingOperation(role, `{domain}-${role}.{name}.ts`),
      ],
    })
  }

  for (const [role, folder, separator] of [['action', 'actions', '.'], ['query', 'queries', '-']]) {
    const files = presetScopes(folderApp, `services/*/${folder}/*.ts`)

    add('files', files, {
      'arch/naming-file': [
        'error',
        {
          pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*-${role}[${separator}][a-z0-9]+(?:-[a-z0-9]+)*[.]ts$`,
          message: 'Use domain-action.name.ts in actions/ and domain-query-name.ts in queries/.',
        },
      ],
    })
    add('exports', files, {
      'arch/naming-exports': [
        'error',
        { mode: 'template', file: `{domain}-${role}${separator}{name}.ts`, export: `make{Domain}${role === 'action' ? 'Action' : 'Query'}{Name}`, placeholder: '[a-z0-9-]+' },
      ],
    })
  }

  for (const role of ['action', 'query']) {
    for (const suffix of ['client.ts', 'server.ts', 'rsc.ts', 'rsc.tsx']) {
      const files = presetScopes(web, `services/**/*-${role}.*.${suffix}`)

      add('files', files, {
        'arch/naming-file': [
          'error',
          {
            pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*-${role}\\.[a-z0-9]+(?:-[a-z0-9]+)*\\.${suffix.replace('.', '\\.')}$`,
            message: 'Frontend operations retain a client, server or rsc runtime suffix.',
          },
        ],
      })
      add('exports', files, { 'arch/naming-exports': ['error', namingOperation(role, `{domain}-${role}.{name}.${suffix}`)] })
    }
  }

  add(
    'exports',
    presetScopes(web, 'services/**/*.rsc.{ts,tsx}'),
    { 'arch/naming-exports': ['error', { mode: 'pattern', pattern: '^[a-z][a-z0-9]*Rsc[A-Z][a-zA-Z0-9]*$' }] },
    ['**/*-{action,query}.*.rsc.{ts,tsx}'],
  )

  if (typeof exportsPattern === 'string') {
    overrides.push(presetOverride([`**/${presetExtensions}`], { 'arch/naming-exports': ['error', { mode: 'pattern', pattern: exportsPattern, types: true }] }))
  }

  return overrides
}
