import { describe, it } from 'vitest'
import { schemasRederive } from '../../../src/rules/schemas/schemas-rederive.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/schemas-rederive', () => {
  it.each([
    { name: 'local schema derivation passes', code: 'const User = z.object({}); type Result = z.infer<typeof User>', options: { from: ['@app/schemas'] } },
    { name: 'imported DTO type passes', code: "import type { User } from '@app/schemas'\nlet user: User", options: { from: ['@app/schemas'] } },
    { name: 'unlisted source passes', code: "import { User } from './local.ts'\ntype Result = z.infer<typeof User>", options: { from: ['@app/schemas'] } },
    {
      name: 'source matching is exact',
      code: "import { User } from '@app/schemas/local'\ntype Result = z.infer<typeof User>",
      options: { from: ['@app/schemas'] },
    },
    { name: 'unlisted operator passes', code: "import { User } from '@app/schemas'\ntype Result = z.output<typeof User>", options: { from: ['@app/schemas'] } },
    {
      name: 'custom namespaces replace the default',
      code: "import { User } from '@app/schemas'\ntype Result = z.infer<typeof User>",
      options: { from: ['@app/schemas'], namespaces: ['schema'] },
    },
    {
      name: 'custom operators replace the defaults',
      code: "import { User } from '@app/schemas'\ntype Result = z.infer<typeof User>",
      options: { from: ['@app/schemas'], operators: ['output'] },
    },
    {
      name: 'imported schema inference fails',
      code: "import { UserSchema } from '@app/schemas'\ntype User = z.infer<typeof UserSchema>",
      options: { from: ['@app/schemas'] },
      errors: ['rederive'],
    },
    {
      name: 'aliased imported input derivation fails',
      code: "import { UserSchema as Schema } from '@app/schemas'\ntype User = z.input<typeof Schema>",
      options: { from: ['@app/schemas'] },
      errors: ['rederive'],
    },
    {
      name: 'default imported schema is checked',
      code: "import Schema from '@app/schemas'\ntype User = z.infer<typeof Schema>",
      options: { from: ['@app/schemas'] },
      errors: ['rederive'],
    },
    {
      name: 'custom namespace is checked',
      code: "import { User } from '@app/schemas'\ntype Result = schema.infer<typeof User>",
      options: { from: ['@app/schemas'], namespaces: ['schema'] },
      errors: ['rederive'],
    },
    {
      name: 'custom operator is checked',
      code: "import { User } from '@app/schemas'\ntype Result = z.output<typeof User>",
      options: { from: ['@app/schemas'], operators: ['output'] },
      errors: ['rederive'],
    },
  ])('$name', (row) => testerRun(schemasRederive, row))
})
