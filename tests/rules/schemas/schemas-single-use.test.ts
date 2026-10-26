import { describe, it } from 'vitest'
import { schemasSingleUse } from '../../../src/rules/schemas/schemas-single-use.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/schemas-single-use', () => {
  it.each([
    { name: 'inline scalar field passes', code: 'export const User = z.object({ name: z.string().min(1) })' },
    { name: 'reused scalar passes', code: 'const id = z.number(); const User = z.object({ id, parentId: id })' },
    { name: 'exported scalar passes', code: 'export const id = z.number(); const User = z.object({ id })' },
    { name: 'later named export passes', code: 'const id = z.number(); export { id }; const User = z.object({ id })' },
    { name: 'default export passes', code: 'const id = z.number(); export default id; const User = z.object({ id })' },
    { name: 'type derivation is not a structural use', code: 'const id = z.number(); type Id = z.infer<typeof id>' },
    { name: 'parse call is not a structural use', code: 'const id = z.number(); const parsed = id.parse(value)' },
    { name: 'arbitrary call is not a structural use', code: 'const id = z.number(); registerSchema(id)' },
    { name: 'ordinary object is not a schema', code: 'const id = z.number(); const config = { id }' },
    { name: 'nested ordinary object is ignored', code: 'const id = z.number(); const User = z.object({ nested: { id } })' },
    { name: 'structural schema is not scalar', code: 'const User = z.object({ id: z.number() }); const Group = z.object({ User })' },
    { name: 'structural chain is not scalar', code: 'const choice = z.string().or(z.number()); const User = z.object({ choice })' },
    { name: 'chained scalar element is not inlineable', code: 'const item = z.string().nullable(); const Items = z.union([item, Named])' },
    { name: 'mutable declaration is ignored', code: 'let item = z.string(); const User = z.object({ item })' },
    { name: 'unlisted namespace is ignored', code: 'const item = schema.string(); const User = schema.object({ item })' },
    { name: 'unbound constructor is ignored', code: 'const string = z.string; const item = string(); const User = z.object({ item })' },
    { name: 'structural element checks can be disabled', code: 'const item = z.string(); const Items = z.array(item)', options: { scalars: false } },
    { name: 'unselected element method is ignored', code: 'const item = z.string(); const Items = z.array(item)', options: { methods: ['union'] } },
    {
      name: 'object field checks require object in structural list',
      code: 'const item = z.string(); const User = z.object({ item })',
      options: { structural: ['array', 'union'] },
    },
    { name: 'a scalar from an imported constructor passes', code: 'import { string } from "zod"; const item = string(); const value = z.object({ item })' },
    { name: 'a union with an object instead of an array passes', code: 'const item = z.string(); const invalidUnion = z.union({ item })' },
    { name: 'single scalar object field fails', code: 'const id = z.number(); const User = z.object({ id })', errors: ['inline'] },
    { name: 'chained scalar object field fails', code: 'const Name = z.string().min(1); export const User = z.object({ name: Name })', errors: ['inline'] },
    { name: 'single array element fails', code: 'const item = z.string(); const Items = z.array(item)', errors: ['inline'] },
    { name: 'single union member fails', code: 'const item = z.literal("a"); const Items = z.union([item, Named])', errors: ['inline'] },
    { name: 'single tuple member fails', code: 'const item = z.string(); const Items = z.tuple([item, Named])', errors: ['inline'] },
    { name: 'single record value fails', code: 'const item = z.boolean(); const Items = z.record(z.string(), item)', errors: ['inline'] },
    { name: 'function-local scalar is checked', code: 'function makeSchema() { const id = z.number(); return z.object({ id }) }', errors: ['inline'] },
    { name: 'computed object field is checked', code: 'const id = z.number(); const User = z.object({ [key]: id })', errors: ['inline'] },
    {
      name: 'custom namespace is checked',
      code: 'const item = schema.string(); const Items = schema.union([item, Named])',
      options: { namespaces: ['schema'] },
      errors: ['inline'],
    },
    {
      name: 'custom element method is checked',
      code: 'const item = z.string(); const Items = z.list(item)',
      options: { methods: ['list'] },
      errors: ['inline'],
    },
    {
      name: 'disabling element checks keeps object field checks',
      code: 'const item = z.string(); const User = z.object({ item })',
      options: { scalars: false },
      errors: ['inline'],
    },
  ])('$name', (row) => testerRun(schemasSingleUse, row))
})
