import { describe, it } from 'vitest'
import { layoutArrowBody } from '../../../src/rules/layout/layout-arrow-body.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/layout-arrow-body', () => {
  it.each([
    { name: 'a body on the arrow line passes', code: 'const run = () => load(id)' },
    { name: 'a block body passes', code: 'const run = () => {\n  load(id)\n}' },
    { name: 'a body past max passes', code: 'const run = () =>\n  loadEverything(id)', options: { max: 20 } },
    { name: 'a comment after the arrow passes', code: 'const run = () => // keep\n  load(id)' },
    { name: 'a body on the next line fails', code: 'const run = () =>\n  load(id)', output: 'const run = () => load(id)', errors: ['sameLine'] },
    {
      name: 'a split call body measures to its open paren',
      code: 'const run = () =>\n  load(\n    id,\n  )',
      options: { max: 24 },
      output: 'const run = () => load(\n    id,\n  )',
      errors: ['sameLine'],
    },
  ])('$name', (row) => testerRun(layoutArrowBody, row))
})
