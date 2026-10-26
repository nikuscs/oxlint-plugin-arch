import { describe, it } from 'vitest'
import { namingDeclarations } from '../../../src/rules/naming/naming-declarations.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/naming-declarations', () => {
  it.each([
    { name: 'the file prefix passes', filename: 'invoice.utils.ts', code: 'export function invoiceFormatTotal() {}\ntype InvoiceRow = {}' },
    { name: 'a compound prefix passes', filename: 'line-item.ts', code: 'const lineItemDraft = {}\ninterface LineItemProps {}' },
    { name: 'loop variables are skipped', filename: 'invoice.ts', code: 'for (const line of lines) {}\nfor (let index = 0; index < 1; index++) {}' },
    { name: 'destructured bindings are skipped', filename: 'invoice.ts', code: 'const { total } = invoice' },
    { name: 'the singular prefix passes with singularize', filename: 'line-items.ts', code: 'type LineItemDraft = {}', options: { singularize: 'trailing-s' } },
    {
      name: 'other kinds pass with kinds',
      filename: 'invoice.ts',
      code: 'type InvoiceRow = {}\nconst leftover = 1',
      options: { kinds: ['type', 'interface'] },
    },
    { name: 'a role is stripped from the prefix', filename: 'ledger-utils.ts', code: 'type LedgerClient = {}', options: { roles: ['utils'] } },
    {
      name: 'a listed separator strips the role',
      filename: 'ledger_utils.ts',
      code: 'type LedgerClient = {}',
      options: { roles: ['utils'], separators: ['_'] },
    },
    { name: 'the full basename prefix passes', filename: 'invoice.query.ts', code: 'const invoiceQueryKey = 1', options: { stem: 'full-basename' } },
    { name: 'an exact-case prefix passes without normalize', filename: 'invoice.ts', code: 'const invoiceTotal = 1', options: { normalize: 'none' } },
    { name: 'an allowed name passes', filename: 'invoice.ts', code: "type AccessErrorKind = 'denied'", options: { allow: 'ErrorKind$' } },
    {
      name: 'a pattern passes',
      filename: 'accounts.ts',
      code: 'const listAccounts = () => []\nfunction getAccount() {}',
      options: { pattern: ['^list[A-Z]', '^get[A-Z]'] },
    },
    {
      name: 'a global flag does not skip names',
      filename: 'accounts.ts',
      code: 'const goodOne = 1\nconst goodTwo = 2',
      options: { pattern: '^good', flags: 'g' },
    },
    {
      name: 'a patterned const with unchecked types passes',
      filename: '/repo/src/api/accounts.ts',
      code: "const listAccounts = () => []\ntype AccessRequestErrorKind = 'denied'",
      options: { kinds: ['const', 'function'], pattern: '^[a-z]+[A-Z]', allow: 'ErrorKind$' },
    },
    { name: 'a missing prefix', filename: 'invoice.utils.ts', code: 'export function formatTotal() {}', errors: ['prefix'] },
    {
      name: 'every kind is checked by default',
      filename: 'invoice.ts',
      code: `function a() {}
class B {}
type C = {}
interface D {}
enum E {}
const f = 1
let g = 1
var h = 1`,
      errors: ['prefix', 'prefix', 'prefix', 'prefix', 'prefix', 'prefix', 'prefix', 'prefix'],
    },
    { name: 'the plural without singularize', filename: 'line-items.ts', code: 'type LineItemDraft = {}', errors: ['prefix'] },
    { name: 'a checked kind', filename: 'invoice.ts', code: 'type Row = {}\nconst leftover = 1', options: { kinds: ['type'] }, errors: ['prefix'] },
    { name: 'the role stays without roles', filename: 'ledger-utils.ts', code: 'type LedgerClient = {}', errors: ['prefix'] },
    {
      name: 'an unlisted separator keeps the role',
      filename: 'ledger-utils.ts',
      code: 'type LedgerClient = {}',
      options: { roles: ['utils'], separators: ['_'] },
      errors: ['prefix'],
    },
    {
      name: 'the short prefix with the full basename',
      filename: 'invoice.query.ts',
      code: 'const invoiceTotal = 1',
      options: { stem: 'full-basename' },
      errors: ['prefix'],
    },
    { name: 'a case mismatch without normalize', filename: 'invoice.ts', code: 'type InvoiceRow = {}', options: { normalize: 'none' }, errors: ['prefix'] },
    {
      name: 'a name off the pattern',
      filename: 'accounts.ts',
      code: 'const leftover = 1\nfunction listAccounts() {}',
      options: { pattern: '^list[A-Z]' },
      errors: ['pattern'],
    },
    { name: 'an empty pattern entry is ignored', filename: 'accounts.ts', code: 'const badOne = 1', options: { pattern: ['', '^good'] }, errors: ['pattern'] },
  ])('$name', (row) => testerRun(namingDeclarations, row))
})
