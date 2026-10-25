import { astSelectorRule } from '../../utils/ast.utils.ts'

export const namingTypes = astSelectorRule('TSInterfaceDeclaration:not([id.name=/^[A-Z][a-zA-Z0-9]*$/])', 'Use PascalCase for interfaces.')
