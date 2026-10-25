import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

const [target = '.', ...flags] = process.argv.slice(2)
const repo = resolve(target)
const config = flags.find((flag) => flag.startsWith('--config='))?.slice('--config='.length) ?? 'oxlint.config.ts'
const top = Number(flags.find((flag) => flag.startsWith('--top='))?.slice('--top='.length) ?? 25)
const oxlint = join(repo, 'node_modules/.bin/oxlint')
const work = mkdtempSync(join(tmpdir(), 'arch-bench-'))
const timings = join(work, 'timings.json')

const loaded = spawnSync('bun', ['--eval', `console.log(JSON.stringify((await import(${JSON.stringify(join(repo, config))})).default))`], {
  cwd: repo,
  encoding: 'utf8',
  maxBuffer: 1 << 28,
})

if (loaded.status !== 0) {
  console.error(loaded.stderr || loaded.stdout)
  process.exit(1)
}

const resolved = JSON.parse(loaded.stdout)

function packageName(specifier: string): string {
  let folder = dirname(specifier)

  while (folder !== dirname(folder)) {
    try {
      const name: string = JSON.parse(readFileSync(join(folder, 'package.json'), 'utf8')).name

      return name.replace(/^(@[^/]+\/)?eslint-plugin(?:-(.+))?$/, (_, scope = '', rest = '') => (scope && !rest ? scope.slice(0, -1) : `${scope}${rest}`))
    } catch {
      folder = dirname(folder)
    }
  }

  return 'plugin'
}

const wrapper = (specifier: string, name: string) => `
import plugin from ${JSON.stringify(specifier)}
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
const file = ${JSON.stringify(timings)}
const times = new Map()
const add = (id, ms) => times.set(id, (times.get(id) ?? 0) + ms)
const wrap = (id, visitors) => Object.fromEntries(Object.entries(visitors ?? {}).map(([key, fn]) => [key, typeof fn === 'function' ? (...args) => { const start = performance.now(); try { return fn(...args) } finally { add(id, performance.now() - start) } } : fn]))
const prefix = ${JSON.stringify(name)} || plugin.meta?.name || ${JSON.stringify(packageName(specifier))}
const rules = Object.fromEntries(Object.entries(plugin.rules ?? {}).map(([key, rule]) => {
  const id = prefix + '/' + key
  const timed = { ...rule }
  if (rule.createOnce) timed.createOnce = (context) => wrap(id, rule.createOnce(context))
  if (rule.create) timed.create = (context) => { const start = performance.now(); const visitors = rule.create(context); add(id, performance.now() - start); return wrap(id, visitors) }
  return [key, timed]
}))
process.on('exit', () => {
  const all = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {}
  for (const [id, ms] of times) all[id] = (all[id] ?? 0) + ms
  writeFileSync(file, JSON.stringify(all))
})
export default { ...plugin, meta: { ...plugin.meta, name: prefix }, rules }
`

resolved.jsPlugins = (resolved.jsPlugins ?? []).map((entry: string | { name: string, specifier: string }, index: number) => {
  const { name, specifier: raw } = typeof entry === 'string' ? { name: '', specifier: entry } : entry
  const specifier = createRequire(join(repo, config)).resolve(raw)
  const file = join(work, `plugin-${index}.mjs`)

  writeFileSync(file, wrapper(specifier, name))

  return name ? { name, specifier: file } : file
})

const benchConfig = join(repo, '.arch-bench.oxlintrc.json')

writeFileSync(benchConfig, JSON.stringify(resolved))

const started = performance.now()

const run = spawnSync(oxlint, ['-c', benchConfig, '--disable-nested-config', '-f', 'json', '.'], {
  cwd: repo,
  encoding: 'utf8',
  maxBuffer: 1 << 28,
})

const wall = performance.now() - started

if (!flags.includes('--keep')) {
  rmSync(benchConfig, { force: true })
}

const ms: Record<string, number> = JSON.parse(readFileSync(timings, 'utf8'))
const total = Object.values(ms).reduce((sum, value) => sum + value, 0)

if (run.status !== 0 && !run.stdout.startsWith('{')) {
  console.error(run.stdout || run.stderr)
  process.exit(1)
}

const diagnostics = JSON.parse(run.stdout).diagnostics.length

console.log(`${repo}: ${diagnostics} diagnostics, ${(wall / 1000).toFixed(1)}s wall, ${(total / 1000).toFixed(1)}s in JS rules`)
console.table(
  Object.entries(ms)
    .toSorted(([, left], [, right]) => right - left)
    .slice(0, top)
    .map(([rule, value]) => ({ rule, ms: Math.round(value), share: `${((value / total) * 100).toFixed(1)}%` })),
)
