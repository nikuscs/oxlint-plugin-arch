export interface ModuleBoundaryOptions {
  web: string[]
  backend: string[]
  packages: string | string[]
  fileRoles?: string[]
  portableLib?: boolean
  backendPackages: string[]
  appPackages: string[]
  aliases: Record<string, string>
  publicEntrypoints: string[]
}

export interface ModuleServiceFunctionsOptions {
  frontend?: boolean
  allowLocalHelpers?: boolean
  allowReturnedMethods?: boolean
  singleExport?: boolean
  message?: string
}

export interface ModuleDomainConstantsOptions {
  allowServiceMethods?: boolean
  includeData?: boolean
}

export interface ModuleRuntimeOptions
  extends Pick<ModuleBoundaryOptions, 'web' | 'backend' | 'aliases' | 'backendPackages'> {
  rpcClients: string[]
  serverImports?: string[]
  clientImports?: string[]
  allowComputedImportsIn?: string[]
}
