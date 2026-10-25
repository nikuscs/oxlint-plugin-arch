import { astSelectorRule } from '../../utils/ast.utils.ts'

const boundariesQueryMethods = '/^(selectFrom|insertInto|updateTable|deleteFrom|mergeInto|executeQuery)$/'

export const boundariesRpcDatabase = astSelectorRule(
  `CallExpression[callee.computed=false][callee.property.name=${boundariesQueryMethods}], CallExpression[callee.computed=true][callee.property.value=${boundariesQueryMethods}]`,
  'RPC handlers delegate database work to services.',
)
