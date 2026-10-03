import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetScopes, presetOverride } from '../utils/helpers/preset.ts'
import {
  presetReactRules,
  presetEffectsRules,
  presetTailwindRules,
} from '../constants/preset.constants.ts'

export function presetReactConfig(context: PresetContext): PresetPolicies {
  const {
    options,
    web,
    webFiles,
    ui,
    testFiles,
    components,
    css,
  } = context
  const policies: PresetPolicies = {}
  if (web.length) {
    policies.reactRules = [
      presetOverride(
        webFiles,
        {
          ...presetReactRules,
          'arch/jsx-attributes-multiline': ['error', { minAttributes: 3 }],
        },
        ui,
      ),
      presetOverride(
        components,
        {
          'arch/no-file-level-helpers': [
            'error',
            { detectComponents: true, hookPattern: '^use[A-Z]' },
          ],
        },
        [...ui, ...testFiles],
      ),
    ]
  }

  if (web.length) {
    policies.effects = [
      presetOverride(
        webFiles,
        { ...presetEffectsRules, 'modules/empty-effect': 'error' },
        ui,
      ),
    ]
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
        'arch/no-file-level-helpers': ['error', { detectComponents: false }],
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
              require: options.formResolver ?? 'standardSchemaResolver',
            },
          ],
        },
        ui,
      ),
    ]
  }

  if (web.length && options.reactCompiler !== false) {
    policies.memoization = [
      presetOverride(webFiles, { 'modules/memoization': 'error' }, ui),
    ]
  }

  if (web.length) {
    policies.clientOwnership = [
      presetOverride(webFiles, {
        'arch/no-restricted-token': [
          'error',
          {
            restrictions: [
              {
                token: 'RouterClient',
                allowIn: [
                  options.rpcClient ?? web[0] + '/services/rpc.client.ts',
                ],
              },
              {
                token: 'createContext',
                allowPathPatterns: [
                  ...presetScopes(web, 'context/'),
                  ...presetScopes(web, 'components/ui/'),
                ],
              },
            ],
          },
        ],
      }),
    ]
  }

  if (css) {
    policies.tailwindRules = [presetOverride(webFiles, presetTailwindRules)]
  }

  if (css && options.shadcn !== false) {
    policies.shadcnRules = [
      presetOverride(
        webFiles,
        {
          'shadcn/no-restyle': ['error', { allow: ['layout'] }],
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
