import { syntaxRule } from '../../utils/helpers/syntax.ts'

export const namingTypes = syntaxRule(
  'TSInterfaceDeclaration:not([id.name=/^[A-Z][a-zA-Z0-9]*$/])',
      'Use PascalCase for interfaces.',
)
