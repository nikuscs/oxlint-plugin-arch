import { astSelectorRule } from '../../utils/ast.utils.ts'

export const boundariesRpcDatabase = astSelectorRule(
  'CallExpression[callee.property.name=/^(selectFrom|insertInto|updateTable|deleteFrom|mergeInto|executeQuery)$/]',
  'RPC handlers delegate database work to services.',
)
