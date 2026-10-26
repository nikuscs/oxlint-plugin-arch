import { describe, it } from 'vitest'
import { noForbiddenTermInSymbolNamesRule } from '../../../../src/vendor/dillon-anti-slop/rules/no-shape-in-symbol-names.ts'
import { testerRun } from '../../../utils/tester.utils.ts'

describe('dillon-anti-slop/no-shape-in-symbol-names', () => {
  it.each([
    { name: 'a domain name passes', code: 'interface User { id: string }' },
    { name: 'string contents are ignored', code: "const label = 'shape'" },
    { name: 'a property read of another API passes', code: 'const keys = Object.keys(schema.shape)' },
    { name: 'a property write of another API passes', code: 'record.shape = 1' },
    { name: 'a renamed destructured property passes', code: 'const { shape: fields } = schema' },
    { name: 'a qualified type read passes', code: 'type Fields = typeof schema.shape' },
    { name: 'a renamed import passes', code: "import { reshape as transform } from 'lib'" },
    { name: 'a renamed re-export passes', code: "export { Shape as Geometry } from 'lib'" },
    { name: 'a JSX member of another API passes', code: 'const icon = <icons.Shape />' },
    { name: 'a JSX attribute passes', code: 'const icon = <Icon shape="circle" />' },
    { name: 'a local export keeps its name checked', code: 'const Shape = 1; export { Shape as Geometry }', errors: ['forbiddenSymbolName', 'forbiddenSymbolName'] },
    { name: 'a computed key is a local name', code: 'const value = record[shapeKey]', errors: ['forbiddenSymbolName'] },
    { name: 'a shorthand destructured binding is a local name', code: 'const { shape } = schema', errors: ['forbiddenSymbolName'] },
    { name: 'an object key you write is a local name', code: 'const value = { shape: 1 }', errors: ['forbiddenSymbolName'] },
    { name: 'a shorthand object property reports its variable once', code: 'const value = { shape }', errors: ['forbiddenSymbolName'] },
    { name: 'a structural name fails', code: 'interface UserShape { id: string }', errors: ['forbiddenSymbolName'] },
    { name: 'matching is case insensitive', code: 'const SHAPE = 1', errors: ['forbiddenSymbolName'] },
    { name: 'private names are checked', code: 'class User { #shape = 1 }', errors: ['forbiddenSymbolName'] },
    { name: 'JSX names are checked', code: 'const icon = <Shape />', errors: ['forbiddenSymbolName'] },
  ])('$name', (row) => testerRun(noForbiddenTermInSymbolNamesRule, row))
})
