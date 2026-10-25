import { posix } from 'node:path'
import { presetExportPrefix, presetExtensions, presetNamingRules } from './preset.constants.ts'
import { presetOverride, presetScopes } from './preset.utils.ts'
import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'

const presetOperationMessage = 'Use domain-action.name.ts or domain-query.name.ts.'

function presetOperationExport(role: string, file: string) {
  return {
    file,
    export: `{domain}${role === 'action' ? 'Action' : 'Query'}{Name}`,
    placeholderPattern: '[a-z0-9-]+',
    camelCase: true,
  }
}

export function presetModulesConfig(context: PresetContext): PresetPolicies {
  const { web, nextWeb, serviceRoots, app, services, utilities, ui, testFiles, components, hooks, options } = context
  const conceptFiles = (options.modules?.customFileRoles ?? []).map((role) => `**/*.${role}.ts`)
  const migrations = options.modules?.migrationFiles ?? []
  const operationRoles = ['action', 'query']

  const frontendEntries = [
    ...presetScopes(web, 'services/**/*.{client,server,rsc}.ts'),
    ...presetScopes(web, 'services/**/*.rsc.tsx'),
  ]

  const ungroupedWeb = web.filter(
    (path) => !context.folders.some((scope) => scope.path === posix.join(path, 'components')),
  )

  return {
    fileLayout: [
      ...context.folders.flatMap(({ path, folder, mode }) => {
        const layout = presetOverride(
          mode === 'flat'
            ? [`${path}/*/**/${presetExtensions}`]
            : [`${path}/${presetExtensions}`, `${path}/*/*/**/${presetExtensions}`],
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
          migrations,
        )

        if (mode !== 'domain') {
          return [layout]
        }

        const prefix = { singularize: folder === 'components' ? 'trailing-s' : 'none', separators: ['.', '-'] }
        const folderPrefix = folder === 'hooks' ? { ...prefix, stripPrefixes: ['use-'] } : prefix
        const naming = presetOverride([`${path}/*/${presetExtensions}`], { 'arch/naming-folder': ['error', folderPrefix] })
        return [layout, naming]
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
          ...(options.modules?.colocatedTypeFiles ?? []),
        ],
      ),
    ],
    serviceStructure: [
      presetOverride(
        services,
        {
          'arch/backend-service-functions': 'error',
          'arch/types-inline': ['error', { parameters: true, returns: true, functionTypes: true, minMembers: 1 }],
        },
        [...utilities, ...testFiles, ...conceptFiles, ...migrations],
      ),
      presetOverride(frontendEntries, { 'arch/backend-service-functions': ['error', { frontend: true }] }, testFiles),
      ...conceptFiles.map((pattern) =>
        presetOverride(
          presetScopes(app, `services/${pattern}`),
          {
            'arch/backend-service-functions': 'off',
            'arch/naming-export-prefix': ['error', { stem: 'full-basename', allFunctions: true }],
          },
          testFiles,
        ),
      ),
      presetOverride(
        [
          ...presetScopes(app, 'services/**/*-{action,query}.*.ts'),
          ...presetScopes(web, 'services/**/*-{action,query}.*.rsc.tsx'),
        ],
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
      presetOverride(presetScopes(serviceRoots, 'services/**/*.ts'), { 'arch/files-domain-constants': 'error' }, [
        ...utilities,
        ...testFiles,
      ]),
      presetOverride(
        presetScopes(web, 'services/**/*.{ts,tsx}'),
        { 'arch/files-domain-constants': ['error', { includeData: true }] },
        ['**/*.constants.ts', ...testFiles],
      ),
      presetOverride(
        frontendEntries,
        { 'arch/files-domain-constants': ['error', { includeData: true, allowServiceMethods: true }] },
        testFiles,
      ),
      presetOverride(
        [...presetScopes(serviceRoots, 'services/**/*-{action,query}.*.ts'), ...frontendEntries],
        { 'arch/code-object-params': ['error', { maxParams: 2 }] },
        testFiles,
      ),
      presetOverride(
        frontendEntries,
        { 'arch/code-object-params': ['error', { maxParams: 2, serviceMethods: true }] },
        testFiles,
      ),
      presetOverride(
        presetScopes(serviceRoots, 'services/**/*.service.ts'),
        {
          'arch/files-exports': [
            'error',
            {
              names: ['make{Domain}Service', '{Domain}Service'],
              domainStem: 'before-first-dot',
              allowTypeExports: false,
            },
          ],
        },
        testFiles,
      ),
      presetOverride(presetScopes(app, 'services/**/{actions,queries}/**/*.ts'), {
        'arch/files-restricted': ['error', { message: presetOperationMessage }],
      }),
    ],
    naming: [
      presetOverride([`**/${presetExtensions}`], presetNamingRules),
      presetOverride(
        presetScopes(app, 'types/**/*.ts'),
        {
          'arch/naming-file': [
            'error',
            { pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*[.]types[.]ts$', message: 'Use domain.types.ts filenames.' },
          ],
        },
        ['**/*.constants.ts'],
      ),
      presetOverride(
        presetScopes(app, '**/*.{constants,utils,handler,service,types,client,server,rsc}.ts'),
        { 'arch/naming-export-prefix': ['error', presetExportPrefix] },
        [...ui, ...presetScopes(serviceRoots, 'entry.*.ts')],
      ),
      presetOverride(
        frontendEntries,
        {
          'arch/naming-export-prefix': [
            'error',
            { ...presetExportPrefix, allFunctions: true, serviceMethods: true, allowPattern: '^\\*$' },
          ],
        },
        testFiles,
      ),
      presetOverride(
        presetScopes(web, 'services/**/*.constants.ts'),
        {
          'arch/naming-export-prefix': ['error', { ...presetExportPrefix, allDeclarations: true, allowPattern: '^\\*$' }],
        },
        testFiles,
      ),
      presetOverride(
        presetScopes(app, '**/*.utils.ts'),
        { 'arch/naming-export-prefix': ['error', { ...presetExportPrefix, allFunctions: true, allowPattern: '^\\*$' }] },
        ui,
      ),
      presetOverride(
        hooks,
        {
          'arch/naming-file': [
            'error',
            {
              pattern: '^use-[a-z0-9]+(?:-[a-z0-9]+)*(?:[.](?:web|native|ios|android))?[.]ts$',
              message: 'Hooks use use-domain.ts filenames, with an optional .web, .native, .ios or .android platform suffix.',
            },
          ],
          'arch/naming-export-prefix': 'error',
          'arch/naming-export-pattern': ['error', { pattern: '^use[A-Z]', ignoreTypeExports: true }],
        },
        ui,
      ),
      presetOverride(
        components,
        {
          'arch/files-components-only': [
            'error',
            { matchFileName: true, allowTypeExports: true, trailingRoles: ['illustration'] },
          ],
        },
        [...ui, ...testFiles],
      ),
      presetOverride(
        presetScopes(ungroupedWeb, 'components/**/*.tsx'),
        { 'arch/naming-folder': ['error', { singularize: 'trailing-s', separators: ['-'] }] },
        [...ui, ...testFiles],
      ),
      ...operationRoles.map((role) =>
        presetOverride(
          [...presetScopes(app, `services/**/*-${role}.*.ts`), ...presetScopes(web, `services/**/*-${role}.*.rsc.tsx`)],
          {
            'arch/naming-file': [
              'error',
              {
                pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*-${role}\\.[a-z0-9]+(?:-[a-z0-9]+)*\\.ts$`,
                message: presetOperationMessage,
              },
            ],
            'arch/naming-export-prefix': [
              'error',
              { ...presetExportPrefix, trailingRoles: [role], allFunctions: true, allowPattern: '^\\*$' },
            ],
            'arch/naming-export-template': ['error', presetOperationExport(role, `{domain}-${role}.{name}.ts`)],
          },
        ),
      ),
      ...operationRoles.flatMap((role) =>
        ['client.ts', 'server.ts', 'rsc.ts', 'rsc.tsx'].map((suffix) =>
          presetOverride(presetScopes(web, `services/**/*-${role}.*.${suffix}`), {
            'arch/naming-file': [
              'error',
              {
                pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*-${role}\\.[a-z0-9]+(?:-[a-z0-9]+)*\\.${suffix.replace('.', '\\.')}$`,
                message: 'Frontend operations retain a client, server or rsc runtime suffix.',
              },
            ],
            'arch/naming-export-template': ['error', presetOperationExport(role, `{domain}-${role}.{name}.${suffix}`)],
          }),
        ),
      ),
      presetOverride(
        presetScopes(web, 'services/**/*.rsc.{ts,tsx}'),
        { 'arch/naming-export-pattern': ['error', { pattern: '^[a-z][a-z0-9]*Rsc[A-Z][a-zA-Z0-9]*$' }] },
        ['**/*-{action,query}.*.rsc.{ts,tsx}'],
      ),
    ],
  }
}
