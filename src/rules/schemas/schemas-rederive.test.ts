import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { schemasRederive } from './schemas-rederive.ts'

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
      name: 'local inference with explicit operators passes',
      code: 'const localSchema = z.object({})\ntype Local = z.infer<typeof localSchema>',
      options: { from: ['@app/server/client'], namespaces: ['z'], operators: ['infer', 'input'] },
    },
    {
      name: 'an imported DTO alias with explicit operators passes',
      code: "import type { BrandDto } from '@app/server/client'\ntype Brand = BrandDto",
      options: { from: ['@app/server/client'], namespaces: ['z'], operators: ['infer', 'input'] },
    },
    {
      name: 'local module inference with explicit operators passes',
      code: "import { brandSchema } from './local.ts'\ntype Brand = z.infer<typeof brandSchema>",
      options: { from: ['@app/server/client'], namespaces: ['z'], operators: ['infer', 'input'] },
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
    {
      name: 'inference from an imported server schema',
      code: "import { brandApiDetail } from '@app/server/client'\ntype Brand = z.infer<typeof brandApiDetail>",
      options: { from: ['@app/server/client'], namespaces: ['z'], operators: ['infer', 'input'] },
      errors: ['rederive'],
    },
    {
      name: 'input derivation from an aliased server schema',
      code: "import { brandApiDetail as detailSchema } from '@app/server/client'\ntype Brand = z.input<typeof detailSchema>",
      options: { from: ['@app/server/client'], namespaces: ['z'], operators: ['infer', 'input'] },
      errors: ['rederive'],
    },
  ])('$name', (row) => testerRun(schemasRederive, row))
})
