import { test } from 'vitest'
import { noLocalSchemaConstruction } from '../rules/no-local-schema-construction.ts'
import { createRuleTester } from './rule-tester.ts'

const runtimeImport = { messageId: 'runtimeImport' }
const construction = { messageId: 'construction' }

test('no-local-schema-construction', () => {
  createRuleTester('tsx').run(
    'arch/no-local-schema-construction',
    noLocalSchemaConstruction,
    {
      valid: [
        "import { userSchema } from '@app/server'\nstandardSchemaResolver(userSchema)",
        "import { userSchema } from '@app/server'\nexport function UserForm() { return <form /> }",
        "import type { z } from 'zod'\ntype User = z.infer<typeof userSchema>",
        "import type { z as zod } from 'zod'\ntype User = zod.infer<typeof userSchema>",
        "import { type ZodType } from 'zod'\ntype Schema = ZodType",
        "import { type z as zod } from 'zod'\ntype User = zod.input<typeof userSchema>",
        {
          filename: '/repo/apps/web/src/forms/user-form.tsx',
          code: "import { z } from 'zod'\nconst schema = z.object({})",
          options: [{ allowIn: ['/src/forms/user-form.tsx'] }],
        },
        {
          filename: '/repo/apps/web/src/components/user-form.tsx',
          code: "import { z } from 'zod'\nconst schema = z.object({})",
          options: [{ allowPathPatterns: ['/src/components/', '/src/types/'] }],
        },
      ],
      invalid: [
        { code: "import { z } from 'zod'", errors: [runtimeImport] },
        {
          code: "import { z as zod } from 'zod'\nconst schema = zod.object({})",
          errors: [runtimeImport, construction],
        },
        {
          code: "import { object } from 'zod'\nconst schema = object({})",
          errors: [runtimeImport, construction],
        },
        { code: 'const schema = z.object({ name: z.string() })', errors: [construction, construction] },
        { code: 'standardSchemaResolver(z.object({ id: z.string() }))', errors: [construction, construction] },
        {
          code: "import { schema as z } from 'valibot'\nconst local = z.object({})",
          options: [{ packages: ['valibot'], namespaces: ['v'] }],
          errors: [runtimeImport, construction],
        },
        {
          filename: '/repo/apps/web/src/forms/user-form.tsx',
          code: "import { z } from 'zod'",
          options: [{
            runtimeImportMessage: 'Import a named schema from the server instead of {{source}}.',
          }],
          errors: [{ message: 'Import a named schema from the server instead of zod.' }],
        },
        {
          filename: '/repo/apps/web/src/forms/user-form.tsx',
          code: 'const schema = z.object({})',
          options: [{
            message: 'Move this schema to a types file or the server module that owns it.',
          }],
          errors: [{ message: 'Move this schema to a types file or the server module that owns it.' }],
        },
      ],
    },
  )
})
