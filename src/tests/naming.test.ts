import { expect, test } from 'vitest'
import { namingFileStem } from '../utils/helpers/naming.ts'

test('namingFileStem keeps current before-first-dot and full-basename cuts', () => {
  expect(namingFileStem('onchain.utils')).toBe('onchain')
  expect(namingFileStem('onchain-utils')).toBe('onchain-utils')
  expect(namingFileStem('agent-setups.types')).toBe('agent-setups')
  expect(namingFileStem('onchain.utils', 'full-basename')).toBe('onchain.utils')
})

test('namingFileStem strips configured trailing roles after the stem cut', () => {
  expect(namingFileStem('onchain-utils', 'before-first-dot', ['utils'])).toBe('onchain')
  expect(namingFileStem('onchain.utils', 'before-first-dot', ['utils'])).toBe('onchain')
  expect(namingFileStem('onchain-utils.client', 'before-first-dot', ['utils'])).toBe('onchain')
  expect(namingFileStem('onchain.utils', 'full-basename', ['utils'])).toBe('onchain')
  expect(namingFileStem('onchain-utils.client', 'full-basename', ['utils', 'client'])).toBe('onchain')
})

test('namingFileStem does not treat hyphens inside the domain as roles', () => {
  expect(namingFileStem('agent-setups.types', 'before-first-dot', ['utils'])).toBe('agent-setups')
  expect(namingFileStem('foo-utils-bar', 'before-first-dot', ['utils'])).toBe('foo-utils-bar')
  expect(namingFileStem('utils', 'before-first-dot', ['utils'])).toBe('utils')
})

test('namingFileStem uses the longest matching role and configured separators', () => {
  expect(namingFileStem('account-types', 'before-first-dot', ['type', 'types'])).toBe('account')
  expect(namingFileStem('onchain-utils', 'before-first-dot', ['utils'], ['.'])).toBe('onchain-utils')
  expect(namingFileStem('onchain.utils', 'full-basename', ['utils'], ['-'])).toBe('onchain.utils')
})
