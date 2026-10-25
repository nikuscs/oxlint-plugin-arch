import { presetExportPrefix, presetExtensions, presetNamingRules } from '../preset.constants.ts'
import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder, PresetRules } from '../../types/preset.types.ts'
import type { OxlintOverride } from 'oxlint'

const namingOperationMessage = 'Use domain-action.name.ts or domain-query.name.ts.'

function namingOperation(role: string, file: string) {
  return { mode: 'template', file, export: `{domain}${role === 'action' ? 'Action' : 'Query'}{Name}`, placeholderPattern: '[a-z0-9-]+', camelCase: true }
}

export const namingGroup: PresetBuilder<'naming'> = (project, settings) => {
  const { web, serviceRoots, app, ui, testFiles, components, hooks } = project
  const frontendEntries = [...presetScopes(web, 'services/**/*.{client,server,rsc}.ts'), ...presetScopes(web, 'services/**/*.rsc.tsx')]
  const ungroupedWeb = web.filter((path) => !project.layouts.some((scope) => scope.path === `${path}/components`))
  const overrides: OxlintOverride[] = []

  const add = (kind: 'files' | 'exports' | 'folders', files: string[], rules: PresetRules, excludeFiles?: string[]) => {
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
    { 'arch/naming-exports': ['error', { ...presetExportPrefix, scope: 'functions', serviceMethods: true, allowPattern: '^\\*$' }] },
    testFiles,
  )
  add(
    'exports',
    presetScopes(web, 'services/**/*.constants.ts'),
    { 'arch/naming-exports': ['error', { ...presetExportPrefix, scope: 'declarations', allowPattern: '^\\*$' }] },
    testFiles,
  )
  add(
    'exports',
    presetScopes(app, '**/*.utils.ts'),
    { 'arch/naming-exports': ['error', { ...presetExportPrefix, scope: 'functions', allowPattern: '^\\*$' }] },
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
    { 'arch/naming-exports': ['error', {}, { mode: 'pattern', pattern: '^use[A-Z]', ignoreTypeExports: true }] },
    ui,
  )
  add(
    'exports',
    components,
    { 'arch/files-components-only': ['error', { matchFileName: true, allowTypeExports: true, trailingRoles: ['illustration'] }] },
    [...ui, ...testFiles],
  )
  add(
    'folders',
    presetScopes(ungroupedWeb, 'components/**/*.tsx'),
    { 'arch/naming-folder': ['error', { singularize: 'trailing-s', separators: ['-'] }] },
    [...ui, ...testFiles],
  )

  for (const role of ['action', 'query']) {
    const files = [...presetScopes(app, `services/**/*-${role}.*.ts`), ...presetScopes(web, `services/**/*-${role}.*.rsc.tsx`)]

    add('files', files, {
      'arch/naming-file': ['error', { pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*-${role}\\.[a-z0-9]+(?:-[a-z0-9]+)*\\.ts$`, message: namingOperationMessage }],
    })
    add('exports', files, {
      'arch/naming-exports': [
        'error',
        { ...presetExportPrefix, trailingRoles: [role], scope: 'functions', allowPattern: '^\\*$' },
        namingOperation(role, `{domain}-${role}.{name}.ts`),
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

  return overrides
}
