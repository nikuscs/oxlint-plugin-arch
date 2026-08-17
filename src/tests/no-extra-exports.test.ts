import { test } from 'vitest'
import { noExtraExports } from '../rules/no-extra-exports.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{
  names: ['make{Domain}Service', '{Domain}Service', '{domain}ServiceDefinition', 'default'],
}]
const error = { messageId: 'extraExport' }

test('no-extra-exports', () => {
  createRuleTester().run(
    'arch/no-extra-exports',
    noExtraExports,
    {
      valid: [
        {
          filename: '/repo/services/api-key/api-key.service.ts',
          code: 'export function makeApiKeyService() {}\nexport type ApiKeyService = {}\nexport const apiKeyServiceDefinition = {}',
          options,
        },
        {
          filename: '/repo/services/billing/billing.service.ts',
          code: 'const billingServiceDefinition = {}\nexport default billingServiceDefinition',
          options,
        },
        {
          filename: '/repo/services/news/news.service.ts',
          code: 'const local = 1\nexport function makeNewsService() {}',
          options,
        },
      ],
      invalid: [
        {
          filename: '/repo/services/billing/billing.service.ts',
          code: 'export const helper = 1',
          options,
          errors: [error],
        },
        {
          filename: '/repo/services/news/news.service.ts',
          code: 'const helper = 1\nexport { helper }',
          options,
          errors: [error],
        },
      ],
    },
  )
})
