import type { ESTree } from '@oxlint/plugins'

export function typeReferenceName(type: ESTree.TSTypeReference): string | null {
  return type.typeName.type === 'Identifier' ? type.typeName.name : null
}
