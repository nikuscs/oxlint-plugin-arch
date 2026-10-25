import type { ESTree } from '@oxlint/plugins'

export interface BoundariesOptions {
  web: string[]
  backend: string[]
  packages: string | string[]
  roles?: string[]
  portable?: boolean
  backendPackages: string[]
  appPackages: string[]
  aliases: Record<string, string>
  entrypoints: string[]
  uiPackages?: string[]
}

export interface BoundariesImport {
  options: BoundariesOptions
  file: string
  source: string
  target: string
  typeOnly: boolean
  reExport: boolean
  roots: string[]
  owner?: string
  web?: string
  backendImport: boolean
}

export interface BoundariesNextOptions extends Pick<BoundariesOptions, 'web' | 'backend' | 'aliases' | 'backendPackages'> {
  server?: string[]
  client?: string[]
  dynamic?: string[]
  serverPackages?: string[]
  clientPackages?: string[]
  hookPackages?: string[]
  publicEnv?: string
}

export interface BoundariesTanstackOptions extends BoundariesNextOptions {
  rpc: string[]
  startPackages?: string[]
  rscPackages?: string[]
}

export type BoundariesIdentifier = Extract<ESTree.Node, { type: 'Identifier' }>

export type BoundariesSide = 'server' | 'client'

export interface BoundariesTanstackImport {
  node: BoundariesIdentifier
  name: string
}

export interface BoundariesTanstackBoundary {
  start: number
  end: number
  side: BoundariesSide
  kind: string
}

export interface BoundariesTokenOwnerRestriction {
  token?: string
  member?: string
  allow?: string[]
  patterns?: string[]
  message?: string
}

export interface BoundariesTokenOwnerOptions extends BoundariesTokenOwnerRestriction {
  restrictions?: BoundariesTokenOwnerRestriction[]
}

export interface BoundariesTokenOwnerTarget {
  kind: 'token' | 'member'
  value: string
  message?: string
}

export interface BoundariesDenyOptions {
  imports?: Record<string, string>
  calls?: Record<string, string>
}
