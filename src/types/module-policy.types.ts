export interface ModuleBoundaryOptions {
  web: string[]
  backend: string[]
  packages: string
  backendPackages: string[]
  appPackages: string[]
  aliases: Record<string, string>
  publicEntrypoints: string[]
}
