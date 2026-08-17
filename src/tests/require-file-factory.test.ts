import { test } from 'vitest'
import { requireFileFactory } from '../rules/require-file-factory.ts'
import { createRuleTester } from './rule-tester.ts'

const options = [{ factory: 'make{Stem}' }]
const error = { messageId: 'factory' }

test('require-file-factory', () => {
  createRuleTester().run('arch/require-file-factory', requireFileFactory, {
    valid: [
      { filename: '/repo/services/workflow/workflow-validation.ts', code: 'export function makeWorkflowValidation() {}', options },
      { filename: '/repo/services/post-generation/post-generation.source.ts', code: 'export const makePostGenerationSource = () => ({})', options },
      { filename: '/repo/services/workflow/workflow-validation.ts', code: 'export const workflowSchema = {}', options },
    ],
    invalid: [
      {
        filename: '/repo/services/post-generation/post-generation.active-workflow.ts',
        code: 'export async function postGenerationActiveWorkflow() {}',
        options,
        errors: [error],
      },
      {
        filename: '/repo/services/workflow/workflow-validation.ts',
        code: 'const wrongFactory = () => ({})\nexport { wrongFactory }',
        options,
        errors: [error],
      },
    ],
  })
})
