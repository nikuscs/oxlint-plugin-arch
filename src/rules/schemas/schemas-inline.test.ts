import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { schemasInline } from './schemas-inline.ts'

describe('arch/schemas-inline', () => {
  it.each([
    { name: 'named array element passes', code: 'export const Users = z.array(User)' },
    { name: 'inline scalar passes by default', code: 'const values = z.array(z.string())' },
    { name: 'record scalar key and named value pass', code: 'const values = z.record(z.string(), Value)' },
    { name: 'named union members pass', code: 'const value = z.union([First, Second])' },
    { name: 'other namespace is ignored', code: 'const value = schema.array(schema.object({}))' },
    { name: 'unselected methods are ignored', code: 'const value = z.array(z.object({}))', options: { methods: ['union'] } },
    { name: 'structural list can permit a constructor', code: 'const value = z.array(z.object({}))', options: { structural: ['array'] } },
    { name: 'a named reference array element passes', code: 'const schema = z.array(personaDashboardReference)' },
    { name: 'a bare string array element passes', code: 'const schema = z.array(z.string())' },
    { name: 'a record with a named value passes', code: 'const schema = z.record(z.string(), namedValue)' },
    { name: 'a union of named references passes', code: 'const schema = z.union([namedA, namedB])' },
    { name: 'inline object element fails', code: 'export const Users = z.array(z.object({ id: z.string() }))', errors: ['inline'] },
    { name: 'inline union member fails', code: 'const value = z.union([Named, z.object({})])', errors: ['inline'] },
    { name: 'inline tuple element fails', code: 'const value = z.tuple([z.object({}), Named])', errors: ['inline'] },
    { name: 'inline record value fails', code: 'const value = z.record(z.string(), z.object({}))', errors: ['inline'] },
    { name: 'each structural member reports', code: 'const value = z.union([z.object({}), z.array(Named)])', errors: ['inline', 'inline'] },
    { name: 'inline scalars can be forbidden', code: 'const value = z.array(z.string())', options: { scalars: false }, errors: ['inline'] },
    { name: 'custom namespace is checked', code: 'const value = schema.array(schema.object({}))', options: { namespaces: ['schema'] }, errors: ['inline'] },
    { name: 'custom element method is checked', code: 'const value = z.list(z.object({}))', options: { methods: ['list'] }, errors: ['inline'] },
    { name: 'custom structural method is checked', code: 'const value = z.array(z.custom())', options: { structural: ['custom'] }, errors: ['inline'] },
    { name: 'chained scalar is not a bare scalar element', code: 'const value = z.array(z.string().nullable())', errors: ['inline'] },
    { name: 'member reference requires a named binding', code: 'const value = z.array(schemas.User)', errors: ['inline'] },
    { name: 'an array containing an inline UUID object', code: 'const schema = z.array(z.object({ id: z.uuid() }))', errors: ['inline'] },
    { name: 'a union containing an inline UUID object', code: 'const schema = z.union([namedA, z.object({ id: z.uuid() })])', errors: ['inline'] },
    {
      name: 'an inline scalar in an explicitly checked array',
      code: 'const schema = z.array(z.string())',
      options: { methods: ['array'], scalars: false },
      errors: ['inline'],
    },
  ])('$name', (row) => testerRun(schemasInline, row))
})
