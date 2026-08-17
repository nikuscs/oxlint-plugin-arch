import { test } from 'vitest'
import { noExtraFactoryKeys } from '../rules/no-extra-factory-keys.ts'
import { createRuleTester } from './rule-tester.ts'

const actionOptions = [{ keys: ['run'] }]
const queryOptions = [{ keys: ['get', 'list'] }]
const error = { messageId: 'extraKey' }

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
      ],
    },
  )
})
