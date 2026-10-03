import { eslintCompatPlugin } from '@oxlint/plugins'
import { syntaxRule } from '../../utils/helpers/syntax.ts'
import { serviceTypes } from './service-types.ts'
import { serviceFunctions } from './service-functions.ts'
import { testModifiers } from './test-modifiers.ts'
import { directives } from './reasoned-directives.ts'
import { importBoundaries } from './import-boundaries.ts'
import { memoization } from './memoization.ts'

export default eslintCompatPlugin({
  meta: { name: 'modules' },
  rules: {
    'dynamic-classes': syntaxRule(
      ':matches(JSXAttribute[name.name="className"] TemplateLiteral[expressions.length>0], JSXAttribute[name.name="className"] BinaryExpression[operator="+"])',
      'Write complete class names instead of constructing them dynamically.',
    ),
    'backend-switch': syntaxRule(
      'SwitchStatement',
      'Use ts-pattern in backend application code.',
    ),
    'concurrent-db': syntaxRule(
      'CallExpression[callee.object.name="test"][callee.property.name="concurrent"] ObjectPattern > Property[key.name="db"]',
      'Obtain an isolated database fixture for concurrent tests.',
    ),
    'domain-constants': syntaxRule(
      ':matches(Program, ExportNamedDeclaration) > VariableDeclaration[kind="const"] > VariableDeclarator[id.name=/^[A-Z][A-Z0-9_]+$/]',
      'Move named module constants to the domain constants file.',
    ),
    'double-negation': syntaxRule(
      'UnaryExpression[operator="!"] > UnaryExpression[operator="!"]',
      'Use Boolean(value) or an explicit comparison.',
    ),
    'empty-effect': syntaxRule(
      ':matches(CallExpression[callee.name=/^use(Layout)?Effect$/], CallExpression[callee.object.name="React"][callee.property.name=/^use(Layout)?Effect$/]) > :matches(ArrowFunctionExpression, FunctionExpression) > BlockStatement[body.length=0]',
      'Remove the empty effect.',
    ),
    'import-boundaries': importBoundaries,
    'local-type-alias': syntaxRule(
      'TSTypeAliasDeclaration',
      'Local React contracts must be interfaces; move aliases to domain types.',
    ),
    'no-unknown': syntaxRule(
      'TSUnknownKeyword',
      'Use an owned domain type rather than unknown.',
    ),
    memoization: memoization,
    'pascal-interface': syntaxRule(
      'TSInterfaceDeclaration:not([id.name=/^[A-Z][a-zA-Z0-9]*$/])',
      'Use PascalCase for interfaces.',
    ),
    'reasoned-directives': directives,
    'rpc-database': syntaxRule(
      'CallExpression[callee.property.name=/^(selectFrom|insertInto|updateTable|deleteFrom|mergeInto|executeQuery)$/]',
      'RPC handlers delegate database work to services.',
    ),
    'service-functions': serviceFunctions,
    'service-types': serviceTypes,
    'shape-suffix': syntaxRule(
      ':matches(VariableDeclarator, FunctionDeclaration, ClassDeclaration, TSInterfaceDeclaration, TSTypeAliasDeclaration)[id.name=/Shape$/]',
      'Name this declaration for its domain role rather than the Shape suffix.',
    ),
    'test-modifiers': testModifiers,
  },
})
