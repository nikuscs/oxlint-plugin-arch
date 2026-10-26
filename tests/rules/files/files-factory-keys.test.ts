import { describe, it } from 'vitest'
import { filesFactoryKeys } from '../../../src/rules/files/files-factory-keys.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/files-factory-keys', () => {
  it.each([
    { name: 'off without keys or sets', code: 'export function makeUser() { return { debug: true } }' },
    { name: 'allowed keys pass', code: "export function makeUser() { return { id: 1, name: 'Ada' } }", options: { keys: ['id', 'name'] } },
    {
      name: 'wrapped allowed keys pass',
      code: 'export const makeUser = () => (({ id: 1 } as const) satisfies { id: number })',
      options: { keys: ['id'], required: ['id'] },
    },
    { name: 'a shorthand key passes', code: 'export function makeAction() { async function run() {} return { run } }', options: { keys: ['run'] } },
    { name: 'an arrow body passes', code: 'export const makeQuery = () => ({ get() {}, list() {} })', options: { keys: ['get', 'list'] } },
    {
      name: 'a nested function return is skipped',
      code: 'export function makeAction() { function run() { return { debug: true } } return { run } }',
      options: { keys: ['run'] },
    },
    { name: 'a non-factory is skipped', code: 'export function helper() { return { debug: true } }', options: { keys: ['run'] } },
    {
      name: 'a custom factory list',
      code: 'export function createAction() { return { run() {} } }',
      options: { keys: ['run'], factory: ['^make', '^create'] },
    },
    { name: 'a required key is allowed', code: 'export function makeAction() { return { preview() {} } }', options: { keys: ['run'], required: ['preview'] } },
    {
      name: 'each set checks its own factories',
      code: 'export function makeAction() { return { run() {} } }\nexport const makeQuery = () => ({ get() {}, list() {} })',
      options: { sets: [{ factory: '^makeAction', keys: ['run'] }, { factory: '^makeQuery', keys: ['get', 'list'] }] },
    },
    {
      name: 'a set wins over keys',
      code: 'export function makeQuery() { return { get() {} } }',
      options: { keys: ['run'], required: ['run'], sets: [{ factory: '^makeQuery', keys: ['get'] }] },
    },
    {
      name: 'a nested preview return passes',
      code: 'export function makeAction() { function run() { return { preview: true } } return { run } }',
      options: { keys: ['run'] },
    },
    { name: 'a helper returning preview passes', code: 'export function helper() { return { preview: true } }', options: { keys: ['run'] } },
    {
      name: 'a required set key beside an unmatched helper passes',
      code: 'export function makeAction() { return { run() {} } }\nexport function helper() { return { preview: true } }',
      options: { sets: [{ factory: '^makeAction', keys: ['run'], required: ['run'] }, { factory: '^makeQuery', keys: ['get', 'list'], required: [] }] },
    },
    {
      name: 'a set overriding the factory filter passes',
      code: 'export function makeQuery() { return { get() {}, list() {} } }',
      options: { keys: ['run'], factory: '^makeAction', sets: [{ factory: '^makeQuery', keys: ['get', 'list'] }] },
    },
    {
      name: 'a set overriding required keys passes',
      code: 'export function makeQuery() { return { get() {}, list() {} } }',
      options: { keys: ['run'], required: ['run'], sets: [{ factory: '^makeQuery', keys: ['get', 'list'] }] },
    },
    {
      name: 'the first matching set allowing query keys passes',
      code: 'export function makeQuery() { return { get() {}, list() {} } }',
      options: { sets: [{ factory: '^makeQuery', keys: ['get', 'list'] }, { factory: '^make', keys: ['run'] }] },
    },
    {
      name: 'allowed and required keys together pass',
      code: 'export function makeAction() { return { run() {}, preview() {} } }',
      options: { keys: ['run'], required: ['preview'] },
    },
    {
      name: 'as const return checks extra and missing keys',
      code: 'export function makeUser() { return { debug: true } as const }',
      options: { keys: ['id'], required: ['id'] },
      errors: ['missingKey', 'extraKey'],
    },
    {
      name: 'satisfies arrow checks extra and missing keys',
      code: 'export const makeUser = () => ({ debug: true } satisfies Record<string, unknown>)',
      options: { keys: ['id'], required: ['id'] },
      errors: ['missingKey', 'extraKey'],
    },
    {
      name: 'nested assertion and non-null wrappers still check keys',
      code: 'export const makeUser = () => (({ debug: true } as const)!)',
      options: { keys: ['id'] },
      errors: ['extraKey'],
    },
    {
      name: 'type assertion return checks keys',
      filename: 'factory.ts',
      code: 'export function makeUser() { return <Record<string, unknown>>{ debug: true } }',
      options: { keys: ['id'] },
      errors: ['extraKey'],
    },
    { name: 'an extra key', code: 'export function makeUser() { return { id: 1, debug: true } }', options: { keys: ['id', 'name'] }, errors: ['extraKey'] },
    {
      name: 'an extra key in an arrow body',
      code: 'export const makeQuery = () => ({ get() {}, preview() {} })',
      options: { keys: ['get'] },
      errors: ['extraKey'],
    },
    { name: 'a spread key', code: 'export function makeUser() { return { ...base } }', options: { keys: ['id'] }, errors: ['extraKey'] },
    { name: 'a computed key', code: 'export function makeUser() { return { [key]: 1 } }', options: { keys: ['id'] }, errors: ['extraKey'] },
    {
      name: 'a missing required key',
      code: 'export function makeAction() { return { run() {} } }',
      options: { keys: ['run'], required: ['preview'] },
      errors: ['missingKey'],
    },
    {
      name: 'a missing and an extra key',
      code: 'export function makeAction() { return { preview() {} } }',
      options: { keys: ['run'], required: ['run'] },
      errors: ['missingKey', 'extraKey'],
    },
    {
      name: 'an empty object',
      code: 'export function makeAction() { return {} }',
      options: { keys: ['run'], required: ['run'] },
      errors: ['emptyObject', 'missingKey'],
    },
    {
      name: 'an empty arrow body',
      code: 'export const makeAction = () => ({})',
      options: { keys: ['run'], required: ['run'] },
      errors: ['emptyObject', 'missingKey'],
    },
    {
      name: 'a set requires its keys',
      code: 'export function makeQuery() { return { get() {} } }',
      options: { sets: [{ factory: '^makeQuery', keys: ['get', 'list'], required: ['get', 'list'] }] },
      errors: ['missingKey'],
    },
    {
      name: 'the first matching set wins',
      code: 'export function makeQuery() { return { get() {} } }',
      options: { sets: [{ factory: '^make', keys: ['run'] }, { factory: '^makeQuery', keys: ['get'] }] },
      errors: ['extraKey'],
    },
    {
      name: 'keys apply beside sets',
      code: 'export function makeAction() { return {} }',
      options: { keys: ['run'], required: ['run'], sets: [{ factory: '^makeQuery', keys: ['get'] }] },
      errors: ['emptyObject', 'missingKey'],
    },
    {
      name: 'an extra preview method',
      code: 'export function makeAction() { return { run() {}, preview() {} } }',
      options: { keys: ['run'] },
      errors: ['extraKey'],
    },
    {
      name: 'an extra method beside a required set key',
      code: 'export function makeAction() { return { preview() {}, extra() {} } }',
      options: { sets: [{ factory: '^makeAction', keys: ['run'], required: ['preview'] }] },
      errors: ['extraKey'],
    },
    {
      name: 'an extra preview method in a matching set',
      code: 'export function makeAction() { return { run() {}, preview() {} } }',
      options: { sets: [{ factory: '^makeAction', keys: ['run'], required: ['run'] }, { factory: '^makeQuery', keys: ['get', 'list'], required: [] }] },
      errors: ['extraKey'],
    },
    {
      name: 'an extra query key beside a valid action',
      code: 'export function makeAction() { return { run() {} } }\nexport function makeQuery() { return { get() {}, extra() {} } }',
      options: { keys: ['run'], sets: [{ factory: '^makeQuery', keys: ['get', 'list'] }] },
      errors: ['extraKey'],
    },
  ])('$name', (row) => testerRun(filesFactoryKeys, row))
})
