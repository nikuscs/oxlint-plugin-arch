import { describe, it } from 'vitest'
import { typesDuplicate } from '../../../src/rules/types/types-duplicate.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/types-duplicate', () => {
  it.each([
    { name: 'different members pass', code: 'interface A { id: string; name: string }\ninterface B { id: string; age: number }' },
    { name: 'one member stays under min', code: 'interface A { id: string }\ninterface B { id: string }' },
    { name: 'different heritage passes', code: 'interface A extends X { id: string; name: string }\ninterface B extends Y { id: string; name: string }' },
    { name: 'a struct and an interface are different kinds', code: 'const A = Schema.Struct({ id: Schema.String, name: Schema.String })\ninterface B { id: Schema.String; name: Schema.String }' },
    { name: 'other callees pass', code: 'const A = make({ id: 1, name: 2 })\nconst B = make({ id: 1, name: 2 })' },
    { name: 'the same interface twice', code: 'interface A { id: string; name: string }\ninterface B { id: string; name: string }', errors: ['duplicate'] },
    {
      name: 'the message names both types',
      code: 'interface A { id: string; name: string }\ninterface B { id: string; name: string }',
      errors: ['B has the same members as A; use A, or derive one from the other.'],
    },
    { name: 'order, readonly and spacing are ignored', code: 'interface A { readonly id: string; name: string }\ninterface B {\n  name: string,\n  id:  string\n}', errors: ['duplicate'] },
    { name: 'an interface and a type literal', code: 'interface A { id: string; name: string }\ntype B = { id: string; name: string }', errors: ['duplicate'] },
    { name: 'the same struct twice', code: 'const A = Schema.Struct({ id: Schema.String, name: Schema.String })\nconst B = Schema.Struct({ name: Schema.String, id: Schema.String })', errors: ['duplicate'] },
    { name: 'min 1', code: 'interface A { id: string }\ninterface B { id: string }', options: { min: 1 }, errors: ['duplicate'] },
    { name: 'custom structs', code: 'const A = z.object({ id: z.string(), name: z.string() })\nconst B = z.object({ id: z.string(), name: z.string() })', options: { structs: ['z.object'] }, errors: ['duplicate'] },
  ])('$name', (row) => testerRun(typesDuplicate, row))
})
