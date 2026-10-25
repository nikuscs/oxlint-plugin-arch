import {
  presetEffectsRules,
  presetIllustrationPalette,
  presetNextHandlerMethods,
  presetNextSegmentConfig,
  presetNextSegmentExports,
  presetReactRules,
  presetTailwindRules,
} from './preset.constants.ts'
import { presetOverride, presetScopes } from './preset.utils.ts'
import type { PresetContext, PresetPolicies, PresetRules } from '../types/preset.types.ts'

export function presetReactConfig(context: PresetContext): PresetPolicies {
  const { options, web, tanstackWeb, nextWeb, webFiles, reactFiles, webUiRoots, ui, testFiles, components, css } = context
  const policies: PresetPolicies = {}
  const compilerOff = options.react?.compiler === false
  const bannedHooks = ['useState', 'useEffect', 'useMutation']

  if (reactFiles.length) {
    const reactRules: PresetRules = { ...presetReactRules, 'arch/layout-jsx-attributes': ['error', { minAttributes: 3 }] }

    if (compilerOff) {
      for (const rule of ['new-object', 'new-array', 'new-function', 'jsx']) {
        reactRules[`react-perf/jsx-no-${rule}-as-prop`] = 'error'
      }
    }

    policies.react = [
      presetOverride(reactFiles, reactRules, ui),
      presetOverride(
        components,
        { 'arch/files-helpers': ['error', { detectComponents: true, hookPattern: '^use[A-Z]' }] },
        [...ui, ...testFiles],
      ),
    ]
    policies.effects = [presetOverride(reactFiles, { ...presetEffectsRules, 'arch/react-empty-effect': 'error' }, ui)]
    policies.forms = [
      presetOverride(
        reactFiles,
        {
          'arch/code-paired-call': [
            'error',
            { when: 'useForm', require: options.forms?.schemaResolver ?? 'standardSchemaResolver' },
          ],
        },
        ui,
      ),
    ]
  }

  if (reactFiles.length && !compilerOff) {
    policies.memoization = [presetOverride(reactFiles, { 'arch/react-memo': 'error' }, ui)]
  }

  const routes = []

  if (tanstackWeb.length) {
    routes.push(
      presetOverride(
        presetScopes(tanstackWeb, 'routes/**/*.{ts,tsx}'),
        { 'arch/files-route': ['error', { exportName: 'Route', bannedHooks, banIntrinsicJsx: true }] },
        testFiles,
      ),
      presetOverride(presetScopes(tanstackWeb, 'routes/handlers/**/*.ts'), {
        'arch/files-helpers': [
          'error',
          {
            detectComponents: false,
            message: 'Nest this helper in its owning route handler callback, or move genuine domain logic to a service. Do not create a component, hook or public helper to bypass this rule.',
          },
        ],
      }),
    )
  }

  if (nextWeb.length) {
    const page = { exportName: 'default', allowedExports: presetNextSegmentExports, bannedHooks, inspectExports: true }
    routes.push(
      presetOverride(
        presetScopes(nextWeb, 'app/**/{page,template,default,not-found,forbidden,unauthorized,loading}.tsx'),
        { 'arch/files-route': ['error', { ...page, banIntrinsicJsx: true }] },
        [...testFiles, ...presetScopes(nextWeb, 'app/not-found.tsx')],
      ),
      presetOverride(
        [...presetScopes(nextWeb, 'app/**/{layout,global-not-found}.tsx'), ...presetScopes(nextWeb, 'app/not-found.tsx')],
        { 'arch/files-route': ['error', { ...page, banIntrinsicJsx: false }] },
        testFiles,
      ),
      presetOverride(presetScopes(nextWeb, 'app/**/route.ts'), {
        'arch/files-route': [
          'error',
          {
            exportName: 'GET',
            allowedExports: [...presetNextHandlerMethods.slice(1), ...presetNextSegmentConfig],
            bannedHooks: [],
            banIntrinsicJsx: false,
          },
        ],
        'arch/files-helpers': [
          'error',
          {
            detectComponents: false,
            allowPattern: `^(${[...presetNextHandlerMethods, ...presetNextSegmentConfig].join('|')})$`,
            message: 'Nest this helper in its owning route handler, or move genuine domain logic to a service. Do not create a component, hook or public helper to bypass this rule.',
          },
        ],
      }),
    )
  }

  if (routes.length) {
    policies.routes = routes
  }

  if (web.length) {
    policies.rpcClientOwnership = [
      presetOverride(webFiles, {
        'arch/boundaries-token-owner': [
          'error',
          {
            restrictions: [
              { token: 'RouterClient', allowIn: [...context.rpcClients] },
              {
                token: 'createContext',
                allowPathPatterns: [...presetScopes(web, 'context/'), ...webUiRoots.map((path) => `${path}/`)],
              },
            ],
          },
        ],
      }),
    ]
  }

  const stylesheets = Object.entries(css)

  if (stylesheets.length) {
    policies.tailwind = stylesheets.map(([path, entryPoint]) =>
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

  if (!stylesheets.length || options.shadcn === false) {
    return policies
  }

  const allow = ['layout', 'opacity', 'truncate']
  const padding = ['p', 'px', 'py', 'ps', 'pe', 'pt', 'pr', 'pb', 'pl']
  const gap = ['gap', 'gap-x', 'gap-y']

  const safeArea = padding.flatMap((group) =>
    ['top', 'right', 'bottom', 'left'].flatMap((side) => [
      `${group}-[env(safe-area-inset-${side})]`,
      ...(group === 'p' ? [] : [`${group}-[max(--spacing(*),env(safe-area-inset-${side}))]`]),
    ]),
  )

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
        'arch/react-dynamic-classes': 'error',
      },
      ui,
    ),
    presetOverride(
      presetScopes(web, 'components/**/*.illustration.tsx'),
      {
        'shadcn/no-restyle': ['error', restyle([...allow, ...presetIllustrationPalette])],
        'shadcn/no-arbitrary-values': ['error', { allow: ['layout', ...safeArea, ...presetIllustrationPalette] }],
      },
      ui,
    ),
    presetOverride(webFiles, { 'shadcn/no-unknown-classes': ['error', { allow: [] }] }),
    presetOverride(presetScopes(webUiRoots, 'sonner.tsx'), {
      'shadcn/no-unknown-classes': ['error', { allow: ['toaster', 'toast'] }],
    }),
  ]

  return policies
}
