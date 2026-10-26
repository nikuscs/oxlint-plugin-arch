import { describe, expect, it } from 'vitest'
import { recipes } from '../../src/preset/preset.ts'
import { testerPreset } from '../utils/tester.utils.ts'
import type { TesterPresetRow } from '../types/tester.types.ts'

describe('preset units', () => {
  const manifest = (name: string, dependencies: Record<string, string>, extra: object = {}) =>
    JSON.stringify({
      ...extra,
      name,
      dependencies,
    })

  const workspaces = JSON.stringify({ workspaces: ['apps/*', 'packages/*'] })

  it.each<TesterPresetRow>([
    {
      name: 'a vinext root package picks the next recipe',
      tree: ['src/app/'],
      files: { 'package.json': manifest('site', { vinext: '1' }) },
      folders: {},
      file: 'src/app/page.tsx',
      rule: 'arch/files-route',
      expected: ['error', { export: 'default' }],
    },
    {
      name: 'a folder without a package.json is not a unit',
      files: { 'package.json': workspaces, 'apps/native/Cargo.toml': '' },
      folders: {},
      file: 'apps/native/src/a.ts',
      rule: 'arch/schemas-local',
      expected: undefined,
    },
    {
      name: 'a nested workspace glob finds its packages',
      tree: ['apps/group/web/src/routes/'],
      files: { 'package.json': JSON.stringify({ workspaces: ['apps/*/*'] }), 'apps/group/web/package.json': manifest('web', { '@tanstack/react-start': '1' }) },
      folders: {},
      file: 'apps/group/web/src/routes/index.tsx',
      rule: 'arch/files-route',
      expected: ['error', { export: 'Route' }],
    },
    {
      name: 'a root app with workspace packages keeps its own recipe',
      tree: ['src/app/', 'packages/lib/src/'],
      files: { 'package.json': manifest('site', { next: '1' }, { workspaces: ['packages/*'] }), 'packages/lib/package.json': manifest('lib', {}) },
      folders: {},
      file: 'src/app/page.tsx',
      rule: 'arch/files-route',
      expected: ['error', { export: 'default' }],
    },
    {
      name: 'a workspace package next to a root app is its own unit',
      tree: ['src/app/', 'packages/lib/src/'],
      files: { 'package.json': manifest('site', { next: '1' }, { workspaces: ['packages/*'] }), 'packages/lib/package.json': manifest('lib', {}) },
      folders: {},
      file: 'packages/lib/src/order.utils.ts',
      rule: 'arch/naming-exports',
      expected: ['error', expect.objectContaining({ scope: 'functions' })],
    },
    {
      name: 'a package next to a root app keeps its own kind',
      tree: ['src/app/', 'packages/lib/src/app/'],
      files: { 'package.json': manifest('site', { next: '1' }, { workspaces: ['packages/*'] }), 'packages/lib/package.json': manifest('lib', {}) },
      folders: {},
      file: 'packages/lib/src/app/page.tsx',
      rule: 'arch/files-route',
      expected: undefined,
    },
    {
      name: 'a wildcard package key next to a root app stays a unit',
      tree: ['src/app/', 'packages/lib/src/'],
      files: { 'package.json': manifest('site', { next: '1' }, { workspaces: ['packages/*'] }), 'packages/lib/package.json': manifest('lib', {}) },
      folders: { '.': recipes.next, 'packages/*': recipes.library },
      detect: false,
      file: 'packages/lib/src/order.utils.ts',
      rule: 'arch/naming-exports',
      expected: ['error', expect.objectContaining({ scope: 'functions' })],
    },
    {
      name: 'a root React app with workspaces keeps its recipe',
      tree: ['src/components/', 'packages/lib/src/'],
      files: { 'package.json': manifest('site', { react: '1' }, { workspaces: ['packages/*'] }), 'packages/lib/package.json': manifest('lib', {}) },
      folders: {},
      file: 'src/a.tsx',
      rule: 'arch/react-memo',
      expected: 'error',
    },
    {
      name: 'a root backend with workspaces keeps its recipe',
      tree: ['src/services/order/', 'packages/lib/src/'],
      files: { 'package.json': manifest('server', { hono: '1' }, { workspaces: ['packages/*'] }), 'packages/lib/package.json': manifest('lib', {}) },
      folders: {},
      file: 'src/services/order/order-query.list.ts',
      rule: 'arch/boundaries-deny',
      expected: ['error', { calls: { insertInto: 'Query files only read; move writes to an action.' } }],
    },
    {
      name: 'a nested workspace package is its own unit',
      tree: ['packages/lib/src/', 'packages/lib/examples/demo/app/'],
      files: {
        'package.json': JSON.stringify({ workspaces: ['packages/*', 'packages/*/examples/*'] }),
        'packages/lib/package.json': manifest('lib', {}),
        'packages/lib/examples/demo/package.json': manifest('demo', { next: '1' }),
      },
      folders: {},
      file: 'packages/lib/examples/demo/app/page.tsx',
      rule: 'arch/files-route',
      expected: ['error', { export: 'default' }],
    },
    {
      name: 'a root library package gets the library recipe',
      tree: ['src/'],
      files: { 'package.json': manifest('lib', { zod: '1' }) },
      folders: {},
      file: 'src/a.ts',
      rule: 'arch/schemas-local',
      expected: ['error', { packages: ['zod'] }],
    },
    {
      name: 'a root library keeps its recipe next to a scripts folder',
      tree: ['src/', 'scripts/'],
      files: { 'package.json': manifest('lib', { zod: '1' }) },
      folders: {},
      file: 'src/a.ts',
      rule: 'arch/schemas-local',
      expected: ['error', { packages: ['zod'] }],
    },
    {
      name: 'a workspace app without src uses its own folder as source',
      tree: ['apps/site/app/'],
      files: { 'package.json': workspaces, 'apps/site/package.json': manifest('site', { next: '1' }) },
      folders: {},
      file: 'apps/site/app/page.tsx',
      rule: 'arch/files-route',
      expected: ['error', { export: 'default' }],
    },
    {
      name: 'a dotted package folder is a valid unit',
      tree: ['packages/my.lib/src/'],
      files: { 'package.json': workspaces, 'packages/my.lib/package.json': manifest('my.lib', {}) },
      folders: {},
      file: 'packages/my.lib/src/a.ts',
      rule: 'arch/schemas-local',
      expected: ['error', { packages: ['zod'] }],
    },
  ])('$name', (row) => {
    expect({ value: testerPreset(row) }).toMatchObject({ value: row.expected })
  })
})
