import type { ESTree } from '@oxlint/plugins'

export interface ExportsBinding {
  exportedName: string
  localName?: string
  node: ESTree.Node
  declaration?: ESTree.Declaration
  initializer?: ESTree.Expression | null
  typeOnly: boolean
  default: boolean
  reExport: boolean
}
