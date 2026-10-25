import type { PresetContext, PresetPolicies } from '../types/preset.types.ts'
import { presetScopes, presetOverride } from '../utils/helpers/preset.ts'
import {
  presetReactRules,
  presetEffectsRules,
  presetTailwindRules,
  presetNextHandlerMethods,
  presetNextSegmentConfig,
  presetNextSegmentExports,
} from '../constants/preset.constants.ts'

export function presetReactConfig(context: PresetContext): PresetPolicies {
  const { options, web, tanstackWeb, nextWeb, webFiles, reactFiles, uiRoots, ui, testFiles, components, css } = context
  const policies: PresetPolicies = {}
  // Kit folders inside a web source keep the web-only shadcn and context exceptions.
  const webUi = uiRoots.filter((path) => web.some((root) => root === '.' || path === root || path.startsWith(root + '/')))
  if (reactFiles.length) {
    policies.react = [
      presetOverride(
        reactFiles,
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

  if (reactFiles.length) {
    policies.effects = [presetOverride(reactFiles, { ...presetEffectsRules, 'modules/empty-effect': 'error' }, ui)]
  }

  const nextPage = { bannedHooks: ['useState', 'useEffect', 'useMutation'], inspectExports: true }
  const routes = [
    ...(tanstackWeb.length
      ? [
          presetOverride(
            presetScopes(tanstackWeb, 'routes/**/*.{ts,tsx}'),
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
          presetOverride(presetScopes(tanstackWeb, 'routes/handlers/**/*.ts'), {
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
      : []),
    ...(nextWeb.length
      ? [
          presetOverride(
            presetScopes(nextWeb, 'app/**/{page,template,default,not-found,forbidden,unauthorized,loading}.tsx'),
            {
              'arch/route-surface': [
                'error',
                { exportName: 'default', allowedExports: presetNextSegmentExports, banIntrinsicJsx: true, ...nextPage },
              ],
            },
            [...testFiles, ...presetScopes(nextWeb, 'app/not-found.tsx')],
          ),
          // The root not-found renders its own document when the root layout only passes children through.
          presetOverride(
            [...presetScopes(nextWeb, 'app/**/{layout,global-not-found}.tsx'), ...presetScopes(nextWeb, 'app/not-found.tsx')],
            {
              'arch/route-surface': [
                'error',
                { exportName: 'default', allowedExports: presetNextSegmentExports, banIntrinsicJsx: false, ...nextPage },
              ],
            },
            testFiles,
          ),
          presetOverride(presetScopes(nextWeb, 'app/**/route.ts'), {
            'arch/route-surface': [
              'error',
              {
                exportName: 'GET',
                allowedExports: [...presetNextHandlerMethods.slice(1), ...presetNextSegmentConfig],
                bannedHooks: [],
                banIntrinsicJsx: false,
              },
            ],
            'arch/no-file-level-helpers': [
              'error',
              {
                detectComponents: false,
                allowPattern: `^(${[...presetNextHandlerMethods, ...presetNextSegmentConfig].join('|')})$`,
                message:
                  'Nest this helper in its owning route handler, or move genuine domain logic to a service. Do not create a component, hook or public helper to bypass this rule.',
              },
            ],
          }),
        ]
      : []),
  ]
  if (routes.length) {
    policies.routes = routes
  }

  if (reactFiles.length) {
    policies.forms = [
      presetOverride(
        reactFiles,
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

  if (reactFiles.length && options.react?.compiler !== false) {
    policies.memoization = [presetOverride(reactFiles, { 'modules/memoization': 'error' }, ui)]
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
                allowPathPatterns: [...presetScopes(web, 'context/'), ...webUi.map((path) => `${path}/`)],
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
            rule === 'tailwindcss/no-duplicate-classes' || rule === 'tailwindcss/no-unnecessary-whitespace'
              ? severity
              : [severity, { entryPoint }],
          ]),
        ),
      ),
    )
  }

  if (Object.keys(css).length && options.shadcn !== false) {
    const allow = ['layout', 'opacity', 'truncate']
    const padding = ['p', 'px', 'py', 'ps', 'pe', 'pt', 'pr', 'pb', 'pl']
    const gap = ['gap', 'gap-x', 'gap-y']
    const safeArea = padding.flatMap((group) =>
      ['top', 'right', 'bottom', 'left'].flatMap((side) => [
        `${group}-[env(safe-area-inset-${side})]`,
        ...(group === 'p' ? [] : [`${group}-[max(--spacing(*),env(safe-area-inset-${side}))]`]),
      ]),
    )
    const illustrationPalette = [
      'text-color',
      'bg-color',
      'gradient-from',
      'gradient-via',
      'gradient-to',
      'border-color',
      'divide-color',
      'outline-color',
      'ring-color',
      'ring-offset-color',
      'shadow',
      'shadow-color',
      'inset-shadow',
      'inset-shadow-color',
      'drop-shadow',
      'drop-shadow-color',
      'fill',
      'stroke',
      'bg-image',
      'bg-size',
      'bg-position',
      'mask-image',
      'blur',
      'saturate',
    ]
    // Illustrations extend the base allowance, so component contracts must be rebuilt on top of the palette.
    const restyle = (base: string[]) => ({
      allow: base,
      contracts: [
        { pattern: '^(CardContent|PopoverContent)$', allow: [...base, ...padding] },
        { pattern: '^TabsContent$', allow: [...base, ...gap, ...padding] },
        { pattern: '^(Tabs|HoverCardContent|SidebarHeader|BreadcrumbList)$', allow: [...base, ...gap] },
      ],
    })
    policies.shadcn = [
      presetOverride(
        webFiles,
        {
          'shadcn/no-restyle': ['error', restyle(allow)],
          'shadcn/no-arbitrary-values': ['error', { allow: ['layout', ...safeArea] }],
          'shadcn/require-static-classes': 'error',
          'modules/dynamic-classes': 'error',
        },
        ui,
      ),
      presetOverride(
        presetScopes(web, 'components/**/*.illustration.tsx'),
        {
          'shadcn/no-restyle': ['error', restyle([...allow, ...illustrationPalette])],
          'shadcn/no-arbitrary-values': ['error', { allow: ['layout', ...safeArea, ...illustrationPalette] }],
        },
        ui,
      ),
      presetOverride(webFiles, {
        'shadcn/no-unknown-classes': ['error', { allow: [] }],
      }),
      presetOverride(presetScopes(webUi, 'sonner.tsx'), {
        'shadcn/no-unknown-classes': ['error', { allow: ['toaster', 'toast'] }],
      }),
    ]
  }
  return policies
}
