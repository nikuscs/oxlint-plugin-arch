import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { preset, PresetError, recipes } from '../../src/preset/preset.ts'
import { testerPreset } from '../utils/tester.utils.ts'
import type { PresetFolders } from '../../src/types/preset.types.ts'
import type { TesterPresetRow } from '../types/tester.types.ts'

describe('preset folders', () => {
  const root = resolve(import.meta.dirname, '../..')

  it.each<TesterPresetRow>([
    {
      name: 'a listed file name passes the strict check',
      tree: ['apps/server/src/services/order/'],
      folders: { 'apps/server': { ...recipes.backend, layout: { strict: true, files: ['*.prompts.ts'] } } },
      file: 'apps/server/src/services/order/order.prompts.ts',
      rule: 'arch/naming-file',
      expected: expect.arrayContaining([expect.objectContaining({ pattern: expect.stringContaining('[a-z0-9]+(?:-[a-z0-9]+)*[.]prompts[.]ts') })]),
    },
    {
      name: 'a listed file kind gets the export name check',
      tree: ['apps/server/src/services/order/'],
      folders: { 'apps/server': { ...recipes.backend, layout: { strict: true, files: ['*.prompts.ts'] } } },
      file: 'apps/server/src/services/order/order.prompts.ts',
      rule: 'arch/naming-exports',
      expected: ['error', { stem: 'full-basename', scope: 'functions' }],
    },
    {
      name: 'a listed file kind is exempt from service functions',
      tree: ['apps/server/src/services/order/'],
      folders: { 'apps/server': { ...recipes.backend, layout: { strict: true, files: ['*.prompts.ts'] } } },
      file: 'apps/server/src/services/order/order.prompts.ts',
      rule: 'arch/backend-service-functions',
      expected: 'off',
    },
    {
      name: 'a listed file kind is private to its domain',
      tree: ['apps/server/src/services/order/'],
      folders: { 'apps/server': { ...recipes.backend, layout: { strict: true, files: ['*.prompts.ts'] } } },
      file: 'apps/server/src/services/order/order.prompts.ts',
      rule: 'arch/boundaries-imports',
      expected: ['error', { roles: ['prompts'] }],
    },
    {
      name: 'a removed built-in file name fails the strict check',
      tree: ['apps/server/src/services/order/'],
      folders: { 'apps/server': { ...recipes.backend, layout: { strict: true, files: ['!*.utils.ts'] } } },
      file: 'apps/server/src/services/order/order.utils.ts',
      rule: 'arch/naming-file',
      expected: expect.arrayContaining([expect.objectContaining({ pattern: expect.not.stringContaining('[.]utils[.]ts') })]),
    },
    {
      name: 'a nested folder adds to the root file names',
      tree: ['apps/server/src/services/order/'],
      folders: { '.': { layout: { files: ['*.prompts.ts'] } }, 'apps/server': { ...recipes.backend, layout: { strict: true, files: ['*.gateway.ts'] } } },
      file: 'apps/server/src/services/order/order.gateway.ts',
      rule: 'arch/naming-file',
      expected: expect.arrayContaining([expect.objectContaining({ pattern: expect.stringMatching(/\[\.\]prompts\[\.\]ts.*\[\.\]gateway\[\.\]ts/) })]),
    },
    {
      name: 'a file name listed on one backend is not allowed in another',
      tree: ['apps/server/src/services/order/', 'apps/api/src/services/order/'],
      folders: { 'apps/server': { ...recipes.backend, layout: { strict: true, files: ['*.prompts.ts'] } }, 'apps/api': { ...recipes.backend, layout: { strict: true } } },
      file: 'apps/api/src/services/order/order.prompts.ts',
      rule: 'arch/naming-file',
      expected: expect.arrayContaining([expect.objectContaining({ pattern: expect.not.stringContaining('prompts') })]),
    },
    {
      name: 'a file name of another shape passes the strict check',
      tree: ['apps/server/src/services/order/'],
      folders: { 'apps/server': { ...recipes.backend, layout: { strict: true, files: ['*-tool.*.ts'] } } },
      file: 'apps/server/src/services/order/order-tool.search.ts',
      rule: 'arch/naming-file',
      expected: expect.arrayContaining([expect.objectContaining({ pattern: expect.stringContaining('[a-z0-9]+(?:-[a-z0-9]+)*-tool[.][a-z0-9]+(?:-[a-z0-9]+)*[.]ts') })]),
    },
    {
      name: 'a file name of another shape adds no role',
      tree: ['apps/server/src/services/order/'],
      folders: { 'apps/server': { ...recipes.backend, layout: { strict: true, files: ['*-tool.*.ts'] } } },
      file: 'apps/server/src/services/order/order-tool.search.ts',
      rule: 'arch/boundaries-imports',
      expected: ['error', { roles: [] }],
    },
    {
      name: 'a folder alone and inside a list merge',
      folders: { 'src/rules': { rules: { eqeqeq: 'warn' } }, 'src/{rules,preset}': { rules: { curly: 'off' } } },
      file: 'src/rules/a.ts',
      rule: 'eqeqeq',
      expected: 'warn',
    },
    {
      name: 'a folder inside a list merges over the folder alone in config order',
      folders: { 'src/rules': { rules: { eqeqeq: 'warn' } }, 'src/{rules,preset}': { rules: { eqeqeq: 'off' } } },
      file: 'src/rules/a.ts',
      rule: 'eqeqeq',
      expected: 'off',
    },
  ])('$name', (row) => {
    expect({ value: testerPreset(row) }).toMatchObject({ value: row.expected })
  })

  it.each<{ name: string; folders: unknown; message: string }>([
    { name: 'the removed layout suffixes option fails', folders: { src: { layout: { suffixes: ['prompts'] } } }, message: 'Unknown option `layout.suffixes`.' },
    {
      name: 'a layout file name with a folder fails',
      folders: { src: { layout: { files: ['prompts/*.ts'] } } },
      message: 'layout.files takes file names such as `*.prompts.ts`; `!*.utils.ts` removes one.',
    },
    { name: 'two folders written alone twice still fail', folders: { 'src/rules': true, './src/rules': true }, message: 'Folder `src/rules` is listed twice.' },
  ])('$name', ({ folders, message }) => {
    // SAFETY: these rows hold invalid folder maps on purpose; preset() validates its input at runtime.
    expect(() => preset({ root, folders: folders as PresetFolders })).toThrow(new PresetError(message))
  })
})
