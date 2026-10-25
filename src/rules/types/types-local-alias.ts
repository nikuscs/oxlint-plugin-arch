import { astSelectorRule } from '../../utils/ast.utils.ts'

export const typesLocalAlias = astSelectorRule(
  'TSTypeAliasDeclaration',
  'Local component/hook contracts use interfaces named for their owner. Derived or reusable aliases belong in domain types; do not substitute an empty interface.',
)
