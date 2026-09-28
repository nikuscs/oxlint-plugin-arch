import { test } from 'vitest'
import { noExtraFactoryKeys } from '../rules/no-extra-factory-keys.ts'
import { createRuleTester } from './rule-tester.ts'

const actionOptions = [{ keys: ['run'] }]
const queryOptions = [{ keys: ['get', 'list'] }]
const error = { messageId: 'extraKey' }
const missing = { messageId: 'missingKey' }
const empty = { messageId: 'emptyObject' }
const requireRun = [{ keys: ['run'], requireKeys: ['run'] }]
const keySets = [{
  keySets: [
    { factoryPattern: '^makeAction', keys: ['run'], requireKeys: ['run'] },
    { factoryPattern: '^makeQuery', keys: ['get', 'list'], requireKeys: [] },
  ],
}]

test('no-extra-factory-keys', () => {
  createRuleTester().run(
    'arch/no-extra-factory-keys',
    noExtraFactoryKeys,
    {
      valid: [
        { code: 'export function makeAction() { async function run() {} return { run } }', options: actionOptions },
        { code: 'export const makeQuery = () => ({ get() {}, list() {} })', options: queryOptions },
        { code: 'export function makeAction() { function run() { return { preview: true } } return { run } }', options: actionOptions },
        { code: 'export function helper() { return { preview: true } }', options: actionOptions },
        { code: 'export function makeAction() { return { run() {} } }', options: requireRun },
        { code: 'export function createAction() { return { run() {} } }', options: [{ keys: ['run'], factoryPattern: ['^make', '^create'] }] },
        { code: 'export function makeAction() { return { run() {} } }\nexport const makeQuery = () => ({ get() {}, list() {} })', options: keySets },
        {
          code: 'export function makeAction() { return { run() {} } }\nexport function helper() { return { preview: true } }',
          options: keySets,
        },
        {
          code: 'export function makeQuery() { return { get() {}, list() {} } }',
          options: [{ keys: ['run'], factoryPattern: '^makeAction', keySets: [{ factoryPattern: '^makeQuery', keys: ['get', 'list'] }] }],
        },
        {
          code: 'export function makeQuery() { return { get() {}, list() {} } }',
          options: [{
            keys: ['run'],
            requireKeys: ['run'],
            keySets: [{ factoryPattern: '^makeQuery', keys: ['get', 'list'] }],
          }],
        },
        {
          code: 'export function makeQuery() { return { get() {}, list() {} } }',
          options: [{ keySets: [
            { factoryPattern: '^makeQuery', keys: ['get', 'list'] },
            { factoryPattern: '^make', keys: ['run'] },
          ] }],
        },
        {
          code: 'export function makeAction() { return { preview() {} } }',
          options: [{ keys: ['run'], requireKeys: ['preview'] }],
        },
        {
          code: 'export function makeAction() { return { run() {}, preview() {} } }',
          options: [{ keys: ['run'], requireKeys: ['preview'] }],
        },
        {
          code: 'export function makeAction() { return { preview() {} } }',
          options: [{ keySets: [{ factoryPattern: '^makeAction', keys: ['run'], requireKeys: ['preview'] }] }],
        },
      ],
      invalid: [
        {
          code: 'export function makeAction() { return { run() {}, preview() {} } }',
          options: actionOptions,
          errors: [error],
        },
        {
          code: 'export const makeQuery = () => ({ get() {}, preview() {} })',
          options: queryOptions,
          errors: [error],
        },
        {
          code: 'export function makeAction() { return { preview() {} } }',
          options: requireRun,
          errors: [missing, error],
        },
        {
          code: 'export function makeAction() { return { run() {} } }',
          options: [{ keys: ['run'], requireKeys: ['preview'] }],
          errors: [missing],
        },
        {
          code: 'export function makeAction() { return { preview() {}, extra() {} } }',
          options: [{ keySets: [{ factoryPattern: '^makeAction', keys: ['run'], requireKeys: ['preview'] }] }],
          errors: [error],
        },
        {
          code: 'export function makeAction() { return {} }',
          options: requireRun,
          errors: [empty, missing],
        },
        {
          code: 'export const makeAction = () => ({})',
          options: requireRun,
          errors: [empty, missing],
        },
        {
          code: 'export function makeAction() { return { run() {}, preview() {} } }',
          options: keySets,
          errors: [error],
        },
        {
          code: 'export const makeQuery = () => ({ get() {}, preview() {} })',
          options: keySets,
          errors: [error],
        },
        {
          code: 'export function makeAction() { return {} }',
          options: keySets,
          errors: [empty, missing],
        },
        {
          code: 'export function makeQuery() { return { get() {} } }',
          options: [{
            keys: ['run'],
            requireKeys: ['run'],
            keySets: [{ factoryPattern: '^makeQuery', keys: ['get', 'list'], requireKeys: ['get', 'list'] }],
          }],
          errors: [missing],
        },
        {
          code: 'export function makeAction() { return { run() {} } }\nexport function makeQuery() { return { get() {}, extra() {} } }',
          options: [{
            keys: ['run'],
            keySets: [{ factoryPattern: '^makeQuery', keys: ['get', 'list'] }],
          }],
          errors: [error],
        },
        {
          code: 'export function makeQuery() { return { get() {} } }',
          options: [{ keySets: [
            { factoryPattern: '^make', keys: ['run'] },
            { factoryPattern: '^makeQuery', keys: ['get', 'list'] },
          ] }],
          errors: [error],
        },
        {
          code: 'export function makeAction() { return {} }',
          options: [{
            keys: ['run'],
            requireKeys: ['run'],
            keySets: [{ factoryPattern: '^makeQuery', keys: ['get', 'list'] }],
          }],
          errors: [empty, missing],
        },
      ],
    },
  )
})
