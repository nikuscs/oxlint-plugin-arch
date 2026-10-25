import { astSelectorRule } from '../../utils/ast.utils.ts'

// oxlint-disable-next-line arch/naming-shape -- the export name is the camelCase of the rule id naming-shape
export const namingShape = astSelectorRule(
  ':matches(VariableDeclarator, FunctionDeclaration, ClassDeclaration, TSInterfaceDeclaration, TSTypeAliasDeclaration)[id.name=/Shape$/]',
  'Name this declaration for its domain role rather than the Shape suffix.',
)
