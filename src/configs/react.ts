import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetScopes, presetOverride } from '../utils/helpers/preset.ts'
import { presetReactRules, presetEffectsRules, presetTailwindRules } from '../constants/preset.constants.ts'

export function presetReactConfig(context: PresetContext): PresetPolicies {
  const { options, web, webFiles, ui, testFiles, components, css } = context
  const policies: PresetPolicies = {}
  if (web.length) {
    policies.react = [
      presetOverride(
        webFiles,
        {
          ...presetReactRules,
          ...(options.react?.compiler === false
            ? ({
                'react-perf/jsx-no-new-object-as-prop': 'error',
                'react-perf/jsx-no-new-array-as-prop': 'error',
                'react-perf/jsx-no-new-function-as-prop': 'error',
                'react-perf/jsx-no-jsx-as-prop': 'error',
              } as const)
            : {}),
          'arch/jsx-attributes-multiline': ['error', { minAttributes: 3 }],
        },
        ui,
      ),
      presetOverride(
        components,
        {
          'arch/no-file-level-helpers': ['error', { detectComponents: true, hookPattern: '^use[A-Z]' }],
        },
        [...ui, ...testFiles],
      ),
    ]
  }

  if (web.length) {
    policies.effects = [presetOverride(webFiles, { ...presetEffectsRules, 'modules/empty-effect': 'error' }, ui)]
  }

  if (web.length) {
    policies.routes = [
      presetOverride(
        presetScopes(web, 'routes/**/*.{ts,tsx}'),
        {
          'arch/route-surface': [
            'error',
            {
              exportName: 'Route',
              bannedHooks: ['useState', 'useEffect', 'useMutation'],
              banIntrinsicJsx: true,
            },
          ],
        },
        testFiles,
      ),
      presetOverride(presetScopes(web, 'routes/handlers/**/*.ts'), {
        'arch/no-file-level-helpers': [
          'error',
          {
            detectComponents: false,
            message:
              'Nest this helper in its owning route handler callback, or move genuine domain logic to a service. Do not create a component, hook or public helper to bypass this rule.',
          },
        ],
      }),
    ]
  }

  if (web.length) {
    policies.forms = [
      presetOverride(
        webFiles,
        {
          'arch/require-paired-call': [
            'error',
            {
              when: 'useForm',
              require: options.forms?.schemaResolver ?? 'standardSchemaResolver',
            },
          ],
        },
        ui,
      ),
    ]
  }

  if (web.length && options.react?.compiler !== false) {
    policies.memoization = [presetOverride(webFiles, { 'modules/memoization': 'error' }, ui)]
  }

  if (web.length) {
    policies.rpcClientOwnership = [
      presetOverride(webFiles, {
        'arch/no-restricted-token': [
          'error',
          {
            restrictions: [
              {
                token: 'RouterClient',
                allowIn: [...(options.orpc?.clientOwnerFile ? [options.orpc?.clientOwnerFile] : context.rpcClients)],
              },
              {
                token: 'createContext',
                allowPathPatterns: [...presetScopes(web, 'context/'), ...presetScopes(web, 'components/ui/')],
              },
            ],
          },
        ],
      }),
    ]
  }

  if (Object.keys(css).length) {
    policies.tailwind = Object.entries(css).map(([path, entryPoint]) =>
      presetOverride(
        presetScopes([path]),
        Object.fromEntries(
          Object.entries(presetTailwindRules).map(([rule, severity]) => [
            rule,
            [
              severity,
              {
                entryPoint,
                rootFontSize: options.tailwind === false ? 16 : (options.tailwind?.rootFontSize ?? 16),
              },
            ],
          ]),
        ),
      ),
    )
  }

  if (Object.keys(css).length && options.shadcn !== false) {
    policies.shadcn = [
      presetOverride(
        webFiles,
        {
          'shadcn/no-restyle': ['error', { allow: ['layout', 'opacity'] }],
          'shadcn/no-arbitrary-values': ['error', { allow: ['layout'] }],
          'shadcn/require-static-classes': 'error',
          'modules/dynamic-classes': 'error',
        },
        ui,
      ),
      presetOverride(webFiles, {
        'shadcn/no-unknown-classes': ['error', { allow: [] }],
      }),
    ]
  }
  return policies
}
