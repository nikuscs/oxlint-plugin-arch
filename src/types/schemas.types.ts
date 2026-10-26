export interface SchemasElementOptions {
  namespaces: string[]
  methods: string[]
  structural: string[]
  scalars: boolean
}

export interface SchemasLocalOptions {
  packages: string[]
  namespaces: string[]
  calls?: string[]
  allow?: string[]
  patterns?: string[]
  message?: string
  importMessage?: string
  constructionMessage?: string
}

export interface SchemasRederiveOptions {
  from: string[]
  namespaces?: string[]
  operators?: string[]
}
