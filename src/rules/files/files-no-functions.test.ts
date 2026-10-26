import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { filesNoFunctions } from './files-no-functions.ts'

describe('arch/files-no-functions', () => {
  it.each([
    { name: 'constants pass', code: 'export const CENTS_PER_UNIT = 100' },
    { name: 'a nested function passes', code: 'export const handlers = { save() {} }' },
    { name: 'a re-export passes when re-exports are off', code: "export * from './currency.ts'", options: { reexports: false } },
    { name: 'a type re-export passes', code: "export type { Money } from './money.ts'" },
    { name: 'a type star re-export passes', code: "export type * from './money.ts'" },
    { name: 'type-only specifiers pass', code: "export { type Money, type Currency } from './money.ts'" },
    { name: 'an allowed name passes', code: 'export function isMoney() {}\nexport function toMoney() {}', options: { allow: ['^is', '^to'] } },
    { name: 'a layout constant passes', filename: '/repo/apps/server/src/types/layout.constants.ts', code: "export const layout = 'wide'" },
    {
      name: 'a fixture re-export with re-exports disabled passes',
      filename: '/repo/apps/web/tests/e2e/example.auth.spec.ts',
      code: "export * from './fixture.ts'",
      options: { reexports: false },
    },
    {
      name: 'getter and factory names in the allow list pass',
      filename: '/repo/apps/server/src/types/layout.constants.ts',
      code: 'export function getLayout() { return 1 }\nexport function makeLayout() { return 2 }',
      options: { allow: ['^get', '^make'] },
    },
    { name: 'a function declaration', code: 'export function toCents(value: number) { return value * 100 }', errors: ['noFunction'] },
    { name: 'a const arrow function', code: 'const toCents = () => 1', errors: ['noFunction'] },
    { name: 'a default function expression', code: 'export default () => 1', errors: ['noFunction'] },
    { name: 'a name outside the allow list', code: 'export function toCents() {}', options: { allow: '^is' }, errors: ['noFunction'] },
    { name: 'a star re-export', code: "export * from './currency.ts'", errors: ['noReExport'] },
    { name: 'mixed specifiers re-export a value', code: "export { type Money, currency } from './money.ts'", errors: ['noReExport'] },
    { name: 'an empty re-export remains banned', code: "export {} from './money.ts'", errors: ['noReExport'] },
    { name: 'a named re-export', code: "export { toCents } from './money.ts'", errors: ['noReExport'] },
    { name: 'one report per function', code: 'const a = () => 1, b = function () {}', errors: ['noFunction', 'noFunction'] },
    {
      name: 'a getter in a constants file',
      filename: '/repo/apps/server/src/types/layout.constants.ts',
      code: 'export function getLayout() { return 1 }',
      errors: ['noFunction'],
    },
    {
      name: 'a private arrow in a constants file',
      filename: '/repo/apps/server/src/types/layout.constants.ts',
      code: 'const getLayout = () => 1',
      errors: ['noFunction'],
    },
    {
      name: 'a star re-export in a constants file',
      filename: '/repo/apps/server/src/types/layout.constants.ts',
      code: "export * from './layout-base.ts'",
      errors: ['noReExport'],
    },
  ])('$name', (row) => testerRun(filesNoFunctions, row))
})
