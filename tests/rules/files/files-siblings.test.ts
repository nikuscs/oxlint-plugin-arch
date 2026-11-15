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
    { name: 'a path template captures the kind', filename: 'kit-wallet/test/wallet.fake.test.ts', files: { 'kit-wallet/src/wallet.fake.ts': '' }, code: 'export {}', options: { file: 'kit-{module}/test/{name}.{kind}.test.ts', require: '../src/{name}.{kind}.ts' } },
    { name: 'a file off the path template is skipped', filename: 'other/a.ts', files: {}, code: 'export {}', options: { file: 'kit-{module}/test/{name}.{kind}.test.ts', require: '../src/{name}.{kind}.ts' } },
    { name: 'one of several siblings is enough', filename: 'order/order.contract.ts', files: { 'order/order.queries.ts': '' }, code: 'export {}', options: { require: [['{folder}.service.ts', '{folder}.queries.ts']] } },
    { name: 'none of the listed siblings', filename: 'order/order.contract.ts', files: {}, code: 'export {}', options: { require: [['{folder}.service.ts', '{folder}.queries.ts']] }, errors: ["This file needs 'order.service.ts' or 'order.queries.ts' beside it."] },
    { name: 'a forbidden sibling', filename: 'order/order.types.ts', files: { 'order/order-users.types.ts': '' }, code: 'export {}', options: { forbid: '{stem}-users.types.ts', message: 'Split types stay in parts.' }, errors: ["This file may not sit beside 'order-users.types.ts'. Split types stay in parts."] },
    { name: 'the condition is not met', filename: 'order/order.contract.ts', files: {}, code: 'export {}', options: { require: '{folder}.service.ts', when: '{folder}.layer.ts' } },
    { name: 'the condition is met', filename: 'order/order.contract.ts', files: { 'order/order.layer.ts': '' }, code: 'export {}', options: { require: '{folder}.service.ts', when: '{folder}.layer.ts' }, errors: ['missing'] },
    { name: 'an absent condition', filename: 'order/order.contract.ts', files: { 'order/order.legacy.ts': '' }, code: 'export {}', options: { require: '{folder}.service.ts', when: '!{folder}.legacy.ts' } },
  ])('$name', (row) => testerRun(filesSiblings, row))
})
