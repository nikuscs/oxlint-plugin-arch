import { presetIllustrationPalette } from '../preset.constants.ts'
import { presetOverride, presetScopes } from '../preset.utils.ts'
import type { PresetBuilder } from '../../types/preset.types.ts'

export const shadcnGroup: PresetBuilder<'shadcn'> = (project) => {
  const { web, webFiles, ui, webUiRoots } = project
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

  if (Object.keys(project.css).length === 0) {
    return []
  }

  return [
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
    presetOverride(presetScopes(webUiRoots, 'sonner.tsx'), { 'shadcn/no-unknown-classes': ['error', { allow: ['toaster', 'toast'] }] }),
  ]
}
