import { syntaxRule } from '../../utils/helpers/syntax.ts'

export const typesLocalAlias = syntaxRule(
  'TSTypeAliasDeclaration',
      'Local component/hook contracts use interfaces named for their owner. Derived or reusable aliases belong in domain types; do not substitute an empty interface.',
)
