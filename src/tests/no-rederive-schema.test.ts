import { test } from 'vitest'
import { noRederiveSchema } from '../rules/no-rederive-schema.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ from: ['@app/server/client'], namespaces: ['z'], operators: ['infer', 'input'] }]
const error = { messageId: 'rederive' }

test('no-rederive-schema', () => {
  createRuleTester().run(
    'arch/no-rederive-schema',
    noRederiveSchema,
    {
      valid: [
        { code: 'const localSchema = z.object({})\ntype Local = z.infer<typeof localSchema>', options },
        { code: "import type { BrandDto } from '@app/server/client'\ntype Brand = BrandDto", options },
        { code: "import { brandSchema } from './local.ts'\ntype Brand = z.infer<typeof brandSchema>", options },
      ],
      invalid: [
        {
          code: "import { brandApiDetail } from '@app/server/client'\ntype Brand = z.infer<typeof brandApiDetail>",
          options,
          errors: [error],
        },
        {
          code: "import { brandApiDetail as detailSchema } from '@app/server/client'\ntype Brand = z.input<typeof detailSchema>",
          options,
          errors: [error],
        },
      ],
    },
  )
})
