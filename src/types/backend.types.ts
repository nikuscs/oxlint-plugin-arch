export interface BackendOrpcOutputOptions {
  composers: string[]
  handler?: string
  output?: string
}

export interface BackendServiceFunctionsOptions {
  frontend?: boolean
  helpers?: boolean
  methods?: boolean
  single?: boolean
  message?: string
}

export interface BackendSqlLikeOptions {
  methods: string[]
  sanitizers: string[]
  bindings?: boolean
  operators?: string[]
}

export interface BackendRegistryOptions {
  registry: string
  services: string
  skip?: string[]
  object?: string
}
