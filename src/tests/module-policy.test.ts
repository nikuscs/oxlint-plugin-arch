import { test } from 'vitest'
import { directives } from '../rules/module-policy/reasoned-directives.ts'
import { serviceTypes } from '../rules/module-policy/service-types.ts'
import { serviceFunctions } from '../rules/module-policy/service-functions.ts'
import { domainConstants } from '../rules/module-policy/domain-constants.ts'
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

test('frontend service modules expose multiple operations with only operation-local helpers', () => {
  const options = [{ frontend: true }]
  createRuleTester().run('modules/service-functions', serviceFunctions, {
    valid: [
      { options, code: 'export function chatRead() { function chatNormalize() { return 1 } return chatNormalize() + 1 } export function chatWrite() { const chatSave = () => 2; return chatSave() + 1 }' },
      { options, code: 'const chatRead = () => { const chatNormalize = () => 1; return chatNormalize() + 2 }; export { chatRead }; export const chatWrite = function () { function chatFormat() { return 2 } return chatFormat() + 1 }' },
      { options, code: 'export function chatCreateService() { const state = new Map(); function chatRead() { return state.size } return { read: chatRead } } export const chatService = chatCreateService()' },
      { options, code: 'export function chatRead() { function chatOuter() { const chatInner = () => 1; return chatInner() + 2 } return chatOuter() + 1 }' },
    ],
    invalid: [
      { options, code: 'function chatPrivate() {} export function chatRead() { chatPrivate() } export function chatWrite() {}', errors: [{ messageId: 'helper' }] },
      { options, code: 'const chatPrivate = () => 1; export const chatRead = () => chatPrivate() + 1', errors: [{ messageId: 'helper' }] },
      { options, code: '{ const chatPrivate = () => 1 } export function chatRead() {}', errors: [{ messageId: 'helper' }] },
      { code: 'export function chatRead() {} export function chatWrite() {}', errors: [{ messageId: 'helper' }, { messageId: 'helper' }] },
      { options: [{ frontend: true, singleExport: true }], code: 'export function chatRead() {} export function chatWrite() {}', errors: [{ messageId: 'exports' }, { messageId: 'helper' }, { messageId: 'helper' }] },
    ],
  })
})

test('frontend data constants exclude local calculations and runtime state owners', () => {
  const options = [{ includeData: true }]
  createRuleTester().run('modules/domain-constants', domainConstants, {
    valid: [
      { options, code: 'export function chatCreate() { const defaults = { limit: 3 }; return defaults } export const chatService = chatCreate()' },
      { options, code: 'const cache = new WeakMap(); const pending = new Map(); const listeners = new Set(); export const chatRead = () => pending.size' },
      { code: 'const labels = { yes: "Yes" }; const limit = 3' },
    ],
    invalid: [
      ...['const limit = 3', 'export const labels = { yes: translate.yes }', 'const values = [1, 2] as const', 'const defaults = { limit: 3 } satisfies Options', 'const delay = 3 * 1000', 'const pattern = /chat/', 'const labels = new Map([["yes", translate.yes]])', 'const values = new Set(["yes"])'].map((code) => ({ options, code, errors: [{ messageId: 'forbidden' }] })),
      { code: 'const CHAT_LIMIT = 3', errors: [{ messageId: 'forbidden' }] },
    ],
  })
})

test('portable libraries consume only their own contract without exposing app types', () => {
  const options = [{
    ...boundaryOptions,
    portableLib: true,
    web: [...boundaryOptions.web, '/repo/apps/admin/src'],
    aliases: { ...boundaryOptions.aliases, '@web': '/repo/apps/web/src', '@admin': '/repo/apps/admin/src' },
  }]
  const filename = '/repo/apps/web/src/lib/fade.ts'
  createRuleTester().run('modules/import-boundaries', importBoundaries, {
    valid: [
      ...['@/types/fade.types', '../types/fade.types.ts', '@web/types/fade.types'].map((source) => ({ filename, options, code: `import type { FadeOptions } from '${source}'` })),
      { filename, options, code: "import { type FadeOptions } from '@/types/fade.types'" },
      { filename: '/repo/apps/web/src/lib/fade.utils.ts', options, code: "import type { FadeOptions } from '../types/fade.types'" },
      { filename: '/repo/apps/admin/src/lib/fade.ts', options, code: "import type { FadeOptions } from '@/types/fade.types'" },
      { filename, options, code: "type Options = import('../types/fade.types').FadeOptions" },
      { filename, options, code: "import { clsx } from 'clsx'" },
      { filename: '/repo/apps/server/src/lib/fade.ts', options, code: "import { fade } from '../services/fade/fade.utils'" },
      { filename, options: [boundaryOptions], code: "import { fade } from '../services/fade/fade.utils'" },
    ],
    invalid: [
        "import type { FadeOptions } from '@/types/chat.types'",
        "import type { FadeOptions } from '@admin/types/fade.types'",
        "import type { FadeOptions } from '../../../admin/src/types/fade.types'",
        "import { FadeOptions } from '../types/fade.types'",
        "import { type FadeOptions, fade } from '../types/fade.types'",
        "export type { FadeOptions } from '../types/fade.types'",
        "export type * from '../types/fade.types'",
        "export * as fadeTypes from '../types/fade.types'",
        "import type { FadeOptions } from '../types/fade.types'; export type { FadeOptions }",
        "import type * as FadeTypes from '../types/fade.types'; export type { FadeTypes }",
        "import type { FadeOptions } from '../services/fade/fade.types'",
        "import type { FadeOptions } from '@backend/types/fade.types'",
        "import type { FadeOptions } from '@app/server/client'",
        "export * from '../services/fade/fade.utils'",
        "import { fade } from '@/lib/../services/fade/fade.utils'",
        "import { fade } from '#/lib/../services/fade/fade.utils'",
        "import('@web/services/fade/fade.utils')",
        "type Options = import('../types/chat.types').ChatOptions",
        "type Options = import('@app/server/client').FadeOptions",
    ].map((code) => ({ filename, options, code, errors: [{ messageId: 'boundary' }] })),
  })
})

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

