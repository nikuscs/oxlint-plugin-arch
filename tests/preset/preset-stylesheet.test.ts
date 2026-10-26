import { describe, expect, it } from 'vitest'
import { testerPreset } from '../utils/tester.utils.ts'
import type { TesterPresetRow } from '../types/tester.types.ts'

describe('preset stylesheet', () => {
  const manifest = (name: string, dependencies: Record<string, string>, extra: object = {}) =>
    JSON.stringify({
      ...extra,
      name,
      dependencies,
    })

  const workspaces = JSON.stringify({ workspaces: ['apps/*', 'packages/*'] })
  const tailwind = '@import "tailwindcss";'

  it.each<TesterPresetRow>([
    {
      name: 'a Tailwind app.css wins over a plain styles.css',
      files: {
        'package.json': workspaces,
        'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }),
        'apps/web/src/app.css': tailwind,
        'apps/web/src/styles.css': 'body {}',
      },
      folders: {},
      file: 'apps/web/src/a.tsx',
      rule: 'tailwindcss/enforce-canonical',
      expected: ['error', { entryPoint: expect.stringMatching(/apps\/web\/src\/app\.css$/) }],
    },
    {
      name: 'a globals.css with @tailwind is the Tailwind entry',
      files: { 'package.json': workspaces, 'apps/site/package.json': manifest('site', { next: '1' }), 'apps/site/src/globals.css': '@tailwind base;' },
      folders: {},
      file: 'apps/site/src/a.tsx',
      rule: 'tailwindcss/enforce-canonical',
      expected: ['error', { entryPoint: expect.stringMatching(/globals\.css$/) }],
    },
    {
      name: 'a UI kit uses the stylesheet of the app that depends on it',
      tree: ['packages/ui/src/components/'],
      files: {
        'package.json': workspaces,
        'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1', ui: '1' }),
        'apps/web/src/app.css': tailwind,
        'apps/site/package.json': manifest('site', { next: '1' }),
        'apps/site/src/globals.css': tailwind,
        'packages/ui/package.json': manifest('ui', { react: '1' }),
      },
      folders: {},
      file: 'packages/ui/src/components/button.tsx',
      rule: 'tailwindcss/enforce-canonical',
      expected: ['error', { entryPoint: expect.stringMatching(/apps\/web\/src\/app\.css$/) }],
    },
    {
      name: 'a Tailwind import inside a CSS string is not an entry',
      files: {
        'package.json': workspaces,
        'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }),
        'apps/web/src/styles.css': 'body::before { content: \'@import "tailwindcss";\'; }',
        'apps/web/src/globals.css': tailwind,
      },
      folders: {},
      file: 'apps/web/src/a.tsx',
      rule: 'tailwindcss/enforce-canonical',
      expected: ['error', { entryPoint: expect.stringMatching(/globals\.css$/) }],
    },
    {
      name: 'an unquoted url() Tailwind import is an entry',
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }), 'apps/web/src/app.css': '@import url(tailwindcss);' },
      folders: {},
      file: 'apps/web/src/a.tsx',
      rule: 'tailwindcss/enforce-canonical',
      expected: ['error', { entryPoint: expect.stringMatching(/app\.css$/) }],
    },
    {
      name: 'a symlinked styles folder is searched',
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }), 'theme/styles.css': tailwind },
      symlinks: { 'apps/web/src/styles': '../../../theme' },
      folders: {},
      file: 'apps/web/src/a.tsx',
      rule: 'tailwindcss/enforce-canonical',
      expected: ['error', { entryPoint: expect.stringMatching(/styles\.css$/) }],
    },
    {
      name: 'a commented-out Tailwind import is not an entry',
      files: {
        'package.json': workspaces,
        'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }),
        'apps/web/src/styles.css': '/* @import "tailwindcss"; */',
        'apps/web/src/globals.css': tailwind,
      },
      folders: {},
      file: 'apps/web/src/a.tsx',
      rule: 'tailwindcss/enforce-canonical',
      expected: ['error', { entryPoint: expect.stringMatching(/globals\.css$/) }],
    },
    {
      name: 'a Tailwind plugin import is not an entry',
      files: {
        'package.json': workspaces,
        'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }),
        'apps/web/src/styles.css': '@import "tailwindcss-animate";',
        'apps/web/src/globals.css': tailwind,
      },
      folders: {},
      file: 'apps/web/src/a.tsx',
      rule: 'tailwindcss/enforce-canonical',
      expected: ['error', { entryPoint: expect.stringMatching(/globals\.css$/) }],
    },
    {
      name: 'a url() Tailwind import is an entry',
      files: { 'package.json': workspaces, 'apps/web/package.json': manifest('web', { '@tanstack/react-start': '1' }), 'apps/web/src/app.css': '@import url("tailwindcss");' },
      folders: {},
      file: 'apps/web/src/a.tsx',
      rule: 'tailwindcss/enforce-canonical',
      expected: ['error', { entryPoint: expect.stringMatching(/app\.css$/) }],
    },
  ])('$name', (row) => {
    expect({ value: testerPreset(row) }).toMatchObject({ value: row.expected })
  })
})
