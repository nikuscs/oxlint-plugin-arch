import { astSelectorRule } from '../../utils/ast.utils.ts'

export const codeSwitch = astSelectorRule('SwitchStatement', 'Avoid switch statements.')
