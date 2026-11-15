import { describe, it } from 'vitest'
import { namingImports } from '../../../src/rules/naming/naming-imports.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/naming-imports', () => {
  it.each([
    { name: 'a source at any depth', code: "import * as WalletCases from '../../support/wallet.cases.ts'", options: { imports: [{ source: '**/support/{file}.ts', name: '{File}' }] } },
    { name: 'a dropped ending', code: "import * as StorageS3 from './storage-s3.driver.ts'", options: { imports: [{ source: '**/{file}.ts', name: '{File}', drop: '[.](?:driver|adapter)$' }] } },
    { name: 'a skipped source stops the search', code: "import * as Anything from '../src/index.ts'", options: { imports: [{ source: '**/index.ts', name: false }, { source: '**/{file}.ts', name: '{File}' }] } },
    { name: 'a name from the file path', filename: 'packages/kit-wallet/test/wallet.test.ts', code: "import * as Wallet from '../src/index.ts'", options: { file: 'kit-{module}/**', imports: [{ source: '**/index.ts', name: '{Module}' }] } },
    { name: 'a file off the path template is skipped', filename: 'apps/web/src/a.ts', code: "import * as Other from '../src/index.ts'", options: { file: 'kit-{module}/**', imports: [{ source: '**/index.ts', name: '{Module}' }] } },
    { name: 'a kept ending without drop', code: "import * as StorageS3 from './storage-s3.driver.ts'", options: { imports: [{ source: '**/{file}.ts', name: '{File}' }] }, errors: ["Import './storage-s3.driver.ts' as 'StorageS3Driver', not 'StorageS3'."] },
    { name: 'a deep source under another name', code: "import * as Cases from '../../support/wallet.cases.ts'", options: { imports: [{ source: '**/support/{file}.ts', name: '{File}' }] }, errors: ['name'] },
    { name: 'no options checks nothing', code: "import { a } from 'other'" },
    { name: 'an unlisted import passes', code: "import { a } from 'other'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] } },
    { name: 'a namespace named after the package', code: "import * as PaymentsKit from '@scope/kit-payments'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] } },
    {
      name: 'a subpath joins the name',
      code: "import * as PaymentsKitSchema from '@scope/kit-payments/schema'",
      options: { imports: [{ source: '@scope/kit-{package}/{subpath}', name: '{Package}Kit{Subpath}' }] },
    },
    {
      name: 'the first matching entry wins',
      code: "import * as ErrorsKit from '@scope/kit-contracts/errors'",
      options: { imports: [{ source: '@scope/kit-contracts/{part}', name: '{Part}Kit' }, { source: '@scope/kit-{package}/{subpath}', name: '{Package}Kit{Subpath}' }] },
    },
    { name: 'a dashed package is PascalCase', code: "import * as UserSettingsKit from '@scope/kit-user-settings'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] } },
    { name: 'several names are allowed', code: "import * as S from 'effect/Schema'", options: { imports: [{ source: 'effect/{module}', name: ['{Module}', 'S'] }] } },
    { name: 'an empty type import passes', code: "import type {} from '@scope/kit-payments'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] } },
    { name: 'a side-effect import passes', code: "import '@scope/kit-payments'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] } },
    { name: 'named imports pass without namespace', code: "import { pay } from '@scope/kit-payments'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit', namespace: false }] } },
    { name: 'a default import is checked by name without namespace', code: "import dayjs from 'dayjs'", options: { imports: [{ source: 'dayjs', name: 'dayjs', namespace: false }] } },
    { name: 'a placeholder does not cross a slash', code: "import { a } from '@scope/kit-payments/schema'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] } },
    { name: 'a misnamed namespace', code: "import * as Payments from '@scope/kit-payments'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] }, errors: ['name'] },
    { name: 'a named import', code: "import { pay } from '@scope/kit-payments'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] }, errors: ['namespace'] },
    { name: 'one report per named import', code: "import { pay, refund } from '@scope/kit-payments'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] }, errors: ['namespace', 'namespace'] },
    { name: 'a default import', code: "import PaymentsKit from '@scope/kit-payments'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] }, errors: ['namespace'] },
    { name: 'a named type import', code: "import type { Pay } from '@scope/kit-payments'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}Kit' }] }, errors: ['namespace'] },
    { name: 'a misnamed default without namespace', code: "import day from 'dayjs'", options: { imports: [{ source: 'dayjs', name: 'dayjs', namespace: false }] }, errors: ['name'] },
    {
      name: 'the report names the expected import',
      code: "import * as Pay from '@scope/kit-payments/schema'",
      options: { imports: [{ source: '@scope/kit-{package}/{subpath}', name: '{Package}Kit{Subpath}' }] },
      errors: ["Import '@scope/kit-payments/schema' as 'PaymentsKitSchema', not 'Pay'."],
    },
    { name: 'an entry message', code: "import * as W from '@scope/kit-wallet'", options: { imports: [{ source: '@scope/kit-{package}', name: '{Package}', message: 'Name kits after the package.' }] }, errors: ["Import '@scope/kit-wallet' as 'Wallet', not 'W'. Name kits after the package."] },
    { name: 'a rule message', code: "import { W } from '@scope/kit-wallet'", options: { message: 'See the guide.', imports: [{ source: '@scope/kit-{package}', name: '{Package}' }] }, errors: ["Import '@scope/kit-wallet' as a namespace: import * as Wallet. See the guide."] },
  ])('$name', (row) => testerRun(namingImports, row))
})
