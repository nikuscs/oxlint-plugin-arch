import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const source = join(root, 'src')
const destination = join(root, 'skills/install-oxlint-arch/assets/arch')
const check = process.argv.includes('--check')

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      return entry.name === 'tests' ? [] : files(entryPath)
    }

    return extname(entry.name) === '.ts' ? [entryPath] : []
  })
}

if (check) {
  const expected = files(source).map((entryPath) => relative(source, entryPath)).sort()
  const actual = existsSync(destination)
    ? files(destination).map((entryPath) => relative(destination, entryPath)).sort()
    : []

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error('Skill assets differ from src; run `bun run sync:skill-assets`.')
  }

  for (const entryPath of expected) {
    if (readFileSync(join(source, entryPath), 'utf8') !== readFileSync(join(destination, entryPath), 'utf8')) {
      throw new Error(`${entryPath} differs from its skill asset; run \`bun run sync:skill-assets\`.`)
    }
  }

  console.log('Skill assets match src.')
} else {
  rmSync(destination, { recursive: true, force: true })
  mkdirSync(destination, { recursive: true })

  for (const entryPath of files(source)) {
    const relativePath = relative(source, entryPath)
    const targetPath = join(destination, relativePath)
    mkdirSync(resolve(targetPath, '..'), { recursive: true })
    cpSync(entryPath, targetPath)
  }

  console.log(`Synced ${relative(root, destination)}.`)
}
