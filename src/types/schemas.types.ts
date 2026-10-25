export interface SchemasInlineOptions {
  namespaces: string[]
  methods: string[]
  structuralMethods: string[]
  allowZodScalars: boolean
}

export interface SchemasLocalOptions {
  packages?: string[]
  namespaces?: string[]
  allowIn?: string[]
  allowPathPatterns?: string[]
  message?: string
  runtimeImportMessage?: string
  constructionMessage?: string
}

export interface SchemasRederiveOptions {
  from: string[]
  namespaces?: string[]
  operators?: string[]
}

export interface SchemasSingleUseOptions {
  namespaces: string[]
  methods: string[]
  structuralMethods: string[]
  allowZodScalars: boolean
}
