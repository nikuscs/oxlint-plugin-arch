import { describe, it } from 'vitest'
import { commentsHeader } from '../../../src/rules/comments/comments-header.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/comments-header', () => {
  it.each([
    { name: 'the header on line 1 passes', code: "// @suite integration\nimport { it } from 'vitest'", options: { comment: '^// @suite integration$' } },
    { name: 'a block header passes', code: "/* @suite integration */\nimport { it } from 'vitest'", options: { comment: '^/\\* @suite \\w+ \\*/$' } },
    { name: 'a file without the import passes', code: "import { it } from 'vitest'", options: { comment: '^// @suite integration$', imports: '/support/app\\.layer' } },
    { name: 'a file outside files passes', code: "import { it } from 'vitest'", filename: 'test/unit/order.test.ts', options: { comment: '^// @suite integration$', files: 'test/domains/**/*.test.ts' } },
    { name: 'the import with the header passes', code: "// @suite integration\nimport { AppLayer } from '../support/app.layer.ts'", options: { comment: '^// @suite integration$', imports: '/support/app\\.layer' } },
    { name: 'missing header', code: "import { it } from 'vitest'", options: { comment: '^// @suite integration$' }, errors: ['missing'] },
    { name: 'another comment on line 1', code: "// order tests\nimport { it } from 'vitest'", options: { comment: '^// @suite integration$' }, errors: ['missing'] },
    { name: 'a header pushed below an import', code: "import { it } from 'vitest'\n// @suite integration\nimport { AppLayer } from './app.layer.ts'", options: { comment: '^// @suite integration$' }, errors: ['misplaced'] },
    { name: 'an indented header', code: "  // @suite integration\nimport { it } from 'vitest'", options: { comment: '^// @suite integration$' }, errors: ['misplaced'] },
    { name: 'a file with the import', code: "import { AppLayer } from '../support/app.layer.ts'", options: { comment: '^// @suite integration$', imports: '/support/app\\.layer' }, errors: ['missing'] },
    { name: 'a re-export counts as an import', code: "export { AppLayer } from '../support/app.layer.ts'", options: { comment: '^// @suite integration$', imports: '/support/app\\.layer' }, errors: ['missing'] },
    { name: 'a file inside files', code: "import { it } from 'vitest'", filename: 'test/domains/order/order.test.ts', options: { comment: '^// @suite integration$', files: 'test/domains/**/*.test.ts' }, errors: ['missing'] },
    {
      name: 'custom message',
      code: "import { it } from 'vitest'",
      options: { comment: '^// @suite integration$', message: 'Integration tests are tagged.' },
      errors: ["Start the file with a comment that matches '^// @suite integration$'. Integration tests are tagged."],
    },
  ])('$name', (row) => testerRun(commentsHeader, row))
})
