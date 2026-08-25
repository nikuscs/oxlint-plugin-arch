import { test } from 'vitest'
import { exportFilePrefix } from '../rules/export-file-prefix.ts'
import { createRuleTester } from './rule-tester.ts'

const error = { messageId: 'prefix' }
const allDeclarations = [{
  stem: 'full-basename' as const,
  normalize: 'remove-separators' as const,
  allDeclarations: true,
}]
const singularTypes = [{
  stem: 'before-first-dot' as const,
  normalize: 'remove-separators' as const,
  singularize: 'trailing-s' as const,
  allDeclarations: true,
}]
const trailingUtils = [{
  stem: 'before-first-dot' as const,
  trailingRoles: ['utils'],
}]

test('export-file-prefix', () => {
  createRuleTester().run(
    'arch/export-file-prefix',
    exportFilePrefix,
    {
      valid: [
        {
          filename: '/repo/services/blog-post.client.ts',
          code: 'export const blogPostGet = () => null\nexport type BlogPost = {}',
        },
        {
          filename: '/repo/services/blog.rsc.tsx',
          code: 'export async function blogRscGetPost() {}',
        },
        {
          filename: '/repo/services/auth.client.ts',
          code: 'const authClient = {}\nexport default authClient',
        },
        {
          filename: '/repo/components/foo-chart.tsx',
          code: 'function fooChartPreview() {}\nfunction fooChartHandle() {}\ninterface FooChartPreviewProps {}\nexport function FooChart() { return null }',
          options: allDeclarations,
        },
        {
          filename: '/repo/components/foo-chart.tsx',
          code: 'function useFooChartData() { return null }\nexport function FooChart() { return null }',
          options: [{ ...allDeclarations[0], allowPattern: '^use' }],
        },
        {
          filename: '/repo/src/api/agent-setups.types.ts',
          code: 'type AgentSetupTimeTrigger = {}\nexport type AgentSetupList = {}',
          options: singularTypes,
        },
        {
          filename: '/repo/src/api/agent-setup-drafts.types.ts',
          code: 'type AgentSetupDraftStatus = {}\nexport function AgentSetupDraftLoad() { return null }',
          options: singularTypes,
        },
        {
          filename: '/repo/src/api/agent-setups.ts',
          code: 'export function AgentSetupList() { return null }',
          options: singularTypes,
        },
        {
          filename: '/repo/src/lib/onchain-utils.ts',
          code: 'export function onchainGet() { return null }',
          options: trailingUtils,
        },
        {
          filename: '/repo/src/lib/onchain.utils.ts',
          code: 'export function onchainGet() { return null }',
          options: trailingUtils,
        },
        {
          filename: '/repo/src/lib/onchain-utils.client.ts',
          code: 'export function onchainGet() { return null }',
          options: trailingUtils,
        },
        {
          filename: '/repo/src/lib/agent-setups.types.ts',
          code: 'export function agentSetupsList() { return null }',
          options: trailingUtils,
        },
      ],
      invalid: [
        {
          filename: '/repo/services/blog.client.ts',
          code: 'export const getBlog = () => null',
          errors: [error],
        },
        {
          filename: '/repo/services/auth.client.ts',
          code: 'const client = {}\nexport { client }',
          errors: [error],
        },
        {
          filename: '/repo/components/foo-chart.tsx',
          code: 'function preview() {}\nfunction handle() {}\ninterface PreviewProps {}\nexport function FooChart() { return null }',
          options: allDeclarations,
          errors: [error, error, error],
        },
        {
          filename: '/repo/components/foo-chart.tsx',
          code: 'export function FooChart() { function handle() { return null } return null }',
          options: allDeclarations,
          errors: [error],
        },
        {
          filename: '/repo/src/api/agent-setup-drafts.types.ts',
          code: 'type DraftStatus = {}\nexport type AgentSetupDraftStatus = {}',
          options: singularTypes,
          errors: [error],
        },
        {
          filename: '/repo/src/lib/onchain-utils.ts',
          code: 'export function helper() { return null }',
          options: trailingUtils,
          errors: [error],
        },
        {
          filename: '/repo/src/lib/onchain-utils.ts',
          code: 'export function onchainGet() { return null }',
          errors: [error],
        },
      ],
    },
  )
})
