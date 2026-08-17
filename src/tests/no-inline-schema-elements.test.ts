import { test } from 'vitest'
import { noInlineSchemaElements } from '../rules/no-inline-schema-elements.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'inline' }

test('no-inline-schema-elements', () => {
  createRuleTester().run(
    'arch/no-inline-schema-elements',
    noInlineSchemaElements,
    {
      valid: [
        'const schema = z.array(personaDashboardReference)',
        'const schema = z.array(z.string())',
        'const schema = z.record(z.string(), namedValue)',
        'const schema = z.union([namedA, namedB])',
      ],
      invalid: [
        { code: 'const schema = z.array(z.object({ id: z.uuid() }))', errors: [error] },
        { code: 'const schema = z.union([namedA, z.object({ id: z.uuid() })])', errors: [error] },
        {
          code: 'const schema = z.array(z.string())',
          options: [{ methods: ['array'], allowZodScalars: false }],
          errors: [error],
        },
      ],
    },
  )
})
