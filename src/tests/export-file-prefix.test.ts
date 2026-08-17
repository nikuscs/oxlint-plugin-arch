import { test } from 'vitest'
import { exportFilePrefix } from '../rules/export-file-prefix.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'prefix' }

test('export-file-prefix', () => {
  createRuleTester().run(
    'arch/export-file-prefix',
    exportFilePrefix,
    {
      valid: [
        {
          filename: '/repo/services/blog-post.client.ts',
          code: 'export const blogPostGet = () => null\nexport type BlogPost = {}',
        },
        {
          filename: '/repo/services/blog.rsc.tsx',
          code: 'export async function blogRscGetPost() {}',
        },
        {
          filename: '/repo/services/auth.client.ts',
          code: 'const authClient = {}\nexport default authClient',
        },
      ],
      invalid: [
        {
          filename: '/repo/services/blog.client.ts',
          code: 'export const getBlog = () => null',
          errors: [error],
        },
        {
          filename: '/repo/services/auth.client.ts',
          code: 'const client = {}\nexport { client }',
          errors: [error],
        },
      ],
    },
  )
})
