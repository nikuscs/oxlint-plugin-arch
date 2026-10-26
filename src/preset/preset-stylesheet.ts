import { readdirSync, readFileSync, realpathSync } from 'node:fs'
import { posix, resolve } from 'node:path'
import * as PresetConstants from './preset.constants.ts'
import { presetIsDirectory, presetIsFile } from './preset.utils.ts'

function presetTailwindEntry(css: string): boolean {
  const code = css.replaceAll(/\/\*[\s\S]*?\*\//g, '')

  return /(?:^|[;{}])\s*@(?:import\s+(?:url\(\s*(["']?)tailwindcss(?:\/[^"')\s]*)?\1\s*\)|(["'])tailwindcss(?:\/[^"']*)?\2)|tailwind\s)/.test(code)
}

export function presetStylesheet(root: string, directory: string): string | undefined {
  const found: string[] = []
  const queue = [directory]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const folder = queue.shift() ?? directory
    const real = realpathSync(resolve(root, folder))

    if (visited.has(real)) {
      continue
    }

    visited.add(real)

    for (const name of readdirSync(resolve(root, folder))) {
      const path = posix.join(folder, name)
      const full = resolve(root, path)
      const depth = posix.relative(directory, path).split('/').length

      if (presetIsDirectory(full)) {
        if (!name.startsWith('.') && !PresetConstants.presetDetectSkip.includes(name) && depth < 8) {
          queue.push(path)
        }
      } else if (name.endsWith('.css') && presetIsFile(full) && presetTailwindEntry(readFileSync(full, 'utf8'))) {
        found.push(path)
      }
    }
  }

  const rank = (path: string) => {
    const index = PresetConstants.presetStylesheetNames.indexOf(posix.basename(path, '.css'))

    return index === -1 ? PresetConstants.presetStylesheetNames.length : index
  }

  return found.toSorted((left, right) => rank(left) - rank(right) || left.length - right.length).at(0)
}
