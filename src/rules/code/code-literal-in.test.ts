import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { codeLiteralIn } from './code-literal-in.ts'

describe('arch/code-literal-in', () => {
  it.each([
    { name: 'dynamic key passes', code: 'key in value' },
    { name: 'numeric index passes', code: '0 in value' },
    {
      name: 'interpolated key passes',
      code: `const prefix = readPrefix()
const value = readValue()
if (\`\${prefix}Key\` in value) {
  use(value)
}`,
    },
    { name: 'own-property check passes', code: "if (Object.hasOwn(user, 'email')) send(user)" },
    { name: 'allowed key passes', code: "'serviceWorker' in navigator", options: { allow: ['serviceWorker'] } },
    { name: 'allowed template key passes', code: '`serviceWorker` in navigator', options: { allow: ['serviceWorker'] } },
    { name: 'a bare interpolated key passes', code: `\`\${prefix}Key\` in value
` },
    { name: 'Object.hasOwn passes', code: "Object.hasOwn(value, 'kind')" },
    { name: 'a discriminant check passes', code: "value.kind === 'record'" },
    { name: 'string key fails', code: "if ('email' in user) send(user)", errors: ['literalIn'] },
    { name: 'static template key fails', code: '`ready` in value', errors: ['literalIn'] },
    {
      name: 'allow list does not exempt other keys',
      code: "'kind' in value && 'serviceWorker' in navigator",
      options: { allow: ['serviceWorker'] },
      errors: ['literalIn'],
    },
    { name: 'each static key reports', code: "'kind' in value && 'status' in value", errors: ['literalIn', 'literalIn'] },
    { name: 'a single-quoted key', code: "'kind' in value", errors: ['literalIn'] },
    { name: 'a double-quoted key', code: '"status" in value', errors: ['literalIn'] },
  ])('$name', (row) => testerRun(codeLiteralIn, row))
})
