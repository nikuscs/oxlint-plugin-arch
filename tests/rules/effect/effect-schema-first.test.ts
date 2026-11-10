import { describe, it } from 'vitest'
import { effectSchemaFirst } from '../../../src/rules/effect/effect-schema-first.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-schema-first', () => {
  it.each([
    {
      name: 'Schemas, kept interfaces, then derived aliases pass',
      code: "import * as Schema from 'effect/Schema'\nexport const User = Schema.Struct({ id: Schema.String })\nexport interface Users { get: (id: string) => Effect.Effect<User> }\nexport type User = typeof User.Type",
    },
    {
      name: 'derived aliases follow Schema order, then other aliases',
      code: 'export const A = Schema.String\nexport const B = Schema.Number\nexport type A = typeof A.Type\nexport type B = typeof B.Type\nexport type Pair = [A, B]',
    },
    { name: 'declare module after interfaces passes', code: "export interface Service { run(): void }\ndeclare module 'x' {}\ntype Id = string" },
    { name: 'an interface with a method stays', code: 'export interface Clock { now(): number }' },
    { name: 'an interface with a runtime type stays', code: 'export interface Deps { body: ReadableStream }' },
    { name: 'a namespaced runtime type stays', code: 'export interface Deps { socket: Cloudflare.WebSocket }' },
    { name: 'an interface that refers to a kept interface stays', code: 'export interface Clock { now(): number }\nexport interface Deps { clock: Clock }' },
    { name: 'a generic interface stays', code: 'export interface Page<A> { items: A[] }' },
    { name: 'an empty interface stays', code: 'export interface Marker {}' },
    { name: 'a type imported from a relative file counts as kept', code: "import type { Clock } from './clock.types.ts'\nexport interface Deps { clock: Clock }" },
    { name: 'a keep pattern keeps the interface', code: 'export interface UserTable { id: string }', options: { keep: 'Table$' } },
    { name: 'rows are off by default', code: 'export type User = Kysely.Selectable<UserTable>' },
    { name: 'a row alias with the suffix passes', code: 'export type UserRecord = Kysely.Selectable<UserTable>', options: { rows: {} } },
    { name: 'a value after an interface', code: 'export interface Clock { now(): number }\nexport const max = 3', errors: ['order'] },
    { name: 'an interface after a type alias', code: 'type Id = string\nexport interface Clock { now(): number }', errors: ['order'] },
    {
      name: 'the order message lists the default sections',
      code: 'type Id = string\nexport interface Clock { now(): number }',
      errors: ['Order a types file as Schemas and values, then interfaces and `declare module`, then type aliases.'],
    },
    { name: 'a custom order allows aliases before interfaces', code: 'type Id = string\nexport interface Clock { now(): number }', options: { order: ['values', 'aliases', ['interfaces', 'modules']] } },
    {
      name: 'a custom order reports against its own sections',
      code: 'export interface Clock { now(): number }\ntype Id = string',
      options: { order: ['aliases', 'interfaces'] },
      errors: ['Order a types file as type aliases, then interfaces.'],
    },
    { name: 'a section left out of the order goes anywhere', code: 'export interface Clock { now(): number }\nexport const max = 3', options: { order: ['interfaces', 'aliases'] } },
    { name: 'derived.first off allows other aliases first', code: 'export const A = Schema.String\nexport type Id = string\nexport type A = typeof A.Type', options: { derived: { first: false } } },
    {
      name: 'derived.sorted off allows any Schema order',
      code: 'export const A = Schema.String\nexport const B = Schema.Number\nexport type B = typeof B.Type\nexport type A = typeof A.Type',
      options: { derived: { sorted: false } },
    },
    { name: 'a Schema without its derived type', code: 'export const User = Schema.Struct({ id: Schema.String })', errors: ['schemaType'] },
    {
      name: 'the message names the member',
      code: 'export const User = Schema.Struct({ id: Schema.String })',
      errors: ['Add `export type User = typeof User.Type` to the final type block.'],
    },
    { name: 'a derived alias out of Schema order', code: 'export const A = Schema.String\nexport const B = Schema.Number\nexport type B = typeof B.Type\nexport type A = typeof A.Type', errors: ['typeOrder'] },
    { name: 'a derived alias after another alias', code: 'export const A = Schema.String\nexport type Id = string\nexport type A = typeof A.Type', errors: ['typeOrder'] },
    { name: 'a data interface', code: 'export interface User { id: string; name: string }', errors: ['dataInterface'] },
    { name: 'a type imported from a package does not count as kept', code: "import type { Actor } from '@app/contracts'\nexport interface Deps { actor: Actor }", errors: ['dataInterface'] },
    { name: 'runtime replaces the defaults', code: 'export interface Deps { body: ReadableStream }', options: { runtime: ['Effect'] }, errors: ['dataInterface'] },
    {
      name: 'a custom member',
      code: 'export const User = Schema.Struct({})\nexport type User = typeof User.Type',
      options: { member: 'Encoded' },
      errors: ['schemaType'],
    },
    { name: 'a row alias without the suffix', code: 'export type User = Kysely.Selectable<UserTable>', options: { rows: {} }, errors: ['rowItem'] },
    { name: 'an interface extending a row', code: 'export interface User extends Kysely.Selectable<UserTable> {}', options: { rows: {} }, errors: ['rowItem'] },
    { name: 'custom row types and suffix', code: 'export type User = Db.Row<UserTable>', options: { rows: { types: ['Db.Row'], suffix: 'Row' } }, errors: ['rowItem'] },
  ])('$name', (row) => testerRun(effectSchemaFirst, row))
})
