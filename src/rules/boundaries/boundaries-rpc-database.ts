import { syntaxRule } from '../../utils/helpers/syntax.ts'

export const boundariesRpcDatabase = syntaxRule(
  'CallExpression[callee.property.name=/^(selectFrom|insertInto|updateTable|deleteFrom|mergeInto|executeQuery)$/]',
      'RPC handlers delegate database work to services.',
)
