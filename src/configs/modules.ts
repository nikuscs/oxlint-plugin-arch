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
  } = context
  const policies: PresetPolicies = {}
  policies.moduleLayout = [
    presetOverride(presetScopes(app, `services/*/*/**/${presetExtensions}`), {
      'arch/no-restricted-files': [
        'error',
        { message: 'Services allow at most one domain folder.' },
      ],
    }),
    presetOverride(
      presetScopes(web, `components/*/*/**/${presetExtensions}`),
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
        ...presetScopes(web, 'hooks/*/**'),
      ],
      {
        'arch/no-restricted-files': [
          'error',
          { message: 'Components use TSX; hooks are flat .ts files.' },
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
            message: 'Frontend services use .client.ts, .server.ts or .rsc.ts.',
          },
        ],
      },
      ['**/*.{client,server,rsc,utils,constants}.ts'],
    ),
  ]

  policies.serviceModules = [
    presetOverride(
      services,
      {
        'modules/service-functions': 'error',
        'modules/domain-constants': 'error',
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
      [...utilities, ...testFiles],
    ),
    presetOverride(
      [
        ...presetScopes(backend, 'services/**/*-{action,query}.*.ts'),
        ...presetScopes(web, 'services/**/*.{client,server,rsc}.ts'),
      ],
      { 'arch/require-object-params': ['error', { maxParams: 2 }] },
      testFiles,
    ),
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
        'arch/folder-prefix': [
          'error',
          { singularize: 'trailing-s', separators: ['-'] },
        ],
        'arch/only-export-components': [
          'error',
          { matchFileName: true, allowTypeExports: true },
        ],
      },
      [...ui, ...testFiles],
    ),
    ...['action', 'query'].map((role) =>
      presetOverride(presetScopes(backend, `services/**/*-${role}.*.ts`), {
        'arch/filename-match': [
          'error',
          {
            pattern: `^[a-z0-9]+(?:-[a-z0-9]+)*-${role}\\.[a-z0-9]+(?:[-.][a-z0-9]+)*\\.ts$`,
            message: 'Use domain-action.name.ts or domain-query.name.ts.',
          },
        ],
        'arch/filename-export-name': [
          'error',
          {
            file: `{domain}-${role}.{name}.ts`,
            export: `{domain}${role === 'action' ? 'Action' : 'Query'}{Name}`,
            placeholderPattern: '[a-z0-9-]+',
          },
        ],
      }),
    ),
    presetOverride(presetScopes(web, 'services/**/*.rsc.ts'), {
      'arch/export-name-pattern': [
        'error',
        { pattern: '^[a-z][a-z0-9]*Rsc[A-Z][a-zA-Z0-9]*$' },
      ],
    }),
  ]
  return policies
}
