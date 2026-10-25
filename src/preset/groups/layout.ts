import { posix } from 'node:path'
import { presetExtensions } from '../preset.constants.ts'
import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const layoutGroup: PresetBuilder<'layout'> = (project) => {
  const { web, nextWeb, serviceRoots, app, services, utilities, ui, testFiles, layouts } = project
  const conceptFiles = project.suffixes.map((suffix) => `**/*.${suffix}.ts`)
  const frontendEntries = [...presetScopes(web, 'services/**/*.{client,server,rsc}.ts'), ...presetScopes(web, 'services/**/*.rsc.tsx')]
  const ungroupedWeb = web.filter((path) => !layouts.some((scope) => scope.path === posix.join(path, 'components')))

  return [
    ...layouts.flatMap(({ path, folder, mode }) => {
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
      )

      if (mode !== 'domain') {
        return [restricted]
      }

      const prefix = { singularize: folder === 'components' ? 'trailing-s' : 'none', separators: ['.', '-'] }
      const naming = folder === 'hooks' ? { ...prefix, stripPrefixes: ['use-'] } : prefix

      return [restricted, presetOverride([`${path}/*/${presetExtensions}`], { 'arch/naming-folder': ['error', naming] })]
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
      ],
    ),
    presetOverride(
      services,
      {
        'arch/backend-service-functions': 'error',
        'arch/types-inline': ['error', { parameters: true, returns: true, functionTypes: true, minMembers: 1 }],
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
      {
        'arch/backend-service-functions': [
          'error',
          {
            allowLocalHelpers: true,
            singleExport: true,
            message: "Action/query files export exactly one named operation. Keep helpers used only by this operation private inside its function; do not export them. Move a helper to the module's .utils.ts only when it is genuinely shared, not merely to satisfy lint.",
          },
        ],
      },
      testFiles,
    ),
    presetOverride(presetScopes(serviceRoots, 'services/**/*.ts'), { 'arch/files-domain-constants': 'error' }, [...utilities, ...testFiles]),
    presetOverride(presetScopes(web, 'services/**/*.{ts,tsx}'), { 'arch/files-domain-constants': ['error', { includeData: true }] }, [
      '**/*.constants.ts',
      ...testFiles,
    ]),
    presetOverride(frontendEntries, { 'arch/files-domain-constants': ['error', { includeData: true, allowServiceMethods: true }] }, testFiles),
    presetOverride(
      [...presetScopes(serviceRoots, 'services/**/*-{action,query}.*.ts'), ...frontendEntries],
      { 'arch/code-object-params': ['error', { maxParams: 2 }] },
      testFiles,
    ),
    presetOverride(frontendEntries, { 'arch/code-object-params': ['error', { maxParams: 2, serviceMethods: true }] }, testFiles),
    presetOverride(
      presetScopes(serviceRoots, 'services/**/*.service.ts'),
      { 'arch/files-exports': ['error', { names: ['make{Domain}Service', '{Domain}Service'], domainStem: 'before-first-dot', allowTypeExports: false }] },
      testFiles,
    ),
    presetOverride(presetScopes(app, 'services/**/{actions,queries}/**/*.ts'), {
      'arch/files-restricted': ['error', { message: 'Use domain-action.name.ts or domain-query.name.ts.' }],
    }),
  ]
}
