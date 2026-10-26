import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { typesNamespaceImport } from './types-namespace-import.ts'

describe('arch/types-namespace-import', () => {
  it.each([
    { name: 'three type imports pass', code: "import type { User, Role, Team } from './user.types'" },
    { name: 'three inline type specifiers pass', code: 'import { type A, type B, type C } from "x"' },
    { name: 'value imports pass', code: "import { User, Role, Team, Invite } from './user'" },
    { name: 'one value import keeps the list', code: "import { User, type Role, type Team, type Invite, type Seat } from './user'" },
    { name: 'a default import keeps the list', code: "import User, { type Role, type Team, type Invite, type Seat } from './user'" },
    { name: 'a namespace import passes', code: "import type * as UserTypes from './user.types'" },
    { name: 'a default type import passes', code: "import type User from './user.types'" },
    { name: 'a side-effect import passes', code: "import './user.css'" },
    { name: 'custom max', code: "import type { User, Role, Team, Invite } from './user.types'", options: { max: 4 } },
    { name: 'an empty type import at zero maximum passes', code: 'import type {} from "x"', options: { max: 0 } },
    {
      name: 'four type imports suggest the module name without doubling Types',
      code: "import type { User, Role, Team, Invite } from './user.types'",
      errors: ["Use `import type * as UserTypes from './user.types'` for 4 type imports (max 3); keep exported domain names."],
    },
    { name: 'inline type specifiers', code: "import { type User, type Role, type Team, type Invite } from './user'", errors: ['namespace'] },
    { name: 'each import reports', code: "import type { A, B, C, D } from './a'\nimport type { E, F, G, H } from './e'", errors: ['namespace', 'namespace'] },
    { name: 'max 0', code: "import type { User } from './user.types'", options: { max: 0 }, errors: ['namespace'] },
    { name: 'an import inside declare module', code: 'declare module "ambient" { import type { A, B, C, D } from "./room.types" }', errors: ['namespace'] },
    { name: 'an import with attributes', code: 'import type { A, B, C, D } from "x" with { "resolution-mode": "import" }', errors: ['namespace'] },
    {
      name: 'custom name overrides the module name',
      code: "import type { User, Role } from '@scope/user'",
      options: { max: 1, names: { '@scope/user': 'DomainTypes' } },
      errors: ["Use `import type * as DomainTypes from '@scope/user'` for 2 type imports (max 1); keep exported domain names."],
    },
    {
      name: 'path aliases use the final module segment',
      code: "import type { A, B, C, D } from '#/types/room.types'",
      errors: ["Use `import type * as RoomTypes from '#/types/room.types'` for 4 type imports (max 3); keep exported domain names."],
    },
    {
      name: 'a plain module name gains the Types suffix',
      code: "import type { A, B, C, D } from './harness'",
      errors: ["Use `import type * as HarnessTypes from './harness'` for 4 type imports (max 3); keep exported domain names."],
    },
    {
      name: 'a scoped package uses its subpath name',
      code: "import type { A, B, C, D } from '@scope/pkg/client'",
      errors: ["Use `import type * as ClientTypes from '@scope/pkg/client'` for 4 type imports (max 3); keep exported domain names."],
    },
    {
      name: 'a TypeScript extension is stripped',
      code: "import type { A, B, C, D } from './harness.types.ts'",
      errors: ["Use `import type * as HarnessTypes from './harness.types.ts'` for 4 type imports (max 3); keep exported domain names."],
    },
    {
      name: 'a declaration extension is stripped',
      code: "import type { A, B, C, D } from './harness.d.ts'",
      errors: ["Use `import type * as HarnessTypes from './harness.d.ts'` for 4 type imports (max 3); keep exported domain names."],
    },
    {
      name: 'a hyphenated TSX module becomes PascalCase',
      code: "import type { A, B, C, D } from './foo-bar.tsx'",
      errors: ["Use `import type * as FooBarTypes from './foo-bar.tsx'` for 4 type imports (max 3); keep exported domain names."],
    },
    {
      name: 'a numeric module name gains the Module prefix',
      code: "import type { A, B, C, D } from './123.ts'",
      errors: ["Use `import type * as Module123Types from './123.ts'` for 4 type imports (max 3); keep exported domain names."],
    },
    {
      name: 'a reserved configured name is reported unchanged',
      code: 'import type { A, B, C, D } from "./room.types";',
      options: { names: { './room.types': 'class' } },
      errors: ["Use `import type * as class from './room.types'` for 4 type imports (max 3); keep exported domain names."],
    },
  ])('$name', (row) => testerRun(typesNamespaceImport, row))
})
