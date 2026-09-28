import { test } from 'vitest'
import { noRuntimeInTypes } from '../rules/no-runtime-in-types.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'runtimeValue' }
const importError = { messageId: 'runtimeImport' }
const reExportError = { messageId: 'runtimeReExport' }

test('no-runtime-in-types', () => {
  createRuleTester().run(
    'arch/no-runtime-in-types',
    noRuntimeInTypes,
    {
      valid: [
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: 'export interface Account { id: string }\nexport type AccountId = string',
        },
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: 'export declare const accountId: string\nexport declare function getAccountId(): string',
        },
        {
          code: "import { value } from './values'\nexport { value as other } from './values'",
        },
        {
          code: "import type Client from './client'\nimport { type Input, type Output } from './contracts'",
          options: [{ runtimeImports: 'ban' }],
        },
        {
          code: "import { schema } from '@scope/schema'\nimport '@scope/schema/register'",
          options: [{ runtimeImports: 'ban', allowImportSources: ['^@scope/schema(?:/|$)'] }],
        },
        {
          code: "export type { Input } from './contracts'\nexport { type Output } from './contracts'\nexport type * from './shared'",
          options: [{ banReExports: true }],
        },
        {
          code: "import type fs = require('node:fs')",
          options: [{ runtimeImports: 'ban' }],
        },
        {
          code: "import fs = require('@scope/schema')",
          options: [{ runtimeImports: 'ban', allowImportSources: ['^@scope/schema(?:/|$)'] }],
        },
        {
          code: "import { value } from './values'\nexport type { value }",
          options: [{ banReExports: true }],
        },
        {
          code: 'namespace Types { export type Id = string; export interface Account { id: string } }',
        },
        {
          code: 'declare namespace API { export const value: number }',
        },
        {
          code: 'export = () => 1',
          options: [{ allow: ['default'] }],
        },
        {
          code: 'interface Shape { x: number }\nexport = Shape',
        },
        {
          code: 'type Shape = { x: number }\nexport = Shape',
        },
        {
          code: 'namespace Types { export interface Shape { x: number } }\nexport = Types',
        },
        {
          code: "import type { Shape } from './shape'\nexport = Shape",
        },
        {
          filename: '/repo/types/shape.d.ts',
          code: 'interface Shape { x: number }\nexport = Shape',
        },
        {
          filename: '/repo/types/api.d.ts',
          code: 'export namespace API { const value: number }',
        },
        {
          filename: '/repo/types/api.d.mts',
          code: 'namespace API { const value: number }',
        },
        {
          filename: '/repo/types/api.d.cts',
          code: 'export namespace API { const value: number }',
        },
        {
          code: "import type Alias = require('./shape')",
        },
        {
          filename: '/repo/types/alias.d.ts',
          code: 'declare namespace UniqueAliasSource { const value: number }\nexport import Alias = UniqueAliasSource',
          options: [{ banReExports: true }],
        },
        {
          code: 'namespace Types { export interface X {} }\nexport import Alias = Types',
        },
      ],
      invalid: [
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: "export const accountId = 'account'",
          errors: [error],
        },
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: "const accountId = 'account'\nexport default accountId",
          errors: [error, error],
        },
        {
          filename: '/repo/apps/web/src/types/account.types.ts',
          code: 'export enum AccountState { Active }',
          errors: [error],
        },
        {
          code: "import { value } from './values'",
          options: [{ runtimeImports: 'ban' }],
          errors: [importError],
        },
        {
          code: "import './register'",
          options: [{ runtimeImports: 'ban' }],
          errors: [importError],
        },
        {
          code: "import { type Input, value } from './module'",
          options: [{ runtimeImports: 'ban' }],
          errors: [importError],
        },
        {
          code: "import fs = require('node:fs'); void fs",
          options: [{ runtimeImports: 'ban' }],
          errors: [importError],
        },
        {
          code: "export { value } from './values'",
          options: [{ banReExports: true }],
          errors: [reExportError],
        },
        {
          code: "export * from './values'\nexport * as values from './values'",
          options: [{ banReExports: true }],
          errors: [reExportError, reExportError],
        },
        {
          code: "export {} from './side-effect'",
          options: [{ banReExports: true }],
          errors: [reExportError],
        },
        {
          code: "import { value } from './values'\nexport { value }",
          options: [{ banReExports: true }],
          errors: [reExportError],
        },
        {
          code: "export import fs = require('node:fs')",
          options: [{ banReExports: true }],
          errors: [reExportError],
        },
        {
          code: "export import fs = require('node:fs')",
          options: [{ runtimeImports: 'ban' }],
          errors: [importError],
        },
        {
          code: 'namespace RuntimeNamespace { export const value = 1 }',
          errors: [error],
        },
        {
          code: 'module RuntimeModule { export function run() {} }',
          errors: [error],
        },
        {
          code: 'export = () => 1',
          errors: [error],
        },
        {
          code: 'declare const value: number\nexport = value',
          errors: [error],
        },
        {
          code: "import { Shape } from './shape'\nexport = Shape",
          errors: [error],
        },
        {
          code: 'declare namespace UniqueAliasSource { const value: number }\nexport import Alias = UniqueAliasSource',
          errors: [error],
        },
        {
          code: 'declare namespace UniqueAliasSource { const value: number }\nexport import Alias = UniqueAliasSource',
          options: [{ banReExports: true }],
          errors: [reExportError, error],
        },
        {
          code: 'declare namespace UniqueRuntimeNS { const value: number }\nnamespace Types { export import Alias = UniqueRuntimeNS }',
          errors: [error],
        },
        {
          code: 'declare namespace UniqueAliasSource { const value: number }\nimport Alias = UniqueAliasSource',
          errors: [error],
        },
        {
          code: 'declare namespace Some { export namespace Namespace { const value: number } }\nexport import Alias = Some.Namespace',
          errors: [error],
        },
      ],
    },
  )
})
