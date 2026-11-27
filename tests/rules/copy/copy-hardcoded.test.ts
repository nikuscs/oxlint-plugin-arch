import { describe, it } from 'vitest'
import { copyHardcoded } from '../../../src/rules/copy/copy-hardcoded.ts'
import { testerRun } from '../../utils/tester.utils.ts'

describe('arch/copy-hardcoded', () => {
  it.each([
    { name: 'a message call passes', code: 'const Hero = () => <h1>{m.hero_title()}</h1>' },
    { name: 'punctuation and numbers pass', code: 'const Price = () => <p>{price} / 12 - 3,50 &copy;</p>' },
    { name: 'whitespace between elements passes', code: 'const List = () => (\n  <ul>\n    <li>{a}</li>\n  </ul>\n)' },
    { name: 'other attributes pass', code: 'const Field = () => <input type="text" name="email" className="w-full" />' },
    { name: 'an attribute expression passes', code: 'const Field = () => <input placeholder={m.field_email()} />' },
    { name: 'an empty alt passes', code: 'const Logo = () => <img alt="" src="/logo.svg" />' },
    { name: 'a URL title passes', code: 'const Link = () => <a title="https://example.com/docs">{label}</a>' },
    { name: 'a path in text passes', code: 'const Link = () => <a href="/docs">{"/docs/start"}</a>' },
    { name: 'strings outside JSX pass', code: "const title = 'Manage your orders'" },
    { name: 'a string prop outside the list passes', code: 'const Hero = () => <Card heading="Orders" />' },
    { name: 'an excluded file passes', code: 'const Hero = () => <h1>Manage your orders</h1>', filename: 'src/legal/terms.tsx', options: { exclude: 'legal/*.tsx' } },
    { name: 'a custom ignore passes', code: 'const Brand = () => <b>Acme</b>', options: { ignore: '^Acme$' } },
    { name: 'JSX text', code: 'const Hero = () => <h1>Manage your orders</h1>', errors: ['text'] },
    { name: 'a fragment child', code: 'const Hero = () => <>Welcome back</>', errors: ['text'] },
    { name: 'a string child', code: "const Hero = () => <h1>{'Welcome back'}</h1>", errors: ['text'] },
    { name: 'a template child', code: 'const Hero = () => <h1>{`Welcome back`}</h1>', errors: ['text'] },
    { name: 'a placeholder', code: 'const Field = () => <input placeholder="Enter name" />', errors: ['text'] },
    { name: 'an aria-label in braces', code: "const Field = () => <select aria-label={'Choose status'} />", errors: ['text'] },
    { name: 'alt and title', code: 'const Logo = () => <img alt="Company logo" title="Logo" />', errors: ['text', 'text'] },
    { name: 'a custom attribute list', code: 'const Hero = () => <Card heading="Orders" title="Orders" />', options: { attributes: ['heading'] }, errors: ['text'] },
    { name: 'a file outside the exclude list', code: 'const Hero = () => <h1>Orders</h1>', filename: 'src/pages/orders.tsx', options: { exclude: 'legal/*.tsx' }, errors: ['text'] },
    {
      name: 'long text is shortened and the message added',
      code: 'const Hero = () => <p>Every order you place shows up here as soon as we receive it</p>',
      options: { message: 'Use m.<key>().' },
      errors: ["Move 'Every order you place shows up here as…' out of the component; user-facing text comes from your copy source. Use m.<key>()."],
    },
  ])('$name', (row) => testerRun(copyHardcoded, row))
})
