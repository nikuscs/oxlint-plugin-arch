import { posix } from 'node:path'
import { presetBuiltinFileRoles, presetExtensions } from '../preset.constants.ts'
import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const layoutGroup: PresetBuilder<'layout'> = (project, settings) => {
  const { web, nextWeb, serviceRoots, app, services, utilities, ui, testFiles, layouts, operations } = project
  const folderOperations = presetScopes(operations, 'services/*/{actions,queries}/*.ts')
  const operationMessage = "Action/query files export exactly one named operation. Keep helpers used only by this operation private inside its function; do not export them. Move a helper to the module's .utils.ts only when it is genuinely shared, not merely to satisfy lint."
  const roles = [...presetBuiltinFileRoles.filter((role) => role !== 'action' && role !== 'query'), ...project.suffixes]
  const conceptFiles = project.suffixes.map((suffix) => `**/*.${suffix}.ts`)
  const frontendEntries = [...presetScopes(web, 'services/**/*.{client,server,rsc}.ts'), ...presetScopes(web, 'services/**/*.rsc.tsx')]
  const ungroupedWeb = web.filter((path) => !layouts.some((scope) => scope.path === posix.join(path, 'components')))

  return [
    ...layouts.flatMap(({ path, folder, mode }) => {
      const folders = folder === 'services' && operations.some((source) => posix.join(source, 'services') === path)

      const registries = folder === 'services' ? project.registries : []

      const restricted = presetOverride(
        mode === 'flat' ? [`${path}/*/**/${presetExtensions}`] : [`${path}/${presetExtensions}`, `${path}/*/*/**/${presetExtensions}`],
        {
          'arch/files-restricted': [
            'error',
            {
              message: mode === 'flat'
                ? 'This folder uses a flat layout; subfolders are forbidden.'
                : 'This folder uses exactly one owning domain directory; loose and deeper files are forbidden.',
            },
          ],
        },
        [...(folders ? [`${path}/*/{actions,queries}/*.ts`] : []), ...registries],
      )

      if (mode !== 'domain') {
        return [restricted]
      }

      const prefix = { singularize: folder === 'components' ? 'trailing-s' : 'none', separators: ['.', '-'] }
      const naming = folder === 'hooks' ? { ...prefix, prefixes: ['use-'] } : prefix
      const domain = [restricted, presetOverride([`${path}/*/${presetExtensions}`], { 'arch/naming-folder': ['error', naming] }, registries)]

      if (!settings.strict || folder !== 'services') {
        return domain
      }

      const strict = presetOverride(
        [`${path}/*/**/${presetExtensions}`],
        {
          'arch/naming-file': [
            'error',
            {
              pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*(?:[.](?:${roles.join('|')})[.]ts|[.]rsc[.]tsx)$`,
              message: `Domain files use domain[-part].<role>.ts with a role from: ${roles.join(', ')}. Add new roles to layout.suffixes.`,
            },
          ],
        },
        ['**/*-{action,query}.*.ts', ...testFiles, ...registries],
      )

      return [...domain, strict]
    }),
    presetOverride(
      presetScopes(ungroupedWeb, `components/*/*/**/${presetExtensions}`),
      { 'arch/files-restricted': ['error', { message: 'Components allow one group folder.' }] },
      ui,
    ),
    presetOverride(
      [...presetScopes(web, 'components/**/*.ts'), ...presetScopes(web, 'hooks/**/*.tsx')],
      { 'arch/files-restricted': ['error', { message: 'Components use TSX; hooks use .ts files.' }] },
      ui,
    ),
    presetOverride(
      presetScopes(web, '**/use-*.{ts,tsx}'),
      { 'arch/files-restricted': ['error', { message: 'Hooks belong in src/hooks.' }] },
      [...presetScopes(web, 'hooks/**'), ...ui],
    ),
    presetOverride(
      presetScopes(web, 'services/**/*.{ts,tsx}'),
      {
        'arch/files-restricted': [
          'error',
          {
            message: 'Frontend services use .client.ts, .server.ts or .rsc.{ts,tsx}; shared domain helpers use .utils.ts and values use .constants.ts.',
          },
        ],
      },
      [
        '**/*.{client,server,rsc,utils,constants}.ts',
        '**/*.rsc.tsx',
        ...presetScopes(nextWeb, 'services/**/*.action.ts'),
        ...conceptFiles,
        ...project.colocated,
        ...testFiles,
      ],
    ),
    presetOverride(
      services,
      {
        'arch/backend-service-functions': 'error',
        'arch/types-inline': ['error', { parameters: true, returns: true, functions: true, min: 1 }],
      },
      [...utilities, ...testFiles, ...conceptFiles],
    ),
    presetOverride(frontendEntries, { 'arch/backend-service-functions': ['error', { frontend: true }] }, testFiles),
    ...conceptFiles.map((pattern) =>
      presetOverride(
        presetScopes(app, `services/${pattern}`),
        {
          'arch/backend-service-functions': 'off',
          'arch/naming-exports': ['error', { stem: 'full-basename', scope: 'functions' }],
        },
        testFiles,
      ),
    ),
    presetOverride(
      [...presetScopes(app, 'services/**/*-{action,query}.*.ts'), ...presetScopes(web, 'services/**/*-{action,query}.*.rsc.tsx')],
      { 'arch/backend-service-functions': ['error', { helpers: true, single: true, message: operationMessage }] },
      testFiles,
    ),
    presetOverride(folderOperations, { 'arch/backend-service-functions': ['error', { helpers: true, single: true, message: operationMessage }] }, testFiles),
    presetOverride(presetScopes(serviceRoots, 'services/**/*.ts'), { 'arch/files-domain-constants': 'error' }, [...utilities, ...testFiles]),
    presetOverride(presetScopes(web, 'services/**/*.{ts,tsx}'), { 'arch/files-domain-constants': ['error', { data: true }] }, [
      '**/*.constants.ts',
      ...testFiles,
    ]),
    presetOverride(frontendEntries, { 'arch/files-domain-constants': ['error', { data: true, services: true }] }, testFiles),
    presetOverride(
      [...presetScopes(serviceRoots, 'services/**/*-{action,query}.*.ts'), ...folderOperations, ...frontendEntries],
      { 'arch/code-object-params': ['error', { max: 2 }] },
      testFiles,
    ),
    presetOverride(frontendEntries, { 'arch/code-object-params': ['error', { max: 2, services: true }] }, testFiles),
    presetOverride(
      presetScopes(serviceRoots, 'services/**/*.service.ts'),
      { 'arch/files-exports': ['error', { names: settings.service, stem: 'before-first-dot', types: false }] },
      testFiles,
    ),
    presetOverride(presetScopes(app.filter((path) => !operations.includes(path)), 'services/**/{actions,queries}/**/*.ts'), {
      'arch/files-restricted': ['error', { message: 'Use domain-action.name.ts or domain-query.name.ts.' }],
    }),
  ]
}
