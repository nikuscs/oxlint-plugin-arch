import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetScopes, presetOverride } from '../utils/helpers/preset.ts'
import {
  presetExtensions,
  presetNamingRules,
  presetExportPrefix,
} from '../constants/preset.constants.ts'

export function presetModulesConfig(context: PresetContext): PresetPolicies {
  const {
    web,
    backend,
    app,
    services,
    utilities,
    ui,
    testFiles,
    components,
    hooks,
    options,
  } = context
  const conceptFiles = (options.fileRoles ?? []).map((role) => `**/*.${role}.ts`)
  const frontendEntries = [...presetScopes(web, 'services/**/*.{client,server,rsc}.ts'), ...presetScopes(web, 'services/**/*.rsc.tsx')]
  const policies: PresetPolicies = {}
  policies.moduleLayout = [
    ...context.folders.flatMap(({ path, folder, mode }) => [
      presetOverride([mode === 'flat' ? `${path}/*/**/${presetExtensions}` : `${path}/${presetExtensions}`, ...(mode === 'domain' ? [`${path}/*/*/**/${presetExtensions}`] : [])], {
        'arch/no-restricted-files': ['error', { message: mode === 'flat' ? 'This folder uses a flat layout; subfolders are forbidden.' : 'This folder uses exactly one owning domain directory; loose and deeper files are forbidden.' }],
      }),
      ...(mode === 'domain' ? [presetOverride([`${path}/*/${presetExtensions}`], {
        'arch/folder-prefix': ['error', { singularize: folder === 'components' ? 'trailing-s' : 'none', separators: ['.', '-'], ...(folder === 'hooks' ? { stripPrefixes: ['use-'] } : {}) }],
      })] : []),
    ]),
    presetOverride(
      presetScopes(web.filter((path) => !context.folders.some((scope) => scope.path === path + '/components')), `components/*/*/**/${presetExtensions}`),
      {
        'arch/no-restricted-files': [
          'error',
          { message: 'Components allow one group folder.' },
        ],
      },
      ui,
    ),
    presetOverride(
      [
        ...presetScopes(web, 'components/**/*.ts'),
        ...presetScopes(web, 'hooks/**/*.tsx'),
      ],
      {
        'arch/no-restricted-files': [
          'error',
          { message: 'Components use TSX; hooks use .ts files.' },
        ],
      },
      ui,
    ),
    presetOverride(
      presetScopes(web, '**/use-*.{ts,tsx}'),
      {
        'arch/no-restricted-files': [
          'error',
          { message: 'Hooks belong in src/hooks.' },
        ],
      },
      [...presetScopes(web, 'hooks/**'), ...ui],
    ),
    presetOverride(
      presetScopes(web, 'services/**/*.{ts,tsx}'),
      {
        'arch/no-restricted-files': [
          'error',
          {
            message: 'Frontend services use .client.ts, .server.ts or .rsc.{ts,tsx}; shared domain helpers use .utils.ts and values use .constants.ts.',
          },
        ],
      },
      ['**/*.{client,server,rsc,utils,constants}.ts', '**/*.rsc.tsx', ...conceptFiles],
    ),
  ]

  policies.serviceModules = [
    presetOverride(
      services,
      {
        'modules/service-functions': 'error',
        'arch/no-inline-types': [
          'error',
          {
            parameters: true,
            returns: true,
            functionTypes: true,
            minMembers: 1,
          },
        ],
      },
      [...utilities, ...testFiles, ...conceptFiles],
    ),
    presetOverride(
      frontendEntries,
      {
        'modules/service-functions': ['error', { frontend: true }],
      },
      testFiles,
    ),
    ...conceptFiles.map((pattern) => presetOverride(presetScopes(app, `services/${pattern}`), {
      'modules/service-functions': 'off',
      'arch/export-file-prefix': ['error', {
        stem: 'full-basename',
        allFunctions: true,
      }],
    }, testFiles)),
    presetOverride(
      [...presetScopes(app, 'services/**/*-{action,query}.*.ts'), ...presetScopes(web, 'services/**/*-{action,query}.*.rsc.tsx')],
      {
        'modules/service-functions': ['error', {
          allowLocalHelpers: true,
          singleExport: true,
          message: 'Action/query files export exactly one named operation. Keep helpers used only by this operation private inside its function; do not export them. Move a helper to the module\'s .utils.ts only when it is genuinely shared, not merely to satisfy lint.',
        }],
      },
      testFiles,
    ),
    presetOverride(
      presetScopes(backend, 'services/**/*.ts'),
      { 'modules/domain-constants': 'error' },
      [...utilities, ...testFiles],
    ),
    presetOverride(presetScopes(web, 'services/**/*.{ts,tsx}'), {
      'modules/domain-constants': ['error', { includeData: true }],
    }, ['**/*.constants.ts', ...testFiles]),
    presetOverride(frontendEntries, {
      'modules/domain-constants': ['error', { includeData: true, allowServiceMethods: true }],
    }, testFiles),
    presetOverride(
      [
        ...presetScopes(backend, 'services/**/*-{action,query}.*.ts'),
        ...frontendEntries,
      ],
      { 'arch/require-object-params': ['error', { maxParams: 2 }] },
      testFiles,
    ),
    presetOverride(frontendEntries, {
      'arch/require-object-params': ['error', { maxParams: 2, serviceMethods: true }],
    }, testFiles),
    presetOverride(
      presetScopes(backend, 'services/**/*.service.ts'),
      {
        'arch/no-extra-exports': [
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
      'arch/no-restricted-files': [
        'error',
        { message: 'Use domain-action.name.ts or domain-query.name.ts.' },
      ],
    }),
  ]

  policies.naming = [
    presetOverride([`**/${presetExtensions}`], presetNamingRules),
    presetOverride(presetScopes(app, 'types/**/*.ts'), {
      'arch/filename-match': [
        'error',
        {
          pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*[.]types[.]ts$',
          message: 'Use domain.types.ts filenames.',
        },
      ],
    }, ['**/*.constants.ts']),
    presetOverride(
      presetScopes(
        app,
        '**/*.{constants,utils,handler,service,types,client,server,rsc}.ts',
      ),
      { 'arch/export-file-prefix': ['error', presetExportPrefix] },
      [...ui, ...presetScopes(backend, 'entry.*.ts')],
    ),
    presetOverride(frontendEntries, {
      'arch/export-file-prefix': ['error', { ...presetExportPrefix, allFunctions: true, serviceMethods: true, allowPattern: '^\\*$' }],
    }, testFiles),
    presetOverride(presetScopes(web, 'services/**/*.constants.ts'), {
      'arch/export-file-prefix': ['error', { ...presetExportPrefix, allDeclarations: true, allowPattern: '^\\*$' }],
    }, testFiles),
    presetOverride(presetScopes(app, '**/*.utils.ts'), {
      'arch/export-file-prefix': ['error', {
        ...presetExportPrefix,
        allFunctions: true,
        allowPattern: '^\\*$',
      }],
    }, ui),
    presetOverride(hooks, {
      'arch/filename-match': [
        'error',
        {
          pattern: '^use-[a-z0-9]+(?:-[a-z0-9]+)*[.]ts$',
          message: 'Hooks use use-domain.ts filenames.',
        },
      ],
      'arch/export-file-prefix': 'error',
      'arch/export-name-pattern': [
        'error',
        { pattern: '^use[A-Z]', ignoreTypeExports: true },
      ],
    }),
    presetOverride(
      components,
      {
        'arch/only-export-components': [
          'error',
          { matchFileName: true, allowTypeExports: true },
        ],
      },
      [...ui, ...testFiles],
    ),
    presetOverride(presetScopes(web.filter((path) => !context.folders.some((scope) => scope.path === path + '/components')), 'components/**/*.tsx'), {
      'arch/folder-prefix': ['error', { singularize: 'trailing-s', separators: ['-'] }],
    }, [...ui, ...testFiles]),
    ...['action', 'query'].map((role) =>
      presetOverride([...presetScopes(app, `services/**/*-${role}.*.ts`), ...presetScopes(web, `services/**/*-${role}.*.rsc.tsx`)], {
        'arch/filename-match': [
          'error',
          {
            pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*-${role}\\.[a-z0-9]+(?:-[a-z0-9]+)*\\.ts$`,
            message: 'Use domain-action.name.ts or domain-query.name.ts.',
          },
        ],
        'arch/export-file-prefix': ['error', {
          ...presetExportPrefix,
          trailingRoles: [role],
          allFunctions: true,
          allowPattern: '^\\*$',
        }],
        'arch/filename-export-name': [
          'error',
          {
            file: `{domain}-${role}.{name}.ts`,
            export: `{domain}${role === 'action' ? 'Action' : 'Query'}{Name}`,
            placeholderPattern: '[a-z0-9-]+',
            camelCase: true,
          },
        ],
      }),
    ),
    ...['action', 'query'].flatMap((role) => ['client.ts', 'server.ts', 'rsc.ts', 'rsc.tsx'].map((suffix) =>
      presetOverride(presetScopes(web, `services/**/*-${role}.*.${suffix}`), {
        'arch/filename-match': ['error', {
          pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*-${role}\\.[a-z0-9]+(?:-[a-z0-9]+)*\\.${suffix.replace('.', '\\.')}$`,
          message: 'Frontend operations retain a client, server or rsc runtime suffix.',
        }],
        'arch/filename-export-name': ['error', {
          file: `{domain}-${role}.{name}.${suffix}`,
          export: `{domain}${role === 'action' ? 'Action' : 'Query'}{Name}`,
          placeholderPattern: '[a-z0-9-]+',
          camelCase: true,
        }],
      }),
    )),
    presetOverride(presetScopes(web, 'services/**/*.rsc.{ts,tsx}'), {
      'arch/export-name-pattern': [
        'error',
        { pattern: '^[a-z][a-z0-9]*Rsc[A-Z][a-zA-Z0-9]*$' },
      ],
    }, ['**/*-{action,query}.*.rsc.{ts,tsx}']),
  ]
  return policies
}
