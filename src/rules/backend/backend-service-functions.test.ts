import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { backendServiceFunctions } from './backend-service-functions.ts'

describe('arch/backend-service-functions', () => {
  it.each([
    { name: 'one exported operation', code: 'export function run() { return items.map(item => item.id) }' },
    {
      name: 'helpers stay inside the operation when enabled',
      code: 'export function run() { const normalize = (value) => value.trim(); return normalize(title) }',
      options: { helpers: true },
    },
    {
      name: 'returned methods may be named locally',
      code: 'export function create() { function read() { return value } return { read } }',
      options: { methods: true },
    },
    {
      name: 'frontend operations each own their helpers',
      code: 'export function read() { function normalize() { return 1 } return normalize() } export const write = () => 2',
      options: { frontend: true },
    },
    {
      name: 'frontend object methods own their helpers',
      code: 'export const service = { read() { const normalize = () => 1; return normalize() } }',
      options: { frontend: true },
    },
    { name: 'single named operation', code: 'export const run = () => 1', options: { single: true } },
    { name: 'local export counts as the single operation', code: 'const run = () => 1; export { run }', options: { single: true } },
    { name: 'private top-level helper', code: 'const normalize = () => 1', errors: ['helper'] },
    { name: 'nested declaration is forbidden by default', code: 'export function run() { function normalize() {} }', errors: ['helper'] },
    { name: 'nested arrow is forbidden by default', code: 'export function run() { const normalize = () => 1 }', errors: ['helper'] },
    {
      name: 'returned methods must actually be returned',
      code: 'export function create() { function read() { return value } return {} }',
      options: { methods: true },
      errors: ['helper'],
    },
    {
      name: 'helpers option does not permit file-level helpers',
      code: 'function normalize() {} export function run() { normalize() }',
      options: { helpers: true },
      errors: ['helper', 'helper'],
    },
    {
      name: 'frontend file-level helpers remain private',
      code: 'const normalize = () => 1; export const read = () => normalize()',
      options: { frontend: true },
      errors: ['helper'],
    },
    { name: 'multiple operations need frontend mode', code: 'export function read() {} export function write() {}', errors: ['helper', 'helper'] },
    { name: 'single mode rejects extra constants', code: 'export function run() {} export const extra = 1', options: { single: true }, errors: ['exports'] },
    { name: 'single mode rejects extra types', code: 'export function run() {} export type Extra = string', options: { single: true }, errors: ['exports'] },
    { name: 'single mode rejects re-exports', code: "export { run } from './other'", options: { single: true }, errors: ['exports'] },
    { name: 'single mode rejects default exports', code: 'export default function run() {}', options: { single: true }, errors: ['exports', 'helper'] },
    {
      name: 'single mode overrides frontend multiplicity',
      code: 'export function read() {} export function write() {}',
      options: { frontend: true, single: true },
      errors: ['exports', 'helper', 'helper'],
    },
    { name: 'custom helper message', code: 'function normalize() {}', options: { message: 'Keep helpers local.' }, errors: ['normalize: Keep helpers local.'] },
  ])('$name', (row) => testerRun(backendServiceFunctions, row))
})
