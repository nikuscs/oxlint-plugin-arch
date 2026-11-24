import { describe, expect, it } from 'vitest'
import { testerPreset } from '../utils/tester.utils.ts'
import type { TesterPresetRow } from '../types/tester.types.ts'

describe('preset Effect contract', () => {
  const manifest = (name: string, dependencies: Record<string, string>) => JSON.stringify({ name, dependencies })
  const workspaces = JSON.stringify({ workspaces: ['apps/*', 'packages/*'] })
  const contractTree = ['packages/contract/src/order/', 'packages/contract/src/shared/']

  const contract = {
    'package.json': workspaces,
    'packages/contract/package.json': manifest('contract', { effect: '1' }),
    'packages/contract/src/order/order.contract.ts': '',
  }

  const frontend = { ...contract, 'packages/frontend/package.json': manifest('frontend', { effect: '1', react: '19' }), 'packages/frontend/src/link.tsx': '' }

  it.each<TesterPresetRow>([
    { name: 'a shared schemas file may export function constants', tree: contractTree, files: contract, folders: {}, file: 'packages/contract/src/shared/money.schemas.ts', rule: 'arch/files-top-level', expected: ['error', { allow: ['import', 'type', 'interface', 'namespace', { kind: 'const', exported: true }, { kind: 'function-const', exported: true }] }] },
    { name: 'a contract service needs no lazy effect', tree: contractTree, files: contract, folders: {}, file: 'packages/contract/src/order/order.service.ts', rule: 'effecttsgo/lazy-effect', expected: 'off' },
    { name: 'a contract schemas file puts schemas first', tree: contractTree, files: contract, folders: {}, file: 'packages/contract/src/order/order.schemas.ts', rule: 'arch/effect-schema-first', expected: 'error' },
    { name: 'a contract schemas file takes the types line limit', tree: contractTree, files: contract, folders: {}, file: 'packages/contract/src/order/order.schemas.ts', rule: 'max-lines', expected: ['error', { max: 2000 }] },
    { name: 'the types limit sets the schemas line limit', tree: contractTree, files: contract, folders: { 'packages/contract': { limits: { types: 2600 } } }, file: 'packages/contract/src/order/order.schemas.ts', rule: 'max-lines', expected: ['error', { max: 2600 }] },
    { name: 'a higher file lines limit still applies to schemas', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.schemas.ts': '' }, folders: { 'packages/contract/src/*/*.schemas.ts': { limits: { lines: 2000 } } }, file: 'packages/contract/src/order/order.schemas.ts', rule: 'max-lines', expected: ['error', { max: 2000 }] },
    { name: 'a contract constants file names its exports after the domain', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.constants.ts': '' }, folders: {}, file: 'packages/contract/src/order/order.constants.ts', rule: 'arch/files-exports', expected: ['error', { patterns: ['{STEM}(?:_[A-Z0-9]+)*'] }] },
    { name: 'a contract constants file is a contract file name', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.constants.ts': '' }, folders: {}, file: 'packages/contract/src/order/order.constants.ts', rule: 'arch/naming-file', expected: ['error', { pattern: expect.stringContaining('[.]constants') }] },
    { name: 'the contract constants file holds constants and reexports', tree: contractTree, files: { ...contract, 'packages/contract/src/contract.constants.ts': '' }, folders: {}, file: 'packages/contract/src/contract.constants.ts', rule: 'arch/files-constants-only', expected: ['error', { reexports: true }] },
    { name: 'a contract without a constants file gets no constants key', tree: contractTree, files: contract, folders: {}, file: 'packages/contract/src/contract.constants.ts', rule: 'arch/files-constants-only', expected: ['error', { types: true, functions: true }] },
    { name: 'a contract with tables files checks their top level', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.tables.ts': '' }, folders: {}, file: 'packages/contract/src/order/order.tables.ts', rule: 'arch/files-top-level', expected: ['error', { allow: ['import', 'type', 'namespace'] }] },
    { name: 'a tables file leaves the service top level alone', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.tables.ts': '' }, folders: {}, file: 'packages/contract/src/order/order.service.ts', rule: 'arch/files-top-level', expected: ['error', { allow: ['import', 'interface', 'type', 'class', 'namespace'] }] },
    { name: 'a contract without tables files keeps the service top level', tree: contractTree, files: contract, folders: {}, file: 'packages/contract/src/order/order.service.ts', rule: 'arch/files-top-level', expected: ['error', { allow: ['import', 'interface', 'type', 'class', 'namespace'] }] },
    { name: 'contract kinds still set the service top level next to tables', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.tables.ts': '' }, folders: { 'packages/contract': { effect: { contract: { kinds: { '*.service.ts': ['class', 'interface'] } } } } }, file: 'packages/contract/src/order/order.service.ts', rule: 'arch/files-top-level', expected: ['error', { allow: ['import', 'class', 'interface'] }] },
    { name: 'effect.files removes the detected tables kind', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.tables.ts': '' }, folders: { 'packages/contract': { effect: { files: ['!*.tables.ts'] } } }, file: 'packages/contract/src/order/order.tables.ts', rule: 'arch/naming-file', expected: ['error', { pattern: expect.not.stringContaining('tables') }] },
    { name: 'a contract with services and no layer types drops the layer types name', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.service.ts': '' }, folders: {}, file: 'packages/contract/src/order/order.layer.types.ts', rule: 'arch/naming-file', expected: ['error', { pattern: expect.not.stringContaining('layer[.]types') }] },
    { name: 'a contract with layer types keeps the layer types name', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.service.ts': '', 'packages/contract/src/order/order.layer.types.ts': '' }, folders: {}, file: 'packages/contract/src/order/order.layer.types.ts', rule: 'arch/naming-file', expected: ['error', { pattern: expect.stringContaining('layer[.]types') }] },
    { name: 'effect.files brings back the layer types name', tree: contractTree, files: { ...contract, 'packages/contract/src/order/order.service.ts': '' }, folders: { 'packages/contract': { effect: { files: ['*.layer.types.ts'] } } }, file: 'packages/contract/src/order/order.layer.types.ts', rule: 'arch/naming-file', expected: ['error', { pattern: expect.stringContaining('layer[.]types') }] },
    {
      name: 'a frontend package imports no contract service',
      tree: contractTree,
      files: frontend,
      folders: {},
      file: 'packages/frontend/src/components/a.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', { imports: { 'contract/*/*.service{,.ts}': 'A frontend package takes its data functions as props, not from a contract service.' } }],
    },
    {
      name: 'a frontend package opens the contract service ban with false',
      tree: contractTree,
      files: frontend,
      folders: { 'packages/frontend': { deny: { imports: { 'contract/*/*.service{,.ts}': false } } } },
      file: 'packages/frontend/src/components/a.tsx',
      rule: 'arch/boundaries-deny',
      expected: ['error', { imports: expect.not.objectContaining({ 'contract/*/*.service{,.ts}': expect.anything() }) }],
    },
  ])('$name', (row) => {
    expect({ value: testerPreset(row) }).toMatchObject({ value: row.expected })
  })
})
