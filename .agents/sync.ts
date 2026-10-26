import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const root = dirname(import.meta.dirname)
const agentsRoot = import.meta.dirname

function link(source: string, target: string): void {
  rmSync(target, { force: true, recursive: true })
  mkdirSync(dirname(target), { recursive: true })
  symlinkSync(relative(dirname(target), source), target)
}

function linkEach(sourceDir: string, targetDir: string): void {
  rmSync(targetDir, { force: true, recursive: true })

  if (!existsSync(sourceDir)) {
    return
  }

  for (const entry of readdirSync(sourceDir)) {
    link(join(sourceDir, entry), join(targetDir, entry))
  }
}

link(join(root, 'AGENTS.md'), join(root, 'CLAUDE.md'))
linkEach(join(agentsRoot, 'skills'), join(root, '.claude/skills'))
linkEach(join(agentsRoot, 'agents'), join(root, '.claude/agents'))

for (const config of ['paseo.json', 'orca.yaml', 'conductor.json', 't3.json']) {
  link(join(agentsRoot, 'orchestrators', config), join(root, config))
}

console.log('Linked CLAUDE.md, .claude/ and the orchestrator configs')
