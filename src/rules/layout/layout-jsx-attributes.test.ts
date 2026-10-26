import { describe, it } from 'vitest'
import { testerRun } from '../../utils/tester.utils.ts'
import { layoutJsxAttributes } from './layout-jsx-attributes.ts'

describe('arch/layout-jsx-attributes', () => {
  it.each([
    { name: 'two attributes stay inline', code: 'const view = <Panel first={1} second={2} />' },
    { name: 'already split tag passes', code: 'const view = <Panel\n  first={1}\n  second={2}\n  third={3}\n/>' },
    { name: 'min raises the threshold', code: 'const view = <Panel first={1} second={2} third={3} />', options: { min: 4 } },
    { name: 'a comment blocks the fix', code: 'const view = <Panel first={1 /* keep */} second={2} third={3} />', output: null, errors: ['multiline'] },
    {
      name: 'splits a self-closing tag',
      code: 'const view = <Panel first={1} second={2} {...rest} />',
      output: 'const view = <Panel\n  first={1}\n  second={2}\n  {...rest}\n/>',
      errors: ['multiline'],
    },
    {
      name: 'splits an opening tag',
      code: 'const view = <Panel first={1} second={2} third={3}>content</Panel>',
      output: 'const view = <Panel\n  first={1}\n  second={2}\n  third={3}\n>content</Panel>',
      errors: ['multiline'],
    },
    {
      name: 'indents from the tag line',
      code: 'function View() {\n  return <Panel first={1} second={2} third={3} />\n}',
      output: 'function View() {\n  return <Panel\n    first={1}\n    second={2}\n    third={3}\n  />\n}',
      errors: ['multiline'],
    },
    {
      name: 'tab indent',
      code: 'const view = <Panel first={1} second={2} third={3} />',
      options: { indent: 'tab' },
      output: 'const view = <Panel\n\tfirst={1}\n\tsecond={2}\n\tthird={3}\n/>',
      errors: ['multiline'],
    },
  ])('$name', (row) => testerRun(layoutJsxAttributes, row))
})