test('action/query helpers stay inside their sole exported operation', () => {
  const options = [{ allowLocalHelpers: true, singleExport: true }]
  createRuleTester().run('modules/service-functions', serviceFunctions, {
    valid: [
      { options, code: 'export function run() { const format = () => 1; return format() + 2 }' },
      { options, code: 'export async function run() { function format() { return 1 } return format() + 2 }' },
      { options, code: 'export const run = () => { const format = function () { return 1 }; return format() + 2 }' },
      { options, code: 'const run = () => { const format = () => 1; return format() + 2 }; export { run }' },
    ],
    invalid: [
      { options, code: 'function helper() {} export function run() { helper() }', errors: [{ messageId: 'helper' }, { messageId: 'helper' }] },
      { options, code: 'export function run() {} export function helper() {}', errors: [{ messageId: 'exports' }, { messageId: 'helper' }, { messageId: 'helper' }] },
      { options, code: 'export function run() {} export const extra = 1', errors: [{ messageId: 'exports' }] },
      { options, code: 'export function run() {} export type Extra = string', errors: [{ messageId: 'exports' }] },
      { options, code: 'export function run() {} export { run as other }', errors: [{ messageId: 'exports' }] },
      { options, code: 'export * from "./other"', errors: [{ messageId: 'exports' }] },
      { options, code: 'export { run } from "./other"', errors: [{ messageId: 'exports' }] },
      { options, code: 'export const value = 1', errors: [{ messageId: 'exports' }] },
      { options, code: 'const value = 1', errors: [{ messageId: 'exports' }] },
      { options, code: 'export default function run() {}', errors: [{ messageId: 'exports' }, { messageId: 'helper' }] },
      { options, code: 'export function run() {} { const helper = () => 1 }', errors: [{ messageId: 'helper' }] },
      { options: [{ ...options[0], message: 'Keep one operation; keep local helpers inside it.' }], code: 'export const extra = 1', errors: [{ message: 'Keep one operation; keep local helpers inside it.' }] },
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

test('service method objects are explicit public method-only forms', () => {
  const options = [{ includeData: true, allowServiceMethods: true }]
  createRuleTester().run('modules/domain-constants', domainConstants, {
    valid: [{ options, code: 'export const themeService = { themeApply(value) { return value.trim() } }' }],
    invalid: [
      'const themeService = { themeApply(value) { return value.trim() } }',
      'export const themeService = { themeApply: (value) => value.trim() }',
      'export const themeLabels = { themeApply: translate.apply }',
      'export const themeService = { limit: 3, themeApply(value) { return value.trim() } }',
      'export const themeService = { ...other, themeApply(value) { return value.trim() } }',
      'export const themeService = { [key](value) { return value.trim() } }',
      'export const themeService = { "themeApply"(value) { return value.trim() } }',
      'export const themeService = { get themeValue() { return value } }',
    ].map((code) => ({ options, code, errors: [{ messageId: 'forbidden' }] })),
  })
  createRuleTester().run('modules/service-functions', serviceFunctions, {
    valid: [{ options: [{ frontend: true }], code: 'export const themeService = { themeApply(value) { function themeNormalize(input) { return input.trim() } return themeNormalize(value) } }' }],
    invalid: [{ options: [{ frontend: true }], code: 'function themeNormalize(value) { return value.trim() } export const themeService = { themeApply(value) { return themeNormalize(value) } }', errors: [{ messageId: 'helper' }] }],
  })
})
