import { test } from 'vitest'
import { requirePairedCall } from '../rules/require-paired-call.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ when: 'useForm', require: 'standardSchemaResolver' }]
const pairs = [{
  pairs: [
    { when: 'useForm', require: 'standardSchemaResolver' },
    { when: 'trackEvent', require: 'flushEvents' },
  ],
}]
const error = { messageId: 'paired' }

test('require-paired-call', () => {
  createRuleTester().run(
    'arch/require-paired-call',
    requirePairedCall,
    {
      valid: [
        { code: 'const resolver = standardSchemaResolver(schema)\nuseForm({ resolver })', options },
        { code: 'useForm({ resolver: standardSchemaResolver(schema) })', options },
        { code: 'const value = otherCall()', options },
        {
          code: "import { useForm as useF, standardSchemaResolver as resolve } from 'form'\nuseF({ resolver: resolve(schema) })",
          options,
        },
        {
          code: 'useForm({ resolver: standardSchemaResolver(schema) })\ntrackEvent()\nflushEvents()',
          options: pairs,
        },
        {
          code: "import { useForm as useF, standardSchemaResolver as resolve, trackEvent as track, flushEvents as flush } from 'tools'\nuseF({ resolver: resolve(schema) })\ntrack()\nflush()",
          options: pairs,
        },
        {
          code: 'useForm()\nstandardSchemaResolver(schema)\ntrackEvent()\nflushEvents()',
          options: [{
            when: 'useForm',
            require: 'standardSchemaResolver',
            pairs: [{ when: 'trackEvent', require: 'flushEvents' }],
          }],
        },
      ],
      invalid: [
        { code: 'useForm({ defaultValues: {} })', options, errors: [error] },
        { code: 'const first = useForm({})\nconst second = useForm({})', options, errors: [error] },
        {
          code: "import { useForm as useF } from 'form'\nuseF({ defaultValues: {} })",
          options,
          errors: [error],
        },
        {
          code: 'useForm()\nstandardSchemaResolver(schema)\ntrackEvent()',
          options: pairs,
          errors: [{ message: 'trackEvent requires a call to flushEvents in the same file.' }],
        },
        {
          code: 'useForm()\ntrackEvent()',
          options: pairs,
          errors: [error, error],
        },
        {
          code: 'useForm()\ntrackEvent()\nflushEvents()',
          options: [{
            when: 'useForm',
            require: 'standardSchemaResolver',
            pairs: [{ when: 'trackEvent', require: 'flushEvents' }],
          }],
          errors: [{ message: 'useForm requires a call to standardSchemaResolver in the same file.' }],
        },
      ],
    },
  )
})
