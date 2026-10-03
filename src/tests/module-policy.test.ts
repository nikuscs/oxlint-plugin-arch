import { test } from 'vitest'
import { directives } from '../rules/module-policy/reasoned-directives.ts'
import { serviceTypes } from '../rules/module-policy/service-types.ts'
import { serviceFunctions } from '../rules/module-policy/service-functions.ts'
import { testModifiers } from '../rules/module-policy/test-modifiers.ts'
import { memoization } from '../rules/module-policy/memoization.ts'
import { importBoundaries } from '../rules/module-policy/import-boundaries.ts'
import { createRuleTester } from './rule-tester.ts'

const boundaryOptions = {
  web: ['/repo/apps/web/src'],
  backend: ['/repo/apps/server/src'],
  packages: '/repo/packages',
  appPackages: ['@app/web', '@app/server'],
  backendPackages: ['@app/server'],
  aliases: { '@backend': '/repo/apps/server/src' },
  publicEntrypoints: ['@app/server/client'],
}

test('service types allow only the matching factory-derived alias', () => {
  createRuleTester().run('modules/service-types', serviceTypes, {
    valid: ['export type ChatService = ReturnType<typeof makeChatService>'],
    invalid: [
      { code: 'interface ChatDeps {}', errors: [{ messageId: 'domain' }] },
      {
        code: 'type ChatService = ReturnType<typeof makeOtherService>',
        errors: [{ messageId: 'domain' }],
      },
    ],
  })
})

test('service operations exclude private helpers but retain inline callbacks', () => {
  createRuleTester().run('modules/service-functions', serviceFunctions, {
    valid: [
      'export function chatActionSend() { return items.map(item => item.id) }',
    ],
    invalid: [
      {
        code: 'const privateHelper = () => 1',
        errors: [{ messageId: 'helper' }],
      },
      {
        code: 'export function chatActionSend() { function helper() {} }',
        errors: [{ messageId: 'helper' }],
      },
    ],
  })
})

test('test modifiers recognize renamed test imports', () => {
  createRuleTester().run('modules/test-modifiers', testModifiers, {
    valid: ["import { test as check } from 'vitest'; check('works', () => {})"],
    invalid: [
      {
        code: "import { test as check } from 'vitest'; check.only('works', () => {})",
        errors: [{ messageId: 'modifier' }],
      },
    ],
  })
})

test('lint exceptions require both a rule name and a reason', () => {
  createRuleTester().run('modules/reasoned-directives', directives, {
    valid: [
      '// oxlint-disable-next-line no-console -- CLI output is intentional.\nconsole.log(1)',
    ],
    invalid: [
      {
        code: '// oxlint-disable-next-line -- No named rule.\nconsole.log(1)',
        errors: [{ messageId: 'directive' }],
      },
      {
        code: '// oxlint-disable-next-line no-console\nconsole.log(1)',
        errors: [{ messageId: 'directive' }],
      },
    ],
  })
})

test('manual memoization recognizes React imports without banning unrelated methods', () => {
  createRuleTester().run('modules/memoization', memoization, {
    valid: ['cache.memo(value)'],
    invalid: [
      {
        code: "import { useMemo as cache } from 'react'",
        errors: [{ messageId: 'memo' }],
      },
      {
        code: "import * as UI from 'react'; UI.memo(Component)",
        errors: [{ messageId: 'memo' }],
      },
    ],
  })
})

test('import boundaries cover aliases, public entries and package direction', () => {
  createRuleTester().run('modules/import-boundaries', importBoundaries, {
    valid: [
      {
        filename: '/repo/apps/web/src/types/chat.types.ts',
        code: "import type { Chat } from '@app/server/client'",
        options: [boundaryOptions],
      },
    ],
    invalid: [
      {
        filename: '/repo/apps/web/src/types/chat.types.ts',
        code: "import type { Chat } from '@backend/types/chat.types'",
        options: [boundaryOptions],
        errors: [{ messageId: 'boundary' }],
      },
      {
        filename: '/repo/packages/logger/src/index.ts',
        code: "import { chat } from '@app/web/internal'",
        options: [boundaryOptions],
        errors: [{ messageId: 'boundary' }],
      },
    ],
  })
})
