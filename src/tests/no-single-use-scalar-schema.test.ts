import { test } from 'vitest'
import { noSingleUseScalarSchema } from '../rules/no-single-use-scalar-schema.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'inline' }

const customOptions = [{
  namespaces: ['schema'],
  methods: ['union'],
  structuralMethods: ['array', 'object', 'tuple', 'union'],
  allowZodScalars: true,
}]

test('no-single-use-scalar-schema', () => {
  createRuleTester().run(
    'arch/no-single-use-scalar-schema',
    noSingleUseScalarSchema,
    {
      valid: [
        'const userId = z.number(); const user = z.object({ id: userId, parentId: userId })',
        'export const userId = z.number(); const user = z.object({ id: userId })',
        'const userId = z.number(); export { userId }; const user = z.object({ id: userId })',
        'const userId = z.number(); export default userId; const user = z.object({ id: userId })',
        'const userId = z.number(); type UserId = z.infer<typeof userId>',
        'const userId = z.number(); const parsed = userId.parse(value)',
        'const userId = z.number(); registerSchema(userId)',
        'const userId = z.number(); const config = { schema: userId }',
        'const userId = z.number(); const user = z.object({ id: { schema: userId } })',
        'const user = z.object({ id: z.number() }); const schema = z.object({ user })',
        'const nullable = z.string().nullable(); const schema = z.union([nullable, namedSchema])',
        'const choice = z.string().or(z.number()); const schema = z.object({ choice })',
        {
          code: 'const item = z.string(); const schema = z.array(item)',
          options: [{ allowZodScalars: false }],
        },
        'const item = schema.string(); const value = schema.object({ item })',
        'const string = z.string; const item = string(); const value = z.object({ item })',
        'import { string } from "zod"; const item = string(); const value = z.object({ item })',
        'let item = z.string(); const value = z.object({ item })',
        {
          code: 'const item = z.string(); const value = z.object({ item })',
          options: [{ structuralMethods: ['array', 'tuple', 'union'] }],
        },
        'const item = z.string(); const invalidUnion = z.union({ item })',
      ],
      invalid: [
        {
          code: 'const userId = z.number(); const user = z.object({ id: userId })',
          errors: [error],
        },
        {
          code: 'const displayName = z.string().nullable(); const user = z.object({ name: displayName })',
          errors: [error],
        },
        {
          code: 'const count = z.number().int(); const page = z.object({ count })',
          errors: [error],
        },
        {
          code: "const variant1 = z.literal('a'); const variants = z.union([variant1, variant2])",
          errors: [error],
        },
        {
          code: 'const item = z.string(); const items = z.array(item)',
          errors: [error],
        },
        {
          code: 'const first = z.string(); const pair = z.tuple([first, second])',
          errors: [error],
        },
        {
          code: 'const value = z.boolean(); const map = z.record(z.string(), value)',
          errors: [error],
        },
        {
          code: 'function makeSchema() { const id = z.number(); return z.object({ id }) }',
          errors: [error],
        },
        {
          code: "const variant = schema.literal('a'); const variants = schema.union([variant, other])",
          options: customOptions,
          errors: [error],
        },
        {
          code: 'const id = z.number(); const user = z.object({ [key]: id })',
          errors: [error],
        },
      ],
    },
  )
})
