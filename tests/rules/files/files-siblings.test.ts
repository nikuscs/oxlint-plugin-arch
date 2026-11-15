import { describe, it } from 'vitest'
import { filesSiblings } from '../../../src/rules/files/files-siblings.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/files-siblings', () => {
  it.each([
    { name: 'the sibling exists', filename: 'order/order.contract.ts', files: { 'order/order.service.ts': '' }, code: 'export {}', options: { require: '{folder}.service.ts' } },
    { name: 'every listed sibling exists', filename: 'order/order.admin.contract.ts', files: { 'order/order.service.ts': '', 'order/order.schemas.ts': '' }, code: 'export {}', options: { require: ['{folder}.service.ts', '{stem}.schemas.ts'] } },
    {
      name: 'a missing sibling',
      filename: 'order/order.contract.ts',
      files: {},
      code: 'export {}',
      options: { require: '{folder}.service.ts', message: 'A domain is reached through its service.' },
      errors: ["This file needs 'order.service.ts' beside it. A domain is reached through its service."],
    },
    { name: 'one of two siblings missing', filename: 'order/order.contract.ts', files: { 'order/order.service.ts': '' }, code: 'export {}', options: { require: ['{folder}.service.ts', '{folder}.schemas.ts'] }, errors: ['missing'] },
  ])('$name', (row) => testerRun(filesSiblings, row))
})
