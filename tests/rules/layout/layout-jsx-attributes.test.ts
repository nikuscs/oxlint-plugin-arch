import { describe, it } from 'vitest'
import { layoutJsxAttributes } from '../../../src/rules/layout/layout-jsx-attributes.ts'
import { testerRun } from '../../utils/tester.utils.ts'

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
      name: 'splits after type arguments',
      code: 'const view = <Panel<Row> first={1} second={2} third={3} />',
      output: 'const view = <Panel<Row>\n  first={1}\n  second={2}\n  third={3}\n/>',
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
    { name: 'join unset leaves a short split tag', code: 'const view = <Panel\n  first={1}\n/>' },
    {
      name: 'join joins a short split self-closing tag',
      code: 'const view = <Panel\n  first={1}\n  second={2}\n/>',
      options: { join: { max: 80 } },
      output: 'const view = <Panel first={1} second={2} />',
      errors: ['join'],
    },
    {
      name: 'join joins a short split opening tag',
      code: 'const view = <Panel\n  first={1}\n>\n  content\n</Panel>',
      options: { join: { max: 80 } },
      output: 'const view = <Panel first={1}>\n  content\n</Panel>',
      errors: ['join'],
    },
    { name: 'join leaves a tag with min attributes split', code: 'const view = <Panel\n  first={1}\n  second={2}\n  third={3}\n/>', options: { join: { max: 80 } } },
    {
      name: 'join joins min - 1 attributes',
      code: 'const view = <Panel\n  first={1}\n/>',
      options: { min: 2, join: { max: 80 } },
      output: 'const view = <Panel first={1} />',
      errors: ['join'],
    },
    { name: 'join leaves min attributes with a lower min', code: 'const view = <Panel\n  first={1}\n  second={2}\n/>', options: { min: 2, join: { max: 80 } } },
    {
      name: 'join joins a tag that fits max exactly',
      code: 'const view = <Panel\n  first={1}\n/>',
      options: { join: { max: 32 } },
      output: 'const view = <Panel first={1} />',
      errors: ['join'],
    },
    { name: 'join leaves a tag one column past max', code: 'const view = <Panel\n  first={1}\n/>', options: { join: { max: 31 } } },
    { name: 'join leaves a commented tag', code: 'const view = <Panel\n  first={1 /* keep */}\n/>', options: { join: { max: 80 } } },
    { name: 'join leaves a multi-line attribute', code: 'const view = <Panel\n  run={() => {\n    go()\n  }}\n/>', options: { join: { max: 80 } } },
    { name: 'join leaves multi-line type arguments', code: 'const view = <Panel<\n  Row\n> first={1} />', options: { join: { max: 80 } } },
  ])('$name', (row) => testerRun(layoutJsxAttributes, row))
})
