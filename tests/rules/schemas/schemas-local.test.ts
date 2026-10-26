import { describe, it } from 'vitest'
import { schemasLocal } from '../../../src/rules/schemas/schemas-local.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/schemas-local', () => {
  it.each([
    { name: 'named schema import passes', code: "import { User } from '@app/schemas'\nUser.parse(input)" },
    { name: 'type-only import passes', code: "import type { z } from 'zod'\ntype User = z.infer<typeof userSchema>" },
    { name: 'inline type-only specifier passes', code: "import { type ZodType } from 'zod'\ntype Schema = ZodType" },
    { name: 'type-only reexport passes', code: "export type { z } from 'zod'" },
    { name: 'inline type-only reexport passes', code: "export { type ZodType } from 'zod'" },
    { name: 'unrelated package prefix passes', code: "import { schema } from 'zod-extra'\nschema.object({})" },
    {
      name: 'allowed filename suffix skips imports and construction',
      filename: 'src/user.schemas.ts',
      code: "import { z } from 'zod'\nconst User = z.object({})",
      options: { allow: ['.schemas.ts'] },
    },
    {
      name: 'matching path pattern skips imports and construction',
      filename: 'src/schemas/user.ts',
      code: "import { z } from 'zod'\nconst User = z.object({})",
      options: { patterns: ['(^|/)schemas/'] },
    },
    { name: 'custom packages replace defaults', code: "import { z } from 'zod'", options: { packages: ['valibot'] } },
    { name: 'custom namespaces replace defaults', code: 'const User = z.object({})', options: { namespaces: ['schema'] } },
    { name: 'an aliased inline type-only namespace passes', code: "import { type z as zod } from 'zod'\ntype User = zod.input<typeof userSchema>" },
    { name: 'runtime import fails', code: "import { z } from 'zod'", errors: ['runtimeImport'] },
    { name: 'package subpath fails', code: "import { z } from 'zod/v4'", errors: ['runtimeImport'] },
    { name: 'side-effect import fails', code: "import 'zod'", errors: ['runtimeImport'] },
    { name: 'runtime reexport fails', code: "export { z } from 'zod'", errors: ['runtimeImport'] },
    { name: 'star reexport fails', code: "export * from 'zod/v4'", errors: ['runtimeImport'] },
    {
      name: 'aliased import also tracks construction',
      code: "import { z as schema } from 'zod'\nconst User = schema.object({})",
      errors: ['runtimeImport', 'construction'],
    },
    { name: 'direct constructor import is tracked', code: "import { object } from 'zod'\nconst User = object({})", errors: ['runtimeImport', 'construction'] },
    { name: 'namespace import is tracked', code: "import * as schema from 'zod'\nconst User = schema.object({})", errors: ['runtimeImport', 'construction'] },
    {
      name: 'each nested construction reports',
      code: "import { z } from 'zod'\nconst User = z.object({ id: z.string() })",
      errors: ['runtimeImport', 'construction', 'construction'],
    },
    { name: 'configured namespace needs no import', code: 'const User = z.object({})', errors: ['construction'] },
    {
      name: 'custom package import is tracked',
      code: "import { schema } from 'valibot'\nconst User = schema.object({})",
      options: { packages: ['valibot'] },
      errors: ['runtimeImport', 'construction'],
    },
    { name: 'custom namespace is checked', code: 'const User = schema.object({})', options: { namespaces: ['schema'] }, errors: ['construction'] },
    {
      name: 'nonmatching filename is still checked',
      filename: 'src/user.ts',
      code: 'const User = z.object({})',
      options: { allow: ['.schemas.ts'], patterns: ['(^|/)schemas/'] },
      errors: ['construction'],
    },
    {
      name: 'shared custom message covers both reports',
      code: "import { z } from 'zod'\nconst User = z.object({})",
      options: { message: 'Import a named schema.' },
      errors: ['Import a named schema.', 'Import a named schema.'],
    },
    {
      name: 'import message accepts the source placeholder',
      code: "import { z } from 'zod'",
      options: { importMessage: 'Do not import {{source}} here.' },
      errors: ['Do not import zod here.'],
    },
    {
      name: 'construction message is configurable',
      code: 'const User = z.object({})',
      options: { constructionMessage: 'Move construction to a schema file.' },
      errors: ['Move construction to a schema file.'],
    },
    {
      name: 'a custom package alias outside configured namespaces',
      code: "import { schema as z } from 'valibot'\nconst local = z.object({})",
      options: { packages: ['valibot'], namespaces: ['v'] },
      errors: ['runtimeImport', 'construction'],
    },
  ])('$name', (row) => testerRun(schemasLocal, row))
})
