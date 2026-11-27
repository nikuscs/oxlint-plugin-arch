import type { NamingCaptureOptions } from './naming.types.ts'

export interface BackendOrpcOutputOptions {
  handler?: string
  output?: string
  roots?: string[]
  require?: string[]
  ignore?: string[]
  message?: string
}

export interface BackendServiceFunctionsOptions {
  frontend?: boolean
  helpers?: boolean
  methods?: boolean
  single?: boolean
  message?: string
}

export interface BackendSqlLikeOptions {
  methods?: string[]
  sanitizers?: string[]
  bindings?: boolean
  operators?: string[]
}

export interface BackendRegistryOptions {
  registry: string
  services: string
  skip?: string[]
  object?: string
  file?: string
}

export interface BackendTableOwnerOptions extends NamingCaptureOptions {
  methods?: string[]
  owners?: Record<string, string>
  domains?: string[]
  prefix?: boolean
  message?: string
}
