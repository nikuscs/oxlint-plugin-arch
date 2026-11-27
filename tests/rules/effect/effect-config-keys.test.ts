import { describe, it } from 'vitest'
import { effectConfigKeys } from '../../../src/rules/effect/effect-config-keys.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/effect-config-keys', () => {
  it.each([
    { name: 'without prefix or allow nothing runs', code: "const key = Config.String('ANY')" },
    { name: 'the domain prefix', code: "const key = Config.String('ORDER_API_KEY')", filename: 'domains/order/order.config.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] } },
    { name: 'a multi-word domain', code: "const key = Config.redacted('SUPPLIER_ORDER_TOKEN')", filename: 'domains/supplier-order/supplier-order.config.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] } },
    { name: 'a shared prefix', code: "const url = Config.String('APP_URL')", filename: 'domains/order/order.config.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] } },
    { name: 'a file the pattern misses is skipped', code: "const key = Config.String('OTHER')", filename: 'lib/env.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] } },
    { name: 'a key that is not a string is skipped', code: 'const key = Config.String(name)', filename: 'domains/order/order.config.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] } },
    { name: 'Config.nested is not a reader', code: "const key = Config.nested('OTHER')(inner)", filename: 'domains/order/order.config.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] } },
    { name: 'Config.succeed is not a reader', code: "const key = Config.succeed('OTHER')", filename: 'domains/order/order.config.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] } },
    { name: 'a fixed prefix without a file', code: "const key = Config.number('SERVER_PORT')", options: { prefix: 'SERVER_' } },
    { name: 'custom callees', code: "const key = env('OTHER')", options: { prefix: 'APP_', callees: ['Env.*'] } },
    { name: 'an unprefixed key', code: "const key = Config.String('BAD_KEY')", filename: 'domains/order/order.config.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] }, errors: ['prefix'] },
    { name: 'another domain prefix', code: "const key = Config.Redacted('USER_TOKEN')", filename: 'domains/order/order.config.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] }, errors: ['prefix'] },
    { name: 'a part of the domain only', code: "const key = Config.integer('SUPPLIER_LIMIT')", filename: 'domains/supplier-order/supplier-order.config.ts', options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'] }, errors: ['prefix'] },
    { name: 'a template key', code: 'const key = Config.boolean(`FLAG`)', options: { allow: ['APP_'] }, errors: ['prefix'] },
    { name: 'custom callees are checked', code: "const key = Env.read('OTHER')", options: { prefix: 'APP_', callees: ['Env.*'] }, errors: ['prefix'] },
    {
      name: 'the message lists the prefixes',
      code: "const key = Config.String('BAD_KEY')",
      filename: 'domains/order/order.config.ts',
      options: { file: 'domains/{domain}/**', prefix: '{DOMAIN}_', allow: ['APP_'], message: 'Name keys after the domain.' },
      errors: ["Config key 'BAD_KEY' must start with 'ORDER_' or 'APP_'. Name keys after the domain."],
    },
  ])('$name', (row) => testerRun(effectConfigKeys, row))
})
