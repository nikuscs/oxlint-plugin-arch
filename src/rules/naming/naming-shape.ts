import { syntaxRule } from '../../utils/helpers/syntax.ts'

export const namingShape = syntaxRule(
  ':matches(VariableDeclarator, FunctionDeclaration, ClassDeclaration, TSInterfaceDeclaration, TSTypeAliasDeclaration)[id.name=/Shape$/]',
      'Name this declaration for its domain role rather than the Shape suffix.',
)
