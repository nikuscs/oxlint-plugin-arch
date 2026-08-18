import { test } from 'vitest'
import { requirePairedCall } from '../rules/require-paired-call.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ when: 'useForm', require: 'standardSchemaResolver' }]
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
      ],
      invalid: [
        { code: 'useForm({ defaultValues: {} })', options, errors: [error] },
        { code: 'const first = useForm({})\nconst second = useForm({})', options, errors: [error] },
        {
          code: "import { useForm as useF } from 'form'\nuseF({ defaultValues: {} })",
          options,
          errors: [error],
        },
      ],
    },
  )
})
