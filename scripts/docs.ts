import { readFileSync, writeFileSync } from 'node:fs'
import plugin from '../src/index.ts'
import { presetDefaultGroups } from '../src/preset/preset.constants.ts'

const readme = new URL('../README.md', import.meta.url)
const families: Record<string, string> = {
  backend: 'Service and RPC structure',
  boundaries: 'Import and runtime boundaries',
  code: 'Code shapes to avoid',
  comments: 'Comments and directives',
  files: 'What a file may contain or export',
  layout: 'Layout a formatter leaves alone',
  naming: 'File, folder and export names',
  react: 'Components, effects, class names',
  schemas: 'Schema placement',
  tests: 'Test structure',
  types: 'Type placement and shape',
}

const rules = Object.entries(plugin.rules).toSorted(([left], [right]) => left.localeCompare(right))

const ruleRows = Object.entries(families).map(([family, covers]) => {
  const links = rules
    .filter(([id]) => id === family || id.startsWith(`${family}-`))
    .map(([id, rule]) => `[\`${id}\`](docs/rules/${id}.md)${rule.meta?.fixable ? ' 🔧' : ''}`)

  return `| \`${family}\` | ${covers} | ${links.join(', ')} |`
})

const optIn = ['react', 'tanstack', 'next', 'expo', 'tailwind', 'shadcn', 'kit', 'backend', 'orpc', 'schemas', 'forms', 'sql', 'console']
const groupLinks = (names: string[]) => names.map((name) => `[\`${name}\`](docs/groups/${name}.md)`).join(', ')

const generated = [
  '<!-- generated:start -->',
  `On by default: ${groupLinks(presetDefaultGroups)}.`,
  '',
  `Opt-in: ${groupLinks(optIn)}.`,
  '',
  `${rules.length} rules, IDs \`arch/<rule>\`. 🔧 = autofix.`,
  '',
  '| Family | Covers | Rules |',
  '| --- | --- | --- |',
  ...ruleRows,
  '<!-- generated:end -->',
].join('\n')

const current = readFileSync(readme, 'utf8')
const next = current.replace(/<!-- generated:start -->[\s\S]*<!-- generated:end -->/, generated)

if (process.argv.includes('--check')) {
  if (next !== current) {
    console.error('README tables are stale: run bun run docs')
    process.exit(1)
  }
} else {
  writeFileSync(readme, next)
}
