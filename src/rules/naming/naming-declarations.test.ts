import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { namingDeclarations } from './naming-declarations.ts'

describe('arch/naming-declarations', () => {
  it.each([
    { name: 'the file prefix passes', filename: 'invoice.utils.ts', code: 'export function invoiceFormatTotal() {}\ntype InvoiceRow = {}' },
    { name: 'a compound prefix passes', filename: 'agent-setup.ts', code: 'const agentSetupDraft = {}\ninterface AgentSetupProps {}' },
    { name: 'loop variables are skipped', filename: 'invoice.ts', code: 'for (const line of lines) {}\nfor (let index = 0; index < 1; index++) {}' },
    { name: 'destructured bindings are skipped', filename: 'invoice.ts', code: 'const { total } = invoice' },
    {
      name: 'the singular prefix passes with singularize',
      filename: 'agent-setups.ts',
      code: 'type AgentSetupDraft = {}',
      options: { singularize: 'trailing-s' },
    },
    {
      name: 'other kinds pass with kinds',
      filename: 'invoice.ts',
      code: 'type InvoiceRow = {}\nconst leftover = 1',
      options: { kinds: ['type', 'interface'] },
    },
    { name: 'a role is stripped from the prefix', filename: 'onchain-utils.ts', code: 'type OnchainClient = {}', options: { roles: ['utils'] } },
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
      name: 'singular type, const and function prefixes pass',
      filename: '/repo/src/api/agent-setups.types.ts',
      code: 'type AgentSetupTimeTrigger = {}\nconst agentSetupDraft = {}\nfunction agentSetupLoad() { return null }',
      options: { singularize: 'trailing-s' },
    },
    {
      name: 'a singular compound type with unchecked constants passes',
      filename: '/repo/src/api/agent-setup-drafts.types.ts',
      code: 'type AgentSetupDraftStatus = {}\nconst leftover = 1',
      options: { kinds: ['type', 'interface'], singularize: 'trailing-s' },
    },
    {
      name: 'a patterned const with unchecked types passes',
      filename: '/repo/src/api/accounts.ts',
      code: "const listAccounts = () => []\ntype AccessRequestErrorKind = 'denied'",
      options: { kinds: ['const', 'function'], pattern: '^[a-z]+[A-Z]', allow: 'ErrorKind$' },
    },
    {
      name: 'a role-stripped type with unchecked functions passes',
      filename: '/repo/src/lib/onchain-utils.ts',
      code: 'type OnchainClient = {}\nfunction leftover() { return null }',
      options: { kinds: ['type'], roles: ['utils'] },
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
    { name: 'an unexported declaration', filename: 'invoice.ts', code: 'const leftover = 1', errors: ['prefix'] },
    { name: 'the plural without singularize', filename: 'agent-setups.ts', code: 'type AgentSetupDraft = {}', errors: ['prefix'] },
    { name: 'a checked kind', filename: 'invoice.ts', code: 'type Row = {}\nconst leftover = 1', options: { kinds: ['type'] }, errors: ['prefix'] },
    { name: 'the role stays without roles', filename: 'onchain-utils.ts', code: 'type OnchainClient = {}', errors: ['prefix'] },
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
    {
      name: 'type and const names missing the singular prefix',
      filename: '/repo/src/api/agent-setups.types.ts',
      code: 'type DraftStatus = {}\nconst leftover = 1',
      options: { singularize: 'trailing-s' },
      errors: ['prefix', 'prefix'],
    },
    {
      name: 'a checked type missing the singular compound prefix',
      filename: '/repo/src/api/agent-setup-drafts.types.ts',
      code: 'type DraftStatus = {}\nconst leftover = 1',
      options: { kinds: ['type'], singularize: 'trailing-s' },
      errors: ['prefix'],
    },
    {
      name: 'a checked const outside the list pattern',
      filename: '/repo/src/api/accounts.ts',
      code: 'const leftover = 1\nfunction listAccounts() { return [] }',
      options: { kinds: ['const', 'function'], pattern: '^list[A-Z]' },
      errors: ['pattern'],
    },
    {
      name: 'a checked type missing the role-stripped prefix',
      filename: '/repo/src/lib/onchain-utils.ts',
      code: 'type DraftStatus = {}',
      options: { kinds: ['type'], roles: ['utils'] },
      errors: ['prefix'],
    },
  ])('$name', (row) => testerRun(namingDeclarations, row))
})
