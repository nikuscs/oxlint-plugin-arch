import { test } from 'vitest'
import { exportNamePattern } from '../rules/export-name-pattern.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ pattern: '^[a-z][a-z0-9]*Rsc[A-Z][a-zA-Z0-9]*$' }]
const allDeclarations = [{ pattern: '^[a-z][a-z0-9]*Rsc[A-Z][a-zA-Z0-9]*$', allDeclarations: true }]
const error = { messageId: 'pattern' }

test('export-name-pattern', () => {
  createRuleTester().run(
    'arch/export-name-pattern',
    exportNamePattern,
    {
      valid: [
        { code: 'export async function blogRscGetPost() {}', options },
        { code: 'const blogRscListPosts = () => []\nexport { blogRscListPosts }', options },
        { code: 'function helper() {}\nexport async function blogRscGetPost() {}', options },
        { code: 'function blogRscHelper() {}\nexport async function blogRscGetPost() {}', options: allDeclarations },
        { code: 'export async function blogRscGetPost() {}\nexport function getPost() {}', options: [{ pattern: ['Rsc[A-Z]', '^get[A-Z]'] }] },
        { code: 'export const goodOne = 1\nexport const goodTwo = 2', options: [{ pattern: '^good', flags: 'g' }] },
        { code: 'export const goodOne = 1\nexport const goodTwo = 2', options: [{ pattern: ['^none', '^good'], flags: 'y' }] },
      ],
      invalid: [
        { code: 'export async function getPost() {}', options, errors: [error] },
        { code: 'export const BlogRscGetPost = () => null', options, errors: [error] },
        { code: 'function helper() {}\nexport async function blogRscGetPost() {}', options: allDeclarations, errors: [error] },
      ],
    },
  )
})
